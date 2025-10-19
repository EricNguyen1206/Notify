import { ChatRepository } from "@/repositories/postgres/chat.repository";
import { Chat, ChatType } from "@/entities/Chat";
import { ChatResponse } from "@/types/response/message.response";
import { logger } from "@/utils/logger";

export class MessageService {
  private chatRepository: ChatRepository;

  constructor() {
    this.chatRepository = new ChatRepository();
  }

  // Get channel messages with pagination
  async getChannelMessages(channelId: number, limit: number = 20, before?: number): Promise<ChatResponse[]> {
    try {
      return await this.chatRepository.getChannelMessagesWithPagination(channelId, limit, before);
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
  ): Promise<Chat> {
    try {
      // Validate that exactly one of receiverId or channelId is set
      if ((!data.receiverId && !data.channelId) || (data.receiverId && data.channelId)) {
        throw new Error("Exactly one of receiverId or channelId must be set");
      }

      // Validate that at least one content field is provided
      if (!data.text && !data.url && !data.fileName) {
        throw new Error("At least one content field (text, url, fileName) must be provided");
      }

      const chat = new Chat();
      chat.senderId = senderId;
      chat.receiverId = data.receiverId;
      chat.channelId = data.channelId;
      chat.text = data.text;
      chat.url = data.url;
      chat.fileName = data.fileName;

      const savedChat = await this.chatRepository.create(chat);

      logger.info("Message created successfully", {
        messageId: savedChat.id,
        senderId,
        channelId: data.channelId,
        receiverId: data.receiverId,
      });

      return savedChat;
    } catch (error) {
      logger.error("Create message error:", error);
      throw error;
    }
  }

  // Get friend messages (direct messages between two users)
  async getFriendMessages(userId: number, friendId: number): Promise<ChatResponse[]> {
    try {
      return await this.chatRepository.getFriendMessages(userId, friendId);
    } catch (error) {
      logger.error("Get friend messages error:", error);
      throw error;
    }
  }

  // Get message by ID
  async getMessageById(messageId: number): Promise<Chat | null> {
    try {
      return await this.chatRepository.findById(messageId);
    } catch (error) {
      logger.error("Get message by ID error:", error);
      throw error;
    }
  }

  // Delete message
  async deleteMessage(messageId: number): Promise<void> {
    try {
      await this.chatRepository.delete(messageId);
      logger.info("Message deleted successfully", { messageId });
    } catch (error) {
      logger.error("Delete message error:", error);
      throw error;
    }
  }
}
