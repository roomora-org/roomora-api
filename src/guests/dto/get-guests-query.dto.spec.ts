import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { GetGuestsQueryDto } from './get-guests-query.dto.js';

describe('GetGuestsQueryDto Validation & Transformation', () => {
  it('should pass validation with default/empty values', async () => {
    const dto = plainToInstance(GetGuestsQueryDto, {});
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should transform numeric string parameters for page and limit to numbers', () => {
    const dto = plainToInstance(GetGuestsQueryDto, {
      page: '2',
      limit: '25',
    });
    expect(typeof dto.page).toBe('number');
    expect(dto.page).toBe(2);
    expect(typeof dto.limit).toBe('number');
    expect(dto.limit).toBe(25);
  });

  it('should validate valid hotelId UUID', async () => {
    const dto = plainToInstance(GetGuestsQueryDto, {
      hotelId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail validation when hotelId is not a valid UUID', async () => {
    const dto = plainToInstance(GetGuestsQueryDto, {
      hotelId: 'invalid-not-a-uuid',
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'hotelId')).toBe(true);
  });

  it('should fail validation when page is less than 1', async () => {
    const dto = plainToInstance(GetGuestsQueryDto, { page: 0 });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'page')).toBe(true);
  });

  it('should fail validation when limit is greater than 100 or less than 1', async () => {
    const dtoOver = plainToInstance(GetGuestsQueryDto, { limit: 101 });
    const errorsOver = await validate(dtoOver);
    expect(errorsOver.some((e) => e.property === 'limit')).toBe(true);

    const dtoUnder = plainToInstance(GetGuestsQueryDto, { limit: 0 });
    const errorsUnder = await validate(dtoUnder);
    expect(errorsUnder.some((e) => e.property === 'limit')).toBe(true);
  });

  it('should pass validation with boundary limit value 100', async () => {
    const dto = plainToInstance(GetGuestsQueryDto, { limit: 100 });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});
