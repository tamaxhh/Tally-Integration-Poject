# Testing Documentation

Comprehensive guide to testing strategies, test execution, and quality assurance for the Tally Integration API.

## 🧪 Testing Overview

The project follows a comprehensive testing strategy with multiple test types:
- **Unit Tests**: Individual component testing
- **Integration Tests**: Component interaction testing
- **End-to-End Tests**: Full workflow testing
- **Performance Tests**: Load and stress testing
- **Contract Tests**: API contract validation

### Test Pyramid

```
    E2E Tests (5%)
   ─────────────────
  Integration Tests (15%)
 ─────────────────────────
Unit Tests (80%)
────────────────────────────
```

## 📁 Test Structure

```
tests/
├── 📁 unit/                    # Unit tests
│   ├── 📁 connectors/         # Tally, Redis, Database connectors
│   │   ├── tally-client.test.js
│   │   ├── xml-parser.test.js
│   │   └── cache-manager.test.js
│   ├── 📁 services/           # Business logic tests
│   │   ├── ledger-service.test.js
│   │   ├── voucher-service.test.js
│   │   └── report-service.test.js
│   ├── 📁 utils/              # Utility function tests
│   │   ├── config.test.js
│   │   ├── helpers.test.js
│   │   └── validators.test.js
│   └── 📁 models/             # Data model tests
│       ├── ledger.model.test.js
│       └── voucher.model.test.js
├── 📁 integration/             # Integration tests
│   ├── 📁 api/                # API endpoint tests
│   │   ├── ledgers.test.js
│   │   ├── vouchers.test.js
│   │   └── health.test.js
│   ├── 📁 database/           # Database integration tests
│   │   ├── migrations.test.js
│   │   └── repositories.test.js
│   └── 📁 tally/              # Tally integration tests
│       ├── connection.test.js
│       └── data-fetch.test.js
├── 📁 e2e/                    # End-to-end tests
│   ├── workflows.test.js       # Complete user workflows
│   └── performance.test.js    # Performance benchmarks
├── 📁 fixtures/               # Test data
│   ├── ledgers.json           # Sample ledger data
│   ├── vouchers.json          # Sample voucher data
│   └── companies.json         # Sample company data
├── 📁 helpers/                # Test utilities
│   ├── mock-tally.js          # Mock Tally server
│   ├── test-db.js             # Test database setup
│   ├── test-redis.js          # Test Redis setup
│   └── assertions.js          # Custom assertions
└── 📁 setup/                  # Test setup files
    ├── jest.config.js         # Jest configuration
    ├── test-setup.js          # Global test setup
    └── test-teardown.js       # Global test teardown
```

## 🔧 Test Configuration

### Jest Configuration (`jest.config.js`)

```javascript
module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // Test file patterns
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js'
  ],
  
  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/index.js',           // Entry point
    '!**/node_modules/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup/test-setup.js'],
  
  // Module path mapping
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1'
  },
  
  // Test timeout
  testTimeout: 30000,
  
  // Parallel execution
  maxWorkers: process.env.CI ? 2 : '50%',
  
  // Verbose output
  verbose: true
}
```

### Test Setup (`tests/setup/test-setup.js`)

```javascript
const { beforeAll, afterAll, beforeEach, afterEach } = require('@jest/globals')

// Global test setup
beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test'
  process.env.LOG_LEVEL = 'silent'
  
  // Initialize test database
  await setupTestDatabase()
  
  // Initialize test Redis
  await setupTestRedis()
  
  // Start mock services
  await startMockTallyServer()
})

afterAll(async () => {
  // Cleanup test database
  await cleanupTestDatabase()
  
  // Cleanup test Redis
  await cleanupTestRedis()
  
  // Stop mock services
  await stopMockTallyServer()
})

beforeEach(async () => {
  // Reset test data before each test
  await resetTestData()
})

afterEach(async () => {
  // Cleanup after each test
  await cleanupTestArtifacts()
})

// Global test utilities
global.testUtils = {
  createMockLedger: require('../fixtures/ledgers').create,
  createMockVoucher: require('../fixtures/vouchers').create,
  assertValidApiResponse: require('../helpers/assertions').assertValidResponse
}
```

## 🧪 Unit Testing

