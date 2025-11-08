import { Server as SocketIOServer, Socket } from "socket.io";
import { ChannelService } from "@/services/channel/channel.service";
import { MessageService } from "@/services/message/message.service";
import { RedisService } from "@/services/redis/redis.service";
import {
  WebSocketMessage,
  MessageType,
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
  private channels: Map<string, Map<string, Socket>> = new Map(); // channelId -> userId -> socket
  private clients: Map<string, Socket> = new Map(); // userId -> socket
  private channelService: ChannelService;
  private messageService: MessageService;
  private redisService: RedisService;

  constructor(
    private io: SocketIOServer,
    channelService: ChannelService,
    messageService: MessageService,
    redisService: RedisService
  ) {
    this.channelService = channelService;
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
      for (const [channelId, channelClients] of this.channels.entries()) {
        if (channelClients.has(userIdStr)) {
          await this.leaveChannel(userId, parseInt(channelId));
        }
      }

      logger.info("Client unregistered", { userId, socketId: socket.id });
    } catch (error) {
      logger.error("Unregister client error:", error);
      throw error;
    }
  }

  // Join a channel
  async joinChannel(userId: number, channelId: number): Promise<void> {
    try {
      const userIdStr = userId.toString();
      const channelIdStr = channelId.toString();

      // Get user socket
      const socket = this.clients.get(userIdStr);
      if (!socket) {
        throw new Error("User not connected");
      }

      // Check if user is already in channel
      if (this.isUserInChannel(userId, channelId)) {
        return;
      }

      // Add user to channel in memory
      if (!this.channels.has(channelIdStr)) {
        this.channels.set(channelIdStr, new Map());
      }
      this.channels.get(channelIdStr)!.set(userIdStr, socket);

      // Add user to channel in Redis
      await this.redisService.joinChannel(userIdStr, channelIdStr);

      // Notify channel members
      await this.notifyChannelMembers(channelId, userId, "join");

      logger.info("User joined channel", { userId, channelId });
    } catch (error) {
      logger.error("Join channel error:", error);
      throw error;
    }
  }

  // Leave a channel
  async leaveChannel(userId: number, channelId: number): Promise<void> {
    try {
      const userIdStr = userId.toString();
      const channelIdStr = channelId.toString();

      // Remove user from channel in memory
      const channelClients = this.channels.get(channelIdStr);
      if (channelClients) {
        channelClients.delete(userIdStr);

        // Remove empty channels
        if (channelClients.size === 0) {
          this.channels.delete(channelIdStr);
        }
      }

      // Remove user from channel in Redis
      await this.redisService.leaveChannel(userIdStr, channelIdStr);

      // Notify channel members
      await this.notifyChannelMembers(channelId, userId, "leave");

      logger.info("User left channel", { userId, channelId });
    } catch (error) {
      logger.error("Leave channel error:", error);
      throw error;
    }
  }

  // Broadcast message to all members of a channel
  async broadcastToChannel(channelId: number, message: WebSocketMessage): Promise<void> {
    try {
      const channelIdStr = channelId.toString();
      const channelClients = this.channels.get(channelIdStr);

      if (!channelClients || channelClients.size === 0) {
        logger.warn("No clients in channel", { channelId });
        return;
      }

      // Send to all clients in channel
      for (const [userId, socket] of channelClients) {
        try {
          socket.emit("message", message);
        } catch (error) {
          logger.error("Error sending message to client", { userId, channelId, error });
        }
      }

      logger.debug("Message broadcasted to channel", {
        channelId,
        clientCount: channelClients.size,
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
        await this.handleJoinChannel(socket, message);
      } else if (isChannelLeaveMessage(message)) {
        await this.handleLeaveChannel(socket, message);
      } else if (isChannelMessage(message)) {
        await this.handleChannelMessage(socket, message);
      } else {
        logger.warn("Unknown message type", { type: message.type });
      }
    } catch (error) {
      logger.error("Handle client message error:", error);

      // Send error message back to client
      const errorMessage = newErrorMessage("MESSAGE_HANDLE_ERROR", "Failed to handle message", {
        originalMessage: message,
        error: error.message,
      });
      socket.emit("message", errorMessage);
    }
  }

  // Handle join channel message
  private async handleJoinChannel(socket: Socket, message: WebSocketMessage): Promise<void> {
    try {
      const { channel_id, user_id } = message.data;

      if (!user_id || !channel_id) {
        throw new Error("Missing user_id or channel_id");
      }

      await this.joinChannel(user_id, channel_id);
    } catch (error) {
      logger.error("Handle join channel error:", error);
      throw error;
    }
  }

  // Handle leave channel message
  private async handleLeaveChannel(socket: Socket, message: WebSocketMessage): Promise<void> {
    try {
      const { channel_id, user_id } = message.data;

      if (!user_id || !channel_id) {
        throw new Error("Missing user_id or channel_id");
      }

      await this.leaveChannel(user_id, channel_id);
    } catch (error) {
      logger.error("Handle leave channel error:", error);
      throw error;
    }
  }

  // Handle channel message
  private async handleChannelMessage(socket: Socket, message: WebSocketMessage): Promise<void> {
    try {
      const { channel_id, sender_id, text, url, file_name } = message.data;

      if (!channel_id || !sender_id) {
        throw new Error("Missing channel_id or sender_id");
      }

      // Validate message content
      if (!text && !url && !file_name) {
        throw new Error("Message must have text, url, or file_name");
      }

      // Save message to database
      const savedMessage = await this.messageService.createMessage(sender_id, {
        channelId: channel_id,
        text,
        url,
        fileName: file_name,
      });

      // Get sender info for the message
      const channel = await this.channelService.getChannelById(channel_id);
      // Note: In a real implementation, you'd get sender info from database
      const senderName = `User-${sender_id}`;
      const senderAvatar = undefined;

      // Create channel message for broadcasting
      const channelMessage = newChannelMessage(channel_id, sender_id, senderName, senderAvatar, text, url, file_name);

      // Broadcast to all channel members
      await this.broadcastToChannel(channel_id, channelMessage);

      logger.info("Channel message handled", {
        channelId: channel_id,
        senderId: sender_id,
        messageId: savedMessage.id,
      });
    } catch (error) {
      logger.error("Handle channel message error:", error);
      throw error;
    }
  }

  // Notify channel members about join/leave events
  private async notifyChannelMembers(channelId: number, userId: number, action: "join" | "leave"): Promise<void> {
    try {
      // Get user info (in real implementation, get from database)
      const username = `User-${userId}`;

      let message: WebSocketMessage;
      if (action === "join") {
        message = newJoinChannelMessage(channelId, userId, username);
      } else {
        message = newLeaveChannelMessage(channelId, userId, username);
      }

      // Broadcast to all channel members
      await this.broadcastToChannel(channelId, message);
    } catch (error) {
      logger.error("Notify channel members error:", error);
      throw error;
    }
  }

  // Check if user is in a channel
  private isUserInChannel(userId: number, channelId: number): boolean {
    const userIdStr = userId.toString();
    const channelIdStr = channelId.toString();
    const channelClients = this.channels.get(channelIdStr);
    return channelClients ? channelClients.has(userIdStr) : false;
  }

  // Get channel member count
  getChannelMemberCount(channelId: number): number {
    const channelIdStr = channelId.toString();
    const channelClients = this.channels.get(channelIdStr);
    return channelClients ? channelClients.size : 0;
  }

  // Get all connected users
  getConnectedUsers(): number[] {
    return Array.from(this.clients.keys()).map((id) => parseInt(id));
  }

  // Get channel members
  getChannelMembers(channelId: number): number[] {
    const channelIdStr = channelId.toString();
    const channelClients = this.channels.get(channelIdStr);
    return channelClients ? Array.from(channelClients.keys()).map((id) => parseInt(id)) : [];
  }
}
