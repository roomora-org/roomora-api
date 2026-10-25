// src/auth/services/refresh-token.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'node:crypto';
import { RefreshToken } from '../entities/refresh-token.entity.js';
import { User } from '../../../users/entities/user.entity.js';

@Injectable()
export class RefreshTokenService {
  private readonly refreshTokenTtlMs: number;

  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    private readonly configService: ConfigService,
  ) {
    const expiresInDays = this.configService.getOrThrow<number>('jwt.refreshExpiresInDays',);
    this.refreshTokenTtlMs = expiresInDays * 24 * 60 * 60 * 1000;
  }

  async createRefreshToken(user: User): Promise<string> {
    await this.refreshTokenRepository.delete({ userId: user.id });

    const rawToken = randomBytes(40).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + this.refreshTokenTtlMs);

    const refreshToken = this.refreshTokenRepository.create({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    await this.refreshTokenRepository.save(refreshToken);

    return rawToken;
  }

  async validateRefreshToken(rawToken: string): Promise<RefreshToken> {
    if (!rawToken?.trim()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokenHash = createHash('sha256').update(rawToken).digest('hex');

    const refreshToken = await this.refreshTokenRepository.findOne({
      where: { tokenHash },
      relations: { user: true },
    });

    if (!refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (refreshToken.expiresAt.getTime() <= Date.now()) {
      await this.refreshTokenRepository.delete({ id: refreshToken.id });
      throw new UnauthorizedException(
        'Refresh token was expired. Please make a new sign in request',
      );
    }

    return refreshToken;
  }

  async deleteByUser(userId: string): Promise<void> {
    await this.refreshTokenRepository.delete({ userId });
  }
}
