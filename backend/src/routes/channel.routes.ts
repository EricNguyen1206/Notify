import { Router } from "express";
import { ChannelController } from "@/controllers/channel/channel.controller";
import { validateDto } from "@/middleware/validation/validation.middleware";
import {
  CreateChannelDto,
  UpdateChannelDto,
  AddUserToChannelDto,
  RemoveUserFromChannelDto,
} from "@/types/dto/channel.dto";

const router = Router();
const channelController = new ChannelController();

// GET /api/v1/channels
router.get("/", channelController.getUserChannels);

// POST /api/v1/channels
router.post("/", validateDto(CreateChannelDto), channelController.createChannel);

// GET /api/v1/channels/:id
router.get("/:id", channelController.getChannelById);

// PUT /api/v1/channels/:id
router.put("/:id", validateDto(UpdateChannelDto), channelController.updateChannel);

// DELETE /api/v1/channels/:id
router.delete("/:id", channelController.deleteChannel);

// POST /api/v1/channels/:id/user
router.post("/:id/user", validateDto(AddUserToChannelDto), channelController.addUserToChannel);

// PUT /api/v1/channels/:id/user
router.put("/:id/user", channelController.leaveChannel);

// DELETE /api/v1/channels/:id/user
router.delete("/:id/user", validateDto(RemoveUserFromChannelDto), channelController.removeUserFromChannel);

export { router as channelRoutes };
