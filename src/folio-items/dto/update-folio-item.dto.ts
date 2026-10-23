import { PartialType } from '@nestjs/mapped-types';
import { CreateFolioItemDto } from './create-folio-item.dto.js';

export class UpdateFolioItemDto extends PartialType(CreateFolioItemDto) {}
