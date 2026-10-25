import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateHotelDto } from './create-hotel.dto.js';
import { HotelStatus } from '../enums/hotel-status.enum.js';

describe('CreateHotelDto Validation', () => {
  const validData = {
    name: 'Roomora Grand Palace',
    slug: 'roomora-grand-palace',
    description: 'A 5-star hotel in downtown',
    email: 'contact@roomorapalace.com',
    phone: '+1-555-0199',
    alternativePhone: '+1-555-0198',
    country: 'United States',
    city: 'New York',
    address: '123 Broadway Avenue',
    postalCode: '10001',
    logoUrl: 'https://cdn.roomora.com/logos/grand-palace.png',
    starRating: 5,
    timeZone: 'America/New_York',
    checkInTime: '14:00',
    checkOutTime: '12:00',
    status: HotelStatus.ACTIVE,
  };

  it('should pass validation when all fields are valid', async () => {
    const dto = plainToInstance(CreateHotelDto, validData);
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail when name is empty', async () => {
    const dto = plainToInstance(CreateHotelDto, { ...validData, name: '' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'name')).toBe(true);
  });

  it('should fail when email is invalid', async () => {
    const dto = plainToInstance(CreateHotelDto, { ...validData, email: 'not-an-email' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'email')).toBe(true);
  });

  it('should fail when slug format is invalid (uppercase or spaces)', async () => {
    const dto = plainToInstance(CreateHotelDto, { ...validData, slug: 'Invalid Slug!' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'slug')).toBe(true);
  });

  it('should fail when starRating is less than 1 or greater than 5', async () => {
    const dtoUnder = plainToInstance(CreateHotelDto, { ...validData, starRating: 0 });
    const errorsUnder = await validate(dtoUnder);
    expect(errorsUnder.some((e) => e.property === 'starRating')).toBe(true);

    const dtoOver = plainToInstance(CreateHotelDto, { ...validData, starRating: 6 });
    const errorsOver = await validate(dtoOver);
    expect(errorsOver.some((e) => e.property === 'starRating')).toBe(true);
  });

  it('should transform numeric postalCode to string and pass validation', async () => {
    const dto = plainToInstance(CreateHotelDto, { ...validData, postalCode: 90028 });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
    expect(dto.postalCode).toBe('90028');
  });
});
