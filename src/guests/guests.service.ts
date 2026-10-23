import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { type Repository } from 'typeorm';
import { Hotel } from '../hotels/entities/hotel.entity.js';
import { CreateGuestDto } from './dto/create-guest.dto.js';
import { UpdateGuestDto } from './dto/update-guest.dto.js';
import { Guest } from './entities/guest.entity.js';

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
      throw new NotFoundException('Hotel not found');
    }

    const guest = this.guestsRepository.create({
      ...createGuestDto,
      dateOfBirth: this.parseDate(createGuestDto.dateOfBirth),
    });

    return this.saveGuest(guest);
  }

  findAll() {
    return `This action returns all guests`;
  }

  findOne(id: string) {
    return `This action returns a #${id} guest`;
  }

  async update(id: string, updateGuestDto: UpdateGuestDto): Promise<Guest> {
    if (Object.keys(updateGuestDto).length === 0) {
      throw new BadRequestException('Provide at least one field to update');
    }

    const guest = await this.guestsRepository.findOneBy({ id });

    if (!guest) {
      throw new NotFoundException('Guest not found');
    }

    const { dateOfBirth, ...editableFields } = updateGuestDto;
    Object.assign(guest, editableFields);

    if (dateOfBirth !== undefined) {
      guest.dateOfBirth = this.parseDate(dateOfBirth);
    }

    return this.saveGuest(guest);
  }

  remove(id: string) {
    return `This action removes a #${id} guest`;
  }

  private parseDate(value: string | null | undefined): Date | null {
    if (!value) {
      return null;
    }

    return new Date(`${value}T00:00:00.000Z`);
  }

  private async saveGuest(guest: Guest): Promise<Guest> {
    try {
      return await this.guestsRepository.save(guest);
    } catch (error) {
      const driverError = (
        error as { driverError?: { code?: string } }
      ).driverError;

      if (driverError?.code === '23505') {
        throw new ConflictException(
          'A guest with this passport number already exists',
        );
      }

      throw error;
    }
  }
}