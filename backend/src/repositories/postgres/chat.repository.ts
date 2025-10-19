import { AppDataSource } from "@/config/database";
import { Chat } from "@/entities/Chat";
import { ChatResponse } from "@/types/response/message.response";
import { logger } from "@/utils/logger";

export class ChatRepository {
  private chatRepository = AppDataSource.getRepository(Chat);

  async create(chat: Chat): Promise<Chat> {
    try {
      return await this.chatRepository.save(chat);
    } catch (error) {
      logger.error("Create chat error:", error);
      throw error;
    }
  }

  async findById(id: number): Promise<Chat | null> {
    try {
      return await this.chatRepository.findOne({
        where: { id },
        relations: ["sender"],
      });
    } catch (error) {
      logger.error("Find chat by ID error:", error);
      throw error;
    }
  }

  async delete(id: number): Promise<void> {
    try {
      await this.chatRepository.softDelete(id);
    } catch (error) {
      logger.error("Delete chat error:", error);
      throw error;
    }
  }

  async getChannelMessagesWithPagination(
    channelId: number,
    limit: number = 20,
    before?: number
  ): Promise<ChatResponse[]> {
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
      logger.error("Get channel messages with pagination error:", error);
      throw error;
    }
  }

  async getFriendMessages(userId: number, friendId: number): Promise<ChatResponse[]> {
    try {
      const messages = await this.chatRepository
        .createQueryBuilder("chat")
        .leftJoinAndSelect("chat.sender", "sender")
        .where(
          "(chat.senderId = :userId AND chat.receiverId = :friendId) OR (chat.senderId = :friendId AND chat.receiverId = :userId)",
          { userId, friendId }
        )
        .andWhere("chat.deletedAt IS NULL")
        .orderBy("chat.createdAt", "ASC")
        .getMany();

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
        receiverId: message.receiverId,
      }));
    } catch (error) {
      logger.error("Get friend messages error:", error);
      throw error;
    }
  }

  async findByChannelId(channelId: number): Promise<Chat[]> {
    try {
      return await this.chatRepository.find({
        where: { channelId },
        relations: ["sender"],
        order: { createdAt: "ASC" },
      });
    } catch (error) {
      logger.error("Find chats by channel ID error:", error);
      throw error;
    }
  }

  async findByUserId(userId: number): Promise<Chat[]> {
    try {
      return await this.chatRepository.find({
        where: { senderId: userId },
        relations: ["sender"],
        order: { createdAt: "DESC" },
      });
    } catch (error) {
      logger.error("Find chats by user ID error:", error);
      throw error;
    }
  }
}
