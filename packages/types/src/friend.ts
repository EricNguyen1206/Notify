import { UserDto } from "./user";
/**
 * Friend Response
 * Represents a friendship relationship with optional friend details
 */
export interface FriendDto {
  userId: string;
  friendId: string;
  createdAt: Date;
  updatedAt: Date;
  user?: UserDto;
  friend?: UserDto;
}

// Friend Request Types
export enum FriendRequestStatus {
  PENDING = "pending",
  ACCEPTED = "accepted",
  DECLINED = "declined",
}

/**
 * Friend Request Response
 * Represents a friend request with optional user details
 */
export interface FriendRequestDto {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: FriendRequestStatus;
  createdAt: Date;
  updatedAt: Date;
  fromUser?: UserDto;
  toUser?: UserDto;
}

/**
 * Friend Requests List Response
 * Contains both sent and received friend requests
 */
export interface FriendRequestsResponse {
  sent: FriendRequestDto[];
  received: FriendRequestDto[];
}
