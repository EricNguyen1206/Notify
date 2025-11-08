import { Request, Response } from "express";
import { AuthService } from "@/services/auth/auth.service";
import { AuthenticatedRequest } from "@/middleware/auth/auth.middleware";
import { logger } from "@/utils/logger";

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  public register = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.authService.register(req.body);
      res.status(201).json(result);
    } catch (error: any) {
      logger.error("Registration failed:", error);

      if (error.message === "Email already exists") {
        res.status(409).json({
          code: 409,
          message: "Email already exists",
          details: "A user with this email already exists",
        });
        return;
      }

      res.status(500).json({
        code: 500,
        message: "Registration failed",
        details: "An unexpected error occurred",
      });
    }
  };

  public login = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.authService.login(req.body);
      res.status(200).json(result);
    } catch (error: any) {
      logger.error("Login failed:", error);

      res.status(401).json({
        code: 401,
        message: "Unauthorized",
        details: "Invalid credentials",
      });
    }
  };

  public refresh = async (req: Request, res: Response): Promise<void> => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({
          code: 400,
          message: "Bad Request",
          details: "Refresh token is required",
        });
        return;
      }

      const result = await this.authService.refreshToken(refreshToken);
      res.status(200).json(result);
    } catch (error: any) {
      logger.error("Refresh token failed:", error);

      res.status(401).json({
        code: 401,
        message: "Unauthorized",
        details: error.message || "Invalid or expired refresh token",
      });
    }
  };

  public logout = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { refreshToken } = req.body;
      const userId = req.userId;

      if (!refreshToken) {
        res.status(400).json({
          code: 400,
          message: "Bad Request",
          details: "Refresh token is required",
        });
        return;
      }

      if (!userId) {
        res.status(401).json({
          code: 401,
          message: "Unauthorized",
          details: "User not authenticated",
        });
        return;
      }

      await this.authService.logout(refreshToken, userId);
      res.status(200).json({
        code: 200,
        message: "Logged out successfully",
      });
    } catch (error: any) {
      logger.error("Logout failed:", error);

      res.status(500).json({
        code: 500,
        message: "Logout failed",
        details: "An unexpected error occurred",
      });
    }
  };
}
