import { Application } from "express";
import { Server as SocketIOServer } from "socket.io";
import { authRoutes } from "./auth.routes";
import { userRoutes } from "./user.routes";
import { channelRoutes } from "./channel.routes";
import { messageRoutes } from "./message.routes";
import websocketRoutes, { initializeWebSocketRoutes } from "./websocket.routes";
import { generalRateLimit, authRateLimit } from "@/middleware/rateLimit/rateLimit.middleware";
import { authenticateToken } from "@/middleware/auth/auth.middleware";

export const setupRoutes = (app: Application, io: SocketIOServer): void => {
  // Initialize WebSocket routes
  initializeWebSocketRoutes(io);

  // API version prefix
  const apiPrefix = "/api/v1";

  // Public routes (no authentication required)
  app.use(`${apiPrefix}/auth`, authRateLimit, authRoutes);

  // Protected routes (authentication required)
  app.use(`${apiPrefix}/users`, generalRateLimit, authenticateToken, userRoutes);
  app.use(`${apiPrefix}/channels`, generalRateLimit, authenticateToken, channelRoutes);
  app.use(`${apiPrefix}/messages`, generalRateLimit, authenticateToken, messageRoutes);

  // WebSocket routes
  app.use(`${apiPrefix}/ws`, websocketRoutes);
};
