// Friend Request Types
export enum FriendRequestStatus {
  PENDING = "pending",
  ACCEPTED = "accepted",
  DECLINED = "declined",
}

/**
 * User information included in friend request responses
 */
export interface FriendRequestUserInfo {
  id: string;
  username: string;
  email: string;
  avatar?: string;
}

/**
 * User information included in friend responses
 */
export interface FriendUserInfo {
  id: string;
  username: string;
  email: string;
  avatar?: string;
}

/**
 * Friend Request Response
 * Represents a friend request with optional user details
 */
export interface FriendRequestResponse {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: FriendRequestStatus;
  createdAt: Date;
  updatedAt: Date;
  fromUser?: FriendRequestUserInfo;
  toUser?: FriendRequestUserInfo;
}

/**
 * Friend Response
 * Represents a friendship relationship with optional friend details
 */
export interface FriendResponse {
  id: string;
  userId: string;
  friendId: string;
  createdAt: Date;
  updatedAt: Date;
  friend?: FriendUserInfo;
}

/**
 * Friend Requests List Response
 * Contains both sent and received friend requests
 */
export interface FriendRequestsResponse {
  sent: FriendRequestResponse[];
  received: FriendRequestResponse[];
}

/**
 * Friends List Response
 * Array of friend relationships
 */
export type FriendsListResponse = FriendResponse[];

// DTOs for friend request operations
export interface SendFriendRequestDto {
  toUserId: string;
}

export interface AcceptFriendRequestDto {
  requestId: string;
}

export interface DeclineFriendRequestDto {
  requestId: string;
}

// API Response types (matching controller responses)
export interface SendFriendRequestApiResponse {
  success: boolean;
  data: FriendRequestResponse;
  message: string;
}

export interface AcceptFriendRequestApiResponse {
  success: boolean;
  data: FriendResponse;
  message: string;
}

export interface DeclineFriendRequestApiResponse {
  success: boolean;
  message: string;
}

export interface GetFriendRequestsApiResponse {
  success: boolean;
  data: FriendRequestsResponse;
}

export interface GetFriendsApiResponse {
  success: boolean;
  data: FriendsListResponse;
}

