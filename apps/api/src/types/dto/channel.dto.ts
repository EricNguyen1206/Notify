import { IsString, IsEnum, IsArray, IsNumber, Min, Max } from "class-validator";
import { ChannelType } from "@/entities/Channel";

export class CreateChannelDto {
  @IsString()
  name?: string;

  @IsEnum(ChannelType)
  type: ChannelType;

  @IsArray()
  @IsNumber({}, { each: true })
  @Min(2, { message: "At least 2 users must be selected" })
  @Max(4, { message: "Maximum 4 users allowed" })
  userIds: number[];
}

export class UpdateChannelDto {
  @IsString()
  name: string;
}

export class AddUserToChannelDto {
  @IsNumber()
  userId: number;
}

export class RemoveUserFromChannelDto {
  @IsNumber()
  userId: number;
}
