import { Request, Response } from 'express';
import { AuthService } from '@/services/auth.service';
import { AuthenticatedRequest } from '@/middleware/auth.middleware';
import { logger } from '@/utils/logger';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  public signup = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.authService.signup(req.body);
      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error('Signup failed:', error);

      if (error.message === 'Email already exists') {
        res.status(409).json({
          code: 409,
          message: 'Email already exists',
          details: 'A user with this email already exists',
        });
        return;
      }

      res.status(500).json({
        code: 500,
        message: 'Signup failed',
        details: 'An unexpected error occurred',
      });
    }
  };

  public signin = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.authService.signin(req.body);

      // Set access token as httpOnly cookie
      const isProduction = process.env['NODE_ENV'] === 'production';
      const cookieOptions = {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax' as const,
        maxAge: 15 * 60 * 1000, // 15 minutes (matches JWT access token expiry)
        path: '/',
      };

      res.cookie('accessToken', result.accessToken, cookieOptions);

      // Set refresh token as httpOnly cookie
      res.cookie('refreshToken', result.refreshToken, {
        ...cookieOptions,
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });

      // Return only user data (tokens are in cookies)
      res.status(200).json({
        success: true,
        data: result.user,
      });
    } catch (error: any) {
      logger.error('Signin failed:', error);

      res.status(401).json({
        code: 401,
        message: 'Unauthorized',
        details: 'Invalid credentials',
      });
    }
  };

  public refresh = async (req: Request, res: Response): Promise<void> => {
    try {
      // Read refresh token from httpOnly cookie
      const refreshToken = req.cookies?.['refreshToken'];

      if (!refreshToken) {
        res.status(400).json({
          code: 400,
          message: 'Bad Request',
          details: 'Refresh token is required in cookie',
        });
        return;
      }

      const result = await this.authService.refreshToken(refreshToken);

      // Set new access token as httpOnly cookie
      const isProduction = process.env['NODE_ENV'] === 'production';
      res.cookie('accessToken', result.accessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax' as const,
        maxAge: 15 * 60 * 1000, // 15 minutes
        path: '/',
      });

      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
      });
    } catch (error: any) {
      logger.error('Refresh token failed:', error);

      res.status(401).json({
        code: 401,
        message: 'Unauthorized',
        details: error.message || 'Invalid or expired refresh token',
      });
    }
  };

  public signout = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      // Read refresh token from httpOnly cookie
      const refreshToken = req.cookies?.['refreshToken'];
      const userId = req.userId;

      if (!refreshToken) {
        res.status(400).json({
          code: 400,
          message: 'Bad Request',
          details: 'Refresh token is required in cookie',
        });
        return;
      }

      if (!userId) {
        res.status(401).json({
          code: 401,
          message: 'Unauthorized',
          details: 'User not authenticated',
        });
        return;
      }

      await this.authService.signout(refreshToken, userId);

      // Clear access token cookie
      res.clearCookie('accessToken', {
        httpOnly: true,
        secure: process.env['NODE_ENV'] === 'production',
        sameSite: 'lax',
        path: '/',
      });

      // Clear refresh token cookie
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env['NODE_ENV'] === 'production',
        sameSite: 'lax',
        path: '/',
      });

      res.status(200).json({
        success: true,
        message: 'Signed out successfully',
      });
    } catch (error: any) {
      logger.error('Signout failed:', error);

      res.status(500).json({
        code: 500,
        message: 'Signout failed',
        details: 'An unexpected error occurred',
      });
    }
  };
}
