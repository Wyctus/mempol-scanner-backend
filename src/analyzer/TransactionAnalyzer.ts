import MempoolProvider from "../provider/MempoolProvider";
import { isEIP1559Transaction, isLegacyTransaction, MempoolTransaction } from "../provider/MempoolTransaction";
import FrequencySet from "../datastructures/FrequencySet";
import Max from "../datastructures/Max";
import Average from "../datastructures/Average";
import MempoolInfoSubscriber from "./MempoolInfoSubscriber";
import { v4 } from "uuid";
import MempoolInfo from "./MempoolInfo";

class TransactionAnalyzer {
  private provider: MempoolProvider;
  private firstTransactionHandled: boolean;
  private subscribers: Map<string, MempoolInfoSubscriber>;

  private fromFrequencies: FrequencySet<string>;
  private toFrequencies: FrequencySet<string>;
  private maxValue: Max;
  private avgMaxFeePerGas: Average;
  private avgMaxPriorityFeePerGas: Average;
  private avgGasPrice: Average;
  private methodFrequencies: FrequencySet<{ hash: string; contract: string }>;

  constructor(provider: MempoolProvider, updateFrequency: number) {
    this.provider = provider;
    this.firstTransactionHandled = false;
    this.subscribers = new Map();

    this.fromFrequencies = new FrequencySet(10);
    this.toFrequencies = new FrequencySet(10);
    this.maxValue = new Max();
    this.avgMaxFeePerGas = new Average();
    this.avgMaxPriorityFeePerGas = new Average();
    this.avgGasPrice = new Average();
    this.methodFrequencies = new FrequencySet(10);

    this.provider.subscribe(this.transactionHandler.bind(this));

    setInterval(() => {
      if (this.firstTransactionHandled) {
        this.notify({
          topToAddresses: this.toFrequencies.getTopK(),
          topFromAddresses: this.fromFrequencies.getTopK(),
          topMethods: this.methodFrequencies.getTopK(),
          maxValue: this.maxValue.max.div(10 ** 9).toString(),
          avgGasPrice: this.avgGasPrice.average / 10 ** 9,
          avgMaxFeePerGas: this.avgMaxFeePerGas.average / 10 ** 9,
          avgMaxPriorityFeePerGas: this.avgMaxPriorityFeePerGas.average / 10 ** 9,
        });
      }
    }, updateFrequency);
  }

  transactionHandler(tx: MempoolTransaction): void {
    if (!this.firstTransactionHandled) {
      this.firstTransactionHandled = true;
    }

    this.fromFrequencies.insert(tx.from);

    if (tx.to) {
      this.toFrequencies.insert(tx.to);
    }

    this.maxValue.insert(tx.value);

    if (isLegacyTransaction(tx)) {
      this.avgGasPrice.insert(tx.gasPrice);
    }

    if (isEIP1559Transaction(tx)) {
      this.avgMaxFeePerGas.insert(tx.maxFeePerGas);
      this.avgMaxPriorityFeePerGas.insert(tx.maxPriorityFeePerGas);
    }

    if (tx.data.byteLength >= 4) {
      const methodHash: string = tx.data.toString("hex", 0, 4);
      this.methodFrequencies.insert({ hash: `0x${methodHash}`, contract: tx.to as string });
    }
  }

  subscribe(subscriber: MempoolInfoSubscriber): string {
    const subscriberId: string = v4();
    this.subscribers.set(subscriberId, subscriber);

    return subscriberId;
  }

  unsubscribe(subscriberId: string): boolean {
    return this.subscribers.delete(subscriberId);
  }

  notify(tx: MempoolInfo): void {
    this.subscribers.forEach((subscriber) => subscriber(tx));
  }
}

export default TransactionAnalyzer;
