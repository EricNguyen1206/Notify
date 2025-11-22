import { Router } from 'express';
import { AuthController } from '@/controllers/auth.controller';
import { validateDto } from '@/middleware/validation/validation.middleware';
import { authenticateToken } from '@/middleware/auth/auth.middleware';
import { SignupRequestDto, LoginDto } from '@notify/validators';

const router = Router();
const authController = new AuthController();

// POST /api/v1/auth/signup
router.post('/signup', validateDto(SignupRequestDto), authController.signup);

// POST /api/v1/auth/signin
router.post('/signin', validateDto(LoginDto), authController.signin);

// POST /api/v1/auth/refresh
router.post('/refresh', authController.refresh);

// POST /api/v1/auth/signout
router.post('/signout', authenticateToken, authController.signout);

export { router as authRoutes };
