import { Server as SocketIOServer, Socket } from "socket.io";
import { Hub } from "./hub";
import { ConversationService } from "@/services/conversation.service";
import { MessageService } from "@/services/message.service";
import { RedisService } from "@/services/redis.service";
import {
  SocketEvent,
  AuthenticatePayload,
  JoinConversationPayload,
  LeaveConversationPayload,
  SendMessagePayload,
  createAuthenticatedPayload,
  createErrorPayload,
  ClientToServerEvents,
  ServerToClientEvents,
} from "@notify/types";
import { logger } from "@/utils/logger";
import jwt from "jsonwebtoken";
import { config } from "@/config/config";

// Extend Socket type with authenticated user info
interface AuthenticatedSocket extends Socket {
  userId?: number;
  username?: string;
}

export class WebSocketHandler {
  private hub: Hub;

  constructor(
    io: SocketIOServer<ClientToServerEvents, ServerToClientEvents>,
    conversationService: ConversationService,
    messageService: MessageService,
    redisService: RedisService
  ) {
    this.hub = new Hub(io, conversationService, messageService, redisService);
  }

  // Initialize WebSocket handling
  public initialize(): void {
    // Hub is already initialized in constructor, no need to reinitialize
    // This method is kept for backward compatibility
  }

  // Handle new WebSocket connection
  public handleConnection(socket: AuthenticatedSocket): void {
    logger.info("New WebSocket connection", { socketId: socket.id });

    // Handle authentication
    socket.on(SocketEvent.AUTHENTICATE, async (payload: AuthenticatePayload) => {
      try {
        const authResult = await this.authenticateUser(payload.token);
        if (authResult) {
          // Register client with hub
          await this.hub.registerClient(socket, authResult.userId);

          // Store user info in socket for easy access
          socket.userId = authResult.userId;
          socket.username = authResult.username;

          // Send authenticated event
          const authenticatedPayload = createAuthenticatedPayload(authResult.userId, authResult.username);
          socket.emit(SocketEvent.AUTHENTICATED, authenticatedPayload);

          logger.info("User authenticated", {
            userId: authResult.userId,
            username: authResult.username,
            socketId: socket.id,
          });
        } else {
          const errorPayload = createErrorPayload("AUTH_FAILED", "Authentication failed");
          socket.emit(SocketEvent.ERROR, errorPayload);
          socket.disconnect();
        }
      } catch (error) {
        logger.error("Authentication error:", error);
        const errorPayload = createErrorPayload(
          "AUTH_ERROR",
          "Authentication error",
          error instanceof Error ? error.message : String(error)
        );
        socket.emit(SocketEvent.ERROR, errorPayload);
        socket.disconnect();
      }
    });

    // Handle join conversation
    socket.on(SocketEvent.JOIN_CONVERSATION, async (payload: JoinConversationPayload) => {
      try {
        if (!socket.userId) {
          const errorPayload = createErrorPayload("NOT_AUTHENTICATED", "Not authenticated");
          socket.emit(SocketEvent.ERROR, errorPayload);
          return;
        }

        await this.hub.joinConversation(socket.userId, payload.conversation_id, socket.username || "");
        logger.info("User joined conversation", {
          userId: socket.userId,
          conversationId: payload.conversation_id,
        });
      } catch (error) {
        logger.error("Join conversation error:", error);
        const errorPayload = createErrorPayload(
          "JOIN_FAILED",
          "Failed to join conversation",
          error instanceof Error ? error.message : String(error)
        );
        socket.emit(SocketEvent.ERROR, errorPayload);
      }
    });

    // Handle leave conversation
    socket.on(SocketEvent.LEAVE_CONVERSATION, async (payload: LeaveConversationPayload) => {
      try {
        if (!socket.userId) {
          const errorPayload = createErrorPayload("NOT_AUTHENTICATED", "Not authenticated");
          socket.emit(SocketEvent.ERROR, errorPayload);
          return;
        }

        await this.hub.leaveConversation(socket.userId, payload.conversation_id, socket.username || "");
        logger.info("User left conversation", {
          userId: socket.userId,
          conversationId: payload.conversation_id,
        });
      } catch (error) {
        logger.error("Leave conversation error:", error);
        const errorPayload = createErrorPayload(
          "LEAVE_FAILED",
          "Failed to leave conversation",
          error instanceof Error ? error.message : String(error)
        );
        socket.emit(SocketEvent.ERROR, errorPayload);
      }
    });

    // Handle send message
    socket.on(SocketEvent.SEND_MESSAGE, async (payload: SendMessagePayload) => {
      try {
        if (!socket.userId) {
          const errorPayload = createErrorPayload("NOT_AUTHENTICATED", "Not authenticated");
          socket.emit(SocketEvent.ERROR, errorPayload);
          return;
        }

        await this.hub.handleMessage(
          String(socket.userId),
          socket.username || "",
          payload.conversation_id,
          payload.text,
          payload.url,
          payload.fileName
        );

        logger.info("Message sent", {
          userId: socket.userId,
          conversationId: payload.conversation_id,
        });
      } catch (error) {
        logger.error("Send message error:", error);
        const errorPayload = createErrorPayload(
          "SEND_MESSAGE_FAILED",
          "Failed to send message",
          error instanceof Error ? error.message : String(error)
        );
        socket.emit(SocketEvent.ERROR, errorPayload);
      }
    });

    // Handle disconnect
    socket.on(SocketEvent.DISCONNECT, async (reason: string) => {
      try {
        if (socket.userId) {
          await this.hub.unregisterClient(socket, socket.userId);
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
  private async authenticateUser(token: string): Promise<{ userId: number; username: string } | null> {
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as any;
      const userId = decoded.userId || decoded.id;
      const username = decoded.username || decoded.name || `User-${userId}`;
      return { userId, username };
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
