import { UserDto } from "./user";

// Conversation Types
export enum ConversationType {
  DIRECT = "direct",
  GROUP = "group",
}

export interface ConversationDto {
  id: string;
  name: string;
  avatar?: string;
  type: ConversationType;
  ownerId: string;
  createdAt: Date;
}

export interface ConversationDetailDto extends ConversationDto {
  members: UserDto[];
}

export interface ConversationListDto {
  direct: ConversationDto[];
  group: ConversationDto[];
}
