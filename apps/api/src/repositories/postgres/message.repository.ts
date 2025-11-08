import { AppDataSource } from "@/config/database";
import { Message } from "@/entities/Message";
import { MessageResponse } from "@notify/types";
import { logger } from "@/utils/logger";

export class MessageRepository {
  private messageRepository = AppDataSource.getRepository(Message);

  async getConversationMessages(conversationId: number, limit: number = 50, before?: number): Promise<MessageResponse[]> {
    try {
      const queryBuilder = this.messageRepository
        .createQueryBuilder("message")
        .leftJoinAndSelect("message.sender", "sender")
        .where("message.conversationId = :conversationId", { conversationId })
        .andWhere("message.deletedAt IS NULL")
        .orderBy("message.createdAt", "DESC")
        .limit(limit);

      if (before) {
        queryBuilder.andWhere("message.id < :before", { before });
      }

      const messages = await queryBuilder.getMany();

      return messages.map((message) => {
        const response: MessageResponse = {
          id: message.id,
          type: message.getType(),
          senderId: message.senderId,
          senderName: message.sender.username,
          createdAt: message.createdAt,
        };
        if (message.sender.avatar !== undefined) {
          response.senderAvatar = message.sender.avatar;
        }
        if (message.text !== undefined) {
          response.text = message.text;
        }
        if (message.url !== undefined) {
          response.url = message.url;
        }
        if (message.fileName !== undefined) {
          response.fileName = message.fileName;
        }
        if (message.conversationId !== undefined) {
          response.conversationId = message.conversationId;
        }
        return response;
      });
    } catch (error) {
      logger.error("Error getting conversation messages:", error);
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

      return messages.map((message) => {
        const response: MessageResponse = {
          id: message.id,
          type: message.getType(),
          senderId: message.senderId,
          senderName: message.sender.username,
          createdAt: message.createdAt,
        };
        if (message.sender.avatar !== undefined) {
          response.senderAvatar = message.sender.avatar;
        }
        if (message.text !== undefined) {
          response.text = message.text;
        }
        if (message.url !== undefined) {
          response.url = message.url;
        }
        if (message.fileName !== undefined) {
          response.fileName = message.fileName;
        }
        if (message.receiverId !== undefined) {
          response.receiverId = message.receiverId;
        }
        return response;
      });
    } catch (error) {
      logger.error("Error getting direct messages:", error);
      throw error;
    }
  }

  async createMessage(data: {
    senderId: number;
    receiverId?: number;
    conversationId?: number;
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

      const response: MessageResponse = {
        id: messageWithRelations.id,
        type: messageWithRelations.getType(),
        senderId: messageWithRelations.senderId,
        senderName: messageWithRelations.sender.username,
        createdAt: messageWithRelations.createdAt,
      };
      if (messageWithRelations.sender.avatar !== undefined) {
        response.senderAvatar = messageWithRelations.sender.avatar;
      }
      if (messageWithRelations.text !== undefined) {
        response.text = messageWithRelations.text;
      }
      if (messageWithRelations.url !== undefined) {
        response.url = messageWithRelations.url;
      }
      if (messageWithRelations.fileName !== undefined) {
        response.fileName = messageWithRelations.fileName;
      }
      if (messageWithRelations.receiverId !== undefined) {
        response.receiverId = messageWithRelations.receiverId;
      }
      if (messageWithRelations.conversationId !== undefined) {
        response.conversationId = messageWithRelations.conversationId;
      }
      return response;
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

      const response: MessageResponse = {
        id: message.id,
        type: message.getType(),
        senderId: message.senderId,
        senderName: message.sender.username,
        createdAt: message.createdAt,
      };
      if (message.sender.avatar !== undefined) {
        response.senderAvatar = message.sender.avatar;
      }
      if (message.text !== undefined) {
        response.text = message.text;
      }
      if (message.url !== undefined) {
        response.url = message.url;
      }
      if (message.fileName !== undefined) {
        response.fileName = message.fileName;
      }
      if (message.receiverId !== undefined) {
        response.receiverId = message.receiverId;
      }
      if (message.conversationId !== undefined) {
        response.conversationId = message.conversationId;
      }
      return response;
    } catch (error) {
      logger.error("Error getting message by id:", error);
      throw error;
    }
  }
}

