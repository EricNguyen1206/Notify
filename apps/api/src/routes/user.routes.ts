import { Router } from "express";
import { UserController } from "@/controllers/user/user.controller";
import { validateDto } from "@/middleware/validation/validation.middleware";
import { UpdateProfileDto } from "@notify/validators";

const router = Router();
const userController = new UserController();

// GET /api/v1/users/profile
router.get("/profile", userController.getProfile);

// PUT /api/v1/users/profile
router.put("/profile", validateDto(UpdateProfileDto), userController.updateProfile);

// GET /api/v1/users/search
router.get("/search", userController.searchUsers);

export { router as userRoutes };
