import { Request, Response } from "express";
import { Server as SocketIOServer } from "socket.io";
import { WebSocketHandler } from "@/websocket/websocket.handler";
import { ConversationService } from "@/services/conversation/conversation.service";
import { MessageService } from "@/services/message/message.service";
import { RedisService } from "@/services/redis/redis.service";
import { newMessage, MessageType } from "@/websocket/message-types";
import { logger } from "@/utils/logger";

export class WebSocketController {
  private wsHandler: WebSocketHandler;

  constructor(io: SocketIOServer) {
    // Initialize services
    const conversationService = new ConversationService();
    const messageService = new MessageService();
    const redisService = new RedisService();

    // Initialize WebSocket handler
    this.wsHandler = new WebSocketHandler(io, conversationService, messageService, redisService);
  }

  // Handle WebSocket connection
  handleConnection(socket: any): void {
    this.wsHandler.handleConnection(socket);
  }

  // Get WebSocket statistics
  async getWebSocketStats(_req: Request, res: Response): Promise<void> {
    try {
      const hub = this.wsHandler.getHub();

      const stats = {
        connectedUsers: hub.getConnectedUsers().length,
        totalConversations: hub["conversations"].size,
        conversationMembers: Array.from(hub["conversations"].entries()).map(([conversationId, members]) => ({
          conversationId: parseInt(conversationId),
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

  // Get conversation members
  async getConversationMembers(req: Request, res: Response): Promise<void> {
    try {
      const { conversationId } = req.params;
      
      if (!conversationId) {
        res.status(400).json({
          success: false,
          message: "Conversation ID is required",
        });
        return;
      }
      
      const conversationIdNum = parseInt(conversationId);

      if (isNaN(conversationIdNum)) {
        res.status(400).json({
          success: false,
          message: "Invalid conversation ID",
        });
        return;
      }

      const hub = this.wsHandler.getHub();
      const members = hub.getConversationMembers(conversationIdNum);
      const memberCount = hub.getConversationMemberCount(conversationIdNum);

      res.status(200).json({
        success: true,
        data: {
          conversationId: conversationIdNum,
          members,
          memberCount,
        },
      });
    } catch (error) {
      logger.error("Get conversation members error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // Broadcast message to conversation (admin only)
  async broadcastToConversation(req: Request, res: Response): Promise<void> {
    try {
      const { conversationId } = req.params;
      
      if (!conversationId) {
        res.status(400).json({
          success: false,
          message: "Conversation ID is required",
        });
        return;
      }
      
      const { message } = req.body;
      const conversationIdNum = parseInt(conversationId);

      if (isNaN(conversationIdNum)) {
        res.status(400).json({
          success: false,
          message: "Invalid conversation ID",
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

      // Create admin message using the message-types helper
      const adminMessage = newMessage(MessageType.CONVERSATION_MESSAGE, {
        conversation_id: conversationIdNum,
        sender_id: 0, // System/admin user
        sender_name: "System",
        text: message,
        message_type: "text" as const,
      });

      await hub.broadcastToConversation(conversationIdNum, adminMessage);

      res.status(200).json({
        success: true,
        message: "Message broadcasted successfully",
      });
    } catch (error) {
      logger.error("Broadcast to conversation error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // Get connected users
  async getConnectedUsers(_req: Request, res: Response): Promise<void> {
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
      
      if (!userId) {
        res.status(400).json({
          success: false,
          message: "User ID is required",
        });
        return;
      }
      
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
