import { Router } from "express";
import { AuthController } from "@/controllers/auth/auth.controller";
import { validateDto } from "@/middleware/validation/validation.middleware";
import { RegisterDto, LoginDto } from "@/types/dto/auth.dto";

const router = Router();
const authController = new AuthController();

// POST /api/v1/auth/register
router.post("/register", validateDto(RegisterDto), authController.register);

// POST /api/v1/auth/login
router.post("/login", validateDto(LoginDto), authController.login);

export { router as authRoutes };
