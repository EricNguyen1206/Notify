import { IsEmail, IsString, MinLength, MaxLength } from "class-validator";

export class RegisterDto {
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

export class UpdateProfileDto {
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  username?: string;

  @IsString()
  avatar?: string;

  @IsString()
  @MinLength(6)
  password?: string;

  @IsString()
  currentPassword: string;
}
