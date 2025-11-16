import { ApiMessageResponse, ApiResponse } from "./common";
import { UserResponse } from "./user";

// Conversation Types
export enum ConversationType {
  DIRECT = "direct",
  GROUP = "group",
}

export interface Conversation {
  id: string;
  name: string;
  type: ConversationType;
  ownerId: string;
  createdAt?: Date;
}

export interface ConversationResponse {
  id: string;
  name: string;
  type: ConversationType;
  ownerId: string;
}

export interface DirectConversationResponse {
  id: string;
  name: string;
  avatar?: string;
  type: ConversationType;
  ownerId: string;
}

export interface ConversationDetailResponse {
  id: string;
  name: string;
  type: ConversationType;
  ownerId: string;
  createdAt: Date;
  members: UserResponse[];
}

export interface UserConversationsResponse {
  direct: DirectConversationResponse[];
  group: ConversationResponse[];
}

export interface CreateConversationRequest {
  name?: string;
  type: ConversationType;
  userIds: string[];
}

export interface UpdateConversationRequest {
  name: string;
}

export interface ConversationMembershipRequest {
  userId: string;
}

export type ConversationListApiResponse = ApiResponse<UserConversationsResponse>;
export type ConversationDetailApiResponse = ApiResponse<ConversationDetailResponse>;
export type ConversationMutationResponse = ApiResponse<ConversationResponse>;
export type ConversationMessageResponse = ApiMessageResponse;
