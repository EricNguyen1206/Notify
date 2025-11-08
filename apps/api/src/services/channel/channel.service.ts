import { AppDataSource } from "@/config/database";
import { Channel, ChannelType } from "@/entities/Channel";
import { User } from "@/entities/User";
import { ChannelMember } from "@/entities/ChannelMember";
import { Chat } from "@/entities/Chat";
import { ChannelRepository } from "@/repositories/postgres/channel.repository";
import { UserRepository } from "@/repositories/postgres/user.repository";
import { ChatRepository } from "@/repositories/postgres/chat.repository";
import {
  ChannelResponse,
  DirectChannelResponse,
  ChannelDetailResponse,
  UserChannelsResponse,
} from "@notify/types";
import { ChatResponse } from "@notify/types";
import { logger } from "@/utils/logger";

export class ChannelService {
  private channelRepository: ChannelRepository;
  private userRepository: UserRepository;
  private chatRepository: ChatRepository;

  constructor() {
    this.channelRepository = new ChannelRepository();
    this.userRepository = new UserRepository();
    this.chatRepository = new ChatRepository();
  }

  // Get all channels for a user, separated by type (direct/group)
  async getAllChannel(userId: number): Promise<{
    direct: DirectChannelResponse[];
    group: ChannelResponse[];
  }> {
    try {
      const channels = await this.channelRepository.getAllUserChannels(userId);

      const direct: DirectChannelResponse[] = [];
      const group: ChannelResponse[] = [];

      for (const channel of channels) {
        if (channel.type === ChannelType.DIRECT) {
          const directResponse = await this.buildDirectChannelResponse(channel, userId);
          direct.push(directResponse);
        } else {
          const groupResponse: ChannelResponse = {
            id: channel.id,
            name: channel.name,
            type: channel.type,
            ownerId: channel.ownerId,
          };
          group.push(groupResponse);
        }
      }

      return { direct, group };
    } catch (error) {
      logger.error("Get all channels error:", error);
      throw error;
    }
  }

  // Helper to build direct channel response
  private async buildDirectChannelResponse(channel: Channel, userId: number): Promise<DirectChannelResponse> {
    try {
      const friends = await this.userRepository.getFriendsByChannelId(channel.id, userId);

      let usrEmail = "Unknown";
      let avatar = "";

      if (friends.length === 1) {
        usrEmail = friends[0].email;
        avatar = friends[0].avatar || "";
      } else if (friends.length > 1) {
        // Multiple friends - avoid showing current user as channel name
        if (friends[0].id === userId) {
          usrEmail = friends[1].email;
          avatar = friends[1].avatar || "";
        } else {
          usrEmail = friends[0].email;
          avatar = friends[0].avatar || "";
        }
      }

      return {
        id: channel.id,
        name: usrEmail,
        avatar,
        type: channel.type,
        ownerId: channel.ownerId,
      };
    } catch (error) {
      logger.error("Build direct channel response error:", error);
      throw error;
    }
  }

