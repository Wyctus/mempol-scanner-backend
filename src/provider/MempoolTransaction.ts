import { BigNumber } from "ethers";

interface MempoolTransactionBase {
  hash: string;
  nonce: number;
  from: string;
  to?: string;
  value: BigNumber;
  data: Buffer;
  gasLimit: number;
}

interface LegacyMempoolTransaction extends MempoolTransactionBase {
  type: 0 | 1;
  gasPrice: number;
}

interface EIP1559MempoolTransaction extends MempoolTransactionBase {
  type: 2;
  maxPriorityFeePerGas: number;
  maxFeePerGas: number;
}

type MempoolTransaction = LegacyMempoolTransaction | EIP1559MempoolTransaction;

function isLegacyTransaction(tx: MempoolTransaction | Partial<MempoolTransaction>): tx is LegacyMempoolTransaction {
  return tx.type === 0 || tx.type === 1;
}

function isEIP1559Transaction(tx: MempoolTransaction | Partial<MempoolTransaction>): tx is EIP1559MempoolTransaction {
  return tx.type === 2;
}

export { MempoolTransaction, LegacyMempoolTransaction, EIP1559MempoolTransaction, isLegacyTransaction, isEIP1559Transaction };
