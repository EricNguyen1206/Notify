import bcrypt from "bcryptjs";
import { AppDataSource } from "@/config/database";
import { User } from "@/entities/User";
import { UpdateProfileDto } from "@notify/validators";
import { UserResponse } from "@notify/types";
import { logger } from "@/utils/logger";

export class UserService {
  private userRepository = AppDataSource.getRepository(User);

  public async getProfile(userId: number): Promise<UserResponse> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!user) {
        throw new Error("User not found");
      }

      return {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        createdAt: user.createdAt,
      };
    } catch (error) {
      logger.error("Get profile error:", error);
      throw error;
    }
  }

  public async updateProfile(userId: number, data: UpdateProfileDto): Promise<UserResponse> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });

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

      const updatedUser = await this.userRepository.save(user);

      logger.info("User profile updated successfully", { userId: updatedUser.id });

      return {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        avatar: updatedUser.avatar,
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
        avatar: user.avatar,
        createdAt: user.createdAt,
      }));
    } catch (error) {
      logger.error("Search users error:", error);
      throw error;
    }
  }
}