### Example: Tally Client Tests

```javascript
// tests/unit/connectors/tally-client.test.js
const axios = require('axios')
const TallyClient = require('@/connectors/tally/client')
const CircuitBreaker = require('@/utils/circuit-breaker')

describe('TallyClient', () => {
  let tallyClient
  let mockAxios
  let mockCircuitBreaker
  
  beforeEach(() => {
    // Mock dependencies
    mockAxios = {
      create: jest.fn(() => ({
        post: jest.fn()
      }))
    }
    mockCircuitBreaker = {
      execute: jest.fn()
    }
    
    // Mock axios module
    jest.mock('axios', () => mockAxios)
    jest.mock('@/utils/circuit-breaker', () => mockCircuitBreaker)
    
    // Create client instance
    tallyClient = new TallyClient({
      host: 'localhost',
      port: 9000,
      timeout: 10000
    })
  })
  
  describe('constructor', () => {
    it('should create axios instance with correct config', () => {
      expect(mockAxios.create).toHaveBeenCalledWith({
        baseURL: 'http://localhost:9000',
        timeout: 10000,
        headers: { 'Content-Type': 'text/xml' }
      })
    })
    
    it('should initialize circuit breaker', () => {
      expect(CircuitBreaker).toHaveBeenCalledWith({
        threshold: 5,
        timeout: 60000
      })
    })
  })
  
  describe('request', () => {
    it('should execute request through circuit breaker', async () => {
      const xmlRequest = '<ENVELOPE>...</ENVELOPE>'
      const expectedResponse = '<RESPONSE>...</RESPONSE>'
      
      mockCircuitBreaker.execute.mockResolvedValue(expectedResponse)
      
      const result = await tallyClient.request(xmlRequest)
      
      expect(mockCircuitBreaker.execute).toHaveBeenCalled()
      expect(result).toBe(expectedResponse)
    })
    
    it('should handle circuit breaker open state', async () => {
      const xmlRequest = '<ENVELOPE>...</ENVELOPE>'
      
      mockCircuitBreaker.execute.mockRejectedValue(
        new Error('Circuit breaker is OPEN')
      )
      
      await expect(tallyClient.request(xmlRequest))
        .rejects.toThrow('Circuit breaker is OPEN')
    })
    
    it('should retry on network errors', async () => {
      const xmlRequest = '<ENVELOPE>...</ENVELOPE>'
      
      mockCircuitBreaker.execute
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce('<RESPONSE>...</RESPONSE>')
      
      const result = await tallyClient.request(xmlRequest)
      
      expect(result).toBe('<RESPONSE>...</RESPONSE>')
      expect(mockCircuitBreaker.execute).toHaveBeenCalledTimes(2)
    })
  })
})
```

### Example: XML Parser Tests

```javascript
// tests/unit/connectors/xml-parser.test.js
const XMLParser = require('@/connectors/tally/parser')

describe('XMLParser', () => {
  describe('parseLedgerResponse', () => {
    it('should parse valid ledger XML response', () => {
      const xmlData = `<?xml version="1.0"?>
<ENVELOPE>
  <BODY>
    <DATA>
      <COLLECTION>
        <LEDGER>
          <LANGUAGENAME.LIST>
            <NAME.LIST>
              <NAME>Alfa Provisions</NAME>
            </NAME.LIST>
          </LANGUAGENAME.LIST>
          <OPENINGBALANCE>15000.00</OPENINGBALANCE>
          <CLOSINGBALANCE>25000.00</CLOSINGBALANCE>
        </LEDGER>
      </COLLECTION>
    </DATA>
  </BODY>
</ENVELOPE>`
      
      const result = XMLParser.parseLedgerResponse(xmlData)
      
      expect(result.success).toBe(true)
      expect(result.ledgers).toHaveLength(1)
      expect(result.ledgers[0]).toMatchObject({
        name: 'Alfa Provisions',
        openingBalance: 15000.00,
        closingBalance: 25000.00
      })
    })
    
    it('should handle multiple ledgers', () => {
      const xmlData = `<?xml version="1.0"?>
