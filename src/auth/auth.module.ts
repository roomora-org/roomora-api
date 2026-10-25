import { Module } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { User } from '../users/entities/user.entity.js';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TokenService } from './token.service.js';
import { Employee } from '../employees/entities/employee.entity.js';
import { EmailVerificationToken } from './email-verification/entities/email-verification-token.entity.js';
import { EmailVerificationService } from './email-verification/services/email-verification.service.js';
import { RefreshToken } from './refresh-token/entities/refresh-token.entity.js';
import { RefreshTokenService } from './refresh-token/services/refresh-token.service.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';

@Module({
  imports: [
    PassportModule,
    TypeOrmModule.forFeature([
      User,
      Employee,
      EmailVerificationToken,
      RefreshToken,
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('jwt.secret'),
        signOptions: {
          expiresIn: configService.getOrThrow<string>('jwt.expiresIn') as '15m' | '1d',
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    TokenService,
    EmailVerificationService,
    RefreshTokenService,
    JwtStrategy
  ],
  exports: [AuthService, TokenService],
})
export class AuthModule {}
