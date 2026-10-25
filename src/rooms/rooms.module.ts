import { Module } from '@nestjs/common';
import { RoomsService } from './rooms.service.js';
import { RoomsController } from './rooms.controller.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Room } from './entities/room.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Room])],
  controllers: [RoomsController],
  providers: [RoomsService],
})
export class RoomsModule {}
