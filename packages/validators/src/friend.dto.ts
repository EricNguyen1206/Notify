import { IsString, IsUUID, IsNotEmpty } from "class-validator";

export class SendFriendRequestApiRequestDto {
  @IsString()
  @IsUUID()
  @IsNotEmpty()
  toUserId!: string;
}

export class AcceptFriendRequestApiRequestDto {
  @IsString()
  @IsUUID()
  @IsNotEmpty()
  requestId!: string;
}

export class DeclineFriendRequestApiRequestDto {
  @IsString()
  @IsUUID()
  @IsNotEmpty()
  requestId!: string;
}
