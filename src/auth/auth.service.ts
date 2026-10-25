import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { AccountType } from '../users/enums/account-type.enum.js';
import {Employee} from "../employees/entities/employee.entity.js";
import {EmailVerificationService} from "./email-verification/services/email-verification.service.js";
import { AuthResponseDto } from './dto/auth-response.dto.js';
import { MeResponseDto } from './dto/me-response.dto.js';
import {TokenService} from "./token.service.js";
import {RefreshTokenService} from "./refresh-token/services/refresh-token.service.js";
import {RefreshRequestDto} from "./refresh-token/dto/refresh-request.dto.js";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    private readonly emailVerificationService: EmailVerificationService,
    private readonly tokenService: TokenService,
    private readonly refreshTokenService: RefreshTokenService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const newUser = this.userRepository.create({
      ...registerDto,
      password: hashedPassword,
      accountType: AccountType.HOTEL_EMPLOYEE,
      emailVerifiedAt: null,
    });

    await this.userRepository.save(newUser);
    await this.emailVerificationService.createAndSendVerificationToken(newUser);

    return {
      message:
        'Account created successfully. Please check your email to verify your account.',
    };
  }

  async verifyEmail(rawToken: string) {
    const user = await this.emailVerificationService.verifyEmail(rawToken);
    return this.createAuthResponse(user);
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
      throw new UnauthorizedException(
        'Please verify your email before logging in.',
      );
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

    return AuthResponseDto.from(
      accessToken,
      refreshRequestDto.refreshToken,
      expiresIn,
      user,
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
      where: {
        user: { id: user.id },
      },
      relations: {
        role: true,
        hotel: true,
      },
    });

    return MeResponseDto.from(user, employee);
  }

  private async createAuthResponse(user: User) {
    const accessToken = await this.tokenService.generateAccessToken(user);
    const refreshToken =
      await this.refreshTokenService.createRefreshToken(user);
    const expiresIn = this.tokenService.getAccessTokenExpiresInSeconds();

    return AuthResponseDto.from(accessToken, refreshToken, expiresIn, user);
  }
}
