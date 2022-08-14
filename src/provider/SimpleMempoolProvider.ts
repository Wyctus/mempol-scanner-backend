import chalk from "chalk";
import { providers } from "ethers";
import MempoolProvider from "./MempoolProvider";
import { isEIP1559Transaction, isLegacyTransaction, LegacyMempoolTransaction, MempoolTransaction } from "./MempoolTransaction";
/**
 * The `SimpleMempoolProvider` is an implementation of the `MempoolProvider`.
 * It is based on an Ethereum node websocket provider.
 */
class SimpleMempoolProvider extends MempoolProvider {
  provider: providers.InfuraWebSocketProvider;
  constructor(capacity?: number) {
    super(capacity);
    this.provider = new providers.InfuraWebSocketProvider("mainnet", "bc4844cc889e45be9722e5b565eaefdd");
    this.provider.on("pending", (tx) => {
      this.provider.getTransaction(tx).then((transaction) => {
        if (transaction) {
          this.handleTransaction(transaction);
        }
      });
    });
  }

  handleTransaction(tx: providers.TransactionResponse): void {
    if (tx.type !== 0 && tx.type !== 1 && tx.type !== 2) {
      console.log(chalk.bold.red(`Unknown transaction type: ${tx.type}, transaction is ignored.`));
      return;
    }
    const transObj: Partial<MempoolTransaction> = {
      type: tx.type,
      hash: tx.hash,
      nonce: tx.nonce,
      from: tx.from,
      to: tx.to,
      value: tx.value,
      data: Buffer.from(tx.data),
      gasLimit: tx.gasLimit.toNumber(),
    };
    if (isLegacyTransaction(transObj)) {
      transObj.gasPrice = tx.gasPrice?.toNumber() as number;
    } else if (isEIP1559Transaction(transObj)) {
      transObj.maxPriorityFeePerGas = tx.maxPriorityFeePerGas?.toNumber() as number;
      transObj.maxFeePerGas = tx.maxFeePerGas?.toNumber() as number;
    }
    this.notify(transObj as MempoolTransaction);
  }
}
export default SimpleMempoolProvider;
