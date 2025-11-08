export interface UserResponse {
  id: number;
  username: string;
  email: string;
  avatar?: string;
  createdAt: Date;
}

export interface LoginResponse {
  token: string;
  user: UserResponse;
}

export interface ErrorResponse {
  code: number;
  message: string;
  details?: string;
}
