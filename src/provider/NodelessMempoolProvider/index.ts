import Common, { Chain, Hardfork } from "@ethereumjs/common";
import { DPT, ETH, Peer, RLPx } from "@ethereumjs/devp2p";
import { FeeMarketEIP1559TxData, Transaction, TransactionFactory } from "@ethereumjs/tx";
import { randomBytes } from "crypto";
import chalk from "chalk";

import bootnodes from "./bootnodes";
import ConstrainedSet from "../../datastructures/ConstrainedSet";
import genesis from "./genesis";
import MempoolProvider from "../MempoolProvider";
import PooledTransactionsMessage from "./PooledTransactionsMessage";
import { BigNumber } from "ethers";
import { isEIP1559Transaction, isLegacyTransaction, MempoolTransaction } from "../MempoolTransaction";

/**
 * The `NodelessMempoolProvider` is an implementation of the `MempoolProvider`.
 * It does not require any RPC provider. It directly connects to peer nodes,
 * and collects transaction data on the protocol level.
 */
class NodelessMempoolProvider extends MempoolProvider {
  private maxPeers: number | undefined;
  private config: Common;
  readonly privateKey: Buffer;
  private dpt!: DPT;
  private rlpx!: RLPx;
  private txHashes!: ConstrainedSet<string>;

  constructor(maxPeers?: number) {
    super();
    this.maxPeers = maxPeers ?? 500;

    this.config = new Common({ chain: Chain.Mainnet, hardfork: Hardfork.Berlin });
    this.privateKey = randomBytes(32);
    this.txHashes = new ConstrainedSet(5000);

    this.setupDPT();
    this.setupRLPx();

    this.startBootstraping();
    this.startLogging();
  }

  private noOp(): void {}

  // Creates and configures the Distributed Peer Table
  private setupDPT(): void {
    this.dpt = new DPT(this.privateKey, {
      endpoint: {
        address: "0.0.0.0",
        udpPort: null,
        tcpPort: null,
      },
    });

    // DPT errors cause peer disconnection anyway so we just ignore it
    this.dpt.on("error", this.noOp);
  }

  private setupRLPx(): void {
    this.rlpx = new RLPx(this.privateKey, {
      dpt: this.dpt,
      maxPeers: this.maxPeers,
      capabilities: [ETH.eth66],
      common: this.config,
      //remoteClientIdFilter: REMOTE_CLIENTID_FILTER,
    });

    this.rlpx.on("peer:removed", this.noOp);
    // Peer errors are usually not recoverable, so just ignore them, these peers are getting disconnected
    this.rlpx.on("peer:error", this.noOp);

    this.rlpx.on("peer:added", this.onPeerAdded.bind(this));
  }

  private onPeerAdded(peer: Peer): void {
    const eth = peer.getProtocols()[0] as ETH;

    eth.sendStatus({
      td: genesis.totalDifficulty,
      bestHash: genesis.hash,
      genesisHash: genesis.hash,
    });

    eth.on("message", (code: ETH.MESSAGE_CODES, payload: unknown) => this.onMessage(code, payload, eth));
  }

  private onMessage(code: ETH.MESSAGE_CODES, payload: unknown, eth: ETH): void {
    switch (code) {
      case ETH.MESSAGE_CODES.NEW_POOLED_TRANSACTION_HASHES:
        this.handleNewPooledTransactionHashes(payload as Buffer[], eth);
        break;
      case ETH.MESSAGE_CODES.POOLED_TRANSACTIONS:
        this.handlePooledTransactions(payload as PooledTransactionsMessage);
        break;
    }
  }

  private handleNewPooledTransactionHashes(data: Buffer[], eth: ETH): void {
    // Filter for hashes that we have never seen
    const newHashes = data.filter((hash) => {
      const h: string = hash.toString("hex");
      if (!this.txHashes.has(h)) {
        this.txHashes.add(h);
        return true;
      } else {
        return false;
      }
    });

    // console.log(`Received TX hashes: ${data.length}, new: ${newHashes.length}`);

    // distribute them into max 256 tx hashes long messages
    // See for the details: https://github.com/ethereum/devp2p/blob/master/caps/eth.md#getpooledtransactions-0x09
    const K: number = Math.ceil(newHashes.length / 256);
    for (let i = 0; i < K; i++) {
      const hashes: Buffer[] = [];
      for (let j = 0; j < 256; j++) {
        const index: number = i * 256 + j;
        if (index < newHashes.length - 1) {
          hashes.push(newHashes[index]);
        } else {
          break;
        }
      }

      // Generate unique 64 bit integer encoded as a Buffer
      // See the first section for details: https://github.com/ethereum/devp2p/blob/master/caps/eth.md#protocol-messages
      const requestId: Buffer = randomBytes(8);
      // Request the transaction details for these never seen pooled transaction hashes
      // See for details: https://github.com/ethereum/devp2p/blob/master/caps/eth.md#getpooledtransactions-0x09
      eth.sendMessage(ETH.MESSAGE_CODES.GET_POOLED_TRANSACTIONS, [requestId, hashes]);
    }
  }

  private handlePooledTransactions(data: PooledTransactionsMessage): void {
    //if (data[1].length > 0) console.log("Received TXs: ", data[1].length);
    for (let i = 0; i < data[1].length; i++) {
      const tx = TransactionFactory.fromBlockBodyData(data[1][i]);
      //console.log(tx.hash().toString("hex"));

      if (tx.type !== 0 && tx.type !== 1 && tx.type !== 2) {
        console.log(chalk.bold.red(`Unknown transaction type: ${tx.type}, transaction is ignored.`));
        continue;
      }

      const transObj: Partial<MempoolTransaction> = {
        hash: tx.hash().toString("hex"),
        type: tx.type,
        nonce: tx.nonce.toNumber(),
        from: tx.getSenderAddress().toString(),
        to: tx.to?.toString(),
        value: BigNumber.from(tx.value.toString()),
        data: tx.data,
        gasLimit: tx.gasLimit.toNumber(),
      };

      if (isLegacyTransaction(transObj)) {
        transObj.gasPrice = (tx as Transaction).gasPrice.toNumber();
      } else if (isEIP1559Transaction(transObj)) {
        const maxPriorityFeePerGas = (tx as FeeMarketEIP1559TxData).maxPriorityFeePerGas?.toString();
        transObj.maxPriorityFeePerGas = BigNumber.from(maxPriorityFeePerGas).toNumber();

        const maxFeePerGas = (tx as FeeMarketEIP1559TxData).maxFeePerGas?.toString();
        transObj.maxFeePerGas = BigNumber.from(maxFeePerGas).toNumber();
      }

      //console.log(transObj);

      this.notify(transObj as MempoolTransaction);
    }

    //if (data[1].length > 0) console.log("----------------------------\n");
  }

  // Connects to some bootnodes, this starts the peer discovery process
  private startBootstraping(): void {
    for (const bootnode of bootnodes) {
      this.dpt.bootstrap(bootnode).catch((err) => {
        console.error(chalk.bold.red(`DPT bootstrap error: ${err}`));
      });
    }
  }

  private startLogging(): void {
    setInterval(() => {
      const peersCount = this.dpt.getPeers().length;
      const openSlots = this.rlpx._getOpenSlots();
      const queueLength = this.rlpx._peersQueue.length;
      const queueLength2 = this.rlpx._peersQueue.filter((o) => o.ts <= Date.now()).length;

      console.log(chalk.yellow(`Total nodes in DPT: ${peersCount}, open slots: ${openSlots}, queue: ${queueLength} / ${queueLength2}`));
    }, 30000);
  }
}

export default NodelessMempoolProvider;
