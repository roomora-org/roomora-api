import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { GuestsController } from './guests.controller.js';
import { GuestsService } from './guests.service.js';
import { Guest } from './entities/guest.entity.js';
import { CreateGuestDto } from './dto/create-guest.dto.js';
import { UpdateGuestDto } from './dto/update-guest.dto.js';
import { GetGuestsQueryDto } from './dto/get-guests-query.dto.js';

describe('GuestsController', () => {
  let controller: GuestsController;
  let service: GuestsService;

  const mockGuest: Guest = {
    id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22',
    hotelId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    hotel: {} as any,
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
    createdBy: null,
    updatedBy: null,
  };

  const mockGuestsService = {
    create: vi.fn(),
    findAll: vi.fn(),
    findOne: vi.fn(),
    update: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GuestsController],
      providers: [
        {
          provide: GuestsService,
          useValue: mockGuestsService,
        },
      ],
    }).compile();

    controller = module.get<GuestsController>(GuestsController);
    service = module.get<GuestsService>(GuestsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto: CreateGuestDto = {
      hotelId: mockGuest.hotelId,
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane.doe@example.com',
      phone: '+1-555-0144',
      passportNumber: 'US987654321',
    };

    it('should call guestsService.create and return created guest', async () => {
      mockGuestsService.create.mockResolvedValue(mockGuest);

      const result = await controller.create(createDto);

      expect(mockGuestsService.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockGuest);
    });

    it('should propagate NotFoundException when hotel does not exist', async () => {
      mockGuestsService.create.mockRejectedValue(
        new NotFoundException('Hotel not found'),
      );

      await expect(controller.create(createDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should propagate ConflictException when passport already exists', async () => {
      mockGuestsService.create.mockRejectedValue(
        new ConflictException('Passport exists'),
      );

      await expect(controller.create(createDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findAll', () => {
    it('should call guestsService.findAll with query parameters and return result', async () => {
      const queryDto: GetGuestsQueryDto = {
        name: 'Jane',
        page: 1,
        limit: 10,
      };
      const expectedResponse = {
        data: [mockGuest],
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      };
      mockGuestsService.findAll.mockResolvedValue(expectedResponse);

      const result = await controller.findAll(queryDto);

      expect(mockGuestsService.findAll).toHaveBeenCalledWith(queryDto);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('findOne', () => {
    it('should call guestsService.findOne with ID and return guest', async () => {
      mockGuestsService.findOne.mockResolvedValue(mockGuest);

      const result = await controller.findOne(mockGuest.id);

      expect(mockGuestsService.findOne).toHaveBeenCalledWith(mockGuest.id);
      expect(result).toEqual(mockGuest);
    });

    it('should propagate NotFoundException when guest does not exist', async () => {
      mockGuestsService.findOne.mockRejectedValue(
        new NotFoundException('Guest not found'),
      );

      await expect(controller.findOne('non-existent-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const updateDto: UpdateGuestDto = {
      firstName: 'Janet',
      phone: '+1-555-9999',
    };

    it('should call guestsService.update with ID and payload', async () => {
      const updated = { ...mockGuest, firstName: 'Janet' };
      mockGuestsService.update.mockResolvedValue(updated);

      const result = await controller.update(mockGuest.id, updateDto);

      expect(mockGuestsService.update).toHaveBeenCalledWith(
        mockGuest.id,
        updateDto,
      );
      expect(result).toEqual(updated);
    });

    it('should propagate NotFoundException when guest does not exist', async () => {
      mockGuestsService.update.mockRejectedValue(
        new NotFoundException('Guest not found'),
      );

      await expect(
        controller.update('missing-uuid', updateDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should propagate ConflictException when update conflicts', async () => {
      mockGuestsService.update.mockRejectedValue(
        new ConflictException('Passport conflict'),
      );

      await expect(
        controller.update(mockGuest.id, updateDto),
      ).rejects.toThrow(ConflictException);
    });
  });
});
