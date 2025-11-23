import { IsString, IsOptional, IsNumber, IsDefined, IsUUID } from "class-validator";

export class SendMessageRequestDto {
  @IsString()
  @IsDefined()
  @IsUUID()
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

export class GetMessagesQueryDto {
  @IsOptional()
  @IsNumber()
  limit?: number;

  @IsOptional()
  @IsNumber()
  offset?: number;
}
