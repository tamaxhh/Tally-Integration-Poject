# Code Structure Explanation

Comprehensive guide to the project's organization, naming conventions, and design patterns.

## 📁 Folder Structure

```
tally-integration/
├── 📁 documentation/           # All project documentation
│   ├── README.md             # Project overview
│   ├── SETUP.md              # Installation guide
│   ├── ARCHITECTURE.md       # System design
│   ├── CODE_STRUCTURE.md     # This file
│   ├── API.md                # API reference
│   ├── DATABASE.md           # Database schema
│   ├── ENVIRONMENT.md        # Configuration guide
│   ├── TESTING.md            # Testing guide
│   ├── DEPLOYMENT.md         # Deployment guide
│   ├── TROUBLESHOOTING.md    # Troubleshooting
│   └── MAINTENANCE.md        # Maintenance guide
│
├── 📁 src/                   # Main source code
│   ├── 📁 connectors/        # External service connections
│   │   ├── tally/
│   │   │   ├── client.js     # Tally HTTP client
│   │   │   ├── xml-builder.js # XML request builder
│   │   │   └── parser.js     # XML response parser
│   │   └── cache/
│   │       └── manager.js    # Redis cache operations
│   ├── 📁 services/          # Business logic layer
│   │   ├── ledger.service.js # Ledger operations
│   │   ├── voucher.service.js # Voucher operations
│   │   ├── report.service.js # Report generation
│   │   └── cache.service.js   # Caching strategy
│   ├── 📁 routes/            # API route handlers
│   │   ├── api/
│   │   │   ├── v1/
│   │   │   │   ├── ledgers.js # Ledger endpoints
│   │   │   │   ├── vouchers.js # Voucher endpoints
│   │   │   │   └── reports.js # Report endpoints
│   │   │   └── index.js      # API v1 router
│   │   ├── health.js         # Health check routes
│   │   └── index.js          # Main router
│   ├── 📁 middleware/        # Request processing middleware
│   │   ├── auth.js           # Authentication
│   │   ├── rate-limit.js     # Rate limiting
│   │   ├── validation.js     # Request validation
│   │   └── error-handler.js  # Error handling
│   ├── 📁 utils/             # Utility functions
│   │   ├── logger.js         # Logging configuration
│   │   ├── config.js         # Configuration management
│   │   ├── helpers.js        # General helpers
│   │   └── constants.js       # Application constants
│   ├── 📁 models/            # Data models/schemas
│   │   ├── ledger.model.js   # Ledger schema
│   │   ├── voucher.model.js  # Voucher schema
│   │   └── index.js          # Model exports
│   └── 📁 index.js           # Application entry point
│
├── 📁 tests/                 # Test files
│   ├── 📁 unit/              # Unit tests
│   │   ├── connectors/       # Connector tests
│   │   ├── services/         # Service tests
│   │   ├── utils/            # Utility tests
│   │   └── models/           # Model tests
│   ├── 📁 integration/       # Integration tests
│   │   ├── api/              # API endpoint tests
│   │   ├── database/         # Database tests
│   │   └── tally/            # Tally integration tests
│   ├── 📁 fixtures/          # Test data
│   │   ├── ledgers.json      # Sample ledger data
│   │   └── vouchers.json     # Sample voucher data
│   └── 📁 helpers/           # Test helpers
│       ├── mock-tally.js     # Mock Tally server
│       ├── test-db.js        # Test database setup
│       └── assertions.js     # Custom assertions
│
├── 📁 migrations/            # Database migrations
│   ├── 001_initial_schema.sql
│   ├── 002_add_snapshots.sql
│   └── 003_add_api_usage.sql
│
├── 📁 scripts/              # Utility scripts
│   ├── setup-dev.sh         # Development setup
│   ├── backup-db.sh         # Database backup
│   ├── deploy.sh            # Deployment script
│   └── health-check.sh      # Health monitoring
│
├── 📁 docker/               # Docker configurations
│   ├── Dockerfile           # Main application image
│   ├── Dockerfile.dev       # Development image
│   └── nginx.conf           # Reverse proxy config
│
├── 📁 config/               # Configuration files
│   ├── jest.config.js       # Test configuration
│   ├── eslint.config.js     # Linting rules
│   └── prettier.config.js   # Code formatting
│
├── 📄 package.json          # Dependencies and scripts
├── 📄 package-lock.json     # Dependency lock file
├── 📄 docker-compose.yml    # Docker orchestration
├── 📄 docker-compose.dev.yml # Development Docker config
├── 📄 docker-compose.prod.yml # Production Docker config
├── 📄 .env.example          # Environment variables template
├── 📄 .gitignore            # Git ignore rules
├── 📄 .eslintrc.js          # ESLint configuration
├── 📄 .prettierrc           # Prettier configuration
└── 📄 README.md              # Project README
```

