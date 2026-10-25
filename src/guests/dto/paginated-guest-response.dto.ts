import { ApiProperty } from '@nestjs/swagger';
import { Guest } from '../entities/guest.entity.js';
import { PaginationMetaDto } from '../../common/dto/pagination-meta.dto.js';
import { PaginatedResponse } from '../../common/interfaces/paginated-response.interface.js';

export class PaginatedGuestResponseDto implements PaginatedResponse<Guest> {
  @ApiProperty({ type: () => [Guest], description: 'List of guests matching criteria' })
  data: Guest[];

  @ApiProperty({ type: () => PaginationMetaDto, description: 'Pagination metadata' })
  meta: PaginationMetaDto;
}
