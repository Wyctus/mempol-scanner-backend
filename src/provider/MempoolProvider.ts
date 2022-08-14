import { v4 } from "uuid";
import MempoolSubscriber from "./MempoolSubscriber";
import { MempoolTransaction } from "./MempoolTransaction";

/**
 * The `MempoolProvider` is the base class of the mempool transaction provider functionality.
 * This allows to easily support multiple data provider strategies.
 */
abstract class MempoolProvider {
  private subscribers: Map<string, MempoolSubscriber>;
  private capacity: number | undefined;

  constructor(capacity?: number) {
    this.subscribers = new Map();
    this.capacity = capacity;
  }

  /**
   * The `subscribe` method adds a new subscriber to the provider.
   * The subscribers get notified of the new transactions.
   * The function returns a subscriber ID.
   */
  subscribe(subscriber: MempoolSubscriber): string {
    const subscriberId: string = v4();
    this.subscribers.set(subscriberId, subscriber);

    return subscriberId;
  }

  unsubscribe(subscriberId: string): boolean {
    return this.subscribers.delete(subscriberId);
  }

  notify(tx: MempoolTransaction): void {
    this.subscribers.forEach((subscriber) => subscriber(tx));
  }
}

export default MempoolProvider;
