import TransactionAnalyzer from "./analyzer/TransactionAnalyzer";
import NodelessMempoolProvider from "./provider/NodelessMempoolProvider";
import SimpleMempoolProvider from "./provider/SimpleMempoolProvider";
import Websocket from "./websocket/Websocket";

const provider = new SimpleMempoolProvider();
//const provider = new NodelessMempoolProvider();
const analyzer = new TransactionAnalyzer(provider, 10000);

const websocket = new Websocket(4042);
analyzer.subscribe((info) => websocket.broadcastMempoolInfo(info));
