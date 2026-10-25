import { ApiProperty } from '@nestjs/swagger';
import { Hotel } from '../entities/hotel.entity.js';
import { PaginationMetaDto } from '../../common/dto/pagination-meta.dto.js';
import { PaginatedResponse } from '../../common/interfaces/paginated-response.interface.js';

export class PaginatedHotelResponseDto implements PaginatedResponse<Hotel> {
  @ApiProperty({ type: () => [Hotel], description: 'List of hotels for the requested page' })
  data: Hotel[];

  @ApiProperty({ type: () => PaginationMetaDto, description: 'Pagination metadata' })
  meta: PaginationMetaDto;
}
