import { Module } from '@nestjs/common';
import { RoomTypesService } from './room-types.service.js';
import { RoomTypesController } from './room-types.controller.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomType } from './entities/room-type.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([RoomType])],
  controllers: [RoomTypesController],
  providers: [RoomTypesService],
})
export class RoomTypesModule {}
