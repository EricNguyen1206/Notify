import { Router } from "express";
import { FriendController } from "@/controllers/friend.controller";
import { validateDto } from "@/middleware/validation/validation.middleware";
import { SendFriendRequestDto } from "@notify/validators";

const router = Router();
const friendController = new FriendController();

// GET /api/v1/friends - Get all friends
router.get("/", friendController.getFriends);

// GET /api/v1/friends/requests - Get all friend requests (sent and received)
router.get("/requests", friendController.getFriendRequests);

// POST /api/v1/friends/requests - Send a friend request
router.post("/requests", validateDto(SendFriendRequestDto), friendController.sendFriendRequest);

// POST /api/v1/friends/requests/:requestId/accept - Accept a friend request
router.post("/requests/:requestId/accept", friendController.acceptFriendRequest);

// POST /api/v1/friends/requests/:requestId/decline - Decline a friend request
router.post("/requests/:requestId/decline", friendController.declineFriendRequest);

export { router as friendRoutes };

