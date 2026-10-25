import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { HotelStatus } from '../enums/hotel-status.enum.js';

export class CreateHotelDto {
  @ApiProperty({
    example: 'Roomora Grand Palace',
    description: 'Name of the hotel',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'roomora-grand-palace',
    description: 'Unique URL slug for the hotel (lowercase letters, numbers, and hyphens)',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must contain only lowercase alphanumeric characters and single hyphens between words',
  })
  slug: string;

  @ApiPropertyOptional({
    example: 'A luxury 5-star hotel in the heart of downtown.',
    description: 'Detailed description of the hotel',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiProperty({
    example: 'contact@roomorapalace.com',
    description: 'Unique primary contact email address for the hotel',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: '+1-555-0199',
    description: 'Primary telephone number for hotel inquiries and reservations',
  })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiPropertyOptional({
    example: '+1-555-0198',
    description: 'Alternative telephone contact number',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  alternativePhone?: string | null;

  @ApiProperty({
    example: 'United States',
    description: 'Country where the hotel is located',
  })
  @IsString()
  @IsNotEmpty()
  country: string;

  @ApiProperty({
    example: 'New York',
    description: 'City where the hotel is located',
  })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({
    example: '123 Broadway Avenue',
    description: 'Street address of the property',
  })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiPropertyOptional({
    example: '10001',
    description: 'Postal/ZIP code',
    nullable: true,
  })
  @IsOptional()
  @Transform(({ value }) => (value !== null && value !== undefined ? String(value) : value))
  @IsString()
  postalCode?: string | null;

  @ApiProperty({
    example: 'https://cdn.roomora.com/logos/grand-palace.png',
    description: 'URL of the hotel logo image',
  })
  @IsString()
  @IsNotEmpty()
  logoUrl: string;

  @ApiPropertyOptional({
    example: 5,
    description: 'Star rating classification (between 1 and 5)',
    minimum: 1,
    maximum: 5,
    nullable: true,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  starRating?: number | null;

  @ApiPropertyOptional({
    example: 'America/New_York',
    description: 'IANA time zone identifier',
    default: 'UTC',
  })
  @IsOptional()
  @IsString()
  timeZone?: string;

  @ApiPropertyOptional({
    example: '14:00',
    description: 'Standard check-in time (HH:mm format)',
    default: '14:00',
  })
  @IsOptional()
  @IsString()
  checkInTime?: string;

  @ApiPropertyOptional({
    example: '12:00',
    description: 'Standard check-out time (HH:mm format)',
    default: '12:00',
  })
  @IsOptional()
  @IsString()
  checkOutTime?: string;

  @ApiPropertyOptional({
    enum: HotelStatus,
    description: 'Operational status of the hotel',
    default: HotelStatus.PENDING,
  })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.toUpperCase() : value))
  @IsEnum(HotelStatus)
  status?: HotelStatus;
}
