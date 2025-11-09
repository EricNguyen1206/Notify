// Shared User Types
export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  createdAt: Date;
}

export interface UserType {
  id?: string;
  name?: string;
  username?: string;
  email?: string;
  password?: string | null;
  avatar?: string | null;
  provider?: string;
  created?: Date | string;
  createdAt?: Date;
  isAdmin?: boolean;
}

export interface UserResponse {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  createdAt: Date;
}
