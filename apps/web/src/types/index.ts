export interface ServerType {
  id: string;
  name: string;
  icon?: string;
  ownerId: string;
  conversations: ConversationType[];
}

export interface UserType {
  id?: string;
  name?: string;
  email?: string;
  password?: string | null;
  avatar?: string | null;
  provider?: string;
  created?: Date | string;
  isAdmin?: boolean;
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
export interface ConversationType {
  id: string;
  name: string;
  type: 'text' | 'voice';
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
