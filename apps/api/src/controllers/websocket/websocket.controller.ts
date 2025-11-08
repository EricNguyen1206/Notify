import { Request, Response } from "express";
import { Server as SocketIOServer } from "socket.io";
import { WebSocketHandler } from "@/websocket/websocket.handler";
import { ChannelService } from "@/services/channel/channel.service";
import { MessageService } from "@/services/message/message.service";
import { RedisService } from "@/services/redis/redis.service";
import { logger } from "@/utils/logger";

export class WebSocketController {
  private wsHandler: WebSocketHandler;

  constructor(io: SocketIOServer) {
    // Initialize services
    const channelService = new ChannelService();
    const messageService = new MessageService();
    const redisService = new RedisService();

    // Initialize WebSocket handler
    this.wsHandler = new WebSocketHandler(io, channelService, messageService, redisService);
  }

  // Handle WebSocket connection
  handleConnection(socket: any): void {
    this.wsHandler.handleConnection(socket);
  }

  // Get WebSocket statistics
  async getWebSocketStats(req: Request, res: Response): Promise<void> {
    try {
      const hub = this.wsHandler.getHub();

      const stats = {
        connectedUsers: hub.getConnectedUsers().length,
        totalChannels: hub["channels"].size,
        channelMembers: Array.from(hub["channels"].entries()).map(([channelId, members]) => ({
          channelId: parseInt(channelId),
          memberCount: members.size,
        })),
      };

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error("Get WebSocket stats error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // Get channel members
  async getChannelMembers(req: Request, res: Response): Promise<void> {
    try {
      const { channelId } = req.params;
      const channelIdNum = parseInt(channelId);

      if (isNaN(channelIdNum)) {
        res.status(400).json({
          success: false,
          message: "Invalid channel ID",
        });
        return;
      }

      const hub = this.wsHandler.getHub();
      const members = hub.getChannelMembers(channelIdNum);
      const memberCount = hub.getChannelMemberCount(channelIdNum);

      res.status(200).json({
        success: true,
        data: {
          channelId: channelIdNum,
          members,
          memberCount,
        },
      });
    } catch (error) {
      logger.error("Get channel members error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // Broadcast message to channel (admin only)
  async broadcastToChannel(req: Request, res: Response): Promise<void> {
    try {
      const { channelId } = req.params;
      const { message, type = "admin" } = req.body;
      const channelIdNum = parseInt(channelId);

      if (isNaN(channelIdNum)) {
        res.status(400).json({
          success: false,
          message: "Invalid channel ID",
        });
        return;
      }

      if (!message) {
        res.status(400).json({
          success: false,
          message: "Message is required",
        });
        return;
      }

      const hub = this.wsHandler.getHub();

      // Create admin message
      const adminMessage = {
        id: `admin-${Date.now()}`,
        type: "admin.message",
        data: {
          channel_id: channelIdNum,
          message,
          type,
          timestamp: Date.now(),
        },
        timestamp: Date.now(),
      };

      await hub.broadcastToChannel(channelIdNum, adminMessage);

      res.status(200).json({
        success: true,
        message: "Message broadcasted successfully",
      });
    } catch (error) {
      logger.error("Broadcast to channel error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // Get connected users
  async getConnectedUsers(req: Request, res: Response): Promise<void> {
    try {
      const hub = this.wsHandler.getHub();
      const connectedUsers = hub.getConnectedUsers();

      res.status(200).json({
        success: true,
        data: {
          users: connectedUsers,
          count: connectedUsers.length,
        },
      });
    } catch (error) {
      logger.error("Get connected users error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // Disconnect user (admin only)
  async disconnectUser(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const userIdNum = parseInt(userId);

      if (isNaN(userIdNum)) {
        res.status(400).json({
          success: false,
          message: "Invalid user ID",
        });
        return;
      }

      const hub = this.wsHandler.getHub();
      const connectedUsers = hub.getConnectedUsers();

      if (!connectedUsers.includes(userIdNum)) {
        res.status(404).json({
          success: false,
          message: "User not connected",
        });
        return;
      }

      // Find and disconnect the user's socket
      const clients = hub["clients"];
      const userSocket = clients.get(userIdNum.toString());

      if (userSocket) {
        userSocket.disconnect(true);
        res.status(200).json({
          success: true,
          message: "User disconnected successfully",
        });
      } else {
        res.status(404).json({
          success: false,
          message: "User socket not found",
        });
      }
    } catch (error) {
      logger.error("Disconnect user error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
}
