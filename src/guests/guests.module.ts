import { Module } from '@nestjs/common';
import { GuestsService } from './guests.service.js';
import { GuestsController } from './guests.controller.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Guest } from './entities/guest.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Guest])],
  controllers: [GuestsController],
  providers: [GuestsService],
})
export class GuestsModule {}
