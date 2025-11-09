import bcrypt from "bcryptjs";
import { AppDataSource } from "@/config/database";
import { User } from "@/models/User";
import { UpdateProfileDto } from "@notify/validators";
import { UserResponse } from "@notify/types";
import { logger } from "@/utils/logger";

export class UserService {
  private userRepository = AppDataSource.getRepository(User);

  // Private repository methods (kept for internal use and potential future expansion)
  private async findById(id: string): Promise<User | null> {
    try {
      return await this.userRepository.findOne({
        where: { id },
      });
    } catch (error) {
      logger.error("Find user by ID error:", error);
      throw error;
    }
  }

  // @ts-ignore - Intentionally unused, kept for future use
  private async findByEmail(email: string): Promise<User | null> {
    try {
      return await this.userRepository.findOne({
        where: { email },
      });
    } catch (error) {
      logger.error("Find user by email error:", error);
      throw error;
    }
  }

  // @ts-ignore - Intentionally unused, kept for future use
  private async create(user: User): Promise<User> {
    try {
      return await this.userRepository.save(user);
    } catch (error) {
      logger.error("Create user error:", error);
      throw error;
    }
  }

  private async update(user: User): Promise<User> {
    try {
      return await this.userRepository.save(user);
    } catch (error) {
      logger.error("Update user error:", error);
      throw error;
    }
  }

  // @ts-ignore - Intentionally unused, kept for future use
  private async delete(userId: string): Promise<void> {
    try {
      await this.userRepository.softDelete(userId);
    } catch (error) {
      logger.error("Delete user error:", error);
      throw error;
    }
  }

  // Public methods
  public async getProfile(userId: string): Promise<UserResponse> {
    try {
      const user = await this.findById(userId);

      if (!user) {
        throw new Error("User not found");
      }

      return {
        id: user.id,
        username: user.username,
        email: user.email,
        ...(user.avatar !== undefined && { avatar: user.avatar }),
        createdAt: user.createdAt,
      };
    } catch (error) {
      logger.error("Get profile error:", error);
      throw error;
    }
  }

  public async updateProfile(userId: string, data: UpdateProfileDto): Promise<UserResponse> {
    try {
      const user = await this.findById(userId);

      if (!user) {
        throw new Error("User not found");
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(data.currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        throw new Error("Current password is incorrect");
      }

      // Update fields if provided
      if (data.username) {
        user.username = data.username;
      }
      if (data.avatar !== undefined) {
        user.avatar = data.avatar;
      }
      if (data.password) {
        user.password = await bcrypt.hash(data.password, 12);
      }

      const updatedUser = await this.update(user);

      logger.info("User profile updated successfully", { userId: updatedUser.id });

      return {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        ...(updatedUser.avatar !== undefined && { avatar: updatedUser.avatar }),
        createdAt: updatedUser.createdAt,
      };
    } catch (error) {
      logger.error("Update profile error:", error);
      throw error;
    }
  }

  public async searchUsers(username: string): Promise<UserResponse[]> {
    try {
      const users = await this.userRepository
        .createQueryBuilder("user")
        .where("user.username ILIKE :username", { username: `%${username}%` })
        .limit(10)
        .getMany();

      return users.map((user) => ({
        id: user.id,
        username: user.username,
        email: user.email,
        ...(user.avatar !== undefined && { avatar: user.avatar }),
        createdAt: user.createdAt,
      }));
    } catch (error) {
      logger.error("Search users error:", error);
      throw error;
    }
  }

  public async getFriendsByConversationId(conversationId: string, userId: string): Promise<User[]> {
    try {
      return await this.userRepository
        .createQueryBuilder("user")
        .innerJoin("user.participants", "participant")
        .where("participant.conversationId = :conversationId", { conversationId })
        .andWhere("user.id != :userId", { userId })
        .andWhere("user.deletedAt IS NULL")
        .getMany();
    } catch (error) {
      logger.error("Get friends by conversation ID error:", error);
      throw error;
    }
  }
}
