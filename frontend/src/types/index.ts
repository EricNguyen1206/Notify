export interface ServerType {
  id: string;
  name: string;
  icon?: string;
  ownerId: string;
  channels: ChannelType[];
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
export interface ChannelType {
  id: string;
  name: string;
  type: 'text' | 'voice';
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
