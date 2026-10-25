import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { HotelsService } from './hotels.service.js';
import { Hotel } from './entities/hotel.entity.js';
import { HotelStatus } from './enums/hotel-status.enum.js';
import { CreateHotelDto } from './dto/create-hotel.dto.js';
import { UpdateHotelDto } from './dto/update-hotel.dto.js';

describe('HotelsService', () => {
  let service: HotelsService;
  let repository: Repository<Hotel>;

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

  const mockHotelRepository = {
    create: vi.fn(),
    save: vi.fn(),
    findOne: vi.fn(),
    findAndCount: vi.fn(),
    remove: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HotelsService,
        {
          provide: getRepositoryToken(Hotel),
          useValue: mockHotelRepository,
        },
      ],
    }).compile();

    service = module.get<HotelsService>(HotelsService);
    repository = module.get<Repository<Hotel>>(getRepositoryToken(Hotel));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(repository).toBeDefined();
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

    it('should successfully create and return a new hotel', async () => {
      mockHotelRepository.findOne.mockResolvedValue(null);
      mockHotelRepository.create.mockReturnValue(mockHotel);
      mockHotelRepository.save.mockResolvedValue(mockHotel);

      const result = await service.create(createDto);

      expect(mockHotelRepository.findOne).toHaveBeenCalledWith({
        where: [{ slug: createDto.slug }, { email: createDto.email }],
      });
      expect(mockHotelRepository.create).toHaveBeenCalledWith(createDto);
      expect(mockHotelRepository.save).toHaveBeenCalledWith(mockHotel);
      expect(result).toEqual(mockHotel);
    });

    it('should throw ConflictException if a hotel with the same slug exists', async () => {
      mockHotelRepository.findOne.mockResolvedValue({
        id: 'different-uuid',
        slug: createDto.slug,
        email: 'other@example.com',
      });

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
      await expect(service.create(createDto)).rejects.toThrow(
        `Hotel with slug "${createDto.slug}" already exists`,
      );
      expect(mockHotelRepository.save).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if a hotel with the same email exists', async () => {
      mockHotelRepository.findOne.mockResolvedValue({
        id: 'different-uuid',
        slug: 'different-slug',
        email: createDto.email,
      });

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
      await expect(service.create(createDto)).rejects.toThrow(
        `Hotel with email "${createDto.email}" already exists`,
      );
      expect(mockHotelRepository.save).not.toHaveBeenCalled();
    });

    it('should gracefully handle 23505 unique constraint error on save', async () => {
      mockHotelRepository.findOne.mockResolvedValue(null);
      mockHotelRepository.create.mockReturnValue(mockHotel);
      mockHotelRepository.save.mockRejectedValue({ code: '23505' });

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
      await expect(service.create(createDto)).rejects.toThrow(
        'A hotel with the provided slug or email already exists',
      );
    });

    it('should re-throw unexpected database errors', async () => {
      mockHotelRepository.findOne.mockResolvedValue(null);
      mockHotelRepository.create.mockReturnValue(mockHotel);
      mockHotelRepository.save.mockRejectedValue(new Error('DB Connection Failed'));

      await expect(service.create(createDto)).rejects.toThrow('DB Connection Failed');
    });
  });

  describe('findOne', () => {
    it('should return the hotel when a valid ID is provided', async () => {
      mockHotelRepository.findOne.mockResolvedValue(mockHotel);

      const result = await service.findOne(mockHotel.id);

      expect(mockHotelRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockHotel.id },
      });
      expect(result).toEqual(mockHotel);
    });

    it('should throw NotFoundException when hotel does not exist', async () => {
      mockHotelRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent-uuid')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('non-existent-uuid')).rejects.toThrow(
        'Hotel with ID "non-existent-uuid" not found',
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated hotels with default pagination parameters', async () => {
      const hotels = [mockHotel];
      mockHotelRepository.findAndCount.mockResolvedValue([hotels, 1]);

      const result = await service.findAll();

      expect(mockHotelRepository.findAndCount).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual({
        data: hotels,
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      });
    });

    it('should handle custom page and limit with boundary calculations', async () => {
      const hotels = [mockHotel];
      mockHotelRepository.findAndCount.mockResolvedValue([hotels, 45]);

      const result = await service.findAll({ page: 3, limit: 10 });

      expect(mockHotelRepository.findAndCount).toHaveBeenCalledWith({
        skip: 20,
        take: 10,
        order: { createdAt: 'DESC' },
      });
      expect(result.meta).toEqual({
        total: 45,
        page: 3,
        limit: 10,
        totalPages: 5,
      });
    });

    it('should handle 0 total records correctly', async () => {
      mockHotelRepository.findAndCount.mockResolvedValue([[], 0]);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result).toEqual({
        data: [],
        meta: {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
        },
      });
    });

    it('should cap limit at 100', async () => {
      mockHotelRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ page: 1, limit: 250 });

      expect(mockHotelRepository.findAndCount).toHaveBeenCalledWith({
        skip: 0,
        take: 100,
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('update', () => {
    const updateDto: UpdateHotelDto = {
      name: 'Updated Grand Hotel',
      starRating: 4,
    };

    it('should successfully update and return the hotel', async () => {
      mockHotelRepository.findOne.mockResolvedValue(mockHotel);
      const updatedHotel = { ...mockHotel, ...updateDto };
      mockHotelRepository.save.mockResolvedValue(updatedHotel);

      const result = await service.update(mockHotel.id, updateDto);

      expect(mockHotelRepository.save).toHaveBeenCalled();
      expect(result.name).toBe('Updated Grand Hotel');
    });

    it('should throw NotFoundException if hotel to update does not exist', async () => {
      mockHotelRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update('non-existent-uuid', updateDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if updated slug belongs to another hotel', async () => {
      mockHotelRepository.findOne.mockImplementation(async ({ where }: any) => {
        if (where?.id === mockHotel.id) return mockHotel;
        if (where?.slug === 'conflicting-slug')
          return { id: 'different-uuid', slug: 'conflicting-slug' };
        return null;
      });

      await expect(
        service.update(mockHotel.id, { slug: 'conflicting-slug' }),
      ).rejects.toThrow(ConflictException);
      await expect(
        service.update(mockHotel.id, { slug: 'conflicting-slug' }),
      ).rejects.toThrow('Hotel with slug "conflicting-slug" already exists');
    });

    it('should throw ConflictException if updated email belongs to another hotel', async () => {
      mockHotelRepository.findOne.mockImplementation(async ({ where }: any) => {
        if (where?.id === mockHotel.id) return mockHotel;
        if (where?.email === 'taken@example.com')
          return { id: 'different-uuid', email: 'taken@example.com' };
        return null;
      });

      await expect(
        service.update(mockHotel.id, { email: 'taken@example.com' }),
      ).rejects.toThrow(ConflictException);
      await expect(
        service.update(mockHotel.id, { email: 'taken@example.com' }),
      ).rejects.toThrow('Hotel with email "taken@example.com" already exists');
    });

    it('should allow updating when slug or email belongs to the same hotel', async () => {
      mockHotelRepository.findOne.mockResolvedValue(mockHotel);
      mockHotelRepository.save.mockResolvedValue(mockHotel);

      const result = await service.update(mockHotel.id, { slug: mockHotel.slug });
      expect(result).toBeDefined();
    });

    it('should handle 23505 unique constraint conflict on save during update', async () => {
      mockHotelRepository.findOne.mockResolvedValue(mockHotel);
      mockHotelRepository.save.mockRejectedValue({ code: '23505' });

      await expect(
        service.update(mockHotel.id, { name: 'New Name' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should delete a hotel successfully', async () => {
      mockHotelRepository.findOne.mockResolvedValue(mockHotel);
      mockHotelRepository.remove.mockResolvedValue(mockHotel);

      await expect(service.remove(mockHotel.id)).resolves.toBeUndefined();
      expect(mockHotelRepository.remove).toHaveBeenCalledWith(mockHotel);
    });

    it('should throw NotFoundException if hotel does not exist', async () => {
      mockHotelRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('missing-id')).rejects.toThrow(NotFoundException);
    });
  });
});
