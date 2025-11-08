import { AppDataSource } from "@/config/database";
import { Channel } from "@/entities/Channel";
import { Chat } from "@/entities/Chat";
import { ChatResponse } from "@notify/types";
import { logger } from "@/utils/logger";

export class ChannelRepository {
  private channelRepository = AppDataSource.getRepository(Channel);
  private chatRepository = AppDataSource.getRepository(Chat);

  async create(channel: Channel): Promise<Channel> {
    try {
      return await this.channelRepository.save(channel);
    } catch (error) {
      logger.error("Create channel error:", error);
      throw error;
    }
  }

  async update(channel: Channel): Promise<Channel> {
    try {
      return await this.channelRepository.save(channel);
    } catch (error) {
      logger.error("Update channel error:", error);
      throw error;
    }
  }

  async delete(channelId: number): Promise<void> {
    try {
      await this.channelRepository.softDelete(channelId);
    } catch (error) {
      logger.error("Delete channel error:", error);
      throw error;
    }
  }

  async getAllUserChannels(userId: number): Promise<Channel[]> {
    try {
      return await this.channelRepository
        .createQueryBuilder("channel")
        .leftJoinAndSelect("channel.members", "member")
        .leftJoinAndSelect("member.user", "user")
        .innerJoin("channel.members", "userMember")
        .where("userMember.userId = :userId", { userId })
        .andWhere("channel.deletedAt IS NULL")
        .getMany();
    } catch (error) {
      logger.error("Get all user channels error:", error);
      throw error;
    }
  }

  async getById(channelId: number): Promise<Channel | null> {
    try {
      return await this.channelRepository
        .createQueryBuilder("channel")
        .leftJoinAndSelect("channel.members", "member")
        .leftJoinAndSelect("member.user", "user")
        .where("channel.id = :channelId", { channelId })
        .andWhere("channel.deletedAt IS NULL")
        .getOne();
    } catch (error) {
      logger.error("Get channel by ID error:", error);
      throw error;
    }
  }

  async addUser(channelId: number, userId: number): Promise<void> {
    try {
      const channel = await this.channelRepository.findOne({
        where: { id: channelId },
        relations: ["members"],
      });

      if (!channel) {
        throw new Error("Channel not found");
      }

      // Check if user is already a member
      const isAlreadyMember = channel.members.some((member) => member.userId === userId);
      if (isAlreadyMember) {
        throw new Error("User is already a member of this channel");
      }

      // Add user to channel
      const channelMember = new (await import("@/entities/ChannelMember")).ChannelMember();
      channelMember.userId = userId;
      channelMember.channelId = channelId;

      await AppDataSource.getRepository("ChannelMember").save(channelMember);
    } catch (error) {
      logger.error("Add user to channel error:", error);
      throw error;
    }
  }

  async removeUser(channelId: number, userId: number): Promise<void> {
    try {
      await AppDataSource.getRepository("ChannelMember").delete({
        channelId,
        userId,
      });
    } catch (error) {
      logger.error("Remove user from channel error:", error);
      throw error;
    }
  }

  async getChatMessagesWithPagination(channelId: number, limit: number = 20, before?: number): Promise<ChatResponse[]> {
    try {
      let query = this.chatRepository
        .createQueryBuilder("chat")
        .leftJoinAndSelect("chat.sender", "sender")
        .where("chat.channelId = :channelId", { channelId })
        .andWhere("chat.deletedAt IS NULL")
        .orderBy("chat.createdAt", "ASC");

      if (before) {
        query = query.andWhere("chat.createdAt < :before", { before });
      }

      const messages = await query.limit(limit).getMany();

      // Convert to ChatResponse format
      return messages.map((message) => ({
        id: message.id,
        type: message.getType(),
        senderId: message.senderId,
        senderName: message.sender?.username || "Unknown",
        senderAvatar: message.sender?.avatar,
        text: message.text,
        url: message.url,
        fileName: message.fileName,
        createdAt: message.createdAt,
        channelId: message.channelId,
      }));
    } catch (error) {
      logger.error("Get chat messages with pagination error:", error);
      throw error;
    }
  }
}