<ENVELOPE>
  <BODY>
    <DATA>
      <COLLECTION>
        <LEDGER>
          <LANGUAGENAME.LIST>
            <NAME.LIST>
              <NAME>Alfa Provisions</NAME>
            </NAME.LIST>
          </LANGUAGENAME.LIST>
        </LEDGER>
        <LEDGER>
          <LANGUAGENAME.LIST>
            <NAME.LIST>
              <NAME>Bank Account</NAME>
            </NAME.LIST>
          </LANGUAGENAME.LIST>
        </LEDGER>
      </COLLECTION>
    </DATA>
  </BODY>
</ENVELOPE>`
      
      const result = XMLParser.parseLedgerResponse(xmlData)
      
      expect(result.ledgers).toHaveLength(2)
      expect(result.ledgers[0].name).toBe('Alfa Provisions')
      expect(result.ledgers[1].name).toBe('Bank Account')
    })
    
    it('should handle empty response', () => {
      const xmlData = '<?xml version="1.0"?><ENVELOPE></ENVELOPE>'
      
      const result = XMLParser.parseLedgerResponse(xmlData)
      
      expect(result.success).toBe(true)
      expect(result.ledgers).toHaveLength(0)
      expect(result.count).toBe(0)
    })
    
    it('should handle malformed XML', () => {
      const xmlData = 'invalid xml'
      
      expect(() => XMLParser.parseLedgerResponse(xmlData))
        .toThrow('Invalid XML format')
    })
  })
  
  describe('parseAmount', () => {
    it('should parse positive amounts', () => {
      expect(XMLParser.parseAmount('5000.00')).toBe(5000.00)
      expect(XMLParser.parseAmount('10000')).toBe(10000.00)
    })
    
    it('should parse negative amounts in parentheses', () => {
      expect(XMLParser.parseAmount('(5000.00)')).toBe(-5000.00)
      expect(XMLParser.parseAmount('(10000)')).toBe(-10000.00)
    })
    
    it('should handle null/empty values', () => {
      expect(XMLParser.parseAmount(null)).toBe(0)
      expect(XMLParser.parseAmount('')).toBe(0)
      expect(XMLParser.parseAmount(undefined)).toBe(0)
    })
  })
})
```

### Example: Service Tests

```javascript
// tests/unit/services/ledger-service.test.js
const LedgerService = require('@/services/ledger-service')

describe('LedgerService', () => {
  let ledgerService
  let mockTallyClient
  let mockCacheManager
  let mockLogger
  
  beforeEach(() => {
    mockTallyClient = {
      request: jest.fn()
    }
    mockCacheManager = {
      get: jest.fn(),
      set: jest.fn()
    }
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    }
    
    ledgerService = new LedgerService({
      tallyClient: mockTallyClient,
      cacheManager: mockCacheManager,
      logger: mockLogger
    })
  })
  
  describe('getLedgers', () => {
    it('should return cached data when available', async () => {
      const cachedData = {
        success: true,
        ledgers: [{ name: 'Test Ledger' }],
        count: 1
      }
      
      mockCacheManager.get.mockResolvedValue(cachedData)
      
      const result = await ledgerService.getLedgers()
      
      expect(result).toEqual(cachedData)
      expect(mockCacheManager.get).toHaveBeenCalledWith('tally:ledgers:default')
      expect(mockTallyClient.request).not.toHaveBeenCalled()
      expect(mockLogger.info).toHaveBeenCalledWith('Cache hit for ledgers')
    })
    
    it('should fetch from Tally when cache miss', async () => {
      const xmlRequest = '<ENVELOPE>...</ENVELOPE>'
      const xmlResponse = '<RESPONSE>...</RESPONSE>'
      const parsedData = {
        success: true,
        ledgers: [{ name: 'Test Ledger' }],
        count: 1
      }
      
      mockCacheManager.get.mockResolvedValue(null)
      mockTallyClient.request.mockResolvedValue(xmlResponse)
      
      // Mock XML parser
      jest.doMock('@/connectors/tally/parser', () => ({
        parseLedgerResponse: jest.fn().mockReturnValue(parsedData)
      }))
      
      const result = await ledgerService.getLedgers()
      
      expect(mockTallyClient.request).toHaveBeenCalledWith(xmlRequest)
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'tally:ledgers:default',
        parsedData,
        300
      )
      expect(result).toEqual(parsedData)
    })
    
    it('should handle Tally errors gracefully', async () => {
      mockCacheManager.get.mockResolvedValue(null)
      mockTallyClient.request.mockRejectedValue(new Error('Tally connection failed'))
      
      await expect(ledgerService.getLedgers())
        .rejects.toThrow('Tally connection failed')
      
      expect(mockLogger.error).toHaveBeenCalled()
    })
  })
})
```

