import { User } from '../../users/entities/user.entity.js';
import { Employee } from '../../employees/entities/employee.entity.js';
import { UserResponseDto } from './user-response.dto.js';

export class AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  user: UserResponseDto;
  onboardingCompleted: boolean;

  static from(
    accessToken: string,
    refreshToken: string,
    expiresIn: number,
    user: User,
    employee: Employee | null,
  ): AuthResponseDto {
    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn,
      user: UserResponseDto.from(user, employee),
      onboardingCompleted: !!employee?.hotel,
    };
  }
}