import { UserType } from "./user";

// Chat/Message Types
export enum MessageType {
  DIRECT = "direct",
  CHANNEL = "group",
}

export interface MessageResponse {
  id: string;
  type: MessageType;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  text?: string;
  url?: string;
  fileName?: string;
  createdAt: Date;
  receiverId?: string;
  conversationId?: string;
}

export interface PaginatedMessageResponse {
  items: MessageResponse[];
  total: number;
  nextCursor?: string;
}

export interface DirectMessageChatType {
  id?: string;
  user: UserType | any;
  userId?: string;
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
