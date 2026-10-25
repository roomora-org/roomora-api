import { ApiProperty } from '@nestjs/swagger';
import { PaginationMeta } from '../interfaces/paginated-response.interface.js';

export class PaginationMetaDto implements PaginationMeta {
  @ApiProperty({ example: 42, description: 'Total number of items matching criteria' })
  total: number;

  @ApiProperty({ example: 1, description: 'Current page number' })
  page: number;

  @ApiProperty({ example: 10, description: 'Number of items per page' })
  limit: number;

  @ApiProperty({ example: 5, description: 'Total number of pages' })
  totalPages: number;
}
