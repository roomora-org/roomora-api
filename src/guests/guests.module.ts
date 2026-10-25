import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GuestsService } from './guests.service.js';
import { GuestsController } from './guests.controller.js';
import { Guest } from './entities/guest.entity.js';
import { Hotel } from '../hotels/entities/hotel.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Guest, Hotel])],
  controllers: [GuestsController],
  providers: [GuestsService],
  exports: [GuestsService],
})
export class GuestsModule {}
