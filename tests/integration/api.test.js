'use strict';

const request = require('supertest');
const { buildServer } = require('../../server');

describe('API Integration Tests', () => {
  let app;
  let mockTallyServer;

  beforeAll(async () => {
    // Start mock Tally server
    mockTallyServer = require('./mock-tally-server');
    await mockTallyServer.start();
    
    // Build Fastify app with test config
    app = await buildServer();
  });

  afterAll(async () => {
    await app.close();
    await mockTallyServer.stop();
  });

  describe('GET /health', () => {
    test('should return health status', async () => {
      const response = await request(app.server)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('tally');
      expect(response.body).toHaveProperty('redis');
    });
  });

  describe('GET /api/v1/ledgers', () => {
    test('should require API key', async () => {
      await request(app.server)
        .get('/api/v1/ledgers')
        .expect(401);
    });

    test('should return ledgers with valid API key', async () => {
      const response = await request(app.server)
        .get('/api/v1/ledgers')
        .set('X-API-Key', 'test-key-123')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('should validate pagination parameters', async () => {
      await request(app.server)
        .get('/api/v1/ledgers?page=0')
        .set('X-API-Key', 'test-key-123')
        .expect(400);

      await request(app.server)
        .get('/api/v1/ledgers?limit=1000')
        .set('X-API-Key', 'test-key-123')
        .expect(400);
    });
  });

  describe('GET /api/v1/vouchers', () => {
    test('should require date range', async () => {
      await request(app.server)
        .get('/api/v1/vouchers')
        .set('X-API-Key', 'test-key-123')
        .expect(400);
    });

    test('should validate date format', async () => {
      await request(app.server)
        .get('/api/v1/vouchers?fromDate=invalid&toDate=2023-04-01')
        .set('X-API-Key', 'test-key-123')
        .expect(400);
    });

    test('should validate date range limit', async () => {
      const from = '2022-01-01';
      const to = '2023-12-31'; // More than 366 days

      await request(app.server)
        .get(`/api/v1/vouchers?fromDate=${from}&toDate=${to}`)
        .set('X-API-Key', 'test-key-123')
        .expect(400);
    });
  });
});
