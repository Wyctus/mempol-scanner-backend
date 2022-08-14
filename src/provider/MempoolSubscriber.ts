import { MempoolTransaction } from "./MempoolTransaction";

type MempoolSubscriber = (tx: MempoolTransaction) => void;

export default MempoolSubscriber;
