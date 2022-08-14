import { createServer, Server as HttpServer } from "http";
import { Server as WebsocketServer } from "socket.io";

/**
 * The `Websocket` class handles the incoming websocket connections,
 * and broadcasts the mempool informations to the clients.
 */
class Websocket {
  private server: HttpServer;
  private io: WebsocketServer;

  constructor(port: number) {
    this.server = createServer();
    this.io = new WebsocketServer(this.server, { cors: { origin: "*" } });

    this.io.listen(port);
  }

  broadcastMempoolInfo(data: unknown): void {
    this.io.emit("mempoolUpdate", data);
  }
}

export default Websocket;
