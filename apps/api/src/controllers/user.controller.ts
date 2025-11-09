import { Response } from "express";
import { UserService } from "@/services/user.service";
import { AuthenticatedRequest } from "@/middleware/auth/auth.middleware";
import { logger } from "@/utils/logger";

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  public getProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const user = await this.userService.getProfile(req.userId!);
      res.status(200).json(user);
    } catch (error: any) {
      logger.error("Get profile failed:", error);

      res.status(500).json({
        code: 500,
        message: "Failed to get profile",
        details: "An unexpected error occurred",
      });
    }
  };

  public updateProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const user = await this.userService.updateProfile(req.userId!, req.body);
      res.status(200).json(user);
    } catch (error: any) {
      logger.error("Update profile failed:", error);

      if (error.message === "Current password is incorrect") {
        res.status(400).json({
          code: 400,
          message: "Bad Request",
          details: "Current password is incorrect",
        });
        return;
      }

      res.status(500).json({
        code: 500,
        message: "Failed to update profile",
        details: "An unexpected error occurred",
      });
    }
  };

  public searchUsers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { username } = req.query;
      if (!username || typeof username !== "string") {
        res.status(400).json({
          code: 400,
          message: "Bad Request",
          details: "Username query parameter is required",
        });
        return;
      }

      const users = await this.userService.searchUsers(username);
      res.status(200).json(users);
    } catch (error: any) {
      logger.error("Search users failed:", error);

      res.status(500).json({
        code: 500,
        message: "Failed to search users",
        details: "An unexpected error occurred",
      });
    }
  };
}
