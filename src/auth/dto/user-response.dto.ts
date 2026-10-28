import { AccountType } from '../../users/enums/account-type.enum.js';
import { User } from '../../users/entities/user.entity.js';
import { Employee } from '../../employees/entities/employee.entity.js';

export class UserResponseDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  accountType: AccountType;
  emailVerifiedAt: Date | null;
  employee: {
    id: string;
    role: { id: string; name: string };
    hotel: { id: string; name: string; status: string } | null;
  } | null;

  static from(user: User, employee: Employee | null = null): UserResponseDto {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      accountType: user.accountType,
      emailVerifiedAt: user.emailVerifiedAt,
      employee: employee
        ? {
            id: employee.id,
            role: {
              id: employee.role.id,
              name: employee.role.name,
            },
            // hotel can be null for a manager who hasn't completed onboarding yet
            hotel: employee.hotel
              ? {
                  id: employee.hotel.id,
                  name: employee.hotel.name,
                  status: employee.hotel.status,
                }
              : null,
          }
        : null,
    };
  }
}