import { AppDataSource } from '@/config/database';
import { FriendRequest, FriendRequestStatus } from '@/models/FriendRequest';
import { Friends } from '@/models/Friends';
import { User } from '@/models/User';
import { FriendDto, FriendRequestDto, FriendRequestsResponse } from '@notify/types';
import { logger } from '@/utils/logger';

export class FriendService {
  private friendRequestRepository = AppDataSource.getRepository(FriendRequest);
  private friendsRepository = AppDataSource.getRepository(Friends);
  private userRepository = AppDataSource.getRepository(User);

  /**
   * Send a friend request
   */
  async sendFriendRequest(fromUserId: string, toUserId: string): Promise<FriendRequestDto> {
    try {
      // Check if user is trying to send request to themselves
      if (fromUserId === toUserId) {
        throw new Error('You cannot send a friend request to yourself');
      }

      // Check if target user exists
      const toUser = await this.userRepository.findOne({ where: { id: toUserId } });
      if (!toUser) {
        throw new Error('User not found');
      }

      // Check if users are already friends
      const existingFriendship = await this.friendsRepository.findOne({
        where: [
          { userId: fromUserId, friendId: toUserId },
          { userId: toUserId, friendId: fromUserId },
        ],
      });

      if (existingFriendship) {
        throw new Error('You are already friends with this user');
      }

      // Check if there's an existing pending request
      const existingRequest = await this.friendRequestRepository.findOne({
        where: [
          { fromUserId, toUserId, status: FriendRequestStatus.PENDING },
          { fromUserId: toUserId, toUserId: fromUserId, status: FriendRequestStatus.PENDING },
        ],
      });

      if (existingRequest) {
        if (existingRequest.fromUserId === fromUserId) {
          throw new Error('You have already sent a friend request to this user');
        } else {
          throw new Error('This user has already sent you a friend request');
        }
      }

      // Create new friend request
      const friendRequest = this.friendRequestRepository.create({
        fromUserId,
        toUserId,
        status: FriendRequestStatus.PENDING,
      });

      const savedRequest = await this.friendRequestRepository.save(friendRequest);

      // Load relations for response
      const requestWithRelations = await this.friendRequestRepository.findOne({
        where: { id: savedRequest.id },
        relations: ['fromUser', 'toUser'],
      });

      if (!requestWithRelations) {
        throw new Error('Failed to create friend request');
      }

      return this.mapFriendRequestToResponse(requestWithRelations);
    } catch (error: any) {
      logger.error('Error sending friend request:', error);
      throw error;
    }
  }

  /**
   * Accept a friend request
   */
  async acceptFriendRequest(requestId: string, userId: string): Promise<FriendDto> {
    try {
      // Find the friend request
      const friendRequest = await this.friendRequestRepository.findOne({
        where: { id: requestId },
        relations: ['fromUser', 'toUser'],
      });

      if (!friendRequest) {
        throw new Error('Friend request not found');
      }

      // Verify the user is the recipient of the request
      if (friendRequest.toUserId !== userId) {
        throw new Error('You are not authorized to accept this friend request');
      }

      // Check if request is pending
      if (friendRequest.status !== FriendRequestStatus.PENDING) {
        throw new Error(`Friend request is already ${friendRequest.status}`);
      }

      // Update request status to accepted
      friendRequest.status = FriendRequestStatus.ACCEPTED;
      await this.friendRequestRepository.save(friendRequest);

      // Create friendship record (bidirectional)
      const friendship = this.friendsRepository.create(friendRequest);

      const savedFriendship = await this.friendsRepository.save(friendship);

      return this.mapFriendToResponse(savedFriendship);
    } catch (error: any) {
      logger.error('Error accepting friend request:', error);
      throw error;
    }
  }

