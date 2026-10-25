import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { HotelsController } from './hotels.controller.js';
import { HotelsService } from './hotels.service.js';
import { Hotel } from './entities/hotel.entity.js';
import { HotelStatus } from './enums/hotel-status.enum.js';
import { CreateHotelDto } from './dto/create-hotel.dto.js';
import { UpdateHotelDto } from './dto/update-hotel.dto.js';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';

describe('HotelsController', () => {
  let controller: HotelsController;
  let service: HotelsService;

  const mockHotel: Hotel = {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    name: 'Grand Roomora Hotel',
    slug: 'grand-roomora-hotel',
    description: 'A 5-star luxury hotel in downtown',
    email: 'contact@grandroomora.com',
    phone: '+1-555-0199',
    alternativePhone: null,
    country: 'United States',
    city: 'New York',
    address: '123 Broadway Avenue',
    postalCode: '10001',
    logoUrl: 'https://cdn.roomora.com/logos/grand-roomora.png',
    starRating: 5,
    timeZone: 'America/New_York',
    checkInTime: '14:00',
    checkOutTime: '12:00',
    status: HotelStatus.ACTIVE,
    employees: [] as any,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    createdBy: null,
    updatedBy: null,
  };

  const mockHotelsService = {
    create: vi.fn(),
    findAll: vi.fn(),
    findOne: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HotelsController],
      providers: [
        {
          provide: HotelsService,
          useValue: mockHotelsService,
        },
      ],
    }).compile();

    controller = module.get<HotelsController>(HotelsController);
    service = module.get<HotelsService>(HotelsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto: CreateHotelDto = {
      name: 'Grand Roomora Hotel',
      slug: 'grand-roomora-hotel',
      email: 'contact@grandroomora.com',
      phone: '+1-555-0199',
      country: 'United States',
      city: 'New York',
      address: '123 Broadway Avenue',
      logoUrl: 'https://cdn.roomora.com/logos/grand-roomora.png',
      starRating: 5,
    };

    it('should call hotelsService.create and return created hotel', async () => {
      mockHotelsService.create.mockResolvedValue(mockHotel);

      const result = await controller.create(createDto);

      expect(mockHotelsService.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockHotel);
    });

    it('should propagate ConflictException if slug or email exists', async () => {
      mockHotelsService.create.mockRejectedValue(
        new ConflictException('Hotel with slug already exists'),
      );

      await expect(controller.create(createDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findAll', () => {
    it('should call hotelsService.findAll and return paginated list', async () => {
      const paginationDto: PaginationQueryDto = { page: 1, limit: 10 };
      const expectedResponse = {
        data: [mockHotel],
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      };
      mockHotelsService.findAll.mockResolvedValue(expectedResponse);

      const result = await controller.findAll(paginationDto);

      expect(mockHotelsService.findAll).toHaveBeenCalledWith(paginationDto);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('findOne', () => {
    it('should call hotelsService.findOne and return a hotel', async () => {
      mockHotelsService.findOne.mockResolvedValue(mockHotel);

      const result = await controller.findOne(mockHotel.id);

      expect(mockHotelsService.findOne).toHaveBeenCalledWith(mockHotel.id);
      expect(result).toEqual(mockHotel);
    });

    it('should propagate NotFoundException when hotel does not exist', async () => {
      mockHotelsService.findOne.mockRejectedValue(
        new NotFoundException('Hotel not found'),
      );

      await expect(controller.findOne('non-existent-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const updateDto: UpdateHotelDto = {
      name: 'Updated Hotel Name',
    };

    it('should call hotelsService.update and return updated hotel', async () => {
      const updatedHotel = { ...mockHotel, ...updateDto };
      mockHotelsService.update.mockResolvedValue(updatedHotel);

      const result = await controller.update(mockHotel.id, updateDto);

      expect(mockHotelsService.update).toHaveBeenCalledWith(
        mockHotel.id,
        updateDto,
      );
      expect(result).toEqual(updatedHotel);
    });

    it('should propagate NotFoundException when updating non-existent hotel', async () => {
      mockHotelsService.update.mockRejectedValue(
        new NotFoundException('Hotel not found'),
      );

      await expect(
        controller.update('non-existent-uuid', updateDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should propagate ConflictException when updating to duplicate slug/email', async () => {
      mockHotelsService.update.mockRejectedValue(
        new ConflictException('Slug already exists'),
      );

      await expect(
        controller.update(mockHotel.id, { slug: 'duplicate-slug' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should call service.remove and resolve', async () => {
      mockHotelsService.remove.mockResolvedValue(undefined);

      await expect(controller.remove(mockHotel.id)).resolves.toBeUndefined();
      expect(mockHotelsService.remove).toHaveBeenCalledWith(mockHotel.id);
    });

    it('should propagate NotFoundException when hotel does not exist', async () => {
      mockHotelsService.remove.mockRejectedValue(
        new NotFoundException('Hotel not found'),
      );

      await expect(controller.remove('missing-id')).rejects.toThrow(NotFoundException);
    });
  });
});
