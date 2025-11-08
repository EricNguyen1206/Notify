import { MessageRepository } from "@/repositories/postgres/message.repository";
import { MessageResponse } from "@notify/types";
import { logger } from "@/utils/logger";

export class MessageService {
  private messageRepository: MessageRepository;

  constructor() {
    this.messageRepository = new MessageRepository();
  }

  // Get conversation messages with pagination
  async getConversationMessages(conversationId: number, limit: number = 20, before?: number): Promise<MessageResponse[]> {
    try {
      return await this.messageRepository.getConversationMessages(conversationId, limit, before);
    } catch (error) {
      logger.error("Get conversation messages error:", error);
      throw error;
    }
  }

  // Create a new message
  async createMessage(
    senderId: number,
    data: {
      conversationId?: number;
      receiverId?: number;
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
        senderId: number;
        receiverId?: number;
        conversationId?: number;
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

      const messageResponse = await this.messageRepository.createMessage(messageData);

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
  async getFriendMessages(userId: number, friendId: number, limit: number = 50, before?: number): Promise<MessageResponse[]> {
    try {
      return await this.messageRepository.getDirectMessages(userId, friendId, limit, before);
    } catch (error) {
      logger.error("Get friend messages error:", error);
      throw error;
    }
  }

  // Get message by ID
  async getMessageById(messageId: number): Promise<MessageResponse | null> {
    try {
      return await this.messageRepository.getMessageById(messageId);
    } catch (error) {
      logger.error("Get message by ID error:", error);
      throw error;
    }
  }

  // Delete message
  async deleteMessage(messageId: number): Promise<void> {
    try {
      await this.messageRepository.deleteMessage(messageId);
      logger.info("Message deleted successfully", { messageId });
    } catch (error) {
      logger.error("Delete message error:", error);
      throw error;
    }
  }
}
