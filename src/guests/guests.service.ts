import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Guest } from './entities/guest.entity.js';
import { Hotel } from '../hotels/entities/hotel.entity.js';
import { CreateGuestDto } from './dto/create-guest.dto.js';
import { UpdateGuestDto } from './dto/update-guest.dto.js';
import { GetGuestsQueryDto } from './dto/get-guests-query.dto.js';
import { PaginatedResponse } from '../common/interfaces/paginated-response.interface.js';

@Injectable()
export class GuestsService {
  constructor(
    @InjectRepository(Guest)
    private readonly guestRepository: Repository<Guest>,
    @InjectRepository(Hotel)
    private readonly hotelRepository: Repository<Hotel>,
  ) {}

  /**
   * Sanitizes guest entity payload to prevent leaking sensitive or internal fields.
   * Strips password hashes, internal secrets, and internal audit fields.
   */
  private sanitizeGuest(guest: Guest): Guest {
    const sanitized = { ...guest };
    delete (sanitized as any).password;
    delete (sanitized as any).passwordHash;
    delete (sanitized as any).internalSecrets;
    delete (sanitized as any).createdBy;
    delete (sanitized as any).updatedBy;
    return sanitized as Guest;
  }

  /**
   * Creates a new guest record.
   *
   * Tenancy and validation:
   * - Validates that the hotel referenced by `hotelId` exists in the database.
   * - Checks that the passport / document number is not already registered.
   * - Strips server-managed and internal audit properties before persistence.
   *
   * Note on future tenant authorization:
   * When authentication/authorization guards are introduced, the active tenant's hotelId
   * can be cross-verified against `createGuestDto.hotelId` to ensure the caller has rights
   * to create guests under that tenant.
   */
  async create(createGuestDto: CreateGuestDto): Promise<Guest> {
    // 1. Validate that the hotel exists
    const hotel = await this.hotelRepository.findOne({
      where: { id: createGuestDto.hotelId },
    });
    if (!hotel) {
      throw new NotFoundException(
        `Hotel with ID "${createGuestDto.hotelId}" not found`,
      );
    }

    // 2. Resolve passport / document number
    const effectivePassportNumber =
      createGuestDto.passportNumber?.trim() ||
      createGuestDto.documentNumber?.trim() ||
      null;

    // 3. Pre-check passport number uniqueness
    if (effectivePassportNumber) {
      const existing = await this.guestRepository.findOne({
        where: { passportNumber: effectivePassportNumber },
      });
      if (existing) {
        throw new ConflictException(
          `Guest with passport / document number "${effectivePassportNumber}" already exists`,
        );
      }
    }

    // 4. Instantiate guest entity with only permitted fields
    const guest = this.guestRepository.create({
      hotelId: createGuestDto.hotelId,
      firstName: createGuestDto.firstName.trim(),
      lastName: createGuestDto.lastName.trim(),
      email: createGuestDto.email ? createGuestDto.email.trim().toLowerCase() : null,
      phone: createGuestDto.phone.trim(),
      dateOfBirth: createGuestDto.dateOfBirth
        ? new Date(createGuestDto.dateOfBirth)
        : null,
      nationality: createGuestDto.nationality?.trim() || null,
      countryOfResidence: createGuestDto.countryOfResidence?.trim() || null,
      city: createGuestDto.city?.trim() || null,
      address: createGuestDto.address?.trim() || null,
      passportNumber: effectivePassportNumber,
    });

    try {
      const savedGuest = await this.guestRepository.save(guest);
      return this.sanitizeGuest(savedGuest);
    } catch (error: any) {
      if (error?.code === '23505') {
        throw new ConflictException(
          'A guest with the provided passport / document number already exists',
        );
      }
      throw error;
    }
  }

