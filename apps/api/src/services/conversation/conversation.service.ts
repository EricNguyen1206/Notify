import { Conversation, ConversationType } from "@/entities/Conversation";
import { User } from "@/entities/User";
import { ConversationRepository } from "@/repositories/postgres/conversation.repository";
import { UserRepository } from "@/repositories/postgres/user.repository";
import {
  ConversationResponse,
  DirectConversationResponse,
  MessageResponse,
} from "@notify/types";
import { logger } from "@/utils/logger";

export class ConversationService {
  private conversationRepository: ConversationRepository;
  private userRepository: UserRepository;

  constructor() {
    this.conversationRepository = new ConversationRepository();
    this.userRepository = new UserRepository();
  }

  // Get all conversations for a user, separated by type (direct/group)
  async getAllConversation(userId: number): Promise<{
    direct: DirectConversationResponse[];
    group: ConversationResponse[];
  }> {
    try {
      const conversations = await this.conversationRepository.getAllUserConversations(userId);

      const direct: DirectConversationResponse[] = [];
      const group: ConversationResponse[] = [];

      for (const conversation of conversations) {
        if (conversation.type === ConversationType.DIRECT) {
          const directResponse = await this.buildDirectConversationResponse(conversation, userId);
          direct.push(directResponse);
        } else {
          const groupResponse: ConversationResponse = {
            id: conversation.id,
            name: conversation.name,
            type: conversation.type,
            ownerId: conversation.ownerId,
          };
          group.push(groupResponse);
        }
      }

      return { direct, group };
    } catch (error) {
      logger.error("Get all conversations error:", error);
      throw error;
    }
  }

  // Helper to build direct conversation response
  private async buildDirectConversationResponse(conversation: Conversation, userId: number): Promise<DirectConversationResponse> {
    try {
      const friends = await this.userRepository.getFriendsByConversationId(conversation.id, userId);

      let usrEmail = "Unknown";
      let avatar = "";

      if (friends.length === 1 && friends[0]) {
        usrEmail = friends[0].email;
        avatar = friends[0].avatar || "";
      } else if (friends.length > 1) {
        // Multiple friends - avoid showing current user as conversation name
        if (friends[0] && friends[0].id === userId && friends[1]) {
          usrEmail = friends[1].email;
          avatar = friends[1].avatar || "";
        } else if (friends[0]) {
          usrEmail = friends[0].email;
          avatar = friends[0].avatar || "";
        }
      }

      return {
        id: conversation.id,
        name: usrEmail,
        avatar,
        type: conversation.type,
        ownerId: conversation.ownerId,
      };
    } catch (error) {
      logger.error("Build direct conversation response error:", error);
      throw error;
    }
  }

  // Create a new conversation with specified users
  async createConversationWithUsers(
    name: string,
    ownerId: number,
    conversationType: ConversationType,
    userIds: number[]
  ): Promise<Conversation> {
    try {
      // Validate owner exists
      const owner = await this.userRepository.findById(ownerId);
      if (!owner) {
        throw new Error("Owner not found");
      }

      // Validate all users exist
      const users: User[] = [];
      for (const userId of userIds) {
        const user = await this.userRepository.findById(userId);
        if (!user) {
          throw new Error(`User with ID ${userId} not found`);
        }
        users.push(user);
      }

      // Auto-generate name for direct messages if not provided
      let conversationName = name;
      if (conversationType === ConversationType.DIRECT && (!name || name === "Direct Message with User")) {
        // Find the other user (not the owner) to use their email as conversation name
        const otherUser = users.find((user) => user.id !== ownerId);
        if (otherUser) {
          conversationName = otherUser.email;
        }
      }

      // Create conversation
      const conversation = new Conversation();
      conversation.name = conversationName;
      conversation.ownerId = ownerId;
      conversation.type = conversationType;

      const savedConversation = await this.conversationRepository.create(conversation);

      // Add all users to conversation
      for (const user of users) {
        await this.conversationRepository.addUser(savedConversation.id, user.id);
      }

      logger.info("Conversation created successfully", {
        conversationId: savedConversation.id,
        ownerId,
        type: conversationType,
        memberCount: users.length,
      });

      return savedConversation;
    } catch (error) {
      logger.error("Create conversation with users error:", error);
      throw error;
    }
  }

  // Update conversation name
  async updateConversation(conversationId: number, name: string): Promise<void> {
    try {
      const conversation = await this.conversationRepository.getById(conversationId);
      if (!conversation) {
        throw new Error("Conversation not found");
      }

      conversation.name = name;
      await this.conversationRepository.update(conversation);

      logger.info("Conversation updated successfully", { conversationId, name });
    } catch (error) {
      logger.error("Update conversation error:", error);
      throw error;
    }
  }

