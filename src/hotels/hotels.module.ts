import { Module } from '@nestjs/common';
import { HotelsService } from './hotels.service.js';
import { HotelsController } from './hotels.controller.js';

@Module({
  controllers: [HotelsController],
  providers: [HotelsService],
})
export class HotelsModule {}
