import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { AppDataSource } from "@/config/database";
import { User } from "@/models/User";
import { Session } from "@/models/Session";
import { config } from "@/config/config";
import { RegisterDto, LoginDto } from "@notify/validators";
import { LoginResponse, UserResponse, RefreshTokenResponse } from "@notify/types";
import { logger } from "@/utils/logger";

export class AuthService {
  private userRepository = AppDataSource.getRepository(User);
  private sessionRepository = AppDataSource.getRepository(Session);

  public async register(data: RegisterDto): Promise<UserResponse> {
    try {
      // Check if user already exists
      const existingUser = await this.userRepository.findOne({
        where: { email: data.email },
      });

      if (existingUser) {
        throw new Error("Email already exists");
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(data.password, 12);

      // Create user
      const user = this.userRepository.create({
        username: data.username,
        email: data.email,
        password: hashedPassword,
      });

      const savedUser = await this.userRepository.save(user);

      logger.info("User registered successfully", { userId: savedUser.id, email: savedUser.email });

      const response: UserResponse = {
        id: savedUser.id,
        username: savedUser.username,
        email: savedUser.email,
        createdAt: savedUser.createdAt,
      };
      if (savedUser.avatar !== undefined) {
        response.avatar = savedUser.avatar;
      }
      return response;
    } catch (error) {
      logger.error("Registration error:", error);
      throw error;
    }
  }

  public async login(data: LoginDto): Promise<LoginResponse> {
    try {
      // Find user by email
      const user = await this.userRepository.findOne({
        where: { email: data.email },
      });

      if (!user) {
        throw new Error("Invalid credentials");
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(data.password, user.password);
      if (!isPasswordValid) {
        throw new Error("Invalid credentials");
      }

      // Generate access token (short-lived)
      const accessToken = jwt.sign({ userId: user.id, email: user.email, username: user.username }, config.jwt.secret, {
        expiresIn: config.jwt.accessExpire,
      } as jwt.SignOptions);

      // Generate refresh token (long-lived, 30 days)
      const refreshToken = crypto.randomBytes(64).toString("hex");

      // Calculate expiration date (30 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      // Create session record
      const session = this.sessionRepository.create({
        userId: user.id,
        refreshToken,
        expiresAt,
      });

      await this.sessionRepository.save(session);

      logger.info("User logged in successfully", { userId: user.id, email: user.email });

      const userResponse: UserResponse = {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
      };
      if (user.avatar !== undefined) {
        userResponse.avatar = user.avatar;
      }

      return {
        accessToken,
        refreshToken,
        user: userResponse,
      };
    } catch (error) {
      logger.error("Login error:", error);
      throw error;
    }
  }

  public async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    try {
      // Find session by refresh token
      const session = await this.sessionRepository.findOne({
        where: { refreshToken },
        relations: ["user"],
      });

      if (!session) {
        throw new Error("Invalid refresh token");
      }

      // Check if session is expired
      if (session.isExpired()) {
        throw new Error("Refresh token expired");
      }

      // Get user
      const user = session.user;
      if (!user) {
        throw new Error("User not found");
      }

      // Generate new access token
      const accessToken = jwt.sign({ userId: user.id, email: user.email, username: user.username }, config.jwt.secret, {
        expiresIn: config.jwt.accessExpire,
      } as jwt.SignOptions);

      logger.info("Access token refreshed", { userId: user.id, sessionId: session.id });

      return {
        accessToken,
      };
    } catch (error) {
      logger.error("Refresh token error:", error);
      throw error;
    }
  }

  public async logout(refreshToken: string, userId: string): Promise<void> {
    try {
      // Find and delete session
      const session = await this.sessionRepository.findOne({
        where: { refreshToken, userId },
      });

      if (session) {
        await this.sessionRepository.softDelete(session.id);
        logger.info("User logged out successfully", { userId, sessionId: session.id });
      }
    } catch (error) {
      logger.error("Logout error:", error);
      throw error;
    }
  }

  public async logoutAll(userId: string): Promise<void> {
    try {
      // Delete all sessions for user
      await this.sessionRepository.createQueryBuilder().softDelete().where("userId = :userId", { userId }).execute();

      logger.info("All sessions logged out", { userId });
    } catch (error) {
      logger.error("Logout all error:", error);
      throw error;
    }
  }
}
