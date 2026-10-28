import { IsNotEmpty, IsString, Length, Matches, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  @Length(64, 64)
  @Matches(/^[a-fA-F0-9]{64}$/, { message: 'Invalid reset token' })
  token: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'Please confirm your password' })
  confirmPassword: string;
}