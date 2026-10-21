import { PartialType } from '@nestjs/mapped-types';
import { CreateGuestDto } from './create-guest.dto.js';

export class UpdateGuestDto extends PartialType(CreateGuestDto) {}
