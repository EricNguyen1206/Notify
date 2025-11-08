import { MessageRepository } from "@/repositories/postgres/message.repository";
import { Message, MessageType } from "@/entities/Message";
import { MessageResponse } from "@notify/types";
import { logger } from "@/utils/logger";

export class MessageService {
  private messageRepository: MessageRepository;

  constructor() {
    this.messageRepository = new MessageRepository();
  }

  // Get channel messages with pagination
  async getChannelMessages(channelId: number, limit: number = 20, before?: number): Promise<MessageResponse[]> {
    try {
      return await this.messageRepository.getChannelMessages(channelId, limit, before);
    } catch (error) {
      logger.error("Get channel messages error:", error);
      throw error;
    }
  }

  // Create a new message
  async createMessage(
    senderId: number,
    data: {
      channelId?: number;
      receiverId?: number;
      text?: string;
      url?: string;
      fileName?: string;
    }
  ): Promise<MessageResponse> {
    try {
      // Validate that exactly one of receiverId or channelId is set
      if ((!data.receiverId && !data.channelId) || (data.receiverId && data.channelId)) {
        throw new Error("Exactly one of receiverId or channelId must be set");
      }

      // Validate that at least one content field is provided
      if (!data.text && !data.url && !data.fileName) {
        throw new Error("At least one content field (text, url, fileName) must be provided");
      }

      const messageResponse = await this.messageRepository.createMessage({
        senderId,
        receiverId: data.receiverId,
        channelId: data.channelId,
        text: data.text,
        url: data.url,
        fileName: data.fileName,
      });

      logger.info("Message created successfully", {
        messageId: messageResponse.id,
        senderId,
        channelId: data.channelId,
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
