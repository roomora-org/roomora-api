import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateGuestDto {
  @IsUUID('all')
  hotelId!: string;

  @Transform(
    ({ value }) => (typeof value === 'string' ? value.trim() : value),
    { toClassOnly: true },
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName!: string;

  @Transform(
    ({ value }) => (typeof value === 'string' ? value.trim() : value),
    { toClassOnly: true },
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName!: string;

  @IsOptional()
  @Transform(
    ({ value }) => (typeof value === 'string' ? value.trim() : value),
    { toClassOnly: true },
  )
  @IsEmail()
  @MaxLength(254)
  email?: string | null;

  @Transform(
    ({ value }) => (typeof value === 'string' ? value.trim() : value),
    { toClassOnly: true },
  )
  @IsString()
  @IsNotEmpty()
  @IsPhoneNumber(undefined)
  @MaxLength(32)
  phone!: string;

  @IsOptional()
  @IsDateString({ strict: true })
  dateOfBirth?: string | null;

  @IsOptional()
  @Transform(
    ({ value }) => (typeof value === 'string' ? value.trim() : value),
    { toClassOnly: true },
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nationality?: string | null;

  @IsOptional()
  @Transform(
    ({ value }) => (typeof value === 'string' ? value.trim() : value),
    { toClassOnly: true },
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  countryOfResidence?: string | null;

  @IsOptional()
  @Transform(
    ({ value }) => (typeof value === 'string' ? value.trim() : value),
    { toClassOnly: true },
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  city?: string | null;

  @IsOptional()
  @Transform(
    ({ value }) => (typeof value === 'string' ? value.trim() : value),
    { toClassOnly: true },
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  address?: string | null;

  @IsOptional()
  @Transform(
    ({ value }) => (typeof value === 'string' ? value.trim() : value),
    { toClassOnly: true },
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  passportNumber?: string | null;

  @IsOptional()
  @Transform(
    ({ value }) => (typeof value === 'string' ? value.trim() : value),
    { toClassOnly: true },
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  documentType?: string | null;
}