import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';
import { AppController } from '../src/app.controller.js';
import { AppService } from '../src/app.service.js';

describe('AppController (e2e)', () => {
  let app: INestApplication | undefined;

  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', async () => {
    if (!app) {
      throw new Error('Nest application was not initialized');
    }

    await request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  afterEach(async () => {
    await app?.close();
  });
});