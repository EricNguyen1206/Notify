import { Server as SocketIOServer, Socket } from "socket.io";
import { Hub } from "./hub";
import { ConversationService } from "@/services/conversation/conversation.service";
import { MessageService } from "@/services/message/message.service";
import { RedisService } from "@/services/redis/redis.service";
import { WebSocketMessage } from "./message-types";
import { logger } from "@/utils/logger";
import jwt from "jsonwebtoken";
import { config } from "@/config/config";

export class WebSocketHandler {
  private hub: Hub;

  constructor(
    io: SocketIOServer,
    conversationService: ConversationService,
    messageService: MessageService,
    redisService: RedisService
  ) {
    // Services are passed to Hub but not directly used here
    this.hub = new Hub(io, conversationService, messageService, redisService);
  }

  // Initialize WebSocket handling
  public initialize(): void {
    // Hub is already initialized in constructor, no need to reinitialize
    // This method is kept for backward compatibility
  }

  // Handle new WebSocket connection
  public handleConnection(socket: Socket): void {
    logger.info("New WebSocket connection", { socketId: socket.id });

    // Handle authentication
    socket.on("authenticate", async (data: { token: string }) => {
      try {
        const userId = await this.authenticateUser(data.token);
        if (userId) {
          // Register client with hub
          await this.hub.registerClient(socket, userId);

          // Store user ID in socket for easy access
          (socket as any).userId = userId;

          socket.emit("authenticated", { userId });
          logger.info("User authenticated", { userId, socketId: socket.id });
        } else {
          socket.emit("error", { message: "Authentication failed" });
          socket.disconnect();
        }
      } catch (error) {
        logger.error("Authentication error:", error);
        socket.emit("error", { message: "Authentication failed" });
        socket.disconnect();
      }
    });

    // Handle incoming messages
    socket.on("message", async (message: WebSocketMessage) => {
      try {
        const userId = (socket as any).userId;
        if (!userId) {
          socket.emit("error", { message: "Not authenticated" });
          return;
        }

        // Add user_id to message if not present
        if (!message.user_id) {
          message.user_id = userId;
        }

        await this.hub.handleClientMessage(socket, message);
      } catch (error) {
        logger.error("Message handling error:", error);
        socket.emit("error", { message: "Failed to handle message" });
      }
    });

    // Handle join conversation
    socket.on("join_conversation", async (data: { conversation_id: number }) => {
      try {
        const userId = (socket as any).userId;
        if (!userId) {
          socket.emit("error", { message: "Not authenticated" });
          return;
        }

        await this.hub.joinConversation(userId, data.conversation_id);
        socket.emit("joined_conversation", { conversation_id: data.conversation_id });
      } catch (error) {
        logger.error("Join conversation error:", error);
        socket.emit("error", { message: "Failed to join conversation" });
      }
    });

    // Handle leave conversation
    socket.on("leave_conversation", async (data: { conversation_id: number }) => {
      try {
        const userId = (socket as any).userId;
        if (!userId) {
          socket.emit("error", { message: "Not authenticated" });
          return;
        }

        await this.hub.leaveConversation(userId, data.conversation_id);
        socket.emit("left_conversation", { conversation_id: data.conversation_id });
      } catch (error) {
        logger.error("Leave conversation error:", error);
        socket.emit("error", { message: "Failed to leave conversation" });
      }
    });

    // Handle disconnect
    socket.on("disconnect", async (reason: string) => {
      try {
        const userId = (socket as any).userId;
        if (userId) {
          await this.hub.unregisterClient(socket, userId);
        }
        logger.info("WebSocket disconnected", { socketId: socket.id, reason });
      } catch (error) {
        logger.error("Disconnect handling error:", error);
      }
    });

    // Handle errors
    socket.on("error", (error: Error) => {
      logger.error("Socket error:", error);
    });
  }

  // Authenticate user from JWT token
  private async authenticateUser(token: string): Promise<number | null> {
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as any;
      return decoded.userId || decoded.id;
    } catch (error) {
      logger.error("JWT verification error:", error);
      return null;
    }
  }

  // Get hub instance for external access
  public getHub(): Hub {
    return this.hub;
  }
}
