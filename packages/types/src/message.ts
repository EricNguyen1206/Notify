import { UserType } from './user';

// Chat/Message Types
export enum MessageType {
  DIRECT = "direct",
  CHANNEL = "group",
}

export interface MessageResponse {
  id: number;
  type: MessageType;
  senderId: number;
  senderName: string;
  senderAvatar?: string;
  text?: string;
  url?: string;
  fileName?: string;
  createdAt: Date;
  receiverId?: number;
  conversationId?: number;
}

export interface PaginatedMessageResponse {
  items: MessageResponse[];
  total: number;
  nextCursor?: number;
}

export interface DirectMessageChatType {
  id?: number;
  user: UserType | any;
  userId?: number;
  friendId?: string;
  text: string;
  type?: string;
  provider?: string;
  url?: string;
  fileName?: string;
  sended?: string;
}

export interface ConversationMessageChatType {
  id?: string;
  user: UserType | any;
  conversationId?: string;
  text: string;
  type?: string;
  provider?: string;
  url?: string;
  fileName?: string;
  sended?: string;
}