  /**
   * Decline a friend request
   */
  async declineFriendRequest(requestId: string, userId: string): Promise<void> {
    try {
      // Find the friend request
      const friendRequest = await this.friendRequestRepository.findOne({
        where: { id: requestId },
      });

      if (!friendRequest) {
        throw new Error('Friend request not found');
      }

      // Verify the user is the recipient of the request
      if (friendRequest.toUserId !== userId) {
        throw new Error('You are not authorized to decline this friend request');
      }

      // Check if request is pending
      if (friendRequest.status !== FriendRequestStatus.PENDING) {
        throw new Error(`Friend request is already ${friendRequest.status}`);
      }

      // Update request status to declined
      friendRequest.status = FriendRequestStatus.DECLINED;
      await this.friendRequestRepository.save(friendRequest);
    } catch (error: any) {
      logger.error('Error declining friend request:', error);
      throw error;
    }
  }

  /**
   * Get all friend requests for a user (sent and received)
   */
  async getFriendRequests(userId: string): Promise<FriendRequestsResponse> {
    try {
      const [sentRequests, receivedRequests] = await Promise.all([
        this.friendRequestRepository.find({
          where: { fromUserId: userId },
          relations: ['fromUser', 'toUser'],
          order: { createdAt: 'DESC' },
        }),
        this.friendRequestRepository.find({
          where: { toUserId: userId, status: FriendRequestStatus.PENDING },
          relations: ['fromUser', 'toUser'],
          order: { createdAt: 'DESC' },
        }),
      ]);

      return {
        sent: sentRequests.map((req) => this.mapFriendRequestToResponse(req)),
        received: receivedRequests.map((req) => this.mapFriendRequestToResponse(req)),
      };
    } catch (error: any) {
      logger.error('Error getting friend requests:', error);
      throw error;
    }
  }

  /**
   * Get all friends of a user
   */
  async getFriends(userId: string): Promise<FriendDto[]> {
    try {
      const friendships = await this.friendsRepository.find({
        where: [{ userId }, { friendId: userId }],
        relations: ['user', 'friend'],
        order: { createdAt: 'DESC' },
      });

      return friendships.map((friendship) => {
        // Determine which user is the friend (not the requesting user)
        const friend = friendship.userId === userId ? friendship.friend : friendship.user;

        const response: FriendDto = friendship;

        if (friend) {
          response.friend = friend;
          if (friend.avatar !== undefined) {
            response.friend.avatar = friend.avatar;
          }
        }

        return response;
      });
    } catch (error: any) {
      logger.error('Error getting friends:', error);
      throw error;
    }
  }

  /**
   * Check if two users are friends
   */
  async areFriends(userId1: string, userId2: string): Promise<boolean> {
    try {
      const friendship = await this.friendsRepository.findOne({
        where: [
          { userId: userId1, friendId: userId2 },
          { userId: userId2, friendId: userId1 },
        ],
      });

      return !!friendship;
    } catch (error: any) {
      logger.error('Error checking friendship:', error);
      return false;
    }
  }

  /**
   * Map FriendRequest entity to FriendRequestResponse
   */
  private mapFriendRequestToResponse(request: FriendRequest): FriendRequestDto {
    const response: FriendRequestDto = {
      id: request.id,
      fromUserId: request.fromUserId,
      toUserId: request.toUserId,
      status: request.status,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
    };

    if (request.fromUser) {
      response.fromUser = request.fromUser;
      if (request.fromUser.avatar !== undefined) {
        response.fromUser.avatar = request.fromUser.avatar;
      }
    }

    if (request.toUser) {
      response.toUser = request.toUser;
      if (request.toUser.avatar !== undefined) {
        response.toUser.avatar = request.toUser.avatar;
      }
    }

    return response;
  }

  /**
   * Map Friends entity to FriendResponse
   */
  private mapFriendToResponse(friendship: Friends): FriendDto {
    const response: FriendDto = friendship;

    if (friendship.friend) {
      response.friend = friendship.friend;
      if (friendship.friend.avatar !== undefined) {
        response.friend.avatar = friendship.friend.avatar;
      }
    }

    return response;
  }
}
