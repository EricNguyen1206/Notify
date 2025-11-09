import { IsString, IsUUID, IsNotEmpty } from "class-validator";

export class SendFriendRequestDto {
  @IsString()
  @IsUUID()
  @IsNotEmpty()
  toUserId!: string;
}

export class AcceptFriendRequestDto {
  @IsString()
  @IsUUID()
  @IsNotEmpty()
  requestId!: string;
}

export class DeclineFriendRequestDto {
  @IsString()
  @IsUUID()
  @IsNotEmpty()
  requestId!: string;
}

