import { UserResponse } from './user';

// Auth Types
// Note: Tokens are now in httpOnly cookies, not in response body
export interface SigninResponse {
  success: boolean;
  data: UserResponse;
}

export interface RefreshTokenResponse {
  success: boolean;
  message: string;
}

export interface ErrorResponse {
  code: number;
  message: string;
  details?: string;
}

export interface SigninRequest {
  email: string;
  password: string;
}

// Keep LoginRequest for backward compatibility (deprecated)
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

