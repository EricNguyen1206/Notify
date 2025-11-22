import { Server as SocketIOServer, Socket } from "socket.io";
import { ConversationService } from "@/services/conversation.service";
import { MessageService } from "@/services/message.service";
import { RedisService } from "@/services/redis.service";
import {
  SocketEvent,
  createJoinedConversationPayload,
  createLeftConversationPayload,
  createMessageDto,
  createUserJoinedPayload,
  createUserLeftPayload,
  ClientToServerEvents,
  ServerToClientEvents,
  MessageDto,
} from "@notify/types";
import { logger } from "@/utils/logger";

export class Hub {
  private conversations: Map<string, Map<string, Socket>> = new Map(); // conversationId -> userId -> socket
  private clients: Map<string, Socket> = new Map(); // userId -> socket
  private conversationService: ConversationService;
  private messageService: MessageService;
  private redisService: RedisService;
  private io: SocketIOServer<ClientToServerEvents, ServerToClientEvents>;

  constructor(
    io: SocketIOServer<ClientToServerEvents, ServerToClientEvents>,
    conversationService: ConversationService,
    messageService: MessageService,
    redisService: RedisService
  ) {
    this.io = io;
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

      // Remove from all conversations
      for (const [conversationId, conversationClients] of this.conversations.entries()) {
        if (conversationClients.has(userIdStr)) {
          await this.leaveConversation(userId, parseInt(conversationId), `User-${userId}`);
        }
      }

      logger.info("Client unregistered", { userId, socketId: socket.id });
    } catch (error) {
      logger.error("Unregister client error:", error);
      throw error;
    }
  }

  // Join a conversation
  async joinConversation(userId: number, conversationId: number, username: string): Promise<void> {
    try {
      const userIdStr = userId.toString();
      const conversationIdStr = conversationId.toString();

      // Get user socket
      const socket = this.clients.get(userIdStr);
      if (!socket) {
        throw new Error("User not connected");
      }

      // Check if user is already in conversation
      if (this.isUserInConversation(userId, conversationId)) {
        return;
      }

      // Add user to conversation in memory
      if (!this.conversations.has(conversationIdStr)) {
        this.conversations.set(conversationIdStr, new Map());
      }
      this.conversations.get(conversationIdStr)!.set(userIdStr, socket);

      // Add user to conversation in Redis
      await this.redisService.joinConversation(userIdStr, conversationIdStr);

      // Emit joined_conversation to the user
      const joinedPayload = createJoinedConversationPayload(conversationId, userId, username);
      socket.emit(SocketEvent.JOINED_CONVERSATION, joinedPayload);

      // Notify other participants
      const userJoinedPayload = createUserJoinedPayload(conversationId, userId, username);
      this.broadcastToConversation(conversationId, SocketEvent.USER_JOINED, userJoinedPayload, userId);

      logger.info("User joined conversation", { userId, conversationId });
    } catch (error) {
      logger.error("Join conversation error:", error);
      throw error;
    }
  }

  // Leave a conversation
  async leaveConversation(userId: number, conversationId: number, username: string): Promise<void> {
    try {
      const userIdStr = userId.toString();
      const conversationIdStr = conversationId.toString();

      // Get user socket
      const socket = this.clients.get(userIdStr);

      // Remove user from conversation in memory
      const conversationClients = this.conversations.get(conversationIdStr);
      if (conversationClients) {
        conversationClients.delete(userIdStr);

        // Remove empty conversations
        if (conversationClients.size === 0) {
          this.conversations.delete(conversationIdStr);
        }
      }

      // Remove user from conversation in Redis
      await this.redisService.leaveConversation(userIdStr, conversationIdStr);

      // Emit left_conversation to the user if socket exists
      if (socket) {
        const leftPayload = createLeftConversationPayload(conversationId, userId, username);
        socket.emit(SocketEvent.LEFT_CONVERSATION, leftPayload);
      }

      // Notify other participants
      const userLeftPayload = createUserLeftPayload(conversationId, userId, username);
      this.broadcastToConversation(conversationId, SocketEvent.USER_LEFT, userLeftPayload, userId);

      logger.info("User left conversation", { userId, conversationId });
    } catch (error) {
      logger.error("Leave conversation error:", error);
      throw error;
    }
  }

  // Broadcast event to all members of a conversation (excluding sender if specified)
  public broadcastToConversation<T>(
    conversationId: number,
    event: SocketEvent,
    payload: T,
    excludeUserId?: number
  ): void {
    try {
      const conversationIdStr = conversationId.toString();
      const conversationClients = this.conversations.get(conversationIdStr);

      if (!conversationClients || conversationClients.size === 0) {
        logger.warn("No clients in conversation", { conversationId });
        return;
      }

      const excludeUserIdStr = excludeUserId?.toString();

      // Send to all clients in conversation (except excluded user)
      for (const [userId, socket] of conversationClients) {
        if (excludeUserIdStr && userId === excludeUserIdStr) {
          continue;
        }

        try {
          socket.emit(event as any, payload);
        } catch (error) {
          logger.error("Error sending event to client", { userId, conversationId, event, error });
        }
      }

      logger.debug("Event broadcasted to conversation", {
        conversationId,
        event,
        clientCount: conversationClients.size,
      });
    } catch (error) {
      logger.error("Broadcast to conversation error:", error);
      throw error;
    }
  }

  // Handle incoming message
  async handleMessage(
    senderId: string,
    senderName: string,
    conversationId: number,
    text?: string | null,
    url?: string | null,
    fileName?: string | null
  ): Promise<void> {
    try {
      // Validate message content
      if (!text && !url && !fileName) {
        throw new Error("Message must have text, url, or fileName");
      }

      // Save message to database
      const messageData: {
        conversationId: string;
        text?: string;
        url?: string;
        fileName?: string;
      } = {
        conversationId: String(conversationId),
      };

      if (text) messageData.text = text;
      if (url) messageData.url = url;
      if (fileName) messageData.fileName = fileName;

      const savedMessage = await this.messageService.createMessage(senderId, messageData);

      // Get sender info (in production, fetch from database/cache)
      const senderAvatar = undefined; // TODO: fetch from user service

      // Create message DTO for broadcasting
      const newMessage: MessageDto = createMessageDto(
        savedMessage.id,
        String(conversationId),
        senderId,
        senderName,
        senderAvatar,
        text,
        url,
        fileName,
        savedMessage.createdAt
      );

      // Broadcast to all conversation members (including sender for confirmation)
      this.broadcastToConversation(conversationId, SocketEvent.NEW_MESSAGE as any, newMessage);

      logger.info("Message handled", {
        conversationId,
        senderId,
        messageId: savedMessage.id,
      });
    } catch (error) {
      logger.error("Handle message error:", error);
      throw error;
    }
  }

  // Check if user is in a conversation
  private isUserInConversation(userId: number, conversationId: number): boolean {
    const userIdStr = userId.toString();
    const conversationIdStr = conversationId.toString();
    const conversationClients = this.conversations.get(conversationIdStr);
    return conversationClients ? conversationClients.has(userIdStr) : false;
  }

  // Get conversation member count
  getParticipantCount(conversationId: number): number {
    const conversationIdStr = conversationId.toString();
    const conversationClients = this.conversations.get(conversationIdStr);
    return conversationClients ? conversationClients.size : 0;
  }

  // Get all connected users
  getConnectedUsers(): number[] {
    return Array.from(this.clients.keys()).map((id) => parseInt(id));
  }

  // Get conversation members
  getParticipants(conversationId: number): number[] {
    const conversationIdStr = conversationId.toString();
    const conversationClients = this.conversations.get(conversationIdStr);
    return conversationClients ? Array.from(conversationClients.keys()).map((id) => parseInt(id)) : [];
  }
}
