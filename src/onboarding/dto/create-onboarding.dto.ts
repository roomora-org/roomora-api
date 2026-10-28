import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateOnboardingDto {
  @IsString()
  @IsNotEmpty({ message: 'Hotel name is required' })
  @MinLength(2, { message: 'Hotel name must be at least 2 characters' })
  @MaxLength(100)
  hotelName: string;

  @IsString()
  @IsNotEmpty({ message: 'City is required' })
  @MaxLength(100)
  city: string;

  @IsString()
  @IsNotEmpty({ message: 'Country is required' })
  @MaxLength(100)
  country: string;

  @IsString()
  @IsNotEmpty({ message: 'Address is required' })
  @MaxLength(500)
  address: string;

  @IsInt()
  @Min(1, { message: 'Minimum 1 star' })
  @Max(5, { message: 'Maximum 5 stars' })
  starRating: number;

  @IsString()
  @IsNotEmpty({ message: 'Hotel phone is required' })
  @MaxLength(32)
  hotelPhone: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  alternativePhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string;
}