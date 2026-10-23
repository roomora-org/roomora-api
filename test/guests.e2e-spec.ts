import { NotFoundException } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { GuestsController } from '../src/guests/guests.controller.js';
import { GuestsService } from '../src/guests/guests.service.js';

describe('GuestsController (e2e)', () => {
  let app: INestApplication;

  const createGuest = vi.fn();
  const updateGuest = vi.fn();

  const guestsServiceMock = {
    create: createGuest,
    update: updateGuest,
    findAll: vi.fn(),
    findOne: vi.fn(),
    remove: vi.fn(),
  };

  const hotelId = '550e8400-e29b-41d4-a716-446655440000';
  const guestId = '550e8400-e29b-41d4-a716-446655440001';

  const validGuest = {
    hotelId,
    firstName: 'Tala',
    lastName: 'Salim',
    email: 'tala@example.com',
    phone: '+12125550123',
  };

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      controllers: [GuestsController],
      providers: [
        {
          provide: GuestsService,
          useValue: guestsServiceMock,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates a guest with valid input', async () => {
    const createdGuest = { id: guestId, ...validGuest };
    createGuest.mockResolvedValue(createdGuest);

    await request(app.getHttpServer())
      .post('/guests')
      .send(validGuest)
      .expect(201)
      .expect(createdGuest);

    expect(createGuest).toHaveBeenCalled();
  });

  it('rejects an invalid email', async () => {
    await request(app.getHttpServer())
      .post('/guests')
      .send({ ...validGuest, email: 'not-an-email' })
      .expect(400);

    expect(createGuest).not.toHaveBeenCalled();
  });

  it('rejects a server-managed ID in the request', async () => {
    await request(app.getHttpServer())
      .post('/guests')
      .send({ ...validGuest, id: guestId })
      .expect(400);

    expect(createGuest).not.toHaveBeenCalled();
  });

  it('updates a guest with valid input', async () => {
    const updatedGuest = {
      id: guestId,
      ...validGuest,
      firstName: 'Maya',
    };
    updateGuest.mockResolvedValue(updatedGuest);

    await request(app.getHttpServer())
      .patch(`/guests/${guestId}`)
      .send({ firstName: 'Maya' })
      .expect(200)
      .expect(updatedGuest);

    expect(updateGuest).toHaveBeenCalled();
  });

  it('rejects changing hotelId in an update request', async () => {
    await request(app.getHttpServer())
      .patch(`/guests/${guestId}`)
      .send({ hotelId })
      .expect(400);

    expect(updateGuest).not.toHaveBeenCalled();
  });

  it('returns 404 when updating a guest that does not exist', async () => {
    updateGuest.mockRejectedValue(new NotFoundException('Guest not found'));

    await request(app.getHttpServer())
      .patch(`/guests/${guestId}`)
      .send({ firstName: 'Maya' })
      .expect(404);
  });
});