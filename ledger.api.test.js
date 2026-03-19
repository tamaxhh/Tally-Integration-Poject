/**
 * tests/integration/api/ledger.api.test.js
 *
 * INTEGRATION TESTS FOR /api/v1/ledgers
 * ======================================
 * These tests exercise the full stack:
 *   HTTP request → Fastify → auth → service → connector → mock Tally → parser → response
 *
 * They use:
 * - supertest: makes HTTP requests against the Fastify instance without binding a port
 * - Mock Tally server: listens on port 9001 and returns fixture XML
 * - Mocked Redis: we don't test caching behavior in integration tests (that's unit territory)
 *
 * HOW TO RUN:
 * -----------
 * npm test                    # Run all tests
 * npm run test:integration    # Run only integration tests
 * npx jest ledger.api.test    # Run only this file
 */

'use strict';

// Override Tally config to point at our mock server
// This MUST happen before requiring any application code
process.env.TALLY_HOST = '127.0.0.1';
process.env.TALLY_PORT = '9001';
process.env.TALLY_TIMEOUT_MS = '3000';
process.env.API_KEYS = 'test-key-abc123';
process.env.NODE_ENV = 'test';

const { buildServer } = require('../../../src/api/server');
const { startMockTally, stopMockTally, setMockMode } = require('../tally-mock/server');

// Mock Redis so tests don't need a real Redis server
// All cache operations become no-ops
jest.mock('../../../src/cache/cacheManager', () => ({
  get: jest.fn().mockResolvedValue(null),      // Always cache miss
  set: jest.fn().mockResolvedValue(true),
  del: jest.fn().mockResolvedValue(true),
  deletePattern: jest.fn().mockResolvedValue(0),
}));

const VALID_API_KEY = 'test-key-abc123';

let server;

beforeAll(async () => {
  await startMockTally(9001);
  server = await buildServer();
  await server.ready(); // Ensure all plugins are loaded
});

afterAll(async () => {
  await server.close();
  await stopMockTally();
});

beforeEach(() => {
  setMockMode('normal'); // Reset mock mode before each test
});

// ============================================================
// Authentication tests
// ============================================================

describe('Authentication', () => {
  test('rejects requests without API key', async () => {
    const res = await server.inject({
      method: 'GET',
      url: '/api/v1/ledgers',
    });
    expect(res.statusCode).toBe(401);
    expect(res.json().error).toBe('Unauthorized');
  });

  test('rejects requests with invalid API key', async () => {
    const res = await server.inject({
      method: 'GET',
      url: '/api/v1/ledgers',
      headers: { 'x-api-key': 'wrong-key' },
    });
    expect(res.statusCode).toBe(403);
  });

  test('allows requests with valid API key', async () => {
    const res = await server.inject({
      method: 'GET',
      url: '/api/v1/ledgers',
      headers: { 'x-api-key': VALID_API_KEY },
    });
    expect(res.statusCode).toBe(200);
  });
});

// ============================================================
// GET /api/v1/ledgers
// ============================================================

describe('GET /api/v1/ledgers', () => {
  const headers = { 'x-api-key': VALID_API_KEY };

  test('returns successful ledger list', async () => {
    const res = await server.inject({ method: 'GET', url: '/api/v1/ledgers', headers });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.meta).toHaveProperty('total');
    expect(body.meta).toHaveProperty('page');
  });

  test('returns ledgers with correct data types', async () => {
    const res = await server.inject({ method: 'GET', url: '/api/v1/ledgers', headers });
    const { data } = res.json();
    const ledger = data[0];

    expect(typeof ledger.name).toBe('string');
    expect(typeof ledger.parent).toBe('string');
    // Amounts must be numbers, not strings
    if (ledger.closingBalance !== null) {
      expect(typeof ledger.closingBalance).toBe('number');
    }
    if (ledger.openingBalance !== null) {
      expect(typeof ledger.openingBalance).toBe('number');
    }
  });

  test('handles pagination correctly', async () => {
    const res = await server.inject({
      method: 'GET',
      url: '/api/v1/ledgers?page=1&limit=2',
      headers,
    });

    const body = res.json();
    expect(body.data.length).toBeLessThanOrEqual(2);
    expect(body.meta.limit).toBe(2);
    expect(body.meta.page).toBe(1);
  });

  test('rejects invalid pagination params', async () => {
    const res = await server.inject({
      method: 'GET',
      url: '/api/v1/ledgers?page=0', // page must be >= 1
      headers,
    });
    expect(res.statusCode).toBe(400);
  });

  test('returns 503 when Tally is offline', async () => {
    setMockMode('offline');

    const res = await server.inject({ method: 'GET', url: '/api/v1/ledgers', headers });
    expect(res.statusCode).toBe(503);
    const body = res.json();
    expect(body.error).toMatch(/TallyOfflineError|CircuitBreakerOpenError/);
  });

  test('sets X-Cache header', async () => {
    const res = await server.inject({ method: 'GET', url: '/api/v1/ledgers', headers });
    expect(res.headers['x-cache']).toBeDefined();
    expect(['HIT', 'MISS']).toContain(res.headers['x-cache']);
  });
});

// ============================================================
// GET /api/v1/ledgers/:name
// ============================================================

describe('GET /api/v1/ledgers/:name', () => {
  const headers = { 'x-api-key': VALID_API_KEY };

  test('returns a ledger when found', async () => {
    // URL-encode the ledger name
    const name = encodeURIComponent('Customer ABC Ltd');
    const res = await server.inject({
      method: 'GET',
      url: `/api/v1/ledgers/${name}`,
      headers,
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.name).toBe('Customer ABC Ltd');
  });

  test('returns 404 for non-existent ledger', async () => {
    const name = encodeURIComponent('Completely Fake Ledger XYZ');
    const res = await server.inject({
      method: 'GET',
      url: `/api/v1/ledgers/${name}`,
      headers,
    });

    expect(res.statusCode).toBe(404);
    expect(res.json().error).toBe('NotFound');
  });
});

// ============================================================
// Health endpoints (no auth required)
// ============================================================

describe('GET /health', () => {
  test('returns health status', async () => {
    const res = await server.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBeOneOf([200, 503]);

    const body = res.json();
    expect(body.status).toBeOneOf(['healthy', 'degraded']);
    expect(body.checks).toHaveProperty('tally');
    expect(body.checks).toHaveProperty('redis');
  });

  test('liveness probe always returns 200', async () => {
    const res = await server.inject({ method: 'GET', url: '/health/live' });
    expect(res.statusCode).toBe(200);
    expect(res.json().status).toBe('alive');
  });
});
