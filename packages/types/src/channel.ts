import { UserResponse } from './user';

// Channel Types
export enum ChannelType {
  DIRECT = "direct",
  GROUP = "group",
}

export interface Channel {
  id: number | string;
  name: string;
  type: ChannelType | 'text' | 'voice';
  ownerId: number;
  createdAt?: Date;
}

export interface ChannelResponse {
  id: number;
  name: string;
  type: ChannelType;
  ownerId: number;
}

export interface DirectChannelResponse {
  id: number;
  name: string;
  avatar?: string;
  type: ChannelType;
  ownerId: number;
}

export interface ChannelDetailResponse {
  id: number;
  name: string;
  type: ChannelType;
  ownerId: number;
  createdAt: Date;
  members: UserResponse[];
}

export interface UserChannelsResponse {
  direct: DirectChannelResponse[];
  group: ChannelResponse[];
}

