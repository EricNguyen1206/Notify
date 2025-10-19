import { ChannelType } from "@/entities/Channel";
import { UserResponse } from "./auth.response";

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
