import { Server as SocketIOServer, Socket } from "socket.io";
import { ConversationService } from "@/services/conversation.service";
import { MessageService } from "@/services/message.service";
import { RedisService } from "@/services/redis.service";
import {
  WebSocketMessage,
  newConnectMessage,
  newChannelMessage,
  newJoinChannelMessage,
  newLeaveChannelMessage,
  newErrorMessage,
  isChannelMessage,
  isChannelJoinMessage,
  isChannelLeaveMessage,
} from "./message-types";
import { logger } from "@/utils/logger";

export class Hub {
  private conversations: Map<string, Map<string, Socket>> = new Map(); // conversationId -> userId -> socket
  private clients: Map<string, Socket> = new Map(); // userId -> socket
  private conversationService: ConversationService;
  private messageService: MessageService;
  private redisService: RedisService;

  constructor(
    // @ts-ignore - Intentionally unused, kept for future use
    private _io: SocketIOServer,
    conversationService: ConversationService,
    messageService: MessageService,
    redisService: RedisService
  ) {
    this.conversationService = conversationService;
    this.messageService = messageService;
    this.redisService = redisService;
  }

  // Register a new client connection
  async registerClient(socket: Socket, userId: number): Promise<void> {
    try {
      const userIdStr = userId.toString();

      // Store client connection
      this.clients.set(userIdStr, socket);

      // Set user online in Redis
      await this.redisService.setUserOnline(userIdStr);

      // Send connect message
      const connectMessage = newConnectMessage(userId, `User-${userId}`);
      socket.emit("message", connectMessage);

      logger.info("Client registered", { userId, socketId: socket.id });
    } catch (error) {
      logger.error("Register client error:", error);
      throw error;
    }
  }

  // Unregister a client connection
  async unregisterClient(socket: Socket, userId: number): Promise<void> {
    try {
      const userIdStr = userId.toString();

      // Remove from clients map
      this.clients.delete(userIdStr);

      // Set user offline in Redis
      await this.redisService.setUserOffline(userIdStr);

      // Remove from all channels
      for (const [conversationId, conversationClients] of this.conversations.entries()) {
        if (conversationClients.has(userIdStr)) {
          await this.leaveConversation(userId, parseInt(conversationId));
        }
      }

      logger.info("Client unregistered", { userId, socketId: socket.id });
    } catch (error) {
      logger.error("Unregister client error:", error);
      throw error;
    }
  }

  // Join a channel
  async joinConversation(userId: number, conversationId: number): Promise<void> {
    try {
      const userIdStr = userId.toString();
      const conversationIdStr = conversationId.toString();

      // Get user socket
      const socket = this.clients.get(userIdStr);
      if (!socket) {
        throw new Error("User not connected");
      }

      // Check if user is already in channel
      if (this.isUserInConversation(userId, conversationId)) {
        return;
      }

      // Add user to channel in memory
      if (!this.conversations.has(conversationIdStr)) {
        this.conversations.set(conversationIdStr, new Map());
      }
      this.conversations.get(conversationIdStr)!.set(userIdStr, socket);

      // Add user to channel in Redis
      await this.redisService.joinConversation(userIdStr, conversationIdStr);

      // Notify channel members
      await this.notifyParticipants(conversationId, userId, "join");

      logger.info("User joined channel", { userId, conversationId });
    } catch (error) {
      logger.error("Join channel error:", error);
      throw error;
    }
  }

  // Leave a channel
  async leaveConversation(userId: number, conversationId: number): Promise<void> {
    try {
      const userIdStr = userId.toString();
      const conversationIdStr = conversationId.toString();

      // Remove user from channel in memory
      const conversationClients = this.conversations.get(conversationIdStr);
      if (conversationClients) {
        conversationClients.delete(userIdStr);

        // Remove empty channels
        if (conversationClients.size === 0) {
          this.conversations.delete(conversationIdStr);
        }
      }

      // Remove user from channel in Redis
      await this.redisService.leaveConversation(userIdStr, conversationIdStr);

      // Notify channel members
      await this.notifyParticipants(conversationId, userId, "leave");

      logger.info("User left channel", { userId, conversationId });
    } catch (error) {
      logger.error("Leave channel error:", error);
      throw error;
    }
  }

  // Broadcast message to all members of a channel
  async broadcastToConversation(conversationId: number, message: WebSocketMessage): Promise<void> {
    try {
      const conversationIdStr = conversationId.toString();
      const conversationClients = this.conversations.get(conversationIdStr);

      if (!conversationClients || conversationClients.size === 0) {
        logger.warn("No clients in channel", { conversationId });
        return;
      }

      // Send to all clients in channel
      for (const [userId, socket] of conversationClients) {
        try {
          socket.emit("message", message);
        } catch (error) {
          logger.error("Error sending message to client", { userId, conversationId, error });
        }
      }

      logger.debug("Message broadcasted to channel", {
        conversationId,
        clientCount: conversationClients.size,
      });
    } catch (error) {
      logger.error("Broadcast to channel error:", error);
      throw error;
    }
  }

