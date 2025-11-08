import { Router } from "express";
import { Server as SocketIOServer } from "socket.io";
import { WebSocketController } from "@/controllers/websocket/websocket.controller";

const router = Router();

// Initialize WebSocket controller
let wsController: WebSocketController;

export const initializeWebSocketRoutes = (io: SocketIOServer) => {
  wsController = new WebSocketController(io);
};

// WebSocket statistics
router.get("/stats", wsController?.getWebSocketStats.bind(wsController));

// Get channel members
router.get("/channels/:channelId/members", wsController?.getChannelMembers.bind(wsController));

// Broadcast message to channel (admin only)
router.post("/channels/:channelId/broadcast", wsController?.broadcastToChannel.bind(wsController));

// Get connected users
router.get("/users", wsController?.getConnectedUsers.bind(wsController));

// Disconnect user (admin only)
router.delete("/users/:userId", wsController?.disconnectUser.bind(wsController));

export default router;