## 🔗 Integration Testing

### Example: API Integration Tests

```javascript
// tests/integration/api/ledgers.test.js
const request = require('supertest')
const { buildServer } = require('@/server')

describe('Ledgers API', () => {
  let app
  
  beforeAll(async () => {
    // Build test server
    app = await buildServer({ test: true })
  })
  
  afterAll(async () => {
    await app.close()
  })
  
  describe('GET /api/v1/ledgers', () => {
    it('should return ledgers with valid API key', async () => {
      const response = await request(app.server)
        .get('/api/v1/ledgers')
        .query({ apiKey: 'test-key' })
        .expect(200)
      
      expect(response.body.success).toBe(true)
      expect(response.body.data.ledgers).toBeInstanceOf(Array)
      expect(response.body.meta.count).toBeGreaterThan(0)
    })
    
    it('should require API key', async () => {
      await request(app.server)
        .get('/api/v1/ledgers')
        .expect(401)
    })
    
    it('should reject invalid API key', async () => {
      await request(app.server)
        .get('/api/v1/ledgers')
        .query({ apiKey: 'invalid-key' })
        .expect(401)
    })
    
    it('should respect limit parameter', async () => {
      const response = await request(app.server)
        .get('/api/v1/ledgers')
        .query({ apiKey: 'test-key', limit: 5 })
        .expect(200)
      
      expect(response.body.data.ledgers).toHaveLength(5)
      expect(response.body.meta.limit).toBe(5)
    })
    
    it('should validate date parameters', async () => {
      await request(app.server)
        .get('/api/v1/ledgers')
        .query({ apiKey: 'test-key', from: 'invalid-date' })
        .expect(400)
    })
  })
  
  describe('GET /api/v1/ledgers/:guid', () => {
    it('should return specific ledger', async () => {
      // First get all ledgers to find a valid GUID
      const listResponse = await request(app.server)
        .get('/api/v1/ledgers')
        .query({ apiKey: 'test-key' })
        .expect(200)
      
      const ledger = listResponse.body.data.ledgers[0]
      
      const response = await request(app.server)
        .get(`/api/v1/ledgers/${ledger.guid}`)
        .query({ apiKey: 'test-key' })
        .expect(200)
      
      expect(response.body.data.ledger.guid).toBe(ledger.guid)
    })
    
    it('should return 404 for non-existent ledger', async () => {
      await request(app.server)
        .get('/api/v1/ledgers/non-existent-guid')
        .query({ apiKey: 'test-key' })
        .expect(404)
    })
  })
})
```

### Example: Database Integration Tests

```javascript
// tests/integration/database/repositories.test.js
const { Pool } = require('pg')
const LedgerRepository = require('@/repositories/ledger-repository')

describe('LedgerRepository Integration', () => {
  let pool
  let repository
  
  beforeAll(async () => {
    // Create test database connection
    pool = new Pool({
      connectionString: process.env.TEST_DATABASE_URL
    })
    
    repository = new LedgerRepository(pool)
    
    // Setup test schema
    await setupTestSchema(pool)
  })
  
  afterAll(async () => {
    await pool.end()
  })
  
  beforeEach(async () => {
    await cleanupTestData(pool)
  })
  
  describe('create', () => {
    it('should create a new ledger', async () => {
      const ledgerData = {
        company_id: 1,
        name: 'Test Ledger',
        parent: 'Test Parent',
        opening_balance: 1000.00,
        closing_balance: 1500.00,
        guid: 'test-guid-123'
      }
      
      const result = await repository.create(ledgerData)
      
      expect(result.id).toBeDefined()
      expect(result.name).toBe(ledgerData.name)
      expect(result.guid).toBe(ledgerData.guid)
    })
    
    it('should enforce unique constraint', async () => {
      const ledgerData = {
        company_id: 1,
        name: 'Test Ledger',
        guid: 'test-guid-123'
      }
      
      await repository.create(ledgerData)
      
      await expect(repository.create(ledgerData))
        .rejects.toThrow('duplicate key value')
    })
  })
  
  describe('findByCompanyId', () => {
    beforeEach(async () => {
      // Create test data
      await repository.create({
        company_id: 1,
        name: 'Ledger 1',
        guid: 'guid-1'
      })
      await repository.create({
        company_id: 1,
        name: 'Ledger 2',
        guid: 'guid-2'
      })
      await repository.create({
        company_id: 2,
        name: 'Ledger 3',
        guid: 'guid-3'
      })
    })
    
    it('should return ledgers for specific company', async () => {
      const ledgers = await repository.findByCompanyId(1)
      
      expect(ledgers).toHaveLength(2)
      expect(ledgers.every(l => l.company_id === 1)).toBe(true)
    })
    
    it('should return empty array for company with no ledgers', async () => {
      const ledgers = await repository.findByCompanyId(999)
      
      expect(ledgers).toHaveLength(0)
    })
  })
})
```

