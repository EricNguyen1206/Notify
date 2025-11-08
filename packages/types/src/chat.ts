import { UserType } from './user';

// Chat/Message Types
export enum ChatType {
  DIRECT = "direct",
  CHANNEL = "group",
}

export interface ChatResponse {
  id: number;
  type: ChatType;
  senderId: number;
  senderName: string;
  senderAvatar?: string;
  text?: string;
  url?: string;
  fileName?: string;
  createdAt: Date;
  receiverId?: number;
  channelId?: number;
}

export interface PaginatedChatResponse {
  items: ChatResponse[];
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

export interface ChannelMessageChatType {
  id?: string;
  user: UserType | any;
  channelId?: string;
  text: string;
  type?: string;
  provider?: string;
  url?: string;
  fileName?: string;
  sended?: string;
}