  /**
   * Updates an existing guest record by UUID.
   *
   * Tenancy and validation:
   * - Throws NotFoundException if the guest does not exist.
   * - Prevents updating non-editable attributes (hotelId, id, audit timestamps).
   * - Checks for unique constraint conflicts when updating passport / document number.
   */
  async update(id: string, updateGuestDto: UpdateGuestDto): Promise<Guest> {
    // 1. Verify existence
    const guest = await this.guestRepository.findOne({
      where: { id },
    });
    if (!guest) {
      throw new NotFoundException(`Guest with ID "${id}" not found`);
    }

    // 2. Protect server-managed and tenant fields
    delete (updateGuestDto as any).id;
    delete (updateGuestDto as any).hotelId;
    delete (updateGuestDto as any).createdAt;
    delete (updateGuestDto as any).updatedAt;
    delete (updateGuestDto as any).createdBy;
    delete (updateGuestDto as any).updatedBy;

    // 3. Resolve passport / document number update
    const effectivePassportNumber =
      updateGuestDto.passportNumber !== undefined
        ? updateGuestDto.passportNumber?.trim() || null
        : updateGuestDto.documentNumber !== undefined
          ? updateGuestDto.documentNumber?.trim() || null
          : undefined;

    if (
      effectivePassportNumber !== undefined &&
      effectivePassportNumber !== null &&
      effectivePassportNumber !== guest.passportNumber
    ) {
      const existingWithPassport = await this.guestRepository.findOne({
        where: { passportNumber: effectivePassportNumber },
      });
      if (existingWithPassport && existingWithPassport.id !== id) {
        throw new ConflictException(
          `Guest with passport / document number "${effectivePassportNumber}" already exists`,
        );
      }
    }

    // 4. Update allowed fields
    if (updateGuestDto.firstName !== undefined) {
      guest.firstName = updateGuestDto.firstName.trim();
    }
    if (updateGuestDto.lastName !== undefined) {
      guest.lastName = updateGuestDto.lastName.trim();
    }
    if (updateGuestDto.email !== undefined) {
      guest.email = updateGuestDto.email
        ? updateGuestDto.email.trim().toLowerCase()
        : null;
    }
    if (updateGuestDto.phone !== undefined) {
      guest.phone = updateGuestDto.phone.trim();
    }
    if (updateGuestDto.dateOfBirth !== undefined) {
      guest.dateOfBirth = updateGuestDto.dateOfBirth
        ? new Date(updateGuestDto.dateOfBirth)
        : null;
    }
    if (updateGuestDto.nationality !== undefined) {
      guest.nationality = updateGuestDto.nationality?.trim() || null;
    }
    if (updateGuestDto.countryOfResidence !== undefined) {
      guest.countryOfResidence =
        updateGuestDto.countryOfResidence?.trim() || null;
    }
    if (updateGuestDto.city !== undefined) {
      guest.city = updateGuestDto.city?.trim() || null;
    }
    if (updateGuestDto.address !== undefined) {
      guest.address = updateGuestDto.address?.trim() || null;
    }
    if (effectivePassportNumber !== undefined) {
      guest.passportNumber = effectivePassportNumber;
    }

    try {
      const updatedGuest = await this.guestRepository.save(guest);
      return this.sanitizeGuest(updatedGuest);
    } catch (error: any) {
      if (error?.code === '23505') {
        throw new ConflictException(
          'A guest with the provided passport / document number already exists',
        );
      }
      throw error;
    }
  }

  /**
   * Retrieves a single guest by UUID.
   * Throws NotFoundException if missing.
   * Ensures sensitive fields are excluded from the response.
   */
  async findOne(id: string): Promise<Guest> {
    const guest = await this.guestRepository.findOne({
      where: { id },
    });

    if (!guest) {
      throw new NotFoundException(`Guest with ID "${id}" not found`);
    }

    return this.sanitizeGuest(guest);
  }

  /**
   * Searches and retrieves a paginated list of guests with flexible filtering.
   *
   * Multi-Tenant Context Contract:
   * Multi-tenancy isolation can be enforced by passing the tenant's hotel context
   * via the optional `tenantHotelId` parameter. When authentication/authorization
   * guards (e.g. TenantGuard) are integrated in subsequent iterations, they should extract
   * the active `hotelId` from request context / JWT claims and pass it here to guarantee
   * tenant data isolation. If omitted, `queryDto.hotelId` is respected if provided.
   *
   * @param queryDto Query parameters containing pagination & search filters
   * @param tenantHotelId Optional tenant hotel UUID injected by caller/context
   */
  async findAll(
    queryDto?: GetGuestsQueryDto,
    tenantHotelId?: string,
  ): Promise<PaginatedResponse<Guest>> {
    const page =
      queryDto?.page && queryDto.page > 0 ? Number(queryDto.page) : 1;
    const limit =
      queryDto?.limit && queryDto.limit > 0
        ? Math.min(Number(queryDto.limit), 100)
        : 10;
    const skip = (page - 1) * limit;

    const query = this.guestRepository.createQueryBuilder('guest');

    // 1. Multi-Tenant Isolation: Enforce tenant hotelId context
    const scopedHotelId = tenantHotelId || queryDto?.hotelId;
    if (scopedHotelId) {
      query.andWhere('guest.hotelId = :hotelId', { hotelId: scopedHotelId });
    }

    // 2. Name search: matches first name, last name, or concatenated full name
    if (queryDto?.name && queryDto.name.trim()) {
      const trimmedName = queryDto.name.trim();
      query.andWhere(
        '(LOWER(guest.firstName) LIKE LOWER(:name) OR LOWER(guest.lastName) LIKE LOWER(:name) OR LOWER(CONCAT(guest.firstName, \' \', guest.lastName)) LIKE LOWER(:name))',
        { name: `%${trimmedName}%` },
      );
    }

    // 3. Email search: case-insensitive partial match
    if (queryDto?.email && queryDto.email.trim()) {
      query.andWhere('LOWER(guest.email) LIKE LOWER(:email)', {
        email: `%${queryDto.email.trim()}%`,
      });
    }

    // 4. Phone search: partial match
    if (queryDto?.phone && queryDto.phone.trim()) {
      query.andWhere('guest.phone LIKE :phone', {
        phone: `%${queryDto.phone.trim()}%`,
      });
    }

    // 5. Document / Passport number search: case-insensitive partial match
    const documentNumber =
      queryDto?.documentNumber?.trim() || queryDto?.passportNumber?.trim();
    if (documentNumber) {
      query.andWhere('LOWER(guest.passportNumber) LIKE LOWER(:docNum)', {
        docNum: `%${documentNumber}%`,
      });
    }

    // Order & Pagination
    query.orderBy('guest.createdAt', 'DESC').skip(skip).take(limit);

    const [guests, total] = await query.getManyAndCount();
    const totalPages = Math.ceil(total / limit);

    return {
      data: guests.map((g) => this.sanitizeGuest(g)),
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }
}
