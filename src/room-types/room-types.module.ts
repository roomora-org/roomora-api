import { Module } from '@nestjs/common';
import { RoomTypesService } from './room-types.service.js';
import { RoomTypesController } from './room-types.controller.js';

@Module({
  controllers: [RoomTypesController],
  providers: [RoomTypesService],
})
export class RoomTypesModule {}
