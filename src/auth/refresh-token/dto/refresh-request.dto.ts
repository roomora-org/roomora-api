import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshRequestDto {
  @IsString()
  @IsNotEmpty({ message: 'Refresh token is required.' })
  refreshToken: string;
}