## 🏗️ Key Modules & Components

### 1. Application Entry Point (`src/index.js`)

**Purpose**: Application bootstrap and server startup

**Responsibilities**:
- Fastify server initialization
- Plugin registration
- Route mounting
- Graceful shutdown handling

**Key Patterns**:
```javascript
// Dependency injection pattern
async function buildServer(config = {}) {
  const fastify = require('fastify')({ logger: true })
  
  // Register plugins
  await fastify.register(require('@fastify/cors'), config.cors)
  await fastify.register(require('@fastify/rate-limit'), config.rateLimit)
  
  // Register routes
  await fastify.register(routes, { prefix: '/api' })
  
  return fastify
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  await fastify.close()
  process.exit(0)
})
```

### 2. Connectors Layer (`src/connectors/`)

**Purpose**: External service communication

#### Tally Client (`src/connectors/tally/client.js`)

```javascript
class TallyClient {
  constructor(config) {
    this.axios = axios.create({
      baseURL: `http://${config.host}:${config.port}`,
      timeout: config.timeout || 10000,
      headers: { 'Content-Type': 'text/xml' }
    })
    this.circuitBreaker = new CircuitBreaker(config.circuitBreaker)
  }
  
  async request(xmlRequest) {
    return this.circuitBreaker.execute(async () => {
      const response = await this.axios.post('/', xmlRequest)
      return response.data
    })
  }
}
```

#### XML Builder (`src/connectors/tally/xml-builder.js`)

```javascript
class XMLBuilder {
  static buildLedgerRequest(options = {}) {
    const defaults = {
      exportFormat: 'XML',
      fromDate: this.getDefaultFromDate(),
      toDate: this.getDefaultToDate()
    }
    
    const config = { ...defaults, ...options }
    
    return `<?xml version="1.0" encoding="utf-8"?>
<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>Export Data</TALLYREQUEST>
    <TYPE>Collection</TYPE>
    <ID>List of Ledgers</ID>
  </HEADER>
  <BODY>
    <DESC>
      <STATICVARIABLES>
        <SVEXPORTFORMAT>${config.exportFormat}</SVEXPORTFORMAT>
        <SVFROMDATE>${config.fromDate}</SVFROMDATE>
        <SVTODATE>${config.toDate}</SVTODATE>
      </STATICVARIABLES>
      <TDL>
        <TDLMESSAGE>
          <COLLECTION NAME="List of Ledgers" ISMODIFY="No">
            <TYPE>Ledger</TYPE>
            <FETCH>*</FETCH>
          </COLLECTION>
        </TDLMESSAGE>
      </TDL>
    </DESC>
  </BODY>
</ENVELOPE>`
  }
}
```

#### XML Parser (`src/connectors/tally/parser.js`)

```javascript
class XMLParser {
  static parseLedgerResponse(xmlData) {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: ''
    })
    
    const result = parser.parse(xmlData)
    const ledgers = this.extractLedgers(result)
    
    return {
      success: true,
      ledgers: ledgers.map(this.normalizeLedger),
      count: ledgers.length,
      raw: result
    }
  }
  
  static extractLedgers(result) {
    // Handle different Tally response structures
    if (result.ENVELOPE?.BODY?.DATA?.COLLECTION?.LEDGER) {
      return Array.isArray(result.ENVELOPE.BODY.DATA.COLLECTION.LEDGER)
        ? result.ENVELOPE.BODY.DATA.COLLECTION.LEDGER
        : [result.ENVELOPE.BODY.DATA.COLLECTION.LEDGER]
    }
    return []
  }
  
  static normalizeLedger(ledger) {
    return {
      name: this.extractName(ledger),
      openingBalance: this.parseAmount(ledger.OPENINGBALANCE),
      closingBalance: this.parseAmount(ledger.CLOSINGBALANCE),
      parent: ledger.PARENT || null,
      guid: ledger.GUID || null
    }
  }
}
```

### 3. Services Layer (`src/services/`)

**Purpose**: Business logic and data orchestration

#### Ledger Service (`src/services/ledger.service.js`)

```javascript
class LedgerService {
  constructor(dependencies) {
    this.tallyClient = dependencies.tallyClient
    this.cacheManager = dependencies.cacheManager
    this.logger = dependencies.logger
  }
  
