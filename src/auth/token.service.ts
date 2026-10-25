import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User } from '../users/entities/user.entity.js';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async generateAccessToken(user: User): Promise<string> {
    return this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      accountType: user.accountType,
    });
  }

  getAccessTokenExpiresInSeconds(): number {
    const expiresIn = this.configService.getOrThrow<string>('jwt.expiresIn');

    return this.getExpiresInSeconds(expiresIn);
  }

  private getExpiresInSeconds(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)(s|m|h|d)$/);

    if (!match) {
      throw new Error('Invalid JWT_EXPIRES_IN format. Use 15m, 1h, or 1d.');
    }

    const value = Number(match[1]);

    const multipliers: Record<string, number> = {
      s: 1,
      m: 60,
      h: 3600,
      d: 86400,
    };

    return value * multipliers[match[2]];
  }
}
