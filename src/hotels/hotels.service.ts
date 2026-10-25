import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Hotel } from './entities/hotel.entity.js';
import { CreateHotelDto } from './dto/create-hotel.dto.js';
import { UpdateHotelDto } from './dto/update-hotel.dto.js';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';
import { PaginatedResponse } from '../common/interfaces/paginated-response.interface.js';

@Injectable()
export class HotelsService {
  constructor(
    @InjectRepository(Hotel)
    private readonly hotelRepository: Repository<Hotel>,
  ) {}

  /**
   * Creates a new Hotel record.
   * Handles unique constraint conflicts on slug and email gracefully.
   */
  async create(createHotelDto: CreateHotelDto): Promise<Hotel> {
    const existing = await this.hotelRepository.findOne({
      where: [{ slug: createHotelDto.slug }, { email: createHotelDto.email }],
    });

    if (existing) {
      if (existing.slug === createHotelDto.slug) {
        throw new ConflictException(
          `Hotel with slug "${createHotelDto.slug}" already exists`,
        );
      }
      if (existing.email === createHotelDto.email) {
        throw new ConflictException(
          `Hotel with email "${createHotelDto.email}" already exists`,
        );
      }
    }

    const hotel = this.hotelRepository.create(createHotelDto);

    try {
      return await this.hotelRepository.save(hotel);
    } catch (error: any) {
      if (error?.code === '23505') {
        throw new ConflictException(
          'A hotel with the provided slug or email already exists',
        );
      }
      throw error;
    }
  }

  /**
   * Retrieves a paginated list of hotels.
   */
  async findAll(
    paginationDto?: PaginationQueryDto,
  ): Promise<PaginatedResponse<Hotel>> {
    const page =
      paginationDto?.page && paginationDto.page > 0
        ? Number(paginationDto.page)
        : 1;
    const limit =
      paginationDto?.limit && paginationDto.limit > 0
        ? Math.min(Number(paginationDto.limit), 100)
        : 10;
    const skip = (page - 1) * limit;

    const [data, total] = await this.hotelRepository.findAndCount({
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  /**
   * Finds a single hotel by UUID.
   * Throws NotFoundException if the hotel is not found.
   */
  async findOne(id: string): Promise<Hotel> {
    const hotel = await this.hotelRepository.findOne({
      where: { id },
    });

    if (!hotel) {
      throw new NotFoundException(`Hotel with ID "${id}" not found`);
    }

    return hotel;
  }

  /**
   * Updates an existing hotel.
   * Gracefully handles unique constraint violations (slug or email conflicts).
   * Throws NotFoundException if the hotel does not exist.
   */
  async update(id: string, updateHotelDto: UpdateHotelDto): Promise<Hotel> {
    const hotel = await this.findOne(id);

    if (updateHotelDto.slug && updateHotelDto.slug !== hotel.slug) {
      const existingSlug = await this.hotelRepository.findOne({
        where: { slug: updateHotelDto.slug },
      });
      if (existingSlug && existingSlug.id !== id) {
        throw new ConflictException(
          `Hotel with slug "${updateHotelDto.slug}" already exists`,
        );
      }
    }

    if (updateHotelDto.email && updateHotelDto.email !== hotel.email) {
      const existingEmail = await this.hotelRepository.findOne({
        where: { email: updateHotelDto.email },
      });
      if (existingEmail && existingEmail.id !== id) {
        throw new ConflictException(
          `Hotel with email "${updateHotelDto.email}" already exists`,
        );
      }
    }

    Object.assign(hotel, updateHotelDto);

    try {
      return await this.hotelRepository.save(hotel);
    } catch (error: any) {
      if (error?.code === '23505') {
        throw new ConflictException(
          'A hotel with the provided slug or email already exists',
        );
      }
      throw error;
    }
  }

  /**
   * Deletes a hotel by UUID.
   * Throws NotFoundException if the hotel is not found.
   */
  async remove(id: string): Promise<void> {
    const hotel = await this.findOne(id);
    await this.hotelRepository.remove(hotel);
  }
}
