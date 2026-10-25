import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateGuestDto {
  @ApiProperty({
    description: 'UUID of the hotel this guest is registered with',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @IsUUID('4', { message: 'hotelId must be a valid UUID' })
  @IsNotEmpty({ message: 'hotelId is required' })
  hotelId: string;

  @ApiProperty({
    description: 'First name of the guest',
    example: 'Eleanor',
  })
  @IsString({ message: 'firstName must be a string' })
  @IsNotEmpty({ message: 'firstName is required' })
  firstName: string;

  @ApiProperty({
    description: 'Last name of the guest',
    example: 'Vance',
  })
  @IsString({ message: 'lastName must be a string' })
  @IsNotEmpty({ message: 'lastName is required' })
  lastName: string;

  @ApiPropertyOptional({
    description: 'Email address of the guest',
    example: 'eleanor.vance@example.com',
    nullable: true,
  })
  @IsOptional()
  @IsEmail({}, { message: 'email must be a valid email address' })
  email?: string | null;

  @ApiProperty({
    description: 'Contact phone number of the guest',
    example: '+1-555-0199',
  })
  @IsString({ message: 'phone must be a string' })
  @IsNotEmpty({ message: 'phone is required' })
  phone: string;

  @ApiPropertyOptional({
    description: 'Date of birth in YYYY-MM-DD or ISO format',
    example: '1992-08-24',
    nullable: true,
  })
  @IsOptional()
  @IsDateString({}, { message: 'dateOfBirth must be a valid date string (e.g. YYYY-MM-DD)' })
  dateOfBirth?: string | null;

  @ApiPropertyOptional({
    description: 'Nationality / citizenship of the guest',
    example: 'American',
    nullable: true,
  })
  @IsOptional()
  @IsString({ message: 'nationality must be a string' })
  nationality?: string | null;

  @ApiPropertyOptional({
    description: 'Country of residence',
    example: 'United States',
    nullable: true,
  })
  @IsOptional()
  @IsString({ message: 'countryOfResidence must be a string' })
  countryOfResidence?: string | null;

  @ApiPropertyOptional({
    description: 'City of residence',
    example: 'San Francisco',
    nullable: true,
  })
  @IsOptional()
  @IsString({ message: 'city must be a string' })
  city?: string | null;

  @ApiPropertyOptional({
    description: 'Residential street address',
    example: '742 Evergreen Terrace',
    nullable: true,
  })
  @IsOptional()
  @IsString({ message: 'address must be a string' })
  address?: string | null;

  @ApiPropertyOptional({
    description: 'Passport or identification document number',
    example: 'P98765432',
    nullable: true,
  })
  @IsOptional()
  @IsString({ message: 'passportNumber must be a string' })
  passportNumber?: string | null;

  @ApiPropertyOptional({
    description: 'Alias for passportNumber',
    example: 'P98765432',
    nullable: true,
  })
  @IsOptional()
  @IsString({ message: 'documentNumber must be a string' })
  documentNumber?: string | null;

  @ApiPropertyOptional({
    description: 'Identification document type (e.g., PASSPORT, NATIONAL_ID, DRIVERS_LICENSE)',
    example: 'PASSPORT',
    nullable: true,
  })
  @IsOptional()
  @IsString({ message: 'documentType must be a string' })
  documentType?: string | null;
}
