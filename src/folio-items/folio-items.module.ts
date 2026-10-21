import { Module } from '@nestjs/common';
import { FolioItemsService } from './folio-items.service.js';
import { FolioItemsController } from './folio-items.controller.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FolioItem } from './entities/folio-item.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([FolioItem])],
  controllers: [FolioItemsController],
  providers: [FolioItemsService],
})
export class FolioItemsModule {}
