import { Router } from "express";
import { MessageController } from "@/controllers/message/message.controller";
import { validateDto } from "@/middleware/validation/validation.middleware";
import { SendMessageDto, GetMessagesDto } from "@/types/dto/message.dto";

const router = Router();
const messageController = new MessageController();

// Get channel messages
router.get("/channel/:id", messageController.getChannelMessages.bind(messageController));

// Create message
router.post("/", validateDto(SendMessageDto), messageController.createMessage.bind(messageController));

// Get friend messages
router.get("/friend/:friendId", messageController.getFriendMessages.bind(messageController));

// Get message by ID
router.get("/:id", messageController.getMessageById.bind(messageController));

// Delete message
router.delete("/:id", messageController.deleteMessage.bind(messageController));

export default router;
