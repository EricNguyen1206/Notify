import { AppDataSource } from "@/config/database";
import { Channel } from "@/entities/Channel";
import { Message } from "@/entities/Message";
import { MessageResponse } from "@notify/types";
import { logger } from "@/utils/logger";

export class MessageRepository {
  private messageRepository = AppDataSource.getRepository(Message);
  private channelRepository = AppDataSource.getRepository(Channel);

  async getChannelMessages(channelId: number, limit: number = 50, before?: number): Promise<MessageResponse[]> {
    try {
      const queryBuilder = this.messageRepository
        .createQueryBuilder("message")
        .leftJoinAndSelect("message.sender", "sender")
        .where("message.channelId = :channelId", { channelId })
        .andWhere("message.deletedAt IS NULL")
        .orderBy("message.createdAt", "DESC")
        .limit(limit);

      if (before) {
        queryBuilder.andWhere("message.id < :before", { before });
      }

      const messages = await queryBuilder.getMany();

      return messages.map((message) => ({
        id: message.id,
        type: message.getType(),
        senderId: message.senderId,
        senderName: message.sender.username,
        senderAvatar: message.sender.avatar,
        text: message.text,
        url: message.url,
        fileName: message.fileName,
        createdAt: message.createdAt,
        channelId: message.channelId,
      }));
    } catch (error) {
      logger.error("Error getting channel messages:", error);
      throw error;
    }
  }

  async getDirectMessages(userId: number, friendId: number, limit: number = 50, before?: number): Promise<MessageResponse[]> {
    try {
      const queryBuilder = this.messageRepository
        .createQueryBuilder("message")
        .leftJoinAndSelect("message.sender", "sender")
        .where(
          "(message.senderId = :userId AND message.receiverId = :friendId) OR (message.senderId = :friendId AND message.receiverId = :userId)",
          { userId, friendId }
        )
        .andWhere("message.deletedAt IS NULL")
        .orderBy("message.createdAt", "DESC")
        .limit(limit);

      if (before) {
        queryBuilder.andWhere("message.id < :before", { before });
      }

      const messages = await queryBuilder.getMany();

      return messages.map((message) => ({
        id: message.id,
        type: message.getType(),
        senderId: message.senderId,
        senderName: message.sender.username,
        senderAvatar: message.sender.avatar,
        text: message.text,
        url: message.url,
        fileName: message.fileName,
        createdAt: message.createdAt,
        receiverId: message.receiverId,
      }));
    } catch (error) {
      logger.error("Error getting direct messages:", error);
      throw error;
    }
  }

  async createMessage(data: {
    senderId: number;
    receiverId?: number;
    channelId?: number;
    text?: string;
    url?: string;
    fileName?: string;
  }): Promise<MessageResponse> {
    try {
      const message = this.messageRepository.create(data);
      const savedMessage = await this.messageRepository.save(message);

      // Reload with relations
      const messageWithRelations = await this.messageRepository.findOne({
        where: { id: savedMessage.id },
        relations: ["sender"],
      });

      if (!messageWithRelations) {
        throw new Error("Message not found after creation");
      }

      return {
        id: messageWithRelations.id,
        type: messageWithRelations.getType(),
        senderId: messageWithRelations.senderId,
        senderName: messageWithRelations.sender.username,
        senderAvatar: messageWithRelations.sender.avatar,
        text: messageWithRelations.text,
        url: messageWithRelations.url,
        fileName: messageWithRelations.fileName,
        createdAt: messageWithRelations.createdAt,
        receiverId: messageWithRelations.receiverId,
        channelId: messageWithRelations.channelId,
      };
    } catch (error) {
      logger.error("Error creating message:", error);
      throw error;
    }
  }

  async deleteMessage(messageId: number): Promise<void> {
    try {
      await this.messageRepository.softDelete(messageId);
    } catch (error) {
      logger.error("Error deleting message:", error);
      throw error;
    }
  }

  async getMessageById(messageId: number): Promise<MessageResponse | null> {
    try {
      const message = await this.messageRepository.findOne({
        where: { id: messageId },
        relations: ["sender"],
      });

      if (!message) {
        return null;
      }

      return {
        id: message.id,
        type: message.getType(),
        senderId: message.senderId,
        senderName: message.sender.username,
        senderAvatar: message.sender.avatar,
        text: message.text,
        url: message.url,
        fileName: message.fileName,
        createdAt: message.createdAt,
        receiverId: message.receiverId,
        channelId: message.channelId,
      };
    } catch (error) {
      logger.error("Error getting message by id:", error);
      throw error;
    }
  }
}

