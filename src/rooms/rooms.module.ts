import { Module } from '@nestjs/common';
import { RoomsService } from './rooms.service.js';
import { RoomsController } from './rooms.controller.js';

@Module({
  controllers: [RoomsController],
  providers: [RoomsService],
})
export class RoomsModule {}
