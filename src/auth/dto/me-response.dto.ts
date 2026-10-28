import { User } from '../../users/entities/user.entity.js';
import { Employee } from '../../employees/entities/employee.entity.js';
import { UserResponseDto } from './user-response.dto.js';

export class MeResponseDto extends UserResponseDto {
  static from(user: User, employee: Employee | null): MeResponseDto {
    return {
      ...UserResponseDto.from(user, employee),
    };
  }
}