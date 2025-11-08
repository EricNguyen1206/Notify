import { Request, Response } from "express";
import { MessageService } from "@/services/message/message.service";
import { logger } from "@/utils/logger";

export class MessageController {
  private messageService: MessageService;

  constructor() {
    this.messageService = new MessageService();
  }

  // Get channel messages with pagination
  async getChannelMessages(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { limit = "20", before } = req.query;
      const channelId = parseInt(id);

      logger.info("Get channel messages", { channelId, limit, before });

      if (isNaN(channelId)) {
        res.status(400).json({
          success: false,
          message: "Invalid channel ID",
        });
        return;
      }

      const limitNum = parseInt(limit as string);
      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        res.status(400).json({
          success: false,
          message: "Limit must be a number between 1 and 100",
        });
        return;
      }

      const beforeNum = before ? parseInt(before as string) : undefined;
      if (before && (isNaN(beforeNum!) || beforeNum! < 0)) {
        res.status(400).json({
          success: false,
          message: "Before must be a positive number",
        });
        return;
      }

      const messages = await this.messageService.getChannelMessages(channelId, limitNum, beforeNum);

      res.status(200).json({
        success: true,
        data: messages,
        pagination: {
          limit: limitNum,
          before: beforeNum,
          hasMore: messages.length === limitNum,
        },
      });
    } catch (error) {
      logger.error("Get channel messages error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // Create a new message
  async createMessage(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { channelId, receiverId, text, url, fileName } = req.body;

      logger.info("Create message", { userId, channelId, receiverId, text, url, fileName });

      // Validate input
      if (!channelId && !receiverId) {
        res.status(400).json({
          success: false,
          message: "Either channelId or receiverId must be provided",
        });
        return;
      }

      if (channelId && receiverId) {
        res.status(400).json({
          success: false,
          message: "Cannot specify both channelId and receiverId",
        });
        return;
      }

      if (!text && !url && !fileName) {
        res.status(400).json({
          success: false,
          message: "At least one content field (text, url, fileName) must be provided",
        });
        return;
      }

      const message = await this.messageService.createMessage(userId, {
        channelId,
        receiverId,
        text,
        url,
        fileName,
      });

      res.status(201).json({
        success: true,
        data: {
          id: message.id,
          type: message.getType(),
          senderId: message.senderId,
          text: message.text,
          url: message.url,
          fileName: message.fileName,
          createdAt: message.createdAt,
          channelId: message.channelId,
          receiverId: message.receiverId,
        },
      });
    } catch (error) {
      logger.error("Create message error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // Get friend messages (direct messages)
  async getFriendMessages(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { friendId } = req.params;
      const friendIdNum = parseInt(friendId);

      logger.info("Get friend messages", { userId, friendId: friendIdNum });

      if (isNaN(friendIdNum)) {
        res.status(400).json({
          success: false,
          message: "Invalid friend ID",
        });
        return;
      }

      const messages = await this.messageService.getFriendMessages(userId, friendIdNum);

      res.status(200).json({
        success: true,
        data: messages,
      });
    } catch (error) {
      logger.error("Get friend messages error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // Get message by ID
  async getMessageById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const messageId = parseInt(id);

      logger.info("Get message by ID", { messageId });

      if (isNaN(messageId)) {
        res.status(400).json({
          success: false,
          message: "Invalid message ID",
        });
        return;
      }

      const message = await this.messageService.getMessageById(messageId);

      if (!message) {
        res.status(404).json({
          success: false,
          message: "Message not found",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          id: message.id,
          type: message.getType(),
          senderId: message.senderId,
          text: message.text,
          url: message.url,
          fileName: message.fileName,
          createdAt: message.createdAt,
          channelId: message.channelId,
          receiverId: message.receiverId,
        },
      });
    } catch (error) {
      logger.error("Get message by ID error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // Delete message
  async deleteMessage(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const messageId = parseInt(id);

      logger.info("Delete message", { messageId });

      if (isNaN(messageId)) {
        res.status(400).json({
          success: false,
          message: "Invalid message ID",
        });
        return;
      }

      await this.messageService.deleteMessage(messageId);

      res.status(200).json({
        success: true,
        message: "Message deleted successfully",
      });
    } catch (error) {
      logger.error("Delete message error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
}
