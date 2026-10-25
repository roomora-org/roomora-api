import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class GetGuestsQueryDto {
  @ApiPropertyOptional({
    description: 'Page number for pagination (1-based index)',
    default: 1,
    minimum: 1,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of guests per page (max 100)',
    default: 10,
    minimum: 1,
    maximum: 100,
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Filter guests by first name, last name, or full name (case-insensitive partial match)',
    example: 'John',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Filter guests by email address (case-insensitive partial match)',
    example: 'john.doe@example.com',
  })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({
    description: 'Filter guests by phone number (partial match)',
    example: '+1-555',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    description: 'Filter guests by identity document / passport number (case-insensitive partial match)',
    example: 'AB123456',
  })
  @IsOptional()
  @IsString()
  documentNumber?: string;

  @ApiPropertyOptional({
    description: 'Alias for documentNumber matching passportNumber',
    example: 'AB123456',
  })
  @IsOptional()
  @IsString()
  passportNumber?: string;

  @ApiPropertyOptional({
    description: 'Filter guests by hotel UUID (tenant isolation)',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @IsOptional()
  @IsUUID()
  hotelId?: string;
}
