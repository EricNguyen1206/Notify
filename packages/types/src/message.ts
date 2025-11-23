export interface MessageDto {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  conversationId: string;
  text?: string | null;
  url?: string | null;
  fileName?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}
