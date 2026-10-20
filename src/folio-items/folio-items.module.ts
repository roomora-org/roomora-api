import { Module } from '@nestjs/common';
import { FolioItemsService } from './folio-items.service.js';
import { FolioItemsController } from './folio-items.controller.js';

@Module({
  controllers: [FolioItemsController],
  providers: [FolioItemsService],
})
export class FolioItemsModule {}
