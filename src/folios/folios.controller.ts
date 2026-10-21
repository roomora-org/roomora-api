import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { FoliosService } from './folios.service.js';
import { CreateFolioDto } from './dto/create-folio.dto.js';
import { UpdateFolioDto } from './dto/update-folio.dto.js';

@Controller('folios')
export class FoliosController {
  constructor(private readonly foliosService: FoliosService) {}

  @Post()
  create(@Body() createFolioDto: CreateFolioDto) {
    return this.foliosService.create(createFolioDto);
  }

  @Get()
  findAll() {
    return this.foliosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.foliosService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFolioDto: UpdateFolioDto) {
    return this.foliosService.update(+id, updateFolioDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.foliosService.remove(+id);
  }
}
