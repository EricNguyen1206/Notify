import { Router } from "express";
import { Server as SocketIOServer } from "socket.io";
import { WebSocketController } from "@/controllers/websocket/websocket.controller";

export const websocketRoutes = (io: SocketIOServer) => {
  const router = Router();
  const websocketController = new WebSocketController(io);

  // WebSocket connection endpoint
  router.get("/", websocketController.handleConnection);

  return router;
};
