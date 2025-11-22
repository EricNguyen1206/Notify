import { AppDataSource } from '@/config/database';
import { Conversation } from '@/models/Conversation';
import { User } from '@/models/User';
import { Participant } from '@/models/Participant';
import { UserService } from '@/services/user.service';
import { ConversationDto, ConversationType } from '@notify/types';
import { logger } from '@/utils/logger';
import { UpdateConversationRequestDto } from '@notify/validators';

export class ConversationService {
  private conversationRepository = AppDataSource.getRepository(Conversation);
  private participantRepository = AppDataSource.getRepository(Participant);
  private userRepository = AppDataSource.getRepository(User);
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  // Helper to build direct conversation response
  private async buildConversationDto(
    conversation: Conversation,

    userId: string
  ): Promise<ConversationDto> {
    try {
      const friends = await this.userService.getFriendsByConversationId(conversation.id, userId);

      let usrEmail = 'Unknown';
      let avatar = '';

      if (friends.length === 1 && friends[0]) {
        usrEmail = friends[0].email;
        avatar = friends[0].avatar || '';
      } else if (friends.length > 1) {
        // Multiple friends - avoid showing current user as conversation name
        if (friends[0] && friends[0].id === userId && friends[1]) {
          usrEmail = friends[1].email;
          avatar = friends[1].avatar || '';
        } else if (friends[0]) {
          usrEmail = friends[0].email;
          avatar = friends[0].avatar || '';
        }
      }

      return {
        ...conversation,
        name: usrEmail,
        avatar,
      };
      return conversation;
    } catch (error) {
      logger.error('Build direct conversation response error:', error);
      throw error;
    }
  }

  async getConversationById(conversationId: string): Promise<Conversation | null> {
    try {
      return await this.conversationRepository
        .createQueryBuilder('conversation')
        .leftJoinAndSelect('conversation.participants', 'participant')
        .leftJoinAndSelect('participant.user', 'user')
        .where('conversation.id = :conversationId', { conversationId })
        .andWhere('conversation.deletedAt IS NULL')
        .getOne();
    } catch (error) {
      logger.error('Get conversation by ID error:', error);
      throw error;
    }
  }

  // Get all conversations for a user, separated by type (direct/group)
  async getAllConversation(userId: string): Promise<{
    direct: ConversationDto[];
    group: ConversationDto[];
  }> {
    try {
      const conversations = await this.conversationRepository
        .createQueryBuilder('conversation')
        .leftJoinAndSelect('conversation.participants', 'participant')
        .leftJoinAndSelect('participant.user', 'user')
        .innerJoin('conversation.participants', 'userParticipant')
        .where('userParticipant.userId = :userId', { userId })
        .andWhere('conversation.deletedAt IS NULL')
        .getMany();

      const direct: ConversationDto[] = [];
      const group: ConversationDto[] = [];

      for (const conversation of conversations) {
        if (conversation.type === ConversationType.DIRECT) {
          const directResponse = await this.buildConversationDto(conversation, userId);
          direct.push(directResponse);
        } else {
          group.push(conversation);
        }
      }

      return { direct, group };
    } catch (error) {
      logger.error('Get all conversations error:', error);
      throw error;
    }
  }

  // Create a new conversation with specified users
  async createConversation(
    name: string,
    ownerId: string,
    conversationType: ConversationType,
    userIds: string[]
  ): Promise<Conversation> {
    try {
      // Validate owner exists
      const owner = await this.userRepository.findOne({ where: { id: ownerId } });
      if (!owner) {
        throw new Error('Owner not found');
      }

      // Validate all users exist
      const users: User[] = [];
      for (const userId of userIds) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
          throw new Error(`User with ID ${userId} not found`);
        }
        users.push(user);
      }

