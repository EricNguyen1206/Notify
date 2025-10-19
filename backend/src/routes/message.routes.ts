import { Router } from "express";
import { MessageController } from "@/controllers/message/message.controller";

const router = Router();
const messageController = new MessageController();

// GET /api/v1/messages/channel/:id
router.get("/channel/:id", messageController.getChannelMessages);

export { router as messageRoutes };
