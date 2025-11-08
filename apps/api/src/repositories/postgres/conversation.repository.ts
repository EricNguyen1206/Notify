import { AppDataSource } from "@/config/database";
import { Conversation } from "@/entities/Conversation";
import { Message } from "@/entities/Message";
import { MessageResponse } from "@notify/types";
import { logger } from "@/utils/logger";

export class ConversationRepository {
  private conversationRepository = AppDataSource.getRepository(Conversation);
  private messageRepository = AppDataSource.getRepository(Message);

  async create(conversation: Conversation): Promise<Conversation> {
    try {
      return await this.conversationRepository.save(conversation);
    } catch (error) {
      logger.error("Create conversation error:", error);
      throw error;
    }
  }

  async update(conversation: Conversation): Promise<Conversation> {
    try {
      return await this.conversationRepository.save(conversation);
    } catch (error) {
      logger.error("Update conversation error:", error);
      throw error;
    }
  }

  async delete(conversationId: number): Promise<void> {
    try {
      await this.conversationRepository.softDelete(conversationId);
    } catch (error) {
      logger.error("Delete conversation error:", error);
      throw error;
    }
  }

  async getAllUserConversations(userId: number): Promise<Conversation[]> {
    try {
      return await this.conversationRepository
        .createQueryBuilder("conversation")
        .leftJoinAndSelect("conversation.members", "member")
        .leftJoinAndSelect("member.user", "user")
        .innerJoin("conversation.members", "userMember")
        .where("userMember.userId = :userId", { userId })
        .andWhere("conversation.deletedAt IS NULL")
        .getMany();
    } catch (error) {
      logger.error("Get all user conversations error:", error);
      throw error;
    }
  }

  async getById(conversationId: number): Promise<Conversation | null> {
    try {
      return await this.conversationRepository
        .createQueryBuilder("conversation")
        .leftJoinAndSelect("conversation.members", "member")
        .leftJoinAndSelect("member.user", "user")
        .where("conversation.id = :conversationId", { conversationId })
        .andWhere("conversation.deletedAt IS NULL")
        .getOne();
    } catch (error) {
      logger.error("Get conversation by ID error:", error);
      throw error;
    }
  }

  async addUser(conversationId: number, userId: number): Promise<void> {
    try {
      const conversation = await this.conversationRepository.findOne({
        where: { id: conversationId },
        relations: ["members"],
      });

      if (!conversation) {
        throw new Error("Conversation not found");
      }

      // Check if user is already a member
      const isAlreadyMember = conversation.members.some((member) => member.userId === userId);
      if (isAlreadyMember) {
        throw new Error("User is already a member of this conversation");
      }

      // Add user to conversation
      const conversationMember = new (await import("@/entities/ConversationMember")).ConversationMember();
      conversationMember.userId = userId;
      conversationMember.conversationId = conversationId;

      await AppDataSource.getRepository("ConversationMember").save(conversationMember);
    } catch (error) {
      logger.error("Add user to conversation error:", error);
      throw error;
    }
  }

  async removeUser(conversationId: number, userId: number): Promise<void> {
    try {
      await AppDataSource.getRepository("ConversationMember").delete({
        conversationId,
        userId,
      });
    } catch (error) {
      logger.error("Remove user from conversation error:", error);
      throw error;
    }
  }

  async getChatMessagesWithPagination(conversationId: number, limit: number = 20, before?: number): Promise<MessageResponse[]> {
    try {
      let query = this.messageRepository
        .createQueryBuilder("message")
        .leftJoinAndSelect("message.sender", "sender")
        .where("message.conversationId = :conversationId", { conversationId })
        .andWhere("message.deletedAt IS NULL")
        .orderBy("message.createdAt", "ASC");

      if (before) {
        query = query.andWhere("message.createdAt < :before", { before });
      }

      const messages = await query.limit(limit).getMany();

      // Convert to MessageResponse format
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
      logger.error("Get chat messages with pagination error:", error);
      throw error;
    }
  }
}

