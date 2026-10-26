import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { Hotel } from '../hotels/entities/hotel.entity.js';
import { CreateGuestDto } from './dto/create-guest.dto.js';
import { UpdateGuestDto } from './dto/update-guest.dto.js';
import { Guest } from './entities/guest.entity.js';

const PASSPORT_NUMBER_UNIQUE_CONSTRAINT =
  'UQ_ad0d24a41c323b2277239898efb';
const GUEST_HOTEL_FOREIGN_KEY = 'FK_7530415f4d7c969101ec8424df2';

/**
 * Tenant and audit assumptions for this feature:
 * - Authentication is not wired yet. Create checks that hotelId identifies an
 *   existing hotel, but it does not authorize the caller for that hotel.
 * - When authentication is added, derive the allowed hotel from the current
 *   tenant and scope guest lookups/updates to that hotel. Do not trust a body
 *   hotelId as authorization.
 * - TypeORM manages createdAt/updatedAt. No authenticated actor is available
 *   yet, so createdBy is null on create and updatedBy is left unchanged on edit.
 */
@Injectable()
export class GuestsService {
  constructor(
    @InjectRepository(Guest)
    private readonly guestsRepository: Repository<Guest>,
    @InjectRepository(Hotel)
    private readonly hotelsRepository: Repository<Hotel>,
  ) {}

  async create(createGuestDto: CreateGuestDto): Promise<Guest> {
    const hotel = await this.hotelsRepository.findOneBy({
      id: createGuestDto.hotelId,
    });

    if (!hotel) {
      throw new NotFoundException('Hotel not found.');
    }

    await this.assertPassportNumberAvailable(createGuestDto.passportNumber);

    const guest = this.guestsRepository.create({
      hotelId: hotel.id,
      hotel,
      firstName: createGuestDto.firstName,
      lastName: createGuestDto.lastName,
      email: createGuestDto.email ?? null,
      phone: createGuestDto.phone,
      dateOfBirth: this.toDate(createGuestDto.dateOfBirth),
      nationality: createGuestDto.nationality ?? null,
      countryOfResidence: createGuestDto.countryOfResidence ?? null,
      city: createGuestDto.city ?? null,
      address: createGuestDto.address ?? null,
      passportNumber: createGuestDto.passportNumber ?? null,
      documentType: createGuestDto.documentType ?? null,
      createdBy: null,
      updatedBy: null,
    });

    return this.saveGuest(guest);
  }

  findAll() {
    return `This action returns all guests`;
  }

  findOne(id: number) {
    return `This action returns a #${id} guest`;
  }

  async update(id: string, updateGuestDto: UpdateGuestDto): Promise<Guest> {
    const guest = await this.guestsRepository.findOneBy({ id });

    if (!guest) {
      throw new NotFoundException('Guest not found.');
    }

    await this.assertPassportNumberAvailable(
      updateGuestDto.passportNumber,
      guest.id,
    );

    if (updateGuestDto.firstName !== undefined) {
      guest.firstName = updateGuestDto.firstName;
    }

    if (updateGuestDto.lastName !== undefined) {
      guest.lastName = updateGuestDto.lastName;
    }

    if (updateGuestDto.email !== undefined) {
      guest.email = updateGuestDto.email;
    }

    if (updateGuestDto.phone !== undefined) {
      guest.phone = updateGuestDto.phone;
    }

    if (updateGuestDto.dateOfBirth !== undefined) {
      guest.dateOfBirth = this.toDate(updateGuestDto.dateOfBirth);
    }

    if (updateGuestDto.nationality !== undefined) {
      guest.nationality = updateGuestDto.nationality;
    }

    if (updateGuestDto.countryOfResidence !== undefined) {
      guest.countryOfResidence = updateGuestDto.countryOfResidence;
    }

    if (updateGuestDto.city !== undefined) {
      guest.city = updateGuestDto.city;
    }

    if (updateGuestDto.address !== undefined) {
      guest.address = updateGuestDto.address;
    }

    if (updateGuestDto.passportNumber !== undefined) {
      guest.passportNumber = updateGuestDto.passportNumber;
    }

    if (updateGuestDto.documentType !== undefined) {
      guest.documentType = updateGuestDto.documentType;
    }

    return this.saveGuest(guest);
  }

  remove(id: number) {
    return `This action removes a #${id} guest`;
  }

  private async assertPassportNumberAvailable(
    passportNumber: string | null | undefined,
    currentGuestId?: string,
  ): Promise<void> {
    if (passportNumber == null) {
      return;
    }

    const guestWithPassport = await this.guestsRepository.findOneBy({
      passportNumber,
    });

    if (guestWithPassport && guestWithPassport.id !== currentGuestId) {
      throw new ConflictException(
        'A guest with this passport number already exists.',
      );
    }
  }

  private toDate(value: string | null | undefined): Date | null {
    return value == null ? null : new Date(value);
  }

  private async saveGuest(guest: Guest): Promise<Guest> {
    try {
      return await this.guestsRepository.save(guest);
    } catch (error) {
      this.rethrowGuestPersistenceError(error);
    }
  }

  private rethrowGuestPersistenceError(error: unknown): never {
    if (error instanceof QueryFailedError) {
      const driverError = error.driverError as {
        code?: string;
        constraint?: string;
      };

      if (
        driverError.code === '23505' &&
        driverError.constraint === PASSPORT_NUMBER_UNIQUE_CONSTRAINT
      ) {
        throw new ConflictException(
          'A guest with this passport number already exists.',
        );
      }

      if (
        driverError.code === '23503' &&
        driverError.constraint === GUEST_HOTEL_FOREIGN_KEY
      ) {
        throw new NotFoundException('Hotel not found.');
      }
    }

    throw error;
  }
}