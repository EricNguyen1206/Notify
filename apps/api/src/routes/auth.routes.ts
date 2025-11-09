import { Router } from "express";
import { AuthController } from "@/controllers/auth.controller";
import { validateDto } from "@/middleware/validation/validation.middleware";
import { authenticateToken } from "@/middleware/auth/auth.middleware";
import { RegisterDto, LoginDto } from "@notify/validators";

const router = Router();
const authController = new AuthController();

// POST /api/v1/auth/register
router.post("/register", validateDto(RegisterDto), authController.register);

// POST /api/v1/auth/login
router.post("/login", validateDto(LoginDto), authController.login);

// POST /api/v1/auth/refresh
router.post("/refresh", authController.refresh);

// POST /api/v1/auth/logout
router.post("/logout", authenticateToken, authController.logout);

export { router as authRoutes };
