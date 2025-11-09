import { AppDataSource } from "@/config/database";
import { Message } from "@/models/Message";
import { MessageResponse } from "@notify/types";
import { logger } from "@/utils/logger";

export class MessageService {
  private messageRepository = AppDataSource.getRepository(Message);

  // Private repository methods
  private async getConversationMessagesPrivate(
    conversationId: string,
    limit: number = 50,
    before?: number
  ): Promise<MessageResponse[]> {
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
          senderName: message.sender?.username || "Unknown",
          createdAt: message.createdAt,
        };
        if (message.sender?.avatar !== undefined) {
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

  private async getDirectMessagesPrivate(
    userId: string,
    friendId: string,
    limit: number = 50,
    before?: number
  ): Promise<MessageResponse[]> {
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
          senderName: message.sender?.username || "Unknown",
          createdAt: message.createdAt,
        };
        if (message.sender?.avatar !== undefined) {
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

  private async createMessagePrivate(data: {
    senderId: string;
    receiverId?: string;
    conversationId?: string;
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
        senderName: messageWithRelations.sender?.username || "Unknown",
        createdAt: messageWithRelations.createdAt,
      };
      if (messageWithRelations.sender?.avatar !== undefined) {
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

  private async deleteMessagePrivate(messageId: string): Promise<void> {
    try {
      await this.messageRepository.softDelete(messageId);
    } catch (error) {
      logger.error("Error deleting message:", error);
      throw error;
    }
  }

  private async getMessageByIdPrivate(messageId: string): Promise<MessageResponse | null> {
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
        senderName: message.sender?.username || "Unknown",
        createdAt: message.createdAt,
      };
      if (message.sender?.avatar !== undefined) {
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

  // Public methods
  // Get conversation messages with pagination
  async getConversationMessages(
    conversationId: string,
    limit: number = 20,
    before?: number
  ): Promise<MessageResponse[]> {
    try {
      return await this.getConversationMessagesPrivate(conversationId, limit, before);
    } catch (error) {
      logger.error("Get conversation messages error:", error);
      throw error;
    }
  }

  // Create a new message
  async createMessage(
    senderId: string,
    data: {
      conversationId?: string;
      receiverId?: string;
      text?: string;
      url?: string;
      fileName?: string;
    }
  ): Promise<MessageResponse> {
    try {
      // Validate that exactly one of receiverId or conversationId is set
      if ((!data.receiverId && !data.conversationId) || (data.receiverId && data.conversationId)) {
        throw new Error("Exactly one of receiverId or conversationId must be set");
      }

      // Validate that at least one content field is provided
      if (!data.text && !data.url && !data.fileName) {
        throw new Error("At least one content field (text, url, fileName) must be provided");
      }

      const messageData: {
        senderId: string;
        receiverId?: string;
        conversationId?: string;
        text?: string;
        url?: string;
        fileName?: string;
      } = {
        senderId,
      };

      if (data.receiverId !== undefined) {
        messageData.receiverId = data.receiverId;
      }
      if (data.conversationId !== undefined) {
        messageData.conversationId = data.conversationId;
      }
      if (data.text !== undefined) {
        messageData.text = data.text;
      }
      if (data.url !== undefined) {
        messageData.url = data.url;
      }
      if (data.fileName !== undefined) {
        messageData.fileName = data.fileName;
      }

      const messageResponse = await this.createMessagePrivate(messageData);

      logger.info("Message created successfully", {
        messageId: messageResponse.id,
        senderId,
        conversationId: data.conversationId,
        receiverId: data.receiverId,
      });

      return messageResponse;
    } catch (error) {
      logger.error("Create message error:", error);
      throw error;
    }
  }

  // Get friend messages (direct messages between two users)
  async getFriendMessages(
    userId: string,
    friendId: string,
    limit: number = 50,
    before?: number
  ): Promise<MessageResponse[]> {
    try {
      return await this.getDirectMessagesPrivate(userId, friendId, limit, before);
    } catch (error) {
      logger.error("Get friend messages error:", error);
      throw error;
    }
  }

  // Get message by ID
  async getMessageById(messageId: string): Promise<MessageResponse | null> {
    try {
      return await this.getMessageByIdPrivate(messageId);
    } catch (error) {
      logger.error("Get message by ID error:", error);
      throw error;
    }
  }

  // Delete message
  async deleteMessage(messageId: string): Promise<void> {
    try {
      await this.deleteMessagePrivate(messageId);
      logger.info("Message deleted successfully", { messageId });
    } catch (error) {
      logger.error("Delete message error:", error);
      throw error;
    }
  }
}