      // Auto-generate name for direct messages if not provided
      let conversationName = name;
      if (
        conversationType === ConversationType.DIRECT &&
        (!name || name === 'Direct Message with User')
      ) {
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

      const savedConversation = await this.conversationRepository.save(conversation);

      // Add all users to conversation
      for (const user of users) {
        await this.addUserToConversation(ownerId, savedConversation.id, user.id);
      }

      logger.info('Conversation created successfully', {
        conversationId: savedConversation.id,
        ownerId,
        type: conversationType,
        memberCount: users.length,
      });

      return savedConversation;
    } catch (error) {
      logger.error('Create conversation with users error:', error);
      throw error;
    }
  }

  // Update conversation name
  async updateConversation(
    conversationId: string,
    updateData: UpdateConversationRequestDto
  ): Promise<void> {
    try {
      const conversation = await this.getConversationById(conversationId);
      if (!conversation) {
        throw new Error('Conversation not found');
      }

      conversation.name = updateData.name;
      if (updateData.avatar) {
        conversation.avatar = updateData.avatar;
      }
      await this.conversationRepository.save(conversation);

      logger.info('Conversation updated successfully', { conversationId });
    } catch (error) {
      logger.error('Update conversation error:', error);
      throw error;
    }
  }

  // Delete conversation (only owner can delete)
  async deleteConversation(ownerId: string, conversationId: string): Promise<void> {
    try {
      const conversation = await this.getConversationById(conversationId);
      if (!conversation) {
        throw new Error('Conversation not found');
      }

      // Check if the user is the owner of the conversation
      if (conversation.ownerId !== ownerId) {
        throw new Error('Only conversation owner can delete conversation');
      }

      await this.conversationRepository.softDelete(conversationId);

      logger.info('Conversation deleted successfully', { conversationId, ownerId });
    } catch (error) {
      logger.error('Delete conversation error:', error);
      throw error;
    }
  }

  // Add user to conversation (only owner can add users)
  async addUserToConversation(
    ownerId: string,
    conversationId: string,
    targetUserId: string
  ): Promise<void> {
    try {
      const conversation = await this.getConversationById(conversationId);
      if (!conversation) {
        throw new Error('Conversation not found');
      }

      // Check if the user is the owner of the conversation
      if (conversation.ownerId !== ownerId) {
        throw new Error('Only conversation owner can add users');
      }

      // Check if target user exists
      const targetUser = await this.userRepository.findOne({ where: { id: targetUserId } });
      if (!targetUser) {
        throw new Error('Target user not found');
      }

      // Add user to conversation
      const participant = new Participant(targetUserId, conversationId);
      await this.participantRepository.save(participant);

      logger.info('User added to conversation', { conversationId, targetUserId, ownerId });
    } catch (error) {
      logger.error('Add user to conversation error:', error);
      throw error;
    }
  }

  // Remove user from conversation (only owner can remove users)
  async removeUserFromConversation(
    ownerId: string,
    conversationId: string,
    targetUserId: string
  ): Promise<void> {
    try {
      const conversation = await this.getConversationById(conversationId);
      if (!conversation) {
        throw new Error('Conversation not found');
      }

      // Check if the user is the owner of the conversation
      if (conversation.ownerId !== ownerId) {
        throw new Error('Only conversation owner can remove users');
      }

      // Check if target user exists
      const targetUser = await this.userRepository.findOne({ where: { id: targetUserId } });
      if (!targetUser) {
        throw new Error('Target user not found');
      }

      // Check if trying to remove the owner
      if (targetUserId === ownerId) {
        throw new Error('Cannot remove conversation owner');
      }

      // Remove user from conversation
      await this.participantRepository.softDelete({
        conversationId,
        userId: targetUserId,
      });

      logger.info('User removed from conversation', { conversationId, targetUserId, ownerId });
    } catch (error) {
      logger.error('Remove user from conversation error:', error);
      throw error;
    }
  }

  async leaveConversation(userId: string, conversationId: string) {
    const conversation = await this.getConversationById(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // Remove user from conversation
    await this.participantRepository.softDelete({
      conversationId,
      userId: userId,
    });
  }
}
