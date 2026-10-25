import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { GuestsService } from './guests.service.js';
import { CreateGuestDto } from './dto/create-guest.dto.js';
import { UpdateGuestDto } from './dto/update-guest.dto.js';
import { GetGuestsQueryDto } from './dto/get-guests-query.dto.js';
import { Guest } from './entities/guest.entity.js';
import { PaginatedGuestResponseDto } from './dto/paginated-guest-response.dto.js';

@ApiTags('guests')
@Controller('guests')
export class GuestsController {
  constructor(private readonly guestsService: GuestsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new guest',
    description:
      'Creates a new guest profile associated with a specific hotel tenant. Validates hotel existence and unique passport/document number.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Guest created successfully',
    type: Guest,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation failed or malformed request payload',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Referenced hotel was not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Guest with the provided passport / document number already exists',
  })
  create(@Body() createGuestDto: CreateGuestDto) {
    return this.guestsService.create(createGuestDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Search and retrieve paginated list of guests',
    description:
      'Retrieves guests matching search criteria (name, email, phone, documentNumber, hotelId) with pagination support. Supports tenant isolation.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Paginated list of guests matching search criteria',
    type: PaginatedGuestResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid query parameters supplied',
  })
  findAll(@Query() queryDto: GetGuestsQueryDto) {
    return this.guestsService.findAll(queryDto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get guest by ID',
    description:
      'Retrieves a single guest by UUID. Sensitive fields and internal credentials are not exposed in the response.',
  })
  @ApiParam({
    name: 'id',
    description: 'Unique UUID identifier of the guest',
    type: 'string',
    format: 'uuid',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Guest details found and retrieved successfully',
    type: Guest,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Guest with the specified ID was not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid UUID format supplied',
  })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.guestsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update guest by ID',
    description:
      'Updates editable details of an existing guest. Validates existence and prevents tenant or internal ID modifications.',
  })
  @ApiParam({
    name: 'id',
    description: 'Unique UUID identifier of the guest',
    type: 'string',
    format: 'uuid',
    example: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Guest updated successfully',
    type: Guest,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation failed or invalid UUID format',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Guest with the specified ID was not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Update conflicts with an existing passport / document number',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateGuestDto: UpdateGuestDto,
  ) {
    return this.guestsService.update(id, updateGuestDto);
  }
}