## 🚀 End-to-End Testing

### Example: Workflow Tests

```javascript
// tests/e2e/workflows.test.js
const request = require('supertest')
const { buildServer } = require('@/server')

describe('Complete Workflows', () => {
  let app
  
  beforeAll(async () => {
    app = await buildServer({ test: true })
  })
  
  afterAll(async () => {
    await app.close()
  })
  
  describe('Ledger Management Workflow', () => {
    it('should complete full ledger workflow', async () => {
      const apiKey = 'test-key'
      
      // 1. Get all ledgers
      const listResponse = await request(app.server)
        .get('/api/v1/ledgers')
        .query({ apiKey })
        .expect(200)
      
      expect(listResponse.body.data.ledgers.length).toBeGreaterThan(0)
      
      // 2. Search for specific ledger
      const searchResponse = await request(app.server)
        .get('/api/v1/search/ledgers')
        .query({ apiKey, q: 'Bank', limit: 5 })
        .expect(200)
      
      expect(searchResponse.body.data.ledgers.length).toBeGreaterThan(0)
      
      // 3. Get specific ledger details
      const ledger = searchResponse.body.data.ledgers[0]
      const detailResponse = await request(app.server)
        .get(`/api/v1/ledgers/${ledger.guid}`)
        .query({ apiKey })
        .expect(200)
      
      expect(detailResponse.body.data.ledger.guid).toBe(ledger.guid)
      
      // 4. Generate trial balance report
      const reportResponse = await request(app.server)
        .get('/api/v1/reports/trial-balance')
        .query({ apiKey, asOf: '2024-03-31' })
        .expect(200)
      
      expect(reportResponse.body.data.report).toBeDefined()
      expect(reportResponse.body.data.report.accounts).toBeInstanceOf(Array)
    })
  })
})
```

## ⚡ Performance Testing

### Load Testing with Artillery

```yaml
# tests/performance/ledgers-load.yml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 50
      name: "Load test"
    - duration: 60
      arrivalRate: 100
      name: "Stress test"
  
scenarios:
  - name: "Fetch Ledgers"
    weight: 70
    flow:
      - get:
          url: "/api/v1/ledgers"
          qs:
            apiKey: "test-key"
            limit: 50
  
  - name: "Search Ledgers"
    weight: 20
    flow:
      - get:
          url: "/api/v1/search/ledgers"
          qs:
            apiKey: "test-key"
            q: "Bank"
            limit: 10
  
  - name: "Get Reports"
    weight: 10
    flow:
      - get:
          url: "/api/v1/reports/trial-balance"
          qs:
            apiKey: "test-key"
            asOf: "2024-03-31"
```

### Performance Benchmarks

