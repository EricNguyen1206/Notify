import { AppDataSource } from "@/config/database";
import { User } from "@/entities/User";
import { logger } from "@/utils/logger";

export class UserRepository {
  private userRepository = AppDataSource.getRepository(User);

  async findById(id: number): Promise<User | null> {
    try {
      return await this.userRepository.findOne({
        where: { id },
      });
    } catch (error) {
      logger.error("Find user by ID error:", error);
      throw error;
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      return await this.userRepository.findOne({
        where: { email },
      });
    } catch (error) {
      logger.error("Find user by email error:", error);
      throw error;
    }
  }

  async create(user: User): Promise<User> {
    try {
      return await this.userRepository.save(user);
    } catch (error) {
      logger.error("Create user error:", error);
      throw error;
    }
  }

  async update(user: User): Promise<User> {
    try {
      return await this.userRepository.save(user);
    } catch (error) {
      logger.error("Update user error:", error);
      throw error;
    }
  }

  async delete(userId: number): Promise<void> {
    try {
      await this.userRepository.softDelete(userId);
    } catch (error) {
      logger.error("Delete user error:", error);
      throw error;
    }
  }

  async searchByUsername(username: string): Promise<User[]> {
    try {
      return await this.userRepository
        .createQueryBuilder("user")
        .where("user.username ILIKE :username", { username: `%${username}%` })
        .andWhere("user.deletedAt IS NULL")
        .limit(10)
        .getMany();
    } catch (error) {
      logger.error("Search users by username error:", error);
      throw error;
    }
  }

  async getFriendsByChannelId(channelId: number, userId: number): Promise<User[]> {
    try {
      return await this.userRepository
        .createQueryBuilder("user")
        .innerJoin("user.channelMemberships", "member")
        .where("member.channelId = :channelId", { channelId })
        .andWhere("user.id != :userId", { userId })
        .andWhere("user.deletedAt IS NULL")
        .getMany();
    } catch (error) {
      logger.error("Get friends by channel ID error:", error);
      throw error;
    }
  }
}
