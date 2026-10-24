import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { GuestsService } from './guests.service.js';
import { CreateGuestDto } from './dto/create-guest.dto.js';
import { UpdateGuestDto } from './dto/update-guest.dto.js';

const guestDtoValidationPipe = new ValidationPipe({
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
});

@Controller('guests')
export class GuestsController {
  constructor(private readonly guestsService: GuestsService) {}

  /** POST /guests — create a guest profile for an existing hotel. */
  @Post()
  @UsePipes(guestDtoValidationPipe)
  create(@Body() createGuestDto: CreateGuestDto) {
    return this.guestsService.create(createGuestDto);
  }

  @Get()
  findAll() {
    return this.guestsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.guestsService.findOne(+id);
  }

  @Patch(':id')
  @UsePipes(guestDtoValidationPipe)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateGuestDto: UpdateGuestDto,
  ) {
    return this.guestsService.update(id, updateGuestDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.guestsService.remove(+id);
  }
}