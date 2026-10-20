import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { FolioItemsService } from './folio-items.service.js';
import { CreateFolioItemDto } from './dto/create-folio-item.dto.js';
import { UpdateFolioItemDto } from './dto/update-folio-item.dto.js';

@Controller('folio-items')
export class FolioItemsController {
  constructor(private readonly folioItemsService: FolioItemsService) {}

  @Post()
  create(@Body() createFolioItemDto: CreateFolioItemDto) {
    return this.folioItemsService.create(createFolioItemDto);
  }

  @Get()
  findAll() {
    return this.folioItemsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.folioItemsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFolioItemDto: UpdateFolioItemDto) {
    return this.folioItemsService.update(+id, updateFolioItemDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.folioItemsService.remove(+id);
  }
}