```javascript
// tests/performance/benchmarks.js
const { performance } = require('perf_hooks')

describe('Performance Benchmarks', () => {
  let app
  
  beforeAll(async () => {
    app = await buildServer({ test: true })
  })
  
  describe('API Response Times', () => {
    it('should respond to ledger request within 200ms', async () => {
      const start = performance.now()
      
      await request(app.server)
        .get('/api/v1/ledgers')
        .query({ apiKey: 'test-key' })
        .expect(200)
      
      const end = performance.now()
      const responseTime = end - start
      
      expect(responseTime).toBeLessThan(200)
    })
    
    it('should handle concurrent requests efficiently', async () => {
      const concurrentRequests = 50
      const requests = Array(concurrentRequests).fill().map(() =>
        request(app.server)
          .get('/api/v1/ledgers')
          .query({ apiKey: 'test-key' })
      )
      
      const start = performance.now()
      await Promise.all(requests)
      const end = performance.now()
      
      const totalTime = end - start
      const averageTime = totalTime / concurrentRequests
      
      expect(averageTime).toBeLessThan(100)
    })
  })
})
```

## 📊 Test Execution

### Running Tests

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run E2E tests only
npm run test:e2e

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- tests/unit/services/ledger-service.test.js

# Run tests matching pattern
npm test -- --testNamePattern="should return cached data"
```

### Test Scripts (`package.json`)

```json
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest --testPathPattern=tests/unit",
    "test:integration": "jest --testPathPattern=tests/integration",
    "test:e2e": "jest --testPathPattern=tests/e2e",
    "test:coverage": "jest --coverage",
    "test:watch": "jest --watch",
    "test:ci": "jest --ci --coverage --watchAll=false",
    "test:performance": "artillery run tests/performance/ledgers-load.yml"
  }
}
```

### CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      
      - run: npm ci
      
      - run: npm run test:ci
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
```

## 📈 Test Coverage

### Coverage Reports

```bash
# Generate coverage report
npm run test:coverage

# View coverage in browser
open coverage/lcov-report/index.html

# Check coverage threshold
npm run test:coverage | grep "All files"
```

### Coverage Configuration

```javascript
// jest.config.js
module.exports = {
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/index.js',
    '!**/node_modules/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/services/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  }
}
```

## 🛠️ Test Utilities

### Mock Tally Server

```javascript
// tests/helpers/mock-tally.js
class MockTallyServer {
  constructor() {
    this.server = null
    this.responses = new Map()
  }
  
  async start(port = 9001) {
    const express = require('express')
    const app = express()
    
    app.use(express.raw({ type: 'text/xml' }))
    
    app.post('/', (req, res) => {
      const xmlRequest = req.body.toString()
      const response = this.getResponse(xmlRequest)
      res.set('Content-Type', 'text/xml')
      res.send(response)
    })
    
    this.server = app.listen(port)
    console.log(`Mock Tally server started on port ${port}`)
  }
  
  async stop() {
    if (this.server) {
      await new Promise(resolve => this.server.close(resolve))
    }
  }
  
  setResponse(requestPattern, response) {
    this.responses.set(requestPattern, response)
  }
  
  getResponse(request) {
    for (const [pattern, response] of this.responses) {
      if (request.includes(pattern)) {
        return response
      }
    }
    
    // Default response
    return `<?xml version="1.0"?>
<ENVELOPE>
  <BODY>
    <DATA>
      <COLLECTION>
        <LEDGER>
          <LANGUAGENAME.LIST>
            <NAME.LIST>
              <NAME>Mock Ledger</NAME>
            </NAME.LIST>
          </LANGUAGENAME.LIST>
        </LEDGER>
      </COLLECTION>
    </DATA>
  </BODY>
</ENVELOPE>`
  }
}

module.exports = MockTallyServer
```

### Custom Assertions

```javascript
// tests/helpers/assertions.js
class CustomAssertions {
  static assertValidApiResponse(response) {
    expect(response).toHaveProperty('success')
    expect(response).toHaveProperty('data')
    expect(response).toHaveProperty('meta')
    expect(response.meta).toHaveProperty('timestamp')
  }
  
  static assertLedgerData(ledger) {
    expect(ledger).toHaveProperty('name')
    expect(ledger).toHaveProperty('guid')
    expect(typeof ledger.name).toBe('string')
    expect(typeof ledger.guid).toBe('string')
  }
  
  static assertError(response, expectedCode, expectedMessage) {
    expect(response.success).toBe(false)
    expect(response.error.code).toBe(expectedCode)
    expect(response.error.message).toContain(expectedMessage)
  }
}

module.exports = CustomAssertions
```

---

**🧪 This comprehensive testing strategy ensures code quality, reliability, and performance for the Tally Integration API.**