  async getLedgers(options = {}) {
    const cacheKey = this.generateCacheKey(options)
    
    // Try cache first
    const cached = await this.cacheManager.get(cacheKey)
    if (cached) {
      this.logger.info('Cache hit for ledgers', { cacheKey })
      return cached
    }
    
    // Fetch from Tally
    const xmlRequest = XMLBuilder.buildLedgerRequest(options)
    const xmlResponse = await this.tallyClient.request(xmlRequest)
    const result = XMLParser.parseLedgerResponse(xmlResponse)
    
    // Cache the result
    await this.cacheManager.set(cacheKey, result, 300) // 5 minutes
    
    return result
  }
  
  generateCacheKey(options) {
    const keyData = {
      type: 'ledgers',
      ...options
    }
    return `tally:${Buffer.from(JSON.stringify(keyData)).toString('base64')}`
  }
}
```

### 4. Routes Layer (`src/routes/`)

**Purpose**: HTTP endpoint definitions

#### Ledger Routes (`src/routes/api/v1/ledgers.js`)

```javascript
async function ledgerRoutes(fastify, options) {
  // Schema validation
  const getLedgersSchema = {
    querystring: {
      type: 'object',
      properties: {
        apiKey: { type: 'string' },
        company: { type: 'string' },
        from: { type: 'string', format: 'date' },
        to: { type: 'string', format: 'date' }
      },
      required: ['apiKey']
    }
  }
  
  // GET /api/v1/ledgers
  fastify.get('/', {
    schema: getLedgersSchema,
    handler: async (request, reply) => {
      const ledgerService = request.scope.resolve('ledgerService')
      const result = await ledgerService.getLedgers(request.query)
      
      reply.send({
        success: true,
        data: result.ledgers,
        meta: {
          count: result.count,
          cached: result.cached || false,
          timestamp: new Date().toISOString()
        }
      })
    }
  })
}

module.exports = ledgerRoutes
```

### 5. Middleware (`src/middleware/`)

#### Authentication (`src/middleware/auth.js`)

```javascript
async function authMiddleware(request, reply) {
  const apiKey = request.query.apiKey || request.headers['x-api-key']
  
  if (!apiKey) {
    reply.code(401).send({
      error: 'Unauthorized',
      message: 'API key required'
    })
    return
  }
  
  const allowedKeys = process.env.API_KEYS.split(',').map(k => k.trim())
  
  if (!allowedKeys.includes(apiKey)) {
    reply.code(401).send({
      error: 'Unauthorized',
      message: 'Invalid API key'
    })
    return
  }
  
  // Add API key to request for downstream use
  request.apiKey = apiKey
}

module.exports = authMiddleware
```

## 🎯 Naming Conventions

### File and Directory Naming

**Pattern**: `kebab-case` for files and directories

```
✅ Correct:
- ledger-service.js
- api-routes/
- xml-parser.js

❌ Incorrect:
- LedgerService.js
- apiRoutes/
- xml_parser.js
```

### Function and Variable Naming

**Pattern**: `camelCase` for functions and variables

```javascript
✅ Correct:
- const getLedgers = async () => {}
- const tallyClient = new TallyClient()
- const cacheKey = generateCacheKey()

❌ Incorrect:
- const GetLedgers = async () => {}
- const TallyClient = new TallyClient()
- const cache_key = generateCacheKey()
```

### Class Naming

**Pattern**: `PascalCase` for classes

```javascript
✅ Correct:
- class TallyClient {}
- class XMLBuilder {}
- class LedgerService {}

❌ Incorrect:
- class tallyClient {}
- class xml_builder {}
- class ledger_service {}
```

### Constant Naming

**Pattern**: `UPPER_SNAKE_CASE` for constants

```javascript
✅ Correct:
- const DEFAULT_TIMEOUT = 10000
- const CACHE_TTL_SECONDS = 300
- const API_VERSION = 'v1'

