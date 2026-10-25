import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { HotelsService } from './hotels.service.js';
import { CreateHotelDto } from './dto/create-hotel.dto.js';
import { UpdateHotelDto } from './dto/update-hotel.dto.js';
import { Hotel } from './entities/hotel.entity.js';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';
import { PaginatedHotelResponseDto } from './dto/paginated-hotel-response.dto.js';

@ApiTags('hotels')
@Controller('hotels')
export class HotelsController {
  constructor(private readonly hotelsService: HotelsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new hotel',
    description: 'Registers a new hotel in the multi-tenant platform. Slug and email must be globally unique.',
  })
  @ApiBody({ type: CreateHotelDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Hotel created successfully',
    type: Hotel,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation failed or malformed request payload',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Hotel with the provided slug or email already exists',
  })
  create(@Body() createHotelDto: CreateHotelDto) {
    return this.hotelsService.create(createHotelDto);
  }

  @Get()
  @ApiOperation({
    summary: 'List all hotels',
    description: 'Retrieves a paginated list of registered hotels ordered by creation date.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Paginated list of hotels retrieved successfully',
    type: PaginatedHotelResponseDto,
  })
  findAll(@Query() paginationDto: PaginationQueryDto) {
    return this.hotelsService.findAll(paginationDto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get hotel by ID',
    description: 'Retrieves details of a specific hotel by its UUID.',
  })
  @ApiParam({
    name: 'id',
    description: 'Unique UUID identifier of the hotel',
    type: 'string',
    format: 'uuid',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Hotel found and retrieved successfully',
    type: Hotel,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Hotel with the specified ID was not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid UUID format supplied',
  })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.hotelsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update hotel by ID',
    description: 'Updates specific attributes of an existing hotel. Slug and email updates are checked for conflicts.',
  })
  @ApiParam({
    name: 'id',
    description: 'Unique UUID identifier of the hotel to update',
    type: 'string',
    format: 'uuid',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @ApiBody({ type: UpdateHotelDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Hotel updated successfully',
    type: Hotel,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation failed on update payload or invalid UUID format',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Hotel with the specified ID was not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Update conflicts with an existing hotel slug or email',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateHotelDto: UpdateHotelDto,
  ) {
    return this.hotelsService.update(id, updateHotelDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete hotel by ID',
    description: 'Deletes a hotel record by its UUID identifier.',
  })
  @ApiParam({
    name: 'id',
    description: 'Unique UUID identifier of the hotel to delete',
    type: 'string',
    format: 'uuid',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Hotel deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid UUID format supplied',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Hotel with the specified ID was not found',
  })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.hotelsService.remove(id);
  }
}
