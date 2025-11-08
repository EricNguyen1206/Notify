import { Request, Response } from "express";
import { ChannelService } from "@/services/channel/channel.service";
import { ChannelType } from "@/entities/Channel";
import { logger } from "@/utils/logger";

export class ChannelController {
  private channelService: ChannelService;

  constructor() {
    this.channelService = new ChannelService();
  }

  // Get all channels for a user
  async getUserChannels(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      logger.info("Get user channels", { userId });

      const channels = await this.channelService.getAllChannel(userId);

      res.status(200).json({
        success: true,
        data: channels,
      });
    } catch (error) {
      logger.error("Get user channels error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // Create a new channel
  async createChannel(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { name, type, userIds } = req.body;
      logger.info("Create channel", { userId, name, type, userIds });

      // Validate input
      if (!name || !type || !userIds || !Array.isArray(userIds)) {
        res.status(400).json({
          success: false,
          message: "Missing required fields: name, type, userIds",
        });
        return;
      }

      // Validate channel type
      if (!Object.values(ChannelType).includes(type)) {
        res.status(400).json({
          success: false,
          message: "Invalid channel type",
        });
        return;
      }

      // Validate user count for direct messages
      if (type === ChannelType.DIRECT && userIds.length !== 1) {
        res.status(400).json({
          success: false,
          message: "Direct message channel must have exactly 1 other user",
        });
        return;
      }

      // Validate user count for group channels
      if (type === ChannelType.GROUP && (userIds.length < 1 || userIds.length > 3)) {
        res.status(400).json({
          success: false,
          message: "Group channel must have 1-3 other users",
        });
        return;
      }

      // Ensure owner is included in userIds
      const allUserIds = [...userIds, userId];
      const uniqueUserIds = [...new Set(allUserIds)];

      const channel = await this.channelService.createChannelWithUsers(name, userId, type, uniqueUserIds);

      res.status(201).json({
        success: true,
        data: {
          id: channel.id,
          name: channel.name,
          type: channel.type,
          ownerId: channel.ownerId,
        },
      });
    } catch (error) {
      logger.error("Create channel error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // Get channel by ID
  async getChannelById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const channelId = parseInt(id);
      logger.info("Get channel by ID", { channelId });

      if (isNaN(channelId)) {
        res.status(400).json({
          success: false,
          message: "Invalid channel ID",
        });
        return;
      }

      const channel = await this.channelService.getChannelById(channelId);

      res.status(200).json({
        success: true,
        data: {
          id: channel.id,
          name: channel.name,
          type: channel.type,
          ownerId: channel.ownerId,
        },
      });
    } catch (error) {
      logger.error("Get channel by ID error:", error);
      if (error.message === "Channel not found") {
        res.status(404).json({
          success: false,
          message: "Channel not found",
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Internal server error",
        });
      }
    }
  }

  // Update channel
  async updateChannel(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name } = req.body;
      const userId = (req as any).user.id;
      const channelId = parseInt(id);
      logger.info("Update channel", { channelId, name, userId });

      if (isNaN(channelId)) {
        res.status(400).json({
          success: false,
          message: "Invalid channel ID",
        });
        return;
      }

      if (!name) {
        res.status(400).json({
          success: false,
          message: "Channel name is required",
        });
        return;
      }

      await this.channelService.updateChannel(channelId, name);

      res.status(200).json({
        success: true,
        message: "Channel updated successfully",
      });
    } catch (error) {
      logger.error("Update channel error:", error);
      if (error.message === "Channel not found") {
        res.status(404).json({
          success: false,
          message: "Channel not found",
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Internal server error",
        });
      }
    }
  }

  // Delete channel
  async deleteChannel(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;
      const channelId = parseInt(id);
      logger.info("Delete channel", { channelId, userId });

      if (isNaN(channelId)) {
        res.status(400).json({
          success: false,
          message: "Invalid channel ID",
        });
        return;
      }

      await this.channelService.deleteChannel(userId, channelId);

      res.status(200).json({
        success: true,
        message: "Channel deleted successfully",
      });
    } catch (error) {
      logger.error("Delete channel error:", error);
      if (error.message === "Channel not found") {
        res.status(404).json({
          success: false,
          message: "Channel not found",
        });
      } else if (error.message === "Only channel owner can delete channel") {
        res.status(403).json({
          success: false,
          message: "Only channel owner can delete channel",
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Internal server error",
        });
      }
    }
  }

  // Add user to channel
  async addUserToChannel(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { userId: targetUserId } = req.body;
      const ownerId = (req as any).user.id;
      const channelId = parseInt(id);
      logger.info("Add user to channel", { channelId, targetUserId, ownerId });

      if (isNaN(channelId)) {
        res.status(400).json({
          success: false,
          message: "Invalid channel ID",
        });
        return;
      }

      if (!targetUserId) {
        res.status(400).json({
          success: false,
          message: "Target user ID is required",
        });
        return;
      }

      await this.channelService.addUserToChannel(ownerId, channelId, targetUserId);

      res.status(200).json({
        success: true,
        message: "User added to channel successfully",
      });
    } catch (error) {
      logger.error("Add user to channel error:", error);
      if (error.message === "Channel not found") {
        res.status(404).json({
          success: false,
          message: "Channel not found",
        });
      } else if (error.message === "Only channel owner can add users") {
        res.status(403).json({
          success: false,
          message: "Only channel owner can add users",
        });
      } else if (error.message === "Target user not found") {
        res.status(404).json({
          success: false,
          message: "Target user not found",
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Internal server error",
        });
      }
    }
  }

  // Leave channel
  async leaveChannel(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;
      const channelId = parseInt(id);
      logger.info("Leave channel", { channelId, userId });

      if (isNaN(channelId)) {
        res.status(400).json({
          success: false,
          message: "Invalid channel ID",
        });
        return;
      }

      await this.channelService.leaveChannel(channelId, userId);

      res.status(200).json({
        success: true,
        message: "Left channel successfully",
      });
    } catch (error) {
      logger.error("Leave channel error:", error);
      if (error.message === "Channel not found") {
        res.status(404).json({
          success: false,
          message: "Channel not found",
        });
      } else if (error.message === "User not found") {
        res.status(404).json({
          success: false,
          message: "User not found",
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Internal server error",
        });
      }
    }
  }

  // Remove user from channel
  async removeUserFromChannel(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { userId: targetUserId } = req.body;
      const ownerId = (req as any).user.id;
      const channelId = parseInt(id);
      logger.info("Remove user from channel", { channelId, targetUserId, ownerId });

      if (isNaN(channelId)) {
        res.status(400).json({
          success: false,
          message: "Invalid channel ID",
        });
        return;
      }

      if (!targetUserId) {
        res.status(400).json({
          success: false,
          message: "Target user ID is required",
        });
        return;
      }

      await this.channelService.removeUserFromChannel(ownerId, channelId, targetUserId);

      res.status(200).json({
        success: true,
        message: "User removed from channel successfully",
      });
    } catch (error) {
      logger.error("Remove user from channel error:", error);
      if (error.message === "Channel not found") {
        res.status(404).json({
          success: false,
          message: "Channel not found",
        });
      } else if (error.message === "Only channel owner can remove users") {
        res.status(403).json({
          success: false,
          message: "Only channel owner can remove users",
        });
      } else if (error.message === "Target user not found") {
        res.status(404).json({
          success: false,
          message: "Target user not found",
        });
      } else if (error.message === "Cannot remove channel owner") {
        res.status(400).json({
          success: false,
          message: "Cannot remove channel owner",
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Internal server error",
        });
      }
    }
  }
}
