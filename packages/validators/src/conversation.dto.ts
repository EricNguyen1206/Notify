import { IsString, IsEnum, IsArray, IsUUID } from "class-validator";
import { ConversationType } from "@notify/types";

export class CreateConversationRequestDto {
  @IsString()
  name: string;

  @IsString()
  avatar?: string;

  @IsEnum(ConversationType)
  type: ConversationType;

  @IsArray()
  @IsString()
  @IsUUID("4", { each: true })
  userIds: string[];
}

export class UpdateConversationRequestDto {
  @IsString()
  name: string;

  @IsString()
  avatar?: string;
}

export class ConversationMembershipRequest {
  @IsString()
  @IsUUID("4", { each: true })
  userId: string;
}
