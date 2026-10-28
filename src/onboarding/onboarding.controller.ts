import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/strategies/guards/jwt-auth.guard.js';
import { OnboardingService } from './onboarding.service.js';
import { CreateOnboardingDto } from './dto/create-onboarding.dto.js';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    accountType: string;
  };
}

@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async complete(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateOnboardingDto,
  ) {
    return this.onboardingService.completeOnboarding(req.user.id, dto);
  }
}