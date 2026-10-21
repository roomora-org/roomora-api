import { Injectable } from '@nestjs/common';
import { CreateFolioItemDto } from './dto/create-folio-item.dto.js';
import { UpdateFolioItemDto } from './dto/update-folio-item.dto.js';

@Injectable()
export class FolioItemsService {
  create(createFolioItemDto: CreateFolioItemDto) {
    return 'This action adds a new folioItem';
  }

  findAll() {
    return `This action returns all folioItems`;
  }

  findOne(id: number) {
    return `This action returns a #${id} folioItem`;
  }

  update(id: number, updateFolioItemDto: UpdateFolioItemDto) {
    return `This action updates a #${id} folioItem`;
  }

  remove(id: number) {
    return `This action removes a #${id} folioItem`;
  }
}
