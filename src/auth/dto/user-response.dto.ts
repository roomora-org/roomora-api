import { AccountType } from '../../users/enums/account-type.enum.js';
import { User } from '../../users/entities/user.entity.js';

export class UserResponseDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  accountType: AccountType;
  emailVerifiedAt: Date | null;

  static from(user: User): UserResponseDto {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      accountType: user.accountType,
      emailVerifiedAt: user.emailVerifiedAt,
    };
  }
}
