import { Request, Response } from "express";
import { AuthenticatedRequest } from "@/middleware/auth/auth.middleware";
import { logger } from "@/utils/logger";

export class MessageController {
  public getChannelMessages = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      // TODO: Implement get channel messages
      res.status(200).json({ items: [], total: 0 });
    } catch (error: any) {
      logger.error("Get channel messages failed:", error);
      res.status(500).json({
        code: 500,
        message: "Failed to get messages",
        details: "An unexpected error occurred",
      });
    }
  };
}
