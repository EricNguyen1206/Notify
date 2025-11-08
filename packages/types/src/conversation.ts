import { UserResponse } from './user';

// Conversation Types
export enum ConversationType {
  DIRECT = "direct",
  GROUP = "group",
}

export interface Conversation {
  id: number | string;
  name: string;
  type: ConversationType | 'text' | 'voice';
  ownerId: number;
  createdAt?: Date;
}

export interface ConversationResponse {
  id: number;
  name: string;
  type: ConversationType;
  ownerId: number;
}

export interface DirectConversationResponse {
  id: number;
  name: string;
  avatar?: string;
  type: ConversationType;
  ownerId: number;
}

export interface ConversationDetailResponse {
  id: number;
  name: string;
  type: ConversationType;
  ownerId: number;
  createdAt: Date;
  members: UserResponse[];
}

export interface UserConversationsResponse {
  direct: DirectConversationResponse[];
  group: ConversationResponse[];
}

