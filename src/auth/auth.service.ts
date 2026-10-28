import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { AccountType } from '../users/enums/account-type.enum.js';
import { Employee } from '../employees/entities/employee.entity.js';
import { Role } from '../roles/entities/role.entity.js';
import { EmailVerificationService } from './email-verification/services/email-verification.service.js';
import { PasswordResetService } from './password-reset/services/password-reset.service.js';
import { AuthResponseDto } from './dto/auth-response.dto.js';
import { MeResponseDto } from './dto/me-response.dto.js';
import { TokenService } from './token.service.js';
import { RefreshTokenService } from './refresh-token/services/refresh-token.service.js';
import { RefreshRequestDto } from './refresh-token/dto/refresh-request.dto.js';
import { ForgotPasswordDto } from './password-reset/dto/forgot-password.dto.js';
import { ResetPasswordDto } from './password-reset/dto/reset-password.dto.js';
import { ResendVerificationDto } from './email-verification/dto/resend-verification.dto.js';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    private readonly dataSource: DataSource,
    private readonly emailVerificationService: EmailVerificationService,
    private readonly passwordResetService: PasswordResetService,
    private readonly tokenService: TokenService,
    private readonly refreshTokenService: RefreshTokenService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException(
        'An account with this email already exists. Please sign in or reset your password.',
      );
    }

    // Find the Hotel Manager role (needed to create the Employee record)
    const managerRole = await this.roleRepository.findOne({
      where: { name: 'Hotel Manager' },
    });

    if (!managerRole) {
      throw new BadRequestException(
        'Manager role not found. Please contact support.',
      );
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const newUser = await this.dataSource.transaction(async (manager) => {
      const userRepository = manager.getRepository(User);
      const employeeRepository = manager.getRepository(Employee);

      const createdUser = userRepository.create({
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        email: registerDto.email,
        phone: registerDto.phone ?? null,
        password: hashedPassword,
        accountType: AccountType.HOTEL_EMPLOYEE,
        emailVerifiedAt: null,
        createdBy: null,
        updatedBy: null,
      });
      await userRepository.save(createdUser);

      // Employee with NO hotel yet — will be attached during /onboarding
      const employee = employeeRepository.create({
        userId: createdUser.id,
        hotelId: null,
        roleId: managerRole.id,
        invitedByUserId: null,
        invitedAt: null,
        createdBy: createdUser.id,
        updatedBy: createdUser.id,
      });
      await employeeRepository.save(employee);

      return createdUser;
    });

    try {
      await this.emailVerificationService.createAndSendVerificationToken(
        newUser,
      );
    } catch (error) {
      console.error('Verification email failed on register:', error);
    }

    return {
      message:
        'Account created successfully. We sent a verification link to your email.',
      email: newUser.email,
    };
  }

  async verifyEmail(rawToken: string) {
    const user = await this.emailVerificationService.verifyEmail(rawToken);
    return this.createAuthResponse(user);
  }

  async resendVerificationEmail(dto: ResendVerificationDto) {
    return this.emailVerificationService.resendVerificationEmail(dto.email);
  }

  async login(loginDto: LoginDto) {
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.emailVerifiedAt) {
      throw new UnauthorizedException({
        statusCode: 401,
        error: 'EMAIL_NOT_VERIFIED',
        message:
          'Please verify your email address before signing in. Check your inbox for the verification link.',
        email: user.email,
      });
    }

    user.lastLoginAt = new Date();
    await this.userRepository.save(user);

    return this.createAuthResponse(user);
  }

  async refreshAccessToken(
    refreshRequestDto: RefreshRequestDto,
  ): Promise<AuthResponseDto> {
    const storedToken = await this.refreshTokenService.validateRefreshToken(
      refreshRequestDto.refreshToken,
    );

    const user = storedToken.user;
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const accessToken = await this.tokenService.generateAccessToken(user);
    const expiresIn = this.tokenService.getAccessTokenExpiresInSeconds();

    const employee = await this.employeeRepository.findOne({
      where: { user: { id: user.id } },
      relations: { hotel: true, role: true },
    });

    return AuthResponseDto.from(
      accessToken,
      refreshRequestDto.refreshToken,
      expiresIn,
      user,
      employee,
    );
  }

  async logout(userId: string): Promise<void> {
    await this.refreshTokenService.deleteByUser(userId);
  }

  async getMe(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const employee = await this.employeeRepository.findOne({
      where: { user: { id: user.id } },
      relations: { role: true, hotel: true },
    });

    return MeResponseDto.from(user, employee);
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    return this.passwordResetService.sendResetLink(dto.email);
  }

  async resetPassword(dto: ResetPasswordDto) {
    return this.passwordResetService.resetPassword(
      dto.token,
      dto.password,
      dto.confirmPassword,
    );
  }

  private async createAuthResponse(user: User) {
    const accessToken = await this.tokenService.generateAccessToken(user);
    const refreshToken =
      await this.refreshTokenService.createRefreshToken(user);
    const expiresIn = this.tokenService.getAccessTokenExpiresInSeconds();

    const employee = await this.employeeRepository.findOne({
      where: { user: { id: user.id } },
      relations: { hotel: true, role: true },
    });

    return AuthResponseDto.from(
      accessToken,
      refreshToken,
      expiresIn,
      user,
      employee,
    );
  }
}