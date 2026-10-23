import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsUUID,
  Matches,
} from 'class-validator';

const trimString = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateGuestDto {
  @IsUUID()
  hotelId!: string;

  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @IsOptional()
  @Transform(trimString)
  @IsEmail()
  email?: string | null;

  @Transform(trimString)
  @IsPhoneNumber()
  phone!: string;

  @IsOptional()
  @Transform(trimString)
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true })
  dateOfBirth?: string | null;

  @IsOptional()
  @Transform(trimString)
  @IsString()
  nationality?: string | null;

  @IsOptional()
  @Transform(trimString)
  @IsString()
  countryOfResidence?: string | null;

  @IsOptional()
  @Transform(trimString)
  @IsString()
  city?: string | null;

  @IsOptional()
  @Transform(trimString)
  @IsString()
  address?: string | null;

  @IsOptional()
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  passportNumber?: string | null;
}