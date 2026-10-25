import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { DataSource } from 'typeorm';

describe('Hotels and Guests Endpoints (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let createdHotelId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        transformOptions: {
          enableImplicitConversion: false,
        },
      }),
    );
    await app.init();

    dataSource = app.get(DataSource);
  });

  afterAll(async () => {
    if (createdHotelId && dataSource) {
      await dataSource.query('DELETE FROM hotels WHERE id = $1', [createdHotelId]);
    }
    await app.close();
  });

  describe('Hotels CRUD', () => {
    it('POST /hotels - creates a hotel successfully (supports lowercase status & transformed types)', async () => {
      const uniqueSlug = `test-hotel-${Date.now()}`;
      const uniqueEmail = `test-${Date.now()}@hotel.com`;

      const res = await request(app.getHttpServer())
        .post('/hotels')
        .send({
          name: 'Test Grand Hotel',
          slug: uniqueSlug,
          email: uniqueEmail,
          phone: '+1-555-0199',
          country: 'United States',
          city: 'New York',
          address: '123 Main St',
          logoUrl: 'https://example.com/logo.png',
          starRating: 5,
          status: 'active', // verifies lowercase 'active' -> transformed to 'ACTIVE'
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.slug).toBe(uniqueSlug);
      expect(res.body.email).toBe(uniqueEmail);
      expect(res.body.status).toBe('ACTIVE');
      createdHotelId = res.body.id;
    });

    it('POST /hotels - duplicate slug returns 409', async () => {
      const res = await request(app.getHttpServer())
        .post('/hotels')
        .send({
          name: 'Another Hotel',
          slug: (await dataSource.query('SELECT slug FROM hotels WHERE id = $1', [createdHotelId]))[0].slug,
          email: `different-${Date.now()}@hotel.com`,
          phone: '+1-555-0100',
          country: 'USA',
          city: 'Chicago',
          address: '456 Elm St',
          logoUrl: 'https://example.com/logo2.png',
        })
        .expect(409);

      expect(res.body.statusCode).toBe(409);
    });

    it('POST /hotels - non-whitelisted property returns 400', async () => {
      await request(app.getHttpServer())
        .post('/hotels')
        .send({
          name: 'Invalid Hotel',
          slug: `invalid-${Date.now()}`,
          email: `invalid-${Date.now()}@hotel.com`,
          phone: '+1-555-0100',
          country: 'USA',
          city: 'Chicago',
          address: '456 Elm St',
          logoUrl: 'https://example.com/logo.png',
          unexpectedField: true,
        })
        .expect(400);
    });

    it('GET /hotels - returns paginated list', async () => {
      const res = await request(app.getHttpServer())
        .get('/hotels')
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('meta');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta.page).toBe(1);
      expect(res.body.meta.limit).toBe(10);
    });

    it('GET /hotels?page=1&limit=5 - handles pagination parameters', async () => {
      const res = await request(app.getHttpServer())
        .get('/hotels?page=1&limit=5')
        .expect(200);

      expect(res.body.meta.limit).toBe(5);
    });

    it('GET /hotels/:id - returns hotel by ID', async () => {
      const res = await request(app.getHttpServer())
        .get(`/hotels/${createdHotelId}`)
        .expect(200);

      expect(res.body.id).toBe(createdHotelId);
      expect(res.body.name).toBe('Test Grand Hotel');
    });

    it('GET /hotels/:id - returns 400 for invalid UUID syntax', async () => {
      await request(app.getHttpServer())
        .get('/hotels/not-a-valid-uuid')
        .expect(400);
    });

    it('GET /hotels/:id - returns 404 for non-existent UUID', async () => {
      await request(app.getHttpServer())
        .get('/hotels/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });

    it('PATCH /hotels/:id - updates hotel successfully', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/hotels/${createdHotelId}`)
        .send({
          name: 'Updated Grand Hotel',
          phone: '+1-555-9999',
        })
        .expect(200);

      expect(res.body.name).toBe('Updated Grand Hotel');
      expect(res.body.phone).toBe('+1-555-9999');
    });

    it('PATCH /hotels/:id - returns 400 for invalid UUID syntax', async () => {
      await request(app.getHttpServer())
        .patch('/hotels/invalid-uuid')
        .send({ name: 'Fails' })
        .expect(400);
    });

    it('PATCH /hotels/:id - returns 404 for non-existent UUID', async () => {
      await request(app.getHttpServer())
        .patch('/hotels/00000000-0000-0000-0000-000000000000')
        .send({ name: 'Does Not Exist' })
        .expect(404);
    });

    it('DELETE /hotels/:id - deletes hotel successfully', async () => {
      // Create a temporary hotel to delete
      const tempRes = await request(app.getHttpServer())
        .post('/hotels')
        .send({
          name: 'Delete Me Hotel',
          slug: `del-hotel-${Date.now()}`,
          email: `del-${Date.now()}@hotel.com`,
          phone: '+1-555-0988',
          country: 'USA',
          city: 'Dallas',
          address: '999 Del St',
          logoUrl: 'https://example.com/del.png',
        })
        .expect(201);

      const delId = tempRes.body.id;

      await request(app.getHttpServer())
        .delete(`/hotels/${delId}`)
        .expect(204);

      // Verify it is gone
      await request(app.getHttpServer())
        .get(`/hotels/${delId}`)
        .expect(404);
    });

    it('DELETE /hotels/:id - returns 400 for invalid UUID', async () => {
      await request(app.getHttpServer())
        .delete('/hotels/not-a-valid-uuid')
        .expect(400);
    });

    it('DELETE /hotels/:id - returns 404 for non-existent UUID', async () => {
      await request(app.getHttpServer())
        .delete('/hotels/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });
  });

  describe('Guests Search and Retrieval', () => {
    let testGuestId: string;

    beforeAll(async () => {
      const result = await dataSource.query(
        `INSERT INTO guests (
          "hotel_id", "first_name", "last_name", "email", "phone",
          "nationality", "country_of_residence", "city", "address",
          "passport_number", "created_by"
        ) VALUES (
          $1, 'John', 'Doe', 'john.doe@example.com', '+1-555-1234',
          'American', 'USA', 'New York', '123 Main St',
          'PASS12345', '00000000-0000-0000-0000-000000000001'
        ) RETURNING id`,
        [createdHotelId],
      );
      testGuestId = result[0].id;
    });

    afterAll(async () => {
      if (testGuestId) {
        await dataSource.query('DELETE FROM guests WHERE id = $1', [testGuestId]);
      }
    });

    it('GET /guests - returns paginated list of guests', async () => {
      const res = await request(app.getHttpServer())
        .get('/guests')
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('meta');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('GET /guests?name=John - filters guests by name', async () => {
      const res = await request(app.getHttpServer())
        .get('/guests?name=john')
        .expect(200);

      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].firstName).toBe('John');
    });

    it('GET /guests?hotelId=... - scopes guests by hotel', async () => {
      const res = await request(app.getHttpServer())
        .get(`/guests?hotelId=${createdHotelId}`)
        .expect(200);

      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].hotelId).toBe(createdHotelId);
    });

    it('GET /guests/:id - returns guest details with sensitive fields stripped', async () => {
      const res = await request(app.getHttpServer())
        .get(`/guests/${testGuestId}`)
        .expect(200);

      expect(res.body.id).toBe(testGuestId);
      expect(res.body.firstName).toBe('John');
      expect(res.body.createdBy).toBeUndefined();
      expect(res.body.password).toBeUndefined();
    });

    it('GET /guests/:id - returns 400 for invalid UUID format', async () => {
      await request(app.getHttpServer())
        .get('/guests/invalid-guest-uuid')
        .expect(400);
    });

    it('GET /guests/:id - returns 404 for non-existent guest', async () => {
      await request(app.getHttpServer())
        .get('/guests/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });

    it('GET /guests?limit=150 - fails validation if limit exceeds 100', async () => {
      await request(app.getHttpServer())
        .get('/guests?limit=150')
        .expect(400);
    });
  });
});
