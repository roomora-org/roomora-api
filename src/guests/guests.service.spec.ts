import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { type Repository } from 'typeorm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Hotel } from '../hotels/entities/hotel.entity.js';
import { CreateGuestDto } from './dto/create-guest.dto.js';
import { UpdateGuestDto } from './dto/update-guest.dto.js';
import { Guest } from './entities/guest.entity.js';
import { GuestsService } from './guests.service.js';

const HOTEL_ID = '11111111-1111-4111-8111-111111111111';
const GUEST_ID = '22222222-2222-4222-8222-222222222222';

function makeService() {
  const guestsRepository = {
    create: vi.fn(),
    save: vi.fn(),
    findOneBy: vi.fn(),
  };

  const hotelsRepository = {
    findOneBy: vi.fn(),
  };

  const service = new GuestsService(
    guestsRepository as unknown as Repository<Guest>,
    hotelsRepository as unknown as Repository<Hotel>,
  );

  return { service, guestsRepository, hotelsRepository };
}

describe('GuestsService', () => {
  let service: GuestsService;
  let guestsRepository: ReturnType<typeof makeService>['guestsRepository'];
  let hotelsRepository: ReturnType<typeof makeService>['hotelsRepository'];

  beforeEach(() => {
    const mocks = makeService();
    service = mocks.service;
    guestsRepository = mocks.guestsRepository;
    hotelsRepository = mocks.hotelsRepository;
  });

  it('creates and saves a guest when the hotel exists', async () => {
    const dto: CreateGuestDto = {
      hotelId: HOTEL_ID,
      firstName: 'Tala',
      lastName: 'Salim',
      phone: '+14155552671',
    };

    const guest = {
      id: GUEST_ID,
      ...dto,
      dateOfBirth: null,
    } as unknown as Guest;

    hotelsRepository.findOneBy.mockResolvedValue({ id: HOTEL_ID });
    guestsRepository.create.mockReturnValue(guest);
    guestsRepository.save.mockResolvedValue(guest);

    await expect(service.create(dto)).resolves.toBe(guest);

    expect(guestsRepository.save).toHaveBeenCalledWith(guest);
  });

  it('rejects creation when the hotel does not exist', async () => {
    hotelsRepository.findOneBy.mockResolvedValue(null);

    await expect(
      service.create({
        hotelId: HOTEL_ID,
        firstName: 'Tala',
        lastName: 'Salim',
        phone: '+14155552671',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(guestsRepository.save).not.toHaveBeenCalled();
  });

  it('returns a conflict when the passport number is duplicated', async () => {
    hotelsRepository.findOneBy.mockResolvedValue({ id: HOTEL_ID });
    guestsRepository.create.mockReturnValue({} as Guest);
    guestsRepository.save.mockRejectedValue({
      driverError: { code: '23505' },
    });

    await expect(
      service.create({
        hotelId: HOTEL_ID,
        firstName: 'Tala',
        lastName: 'Salim',
        phone: '+14155552671',
        passportNumber: 'P123456',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('updates an existing guest', async () => {
    const guest = {
      id: GUEST_ID,
      firstName: 'Old',
      lastName: 'Name',
      phone: '+14155552671',
      dateOfBirth: null,
    } as Guest;

    const dto: UpdateGuestDto = { firstName: 'New' };

    guestsRepository.findOneBy.mockResolvedValue(guest);
    guestsRepository.save.mockResolvedValue(guest);

    const result = await service.update(GUEST_ID, dto);

    expect(guestsRepository.findOneBy).toHaveBeenCalledWith({ id: GUEST_ID });
    expect(result.firstName).toBe('New');
    expect(guestsRepository.save).toHaveBeenCalledWith(guest);
  });

  it('returns not found when updating a guest that does not exist', async () => {
    guestsRepository.findOneBy.mockResolvedValue(null);

    await expect(
      service.update(GUEST_ID, { firstName: 'New' }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(guestsRepository.save).not.toHaveBeenCalled();
  });

  it('rejects an empty update', async () => {
    await expect(
      service.update(GUEST_ID, {}),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(guestsRepository.findOneBy).not.toHaveBeenCalled();
  });
});