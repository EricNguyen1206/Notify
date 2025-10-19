import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AppDataSource } from "@/config/database";
import { User } from "@/entities/User";
import { config } from "@/config/config";
import { RegisterDto, LoginDto } from "@/types/dto/auth.dto";
import { LoginResponse, UserResponse } from "@/types/response/auth.response";
import { logger } from "@/utils/logger";

export class AuthService {
  private userRepository = AppDataSource.getRepository(User);

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

      return {
        id: savedUser.id,
        username: savedUser.username,
        email: savedUser.email,
        avatar: savedUser.avatar,
        createdAt: savedUser.createdAt,
      };
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

      // Generate JWT token
      const token = jwt.sign({ userId: user.id, email: user.email, username: user.username }, config.jwt.secret, {
        expiresIn: config.jwt.expire,
      });

      logger.info("User logged in successfully", { userId: user.id, email: user.email });

      return {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          createdAt: user.createdAt,
        },
      };
    } catch (error) {
      logger.error("Login error:", error);
      throw error;
    }
  }
}
