import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class VerifyEmailDto {
  @IsString()
  @IsNotEmpty()
  @Length(64, 64)
  @Matches(/^[a-fA-F0-9]{64}$/)
  token: string;
}
