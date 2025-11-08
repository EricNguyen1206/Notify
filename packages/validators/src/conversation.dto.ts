import { IsString, IsEnum, IsArray, IsNumber, Min, Max } from "class-validator";
import { ConversationType } from "@notify/types";

export class CreateConversationDto {
  @IsString()
  name?: string;

  @IsEnum(ConversationType)
  type: ConversationType;

  @IsArray()
  @IsNumber({}, { each: true })
  @Min(2, { message: "At least 2 users must be selected" })
  @Max(4, { message: "Maximum 4 users allowed" })
  userIds: number[];
}

export class UpdateConversationDto {
  @IsString()
  name: string;
}

export class AddUserToConversationDto {
  @IsNumber()
  userId: number;
}

export class RemoveUserFromConversationDto {
  @IsNumber()
  userId: number;
}