❌ Incorrect:
- const defaultTimeout = 10000
- const cacheTtlSeconds = 300
- const api_version = 'v1'
```

## 🧩 Design Patterns Used

### 1. Dependency Injection

```javascript
// Service locator pattern
async function buildServer(container) {
  const fastify = require('fastify')({ logger: true })
  
  // Register dependencies
  fastify.decorate('tallyClient', new TallyClient(container.config.tally))
  fastify.decorate('cacheManager', new CacheManager(container.config.redis))
  fastify.decorate('ledgerService', new LedgerService({
    tallyClient: fastify.tallyClient,
    cacheManager: fastify.cacheManager,
    logger: fastify.log
  }))
  
  return fastify
}
```

### 2. Factory Pattern

```javascript
class ClientFactory {
  static create(type, config) {
    switch (type) {
      case 'tally':
        return new TallyClient(config)
      case 'redis':
        return new RedisClient(config)
      default:
        throw new Error(`Unknown client type: ${type}`)
    }
  }
}
```

### 3. Repository Pattern

```javascript
class LedgerRepository {
  constructor(database) {
    this.db = database
  }
  
  async findById(id) {
    return this.db.query('SELECT * FROM ledgers WHERE id = $1', [id])
  }
  
  async findByCompany(companyId) {
    return this.db.query('SELECT * FROM ledgers WHERE company_id = $1', [companyId])
  }
}
```

### 4. Strategy Pattern

```javascript
class CacheStrategy {
  static get(type) {
    switch (type) {
      case 'redis':
        return new RedisCacheStrategy()
      case 'memory':
        return new MemoryCacheStrategy()
      default:
        return new NoCacheStrategy()
    }
  }
}
```

### 5. Observer Pattern

```javascript
class EventEmitter {
  constructor() {
    this.events = new Map()
  }
  
  on(event, listener) {
    if (!this.events.has(event)) {
      this.events.set(event, [])
    }
    this.events.get(event).push(listener)
  }
  
  emit(event, data) {
    if (this.events.has(event)) {
      this.events.get(event).forEach(listener => listener(data))
    }
  }
}
```

## 🔄 Data Flow Patterns

### Request Processing Pipeline

```javascript
// Middleware chain pattern
const pipeline = [
  authMiddleware,
  rateLimitMiddleware,
  validationMiddleware,
  loggingMiddleware,
  requestHandler,
  errorHandlingMiddleware
]

async function processRequest(request, reply) {
  for (const middleware of pipeline) {
    const result = await middleware(request, reply)
    if (result === 'stop') break
  }
}
```

### Error Handling Pattern

```javascript
class ErrorHandler {
  static handle(error, request, reply) {
    const logger = request.log || console
    
    if (error instanceof ValidationError) {
      logger.warn('Validation error', { error: error.message })
      return reply.code(400).send({
        error: 'Bad Request',
        message: error.message,
        details: error.details
      })
    }
    
    if (error instanceof TallyError) {
      logger.error('Tally error', { error: error.message })
      return reply.code(502).send({
        error: 'Tally Error',
        message: 'Failed to communicate with Tally'
      })
    }
    
    // Generic error
    logger.error('Unexpected error', { error: error.stack })
    return reply.code(500).send({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred'
    })
  }
}
```

## 📝 Code Quality Standards

### ESLint Configuration

```javascript
module.exports = {
  extends: ['eslint:recommended', '@nodejs/recommended'],
  rules: {
    'indent': ['error', 2],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
    'no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
    'no-console': 'warn',
    'prefer-const': 'error',
    'no-var': 'error'
  }
}
```

### Prettier Configuration

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false
}
```

### Testing Patterns

```javascript
// Test structure
describe('LedgerService', () => {
  let ledgerService
  let mockTallyClient
  let mockCacheManager
  
  beforeEach(() => {
    mockTallyClient = { request: jest.fn() }
    mockCacheManager = { get: jest.fn(), set: jest.fn() }
    
    ledgerService = new LedgerService({
      tallyClient: mockTallyClient,
      cacheManager: mockCacheManager,
      logger: mockLogger
    })
  })
  
  describe('getLedgers', () => {
    it('should return cached data when available', async () => {
      const cachedData = { ledgers: [], count: 0 }
      mockCacheManager.get.mockResolvedValue(cachedData)
      
      const result = await ledgerService.getLedgers()
      
      expect(result).toEqual(cachedData)
      expect(mockTallyClient.request).not.toHaveBeenCalled()
    })
  })
})
```

---

**🏗️ This code structure ensures maintainability, scalability, and developer productivity for the Tally Integration API.**
