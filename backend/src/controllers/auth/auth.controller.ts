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
}
