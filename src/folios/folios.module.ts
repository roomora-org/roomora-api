import { Module } from '@nestjs/common';
import { FoliosService } from './folios.service.js';
import { FoliosController } from './folios.controller.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Folio } from './entities/folio.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Folio])],
  controllers: [FoliosController],
  providers: [FoliosService],
})
export class FoliosModule {}
