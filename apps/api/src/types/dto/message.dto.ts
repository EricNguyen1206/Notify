import { IsString, IsOptional, IsNumber } from "class-validator";

export class SendMessageDto {
  @IsString()
  conversationId!: string;

  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsString()
  fileName?: string;
}

export class GetMessagesDto {
  @IsOptional()
  @IsNumber()
  limit?: number;

  @IsOptional()
  @IsNumber()
  before?: number;
}