  // Delete conversation (only owner can delete)
  async deleteConversation(ownerId: number, conversationId: number): Promise<void> {
    try {
      const conversation = await this.conversationRepository.getById(conversationId);
      if (!conversation) {
        throw new Error("Conversation not found");
      }

      // Check if the user is the owner of the conversation
      if (conversation.ownerId !== ownerId) {
        throw new Error("Only conversation owner can delete conversation");
      }

      await this.conversationRepository.delete(conversationId);

      logger.info("Conversation deleted successfully", { conversationId, ownerId });
    } catch (error) {
      logger.error("Delete conversation error:", error);
      throw error;
    }
  }

  // Get conversation by ID
  async getConversationById(conversationId: number): Promise<Conversation> {
    try {
      const conversation = await this.conversationRepository.getById(conversationId);
      if (!conversation) {
        throw new Error("Conversation not found");
      }
      return conversation;
    } catch (error) {
      logger.error("Get conversation by ID error:", error);
      throw error;
    }
  }

  // Join conversation
  async joinConversation(conversationId: number, userId: number): Promise<void> {
    try {
      // Check if conversation exists
      const conversation = await this.conversationRepository.getById(conversationId);
      if (!conversation) {
        throw new Error("Conversation not found");
      }

      // Check if user exists
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }

      // Add user to conversation
      await this.conversationRepository.addUser(conversationId, userId);

      logger.info("User joined conversation", { conversationId, userId });
    } catch (error) {
      logger.error("Join conversation error:", error);
      throw error;
    }
  }

  // Leave conversation
  async leaveConversation(conversationId: number, userId: number): Promise<void> {
    try {
      // Check if conversation exists
      const conversation = await this.conversationRepository.getById(conversationId);
      if (!conversation) {
        throw new Error("Conversation not found");
      }

      // Check if user exists
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }

      // Remove user from conversation
      await this.conversationRepository.removeUser(conversationId, userId);

      logger.info("User left conversation", { conversationId, userId });
    } catch (error) {
      logger.error("Leave conversation error:", error);
      throw error;
    }
  }

  // Add user to conversation (only owner can add users)
  async addUserToConversation(ownerId: number, conversationId: number, targetUserId: number): Promise<void> {
    try {
      const conversation = await this.conversationRepository.getById(conversationId);
      if (!conversation) {
        throw new Error("Conversation not found");
      }

      // Check if the user is the owner of the conversation
      if (conversation.ownerId !== ownerId) {
        throw new Error("Only conversation owner can add users");
      }

      // Check if target user exists
      const targetUser = await this.userRepository.findById(targetUserId);
      if (!targetUser) {
        throw new Error("Target user not found");
      }

      // Add user to conversation
      await this.conversationRepository.addUser(conversationId, targetUserId);

      logger.info("User added to conversation", { conversationId, targetUserId, ownerId });
    } catch (error) {
      logger.error("Add user to conversation error:", error);
      throw error;
    }
  }

  // Remove user from conversation (only owner can remove users)
  async removeUserFromConversation(ownerId: number, conversationId: number, targetUserId: number): Promise<void> {
    try {
      const conversation = await this.conversationRepository.getById(conversationId);
      if (!conversation) {
        throw new Error("Conversation not found");
      }

      // Check if the user is the owner of the conversation
      if (conversation.ownerId !== ownerId) {
        throw new Error("Only conversation owner can remove users");
      }

      // Check if target user exists
      const targetUser = await this.userRepository.findById(targetUserId);
      if (!targetUser) {
        throw new Error("Target user not found");
      }

      // Check if trying to remove the owner
      if (targetUserId === ownerId) {
        throw new Error("Cannot remove conversation owner");
      }

      // Remove user from conversation
      await this.conversationRepository.removeUser(conversationId, targetUserId);

      logger.info("User removed from conversation", { conversationId, targetUserId, ownerId });
    } catch (error) {
      logger.error("Remove user from conversation error:", error);
      throw error;
    }
  }

  // Get chat messages for a conversation with pagination
  async getChatMessagesByConversationWithPagination(
    conversationId: number,
    limit: number = 20,
    before?: number
  ): Promise<MessageResponse[]> {
    try {
      return await this.conversationRepository.getChatMessagesWithPagination(conversationId, limit, before);
    } catch (error) {
      logger.error("Get chat messages by conversation error:", error);
      throw error;
    }
  }
}

