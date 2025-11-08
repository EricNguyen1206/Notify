import { UserResponse } from './user';

// Auth Types
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: UserResponse;
}

export interface RefreshTokenResponse {
  accessToken: string;
}

export interface ErrorResponse {
  code: number;
  message: string;
  details?: string;
}

