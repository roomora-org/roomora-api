import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Hotel } from '../hotels/entities/hotel.entity.js';
import { Guest } from './entities/guest.entity.js';
import { GuestsController } from './guests.controller.js';
import { GuestsService } from './guests.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Guest, Hotel])],
  controllers: [GuestsController],
  providers: [GuestsService],
})
export class GuestsModule {}