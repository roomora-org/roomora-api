import { Module } from '@nestjs/common';
import { FoliosService } from './folios.service.js';
import { FoliosController } from './folios.controller.js';

@Module({
  controllers: [FoliosController],
  providers: [FoliosService],
})
export class FoliosModule {}
