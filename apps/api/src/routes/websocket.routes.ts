import { Router } from "express";
import { Server as SocketIOServer } from "socket.io";
import { WebSocketController } from "@/controllers/websocket.controller";

const router = Router();

// Initialize WebSocket controller
let wsController: WebSocketController | undefined;

export const initializeWebSocketRoutes = (io: SocketIOServer) => {
  wsController = new WebSocketController(io);

  // Setup routes after controller is initialized
  router.get("/stats", (req, res) => wsController!.getWebSocketStats(req, res));
  router.get("/conversations/:conversationId/participants", (req, res) => wsController!.getParticipants(req, res));
  router.post("/conversations/:conversationId/broadcast", (req, res) =>
    wsController!.broadcastToConversation(req, res)
  );
  router.get("/users", (req, res) => wsController!.getConnectedUsers(req, res));
  router.delete("/users/:userId", (req, res) => wsController!.disconnectUser(req, res));
};

export default router;
