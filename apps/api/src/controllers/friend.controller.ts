import { Response } from "express";
import { FriendService } from "@/services/friend.service";
import { AuthenticatedRequest } from "@/middleware/auth/auth.middleware";
import { logger } from "@/utils/logger";

export class FriendController {
  private friendService: FriendService;

  constructor() {
    this.friendService = new FriendService();
  }

  /**
   * Send a friend request
   * POST /api/v1/friends/requests
   */
  public sendFriendRequest = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.userId!;
      const { toUserId } = req.body;

      const friendRequest = await this.friendService.sendFriendRequest(userId, toUserId);

      res.status(201).json({
        success: true,
        data: friendRequest,
        message: "Friend request sent successfully",
      });
    } catch (error: any) {
      logger.error("Send friend request error:", error);

      if (error.message.includes("cannot send a friend request to yourself")) {
        res.status(400).json({
          success: false,
          message: error.message,
        });
        return;
      }

      if (error.message.includes("already") || error.message.includes("already sent")) {
        res.status(400).json({
          success: false,
          message: error.message,
        });
        return;
      }

      if (error.message.includes("not found")) {
        res.status(404).json({
          success: false,
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: "Failed to send friend request",
        details: error.message,
      });
    }
  };

  /**
   * Accept a friend request
   * POST /api/v1/friends/requests/:requestId/accept
   */
  public acceptFriendRequest = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.userId!;
      const { requestId } = req.params;

      if (!requestId) {
        res.status(400).json({
          success: false,
          message: "Request ID is required",
        });
        return;
      }

      const friendship = await this.friendService.acceptFriendRequest(requestId, userId);

      res.status(200).json({
        success: true,
        data: friendship,
        message: "Friend request accepted successfully",
      });
    } catch (error: any) {
      logger.error("Accept friend request error:", error);

      if (error.message.includes("not found")) {
        res.status(404).json({
          success: false,
          message: error.message,
        });
        return;
      }

      if (error.message.includes("not authorized") || error.message.includes("already")) {
        res.status(400).json({
          success: false,
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: "Failed to accept friend request",
        details: error.message,
      });
    }
  };

  /**
   * Decline a friend request
   * POST /api/v1/friends/requests/:requestId/decline
   */
  public declineFriendRequest = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.userId!;
      const { requestId } = req.params;

      if (!requestId) {
        res.status(400).json({
          success: false,
          message: "Request ID is required",
        });
        return;
      }

      await this.friendService.declineFriendRequest(requestId, userId);

      res.status(200).json({
        success: true,
        message: "Friend request declined successfully",
      });
    } catch (error: any) {
      logger.error("Decline friend request error:", error);

      if (error.message.includes("not found")) {
        res.status(404).json({
          success: false,
          message: error.message,
        });
        return;
      }

      if (error.message.includes("not authorized") || error.message.includes("already")) {
        res.status(400).json({
          success: false,
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: "Failed to decline friend request",
        details: error.message,
      });
    }
  };

  /**
   * Get all friend requests (sent and received)
   * GET /api/v1/friends/requests
   */
  public getFriendRequests = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.userId!;

      const requests = await this.friendService.getFriendRequests(userId);

      res.status(200).json({
        success: true,
        data: requests,
      });
    } catch (error: any) {
      logger.error("Get friend requests error:", error);

      res.status(500).json({
        success: false,
        message: "Failed to get friend requests",
        details: error.message,
      });
    }
  };

  /**
   * Get all friends
   * GET /api/v1/friends
   */
  public getFriends = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.userId!;

      const friends = await this.friendService.getFriends(userId);

      res.status(200).json({
        success: true,
        data: friends,
      });
    } catch (error: any) {
      logger.error("Get friends error:", error);

      res.status(500).json({
        success: false,
        message: "Failed to get friends",
        details: error.message,
      });
    }
  };
}