  // Create a new channel with specified users
  async createChannelWithUsers(
    name: string,
    ownerId: number,
    channelType: ChannelType,
    userIds: number[]
  ): Promise<Channel> {
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
      let channelName = name;
      if (channelType === ChannelType.DIRECT && (!name || name === "Direct Message with User")) {
        // Find the other user (not the owner) to use their email as channel name
        const otherUser = users.find((user) => user.id !== ownerId);
        if (otherUser) {
          channelName = otherUser.email;
        }
      }

      // Create channel
      const channel = new Channel();
      channel.name = channelName;
      channel.ownerId = ownerId;
      channel.type = channelType;

      const savedChannel = await this.channelRepository.create(channel);

      // Add all users to channel
      for (const user of users) {
        await this.channelRepository.addUser(savedChannel.id, user.id);
      }

      logger.info("Channel created successfully", {
        channelId: savedChannel.id,
        ownerId,
        type: channelType,
        memberCount: users.length,
      });

      return savedChannel;
    } catch (error) {
      logger.error("Create channel with users error:", error);
      throw error;
    }
  }

  // Update channel name
  async updateChannel(channelId: number, name: string): Promise<void> {
    try {
      const channel = await this.channelRepository.getById(channelId);
      if (!channel) {
        throw new Error("Channel not found");
      }

      channel.name = name;
      await this.channelRepository.update(channel);

      logger.info("Channel updated successfully", { channelId, name });
    } catch (error) {
      logger.error("Update channel error:", error);
      throw error;
    }
  }

  // Delete channel (only owner can delete)
  async deleteChannel(ownerId: number, channelId: number): Promise<void> {
    try {
      const channel = await this.channelRepository.getById(channelId);
      if (!channel) {
        throw new Error("Channel not found");
      }

      // Check if the user is the owner of the channel
      if (channel.ownerId !== ownerId) {
        throw new Error("Only channel owner can delete channel");
      }

      await this.channelRepository.delete(channelId);

      logger.info("Channel deleted successfully", { channelId, ownerId });
    } catch (error) {
      logger.error("Delete channel error:", error);
      throw error;
    }
  }

  // Get channel by ID
  async getChannelById(channelId: number): Promise<Channel> {
    try {
      const channel = await this.channelRepository.getById(channelId);
      if (!channel) {
        throw new Error("Channel not found");
      }
      return channel;
    } catch (error) {
      logger.error("Get channel by ID error:", error);
      throw error;
    }
  }

  // Join channel
  async joinChannel(channelId: number, userId: number): Promise<void> {
    try {
      // Check if channel exists
      const channel = await this.channelRepository.getById(channelId);
      if (!channel) {
        throw new Error("Channel not found");
      }

      // Check if user exists
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }

      // Add user to channel
      await this.channelRepository.addUser(channelId, userId);

      logger.info("User joined channel", { channelId, userId });
    } catch (error) {
      logger.error("Join channel error:", error);
      throw error;
    }
  }

  // Leave channel
  async leaveChannel(channelId: number, userId: number): Promise<void> {
    try {
      // Check if channel exists
      const channel = await this.channelRepository.getById(channelId);
      if (!channel) {
        throw new Error("Channel not found");
      }

      // Check if user exists
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }

      // Remove user from channel
      await this.channelRepository.removeUser(channelId, userId);

      logger.info("User left channel", { channelId, userId });
    } catch (error) {
      logger.error("Leave channel error:", error);
      throw error;
    }
  }

  // Add user to channel (only owner can add users)
  async addUserToChannel(ownerId: number, channelId: number, targetUserId: number): Promise<void> {
    try {
      const channel = await this.channelRepository.getById(channelId);
      if (!channel) {
        throw new Error("Channel not found");
      }

      // Check if the user is the owner of the channel
      if (channel.ownerId !== ownerId) {
        throw new Error("Only channel owner can add users");
      }

      // Check if target user exists
      const targetUser = await this.userRepository.findById(targetUserId);
      if (!targetUser) {
        throw new Error("Target user not found");
      }

      // Add user to channel
      await this.channelRepository.addUser(channelId, targetUserId);

      logger.info("User added to channel", { channelId, targetUserId, ownerId });
    } catch (error) {
      logger.error("Add user to channel error:", error);
      throw error;
    }
  }

  // Remove user from channel (only owner can remove users)
  async removeUserFromChannel(ownerId: number, channelId: number, targetUserId: number): Promise<void> {
    try {
      const channel = await this.channelRepository.getById(channelId);
      if (!channel) {
        throw new Error("Channel not found");
      }

      // Check if the user is the owner of the channel
      if (channel.ownerId !== ownerId) {
        throw new Error("Only channel owner can remove users");
      }

      // Check if target user exists
      const targetUser = await this.userRepository.findById(targetUserId);
      if (!targetUser) {
        throw new Error("Target user not found");
      }

      // Check if trying to remove the owner
      if (targetUserId === ownerId) {
        throw new Error("Cannot remove channel owner");
      }

      // Remove user from channel
      await this.channelRepository.removeUser(channelId, targetUserId);

      logger.info("User removed from channel", { channelId, targetUserId, ownerId });
    } catch (error) {
      logger.error("Remove user from channel error:", error);
      throw error;
    }
  }

  // Get chat messages for a channel with pagination
  async getChatMessagesByChannelWithPagination(
    channelId: number,
    limit: number = 20,
    before?: number
  ): Promise<ChatResponse[]> {
    try {
      return await this.channelRepository.getChatMessagesWithPagination(channelId, limit, before);
    } catch (error) {
      logger.error("Get chat messages by channel error:", error);
      throw error;
    }
  }
}
