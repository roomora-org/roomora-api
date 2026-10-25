import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { GuestsService } from './guests.service.js';
import { Guest } from './entities/guest.entity.js';
import { Hotel } from '../hotels/entities/hotel.entity.js';
import { GetGuestsQueryDto } from './dto/get-guests-query.dto.js';
import { CreateGuestDto } from './dto/create-guest.dto.js';
import { UpdateGuestDto } from './dto/update-guest.dto.js';

describe('GuestsService', () => {
  let service: GuestsService;
  let guestRepository: Repository<Guest>;
  let hotelRepository: Repository<Hotel>;

  const mockHotel: Hotel = {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    name: 'Roomora Grand Hotel',
    slug: 'roomora-grand-hotel',
    description: 'A 5-star hotel',
    email: 'hotel@roomora.com',
    phone: '+1-555-0100',
    alternativePhone: null,
    country: 'United States',
    city: 'New York',
    address: '100 Park Ave',
    postalCode: '10001',
    logoUrl: 'https://cdn.roomora.com/logo.png',
    starRating: 5,
    timeZone: 'America/New_York',
    checkInTime: '15:00',
    checkOutTime: '11:00',
    status: 'ACTIVE' as any,
    employees: [] as any,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    createdBy: null,
    updatedBy: null,
  };

  const mockGuest: Guest = {
    id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22',
    hotelId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    hotel: mockHotel,
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane.doe@example.com',
    phone: '+1-555-0144',
    dateOfBirth: new Date('1990-05-15'),
    nationality: 'American',
    countryOfResidence: 'United States',
    city: 'New York',
    address: '456 Park Avenue',
    passportNumber: 'US987654321',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    createdBy: 'internal-user-id',
    updatedBy: 'internal-user-id',
  };

  const mockQueryBuilder = {
    andWhere: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    skip: vi.fn().mockReturnThis(),
    take: vi.fn().mockReturnThis(),
    getManyAndCount: vi.fn(),
  };

  const mockGuestRepository = {
    create: vi.fn(),
    save: vi.fn(),
    findOne: vi.fn(),
    createQueryBuilder: vi.fn().mockReturnValue(mockQueryBuilder),
  };

  const mockHotelRepository = {
    findOne: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    mockGuestRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GuestsService,
        {
          provide: getRepositoryToken(Guest),
          useValue: mockGuestRepository,
        },
        {
          provide: getRepositoryToken(Hotel),
          useValue: mockHotelRepository,
        },
      ],
    }).compile();

    service = module.get<GuestsService>(GuestsService);
    guestRepository = module.get<Repository<Guest>>(getRepositoryToken(Guest));
    hotelRepository = module.get<Repository<Hotel>>(getRepositoryToken(Hotel));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(guestRepository).toBeDefined();
    expect(hotelRepository).toBeDefined();
  });

  describe('create', () => {
    const createDto: CreateGuestDto = {
      hotelId: mockHotel.id,
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane.doe@example.com',
      phone: '+1-555-0144',
      dateOfBirth: '1990-05-15',
      nationality: 'American',
      countryOfResidence: 'United States',
      city: 'New York',
      address: '456 Park Avenue',
      passportNumber: 'US987654321',
    };

    it('should create a guest successfully and strip internal fields', async () => {
      mockHotelRepository.findOne.mockResolvedValue(mockHotel);
      mockGuestRepository.findOne.mockResolvedValue(null);
      mockGuestRepository.create.mockReturnValue(mockGuest);
      mockGuestRepository.save.mockResolvedValue(mockGuest);

      const result = await service.create(createDto);

      expect(mockHotelRepository.findOne).toHaveBeenCalledWith({
        where: { id: createDto.hotelId },
      });
      expect(mockGuestRepository.findOne).toHaveBeenCalledWith({
        where: { passportNumber: 'US987654321' },
      });
      expect(mockGuestRepository.save).toHaveBeenCalled();
      expect(result.id).toBe(mockGuest.id);
      expect((result as any).createdBy).toBeUndefined();
      expect((result as any).updatedBy).toBeUndefined();
    });

    it('should accept documentNumber as alias for passportNumber', async () => {
      const dtoWithDocNum: CreateGuestDto = {
        hotelId: mockHotel.id,
        firstName: 'Jane',
        lastName: 'Doe',
        phone: '+1-555-0144',
        documentNumber: 'DOC-12345',
      };
      mockHotelRepository.findOne.mockResolvedValue(mockHotel);
      mockGuestRepository.findOne.mockResolvedValue(null);
      mockGuestRepository.create.mockReturnValue({
        ...mockGuest,
        passportNumber: 'DOC-12345',
      });
      mockGuestRepository.save.mockResolvedValue({
        ...mockGuest,
        passportNumber: 'DOC-12345',
      });

      const result = await service.create(dtoWithDocNum);

      expect(mockGuestRepository.findOne).toHaveBeenCalledWith({
        where: { passportNumber: 'DOC-12345' },
      });
      expect(result.passportNumber).toBe('DOC-12345');
    });

    it('should throw NotFoundException if referenced hotel does not exist', async () => {
      mockHotelRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.create(createDto)).rejects.toThrow(
        `Hotel with ID "${createDto.hotelId}" not found`,
      );
      expect(mockGuestRepository.save).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if passport number already exists', async () => {
      mockHotelRepository.findOne.mockResolvedValue(mockHotel);
      mockGuestRepository.findOne.mockResolvedValue(mockGuest);

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(createDto)).rejects.toThrow(
        'Guest with passport / document number "US987654321" already exists',
      );
      expect(mockGuestRepository.save).not.toHaveBeenCalled();
    });

    it('should handle unique constraint 23505 error on save', async () => {
      mockHotelRepository.findOne.mockResolvedValue(mockHotel);
      mockGuestRepository.findOne.mockResolvedValue(null);
      mockGuestRepository.create.mockReturnValue(mockGuest);
      mockGuestRepository.save.mockRejectedValue({ code: '23505' });

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('update', () => {
    const updateDto: UpdateGuestDto = {
      firstName: 'Janet',
      phone: '+1-555-9999',
    };

    it('should update allowed fields successfully', async () => {
      mockGuestRepository.findOne.mockResolvedValue({ ...mockGuest });
      const updatedGuest = { ...mockGuest, firstName: 'Janet', phone: '+1-555-9999' };
      mockGuestRepository.save.mockResolvedValue(updatedGuest);

      const result = await service.update(mockGuest.id, updateDto);

      expect(result.firstName).toBe('Janet');
      expect(mockGuestRepository.save).toHaveBeenCalled();
    });

    it('should prevent updating non-editable fields (hotelId, id, audit timestamps)', async () => {
      const maliciousDto: any = {
        id: 'new-id',
        hotelId: 'different-hotel-id',
        createdAt: new Date(),
        updatedAt: new Date(),
        firstName: 'Janet',
      };
      const existing = { ...mockGuest };
      mockGuestRepository.findOne.mockResolvedValue(existing);
      mockGuestRepository.save.mockImplementation(async (g) => g);

      const result = await service.update(mockGuest.id, maliciousDto);

      expect(result.id).toBe(mockGuest.id);
      expect(result.hotelId).toBe(mockGuest.hotelId);
    });

    it('should throw NotFoundException if guest does not exist', async () => {
      mockGuestRepository.findOne.mockResolvedValue(null);

      await expect(service.update('missing-id', updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException if updated passport is already used by another guest', async () => {
      mockGuestRepository.findOne.mockImplementation(async ({ where }: any) => {
        if (where?.id === mockGuest.id) return { ...mockGuest };
        if (where?.passportNumber === 'CONFLICT99') {
          return { ...mockGuest, id: 'different-guest-id', passportNumber: 'CONFLICT99' };
        }
        return null;
      });

      await expect(
        service.update(mockGuest.id, { passportNumber: 'CONFLICT99' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should allow updating passport to its current value without conflict', async () => {
      mockGuestRepository.findOne.mockResolvedValue({ ...mockGuest });
      mockGuestRepository.save.mockImplementation(async (g) => g);

      const result = await service.update(mockGuest.id, {
        passportNumber: mockGuest.passportNumber,
      });

      expect(result.passportNumber).toBe(mockGuest.passportNumber);
    });

    it('should handle unique constraint 23505 error on save during update', async () => {
      mockGuestRepository.findOne.mockResolvedValue({ ...mockGuest });
      mockGuestRepository.save.mockRejectedValue({ code: '23505' });

      await expect(
        service.update(mockGuest.id, { firstName: 'Janet' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findOne', () => {
    it('should return guest by ID and strip sensitive internal fields', async () => {
      const sensitiveGuest = {
        ...mockGuest,
        password: 'hashed-secret-password',
        passwordHash: '$2b$10$abcdef',
        internalSecrets: 'internal-api-key',
      };
      mockGuestRepository.findOne.mockResolvedValue(sensitiveGuest);

      const result = await service.findOne(mockGuest.id);

      expect(mockGuestRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockGuest.id },
      });
      expect(result.id).toBe(mockGuest.id);
      expect(result.firstName).toBe('Jane');
      expect((result as any).password).toBeUndefined();
      expect((result as any).passwordHash).toBeUndefined();
      expect((result as any).internalSecrets).toBeUndefined();
      expect((result as any).createdBy).toBeUndefined();
      expect((result as any).updatedBy).toBeUndefined();
    });

    it('should throw NotFoundException when guest does not exist', async () => {
      mockGuestRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent-uuid')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('non-existent-uuid')).rejects.toThrow(
        'Guest with ID "non-existent-uuid" not found',
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated guests with default query parameters', async () => {
      const guests = [mockGuest];
      mockQueryBuilder.getManyAndCount.mockResolvedValue([guests, 1]);

      const result = await service.findAll();

      expect(mockGuestRepository.createQueryBuilder).toHaveBeenCalledWith('guest');
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('guest.createdAt', 'DESC');
      expect(result).toEqual({
        data: [
          expect.objectContaining({
            id: mockGuest.id,
            firstName: 'Jane',
            lastName: 'Doe',
            email: 'jane.doe@example.com',
          }),
        ],
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      });
      // Sensitive fields must be stripped in list items too
      expect((result.data[0] as any).createdBy).toBeUndefined();
    });

    it('should filter by hotelId when provided in queryDto', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[mockGuest], 1]);

      const queryDto: GetGuestsQueryDto = {
        hotelId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      };
      await service.findAll(queryDto);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'guest.hotelId = :hotelId',
        { hotelId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' },
      );
    });

    it('should prioritize tenantHotelId parameter over queryDto.hotelId for tenant isolation', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[mockGuest], 1]);

      const queryDto: GetGuestsQueryDto = {
        hotelId: 'client-supplied-hotel-id',
      };
      const tenantContextHotelId = 'tenant-context-hotel-id';

      await service.findAll(queryDto, tenantContextHotelId);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'guest.hotelId = :hotelId',
        { hotelId: tenantContextHotelId },
      );
    });

    it('should filter by name (first name, last name, or full name)', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[mockGuest], 1]);

      await service.findAll({ name: 'Jane' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(LOWER(guest.firstName) LIKE LOWER(:name) OR LOWER(guest.lastName) LIKE LOWER(:name) OR LOWER(CONCAT(guest.firstName, \' \', guest.lastName)) LIKE LOWER(:name))',
        { name: '%Jane%' },
      );
    });

    it('should filter by email', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[mockGuest], 1]);

      await service.findAll({ email: 'jane.doe@example.com' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'LOWER(guest.email) LIKE LOWER(:email)',
        { email: '%jane.doe@example.com%' },
      );
    });

    it('should filter by phone', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[mockGuest], 1]);

      await service.findAll({ phone: '+1-555' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'guest.phone LIKE :phone',
        { phone: '%+1-555%' },
      );
    });

    it('should filter by documentNumber against passportNumber', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[mockGuest], 1]);

      await service.findAll({ documentNumber: 'US9876' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'LOWER(guest.passportNumber) LIKE LOWER(:docNum)',
        { docNum: '%US9876%' },
      );
    });

    it('should filter by passportNumber alias against passportNumber', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[mockGuest], 1]);

      await service.findAll({ passportNumber: 'US9876' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'LOWER(guest.passportNumber) LIKE LOWER(:docNum)',
        { docNum: '%US9876%' },
      );
    });

    it('should calculate pagination boundaries properly', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 33]);

      const result = await service.findAll({ page: 4, limit: 10 });

      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(30);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
      expect(result.meta).toEqual({
        total: 33,
        page: 4,
        limit: 10,
        totalPages: 4,
      });
    });

    it('should handle zero total records correctly', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

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
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ page: 1, limit: 300 });

      expect(mockQueryBuilder.take).toHaveBeenCalledWith(100);
    });
  });
});
