import { User } from '../../users/entities/user.entity.js';
import { Employee } from '../../employees/entities/employee.entity.js';
import { UserResponseDto } from './user-response.dto.js';

export class MeResponseDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  accountType: UserResponseDto['accountType'];
  emailVerifiedAt: Date | null;

  employee: {
    id: string;
    role: {
      id: string;
      name: string;
    };
    hotel: {
      id: string;
      name: string;
      status: string;
    };
  } | null;

  static from(user: User, employee: Employee | null): MeResponseDto {
    return {
      ...UserResponseDto.from(user),

      employee: employee
        ? {
            id: employee.id,
            role: {
              id: employee.role.id,
              name: employee.role.name,
            },
            hotel: {
              id: employee.hotel.id,
              name: employee.hotel.name,
              status: employee.hotel.status,
            },
          }
        : null,
    };
  }
}
