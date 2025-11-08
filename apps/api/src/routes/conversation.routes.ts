import { Router } from "express";
import { ConversationController } from "@/controllers/conversation/conversation.controller";
import { validateDto } from "@/middleware/validation/validation.middleware";
import {
  CreateConversationDto,
  UpdateConversationDto,
  AddUserToConversationDto,
  RemoveUserFromConversationDto,
} from "@notify/validators";

const router = Router();
const conversationController = new ConversationController();

// GET /api/v1/conversations
router.get("/", conversationController.getUserConversations);

// POST /api/v1/conversations
router.post("/", validateDto(CreateConversationDto), conversationController.createConversation);

// GET /api/v1/conversations/:id
router.get("/:id", conversationController.getConversationById);

// PUT /api/v1/conversations/:id
router.put("/:id", validateDto(UpdateConversationDto), conversationController.updateConversation);

// DELETE /api/v1/conversations/:id
router.delete("/:id", conversationController.deleteConversation);

// POST /api/v1/conversations/:id/user
router.post("/:id/user", validateDto(AddUserToConversationDto), conversationController.addUserToConversation);

// PUT /api/v1/conversations/:id/user
router.put("/:id/user", conversationController.leaveConversation);

// DELETE /api/v1/conversations/:id/user
router.delete("/:id/user", validateDto(RemoveUserFromConversationDto), conversationController.removeUserFromConversation);

export { router as conversationRoutes };