  // Handle incoming client message
  async handleClientMessage(socket: Socket, message: WebSocketMessage): Promise<void> {
    try {
      if (isChannelJoinMessage(message)) {
        await this.handleJoinConversation(socket, message);
      } else if (isChannelLeaveMessage(message)) {
        await this.handleLeaveChannel(socket, message);
      } else if (isChannelMessage(message)) {
        await this.handleConversationMessage(socket, message);
      } else {
        logger.warn("Unknown message type", { type: message.type });
      }
    } catch (error) {
      logger.error("Handle client message error:", error);

      // Send error message back to client
      const errorMessage = newErrorMessage("MESSAGE_HANDLE_ERROR", "Failed to handle message", {
        originalMessage: message,
        error: error instanceof Error ? error.message : String(error),
      });
      socket.emit("message", errorMessage);
    }
  }

  // Handle join channel message
  private async handleJoinConversation(_socket: Socket, message: WebSocketMessage): Promise<void> {
    try {
      const { conversation_id, user_id } = message.data;

      if (!user_id || !conversation_id) {
        throw new Error("Missing user_id or conversation_id");
      }

      await this.joinConversation(user_id, conversation_id);
    } catch (error) {
      logger.error("Handle join channel error:", error);
      throw error;
    }
  }

  // Handle leave channel message
  private async handleLeaveChannel(_socket: Socket, message: WebSocketMessage): Promise<void> {
    try {
      const { conversation_id, user_id } = message.data;

      if (!user_id || !conversation_id) {
        throw new Error("Missing user_id or conversation_id");
      }

      await this.leaveConversation(user_id, conversation_id);
    } catch (error) {
      logger.error("Handle leave channel error:", error);
      throw error;
    }
  }

  // Handle channel message
  private async handleConversationMessage(_socket: Socket, message: WebSocketMessage): Promise<void> {
    try {
      const { conversation_id, sender_id, text, url, file_name } = message.data;

      if (!conversation_id || !sender_id) {
        throw new Error("Missing conversation_id or sender_id");
      }

      // Validate message content
      if (!text && !url && !file_name) {
        throw new Error("Message must have text, url, or file_name");
      }

      // Save message to database
      const savedMessage = await this.messageService.createMessage(sender_id, {
        conversationId: conversation_id,
        text,
        url,
        fileName: file_name,
      });

      // Get sender info for the message
      // Note: In a real implementation, you'd get sender info from database
      await this.conversationService.getConversationByIdPublic(conversation_id);
      const senderName = `User-${sender_id}`;
      const senderAvatar = undefined;

      // Create channel message for broadcasting
      const channelMessage = newChannelMessage(
        conversation_id,
        sender_id,
        senderName,
        senderAvatar,
        text,
        url,
        file_name
      );

      // Broadcast to all channel members
      await this.broadcastToConversation(conversation_id, channelMessage);

      logger.info("Channel message handled", {
        conversationId: conversation_id,
        senderId: sender_id,
        messageId: savedMessage.id,
      });
    } catch (error) {
      logger.error("Handle channel message error:", error);
      throw error;
    }
  }

  // Notify channel members about join/leave events
  private async notifyParticipants(conversationId: number, userId: number, action: "join" | "leave"): Promise<void> {
    try {
      // Get user info (in real implementation, get from database)
      const username = `User-${userId}`;

      let message: WebSocketMessage;
      if (action === "join") {
        message = newJoinChannelMessage(conversationId, userId, username);
      } else {
        message = newLeaveChannelMessage(conversationId, userId, username);
      }

      // Broadcast to all channel members
      await this.broadcastToConversation(conversationId, message);
    } catch (error) {
      logger.error("Notify participants error:", error);
      throw error;
    }
  }

  // Check if user is in a channel
  private isUserInConversation(userId: number, conversationId: number): boolean {
    const userIdStr = userId.toString();
    const conversationIdStr = conversationId.toString();
    const conversationClients = this.conversations.get(conversationIdStr);
    return conversationClients ? conversationClients.has(userIdStr) : false;
  }

  // Get channel member count
  getParticipantCount(conversationId: number): number {
    const conversationIdStr = conversationId.toString();
    const conversationClients = this.conversations.get(conversationIdStr);
    return conversationClients ? conversationClients.size : 0;
  }

  // Get all connected users
  getConnectedUsers(): number[] {
    return Array.from(this.clients.keys()).map((id) => parseInt(id));
  }

  // Get channel members
  getParticipants(conversationId: number): number[] {
    const conversationIdStr = conversationId.toString();
    const conversationClients = this.conversations.get(conversationIdStr);
    return conversationClients ? Array.from(conversationClients.keys()).map((id) => parseInt(id)) : [];
  }
}
