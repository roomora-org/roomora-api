import { Module } from '@nestjs/common';
import { HotelsService } from './hotels.service.js';
import { HotelsController } from './hotels.controller.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Hotel } from './entities/hotel.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Hotel])],
  controllers: [HotelsController],
  providers: [HotelsService],
})
export class HotelsModule {}
