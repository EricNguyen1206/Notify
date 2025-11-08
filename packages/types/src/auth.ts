import { UserResponse } from './user';

// Auth Types
export interface LoginResponse {
  token: string;
  user: UserResponse;
}

export interface ErrorResponse {
  code: number;
  message: string;
  details?: string;
}

