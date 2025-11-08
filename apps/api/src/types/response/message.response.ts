import { ChatType } from "@/entities/Chat";

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
