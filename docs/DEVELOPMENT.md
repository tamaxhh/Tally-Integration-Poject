# 🛠️ Development Guide

Complete guide for developing and contributing to the Tally Integration API.

## 🚀 Getting Started

### Prerequisites
- Node.js v20+ (LTS)
- Tally Prime (for testing)
- Git
- Code editor (VS Code recommended)

### Development Setup

1. **Clone Repository**
```bash
git clone <repository-url>
cd tally-integration
```

2. **Install Dependencies**
```bash
# Backend dependencies
npm install

# Frontend dependencies
cd frontend
npm install
cd ..
```

3. **Configure Environment**
```bash
# Copy environment template
copy .env.example .env

# Edit .env for development
NODE_ENV=development
PORT=3000
HOST=0.0.0.0
TALLY_HOST=localhost
TALLY_PORT=9000
API_KEYS=dev-key-local-only,admin-key-1234
LOG_LEVEL=debug
```

4. **Start Development Servers**
```bash
# Start backend (in terminal 1)
npm run dev

# Start frontend (in terminal 2)
cd frontend
npm start
```

5. **Verify Setup**
```bash
# Test backend
curl http://localhost:3000/health

# Test API
curl "http://localhost:3000/api/v1/ledgers?apiKey=dev-key-local-only"

# Access frontend
# Open: http://localhost:3001
```

## 📁 Project Structure

```
tally-integration/
├── src/                          # Backend source code
│   ├── app.js                    # Main Fastify application
│   ├── index.js                  # Application entry point
│   ├── config/                   # Configuration and logging
│   │   ├── index.js              # Config loader
│   │   └── logger.js             # Pino logger setup
│   ├── middleware/               # Express/Fastify middleware
│   │   ├── auth.middleware.js    # API key authentication
│   │   └── errorHandler.middleware.js # Error handling
│   ├── routes/                   # API route handlers
│   │   ├── health.routes.js      # Health check endpoints
│   │   ├── ledger.routes.js      # Ledger-related endpoints
│   │   ├── voucher.routes.js     # Voucher endpoints
│   │   ├── report.routes.js      # Financial reports
│   │   ├── groups.routes.js      # Account groups
│   │   └── complete-data.routes.js # Complete data export
│   ├── services/                 # Business logic layer
│   │   ├── tally.client.js       # Tally XML client
│   │   ├── ledger.service.js     # Ledger operations
│   │   ├── voucher.service.js    # Voucher operations
│   │   └── company.service.js    # Company data operations
│   ├── parsers/                  # XML parsing logic
│   │   ├── ledger.parser.js      # Parse ledger XML
│   │   ├── voucher.parser.js     # Parse voucher XML
│   │   └── report.parser.js      # Parse report XML
│   └── utils/                    # Utility functions
│       ├── errors.js             # Custom error classes
│       └── cacheManager.js       # Redis caching
├── frontend/                     # React frontend
│   ├── src/
│   │   ├── components/           # React components
│   │   │   ├── Dashboard.js       # Main dashboard
│   │   │   ├── LedgerList.js      # Ledger listing
│   │   │   ├── TransactionList.js # Transaction view
│   │   │   └── Reports.js         # Financial reports
│   │   ├── contexts/             # React contexts
│   │   │   └── ApiContext.js     # API state management
│   │   ├── pages/                # Page components
│   │   └── App.js                # Main React app
│   ├── public/                   # Static assets
│   └── package.json              # Frontend dependencies
├── docker/                       # Docker configuration
│   ├── Dockerfile               # Backend container
│   ├── Dockerfile.frontend      # Frontend container
│   └── docker-compose.yml       # Multi-container setup
├── docs/                        # Documentation
├── test/                        # Test files
├── .env.example                 # Environment template
├── package.json                 # Backend dependencies
└── README.md                    # Project documentation
```

## 🧪 Testing

### Test Structure
```
test/
├── unit/                        # Unit tests
│   ├── services/               # Service layer tests
│   ├── parsers/               # Parser tests
│   └── utils/                 # Utility tests
├── integration/                # Integration tests
│   ├── api/                   # API endpoint tests
│   └── tally-mock/           # Mock Tally server
└── fixtures/                  # Test data
    ├── ledger.xml            # Sample ledger XML
    └── voucher.xml           # Sample voucher XML
```

### Running Tests

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests
npm run test:integration

# Run with coverage
npx jest --coverage

# Watch mode (development)
npm run test:watch
```

### Writing Tests

#### Unit Test Example
```javascript
// test/unit/services/ledger.service.test.js
const { getLedgers } = require('../../../src/services/ledger.service');
const { mockTallyClient } = require('../../helpers/tally-mock');

describe('Ledger Service', () => {
  beforeEach(() => {
    // Setup mocks
    mockTallyClient.reset();
  });

  describe('getLedgers', () => {
    it('should return list of ledgers', async () => {
      // Arrange
      const mockResponse = '<ENVELOPE>...</ENVELOPE>';
      mockTallyClient.sendXML.mockResolvedValue(mockResponse);

      // Act
      const result = await getLedgers();

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(10);
    });

    it('should handle Tally errors', async () => {
      // Arrange
      mockTallyClient.sendXML.mockRejectedValue(new Error('Tally offline'));

      // Act
      const result = await getLedgers();

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('TallyOfflineError');
    });
  });
});
```

#### Integration Test Example
```javascript
// test/integration/api/ledger.api.test.js
const request = require('supertest');
const { buildServer } = require('../../../src/app');

describe('Ledger API', () => {
  let server;

  beforeAll(async () => {
    server = await buildServer();
  });

  afterAll(async () => {
    await server.close();
  });

  describe('GET /api/v1/ledgers', () => {
    it('should return ledgers with valid API key', async () => {
      const response = await request(server)
        .get('/api/v1/ledgers')
        .query({ apiKey: 'test-key' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should reject requests without API key', async () => {
      const response = await request(server)
        .get('/api/v1/ledgers');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Missing API key');
    });
  });
});
```

### Mock Tally Server
```javascript
// test/helpers/tally-mock.js
const express = require('express');

class MockTallyServer {
  constructor() {
    this.app = express();
    this.setupRoutes();
  }

  setupRoutes() {
    this.app.post('/', (req, res) => {
      const xml = req.body;
      
      // Parse XML to determine response
      if (xml.includes('List of Ledgers')) {
        res.send(this.getLedgerResponse());
      } else if (xml.includes('Trial Balance')) {
        res.send(this.getTrialBalanceResponse());
      } else {
        res.status(400).send('Invalid XML request');
      }
    });

    this.app.get('/', (req, res) => {
      res.send('Tally Mock Server');
    });
  }

  getLedgerResponse() {
    return `
      <ENVELOPE>
        <BODY>
          <DATA>
            <COLLECTION>
              <LEDGER>
                <NAME>Cash</NAME>
                <OPENINGBALANCE>10000.00</OPENINGBALANCE>
              </LEDGER>
            </COLLECTION>
          </DATA>
        </BODY>
      </ENVELOPE>
    `;
  }

  getTrialBalanceResponse() {
    return `
      <ENVELOPE>
        <BODY>
          <DATA>
            <COLLECTION>
              <LEDGER>
                <NAME>Cash</NAME>
                <CLOSINGBALANCE>15000.00</CLOSINGBALANCE>
              </LEDGER>
            </COLLECTION>
          </DATA>
        </BODY>
      </ENVELOPE>
    `;
  }

  start(port = 9001) {
    return new Promise((resolve) => {
      this.server = this.app.listen(port, () => {
        console.log(`Mock Tally server running on port ${port}`);
        resolve();
      });
    });
  }

  stop() {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(resolve);
      } else {
        resolve();
      }
    });
  }
}

module.exports = { MockTallyServer };
```

## 🔧 Development Tools

### VS Code Configuration

#### Recommended Extensions
```json
{
  "recommendations": [
    "ms-vscode.vscode-json",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "ms-vscode.vscode-jest",
    "ms-vscode-remote.remote-containers"
  ]
}
```

#### Settings
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "files.associations": {
    "*.js": "javascript"
  },
  "emmet.includeLanguages": {
    "javascript": "javascriptreact"
  }
}
```

### Debug Configuration

#### VS Code launch.json
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Backend",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/src/index.js",
      "env": {
        "NODE_ENV": "development"
      },
      "console": "integratedTerminal",
      "restart": true,
      "runtimeExecutable": "nodemon"
    },
    {
      "name": "Debug Tests",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": ["--runInBand"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

### Package Scripts

```json
{
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js",
    "test": "jest --runInBand",
    "test:unit": "jest test/unit",
    "test:integration": "jest test/integration",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src/ --fix",
    "format": "prettier --write src/",
    "build:exe": "pkg src/index.js --targets node18-win-x64 --output dist/tally-remote-fetcher.exe",
    "docker:build": "docker build -t tally-integration .",
    "docker:run": "docker run -p 3000:3000 tally-integration"
  }
}
```

## 🏗️ Architecture Patterns

### Service Layer Pattern

#### Service Structure
```javascript
// src/services/ledger.service.js
const { buildLedgerXML } = require('../parsers/ledger.xml');
const { parseLedgerResponse } = require('../parsers/ledger.parser');
const { sendToTally } = require('./tally.client');
const { cache } = require('../utils/cacheManager');

class LedgerService {
  async getLedgers(options = {}) {
    const cacheKey = 'ledgers:all';
    
    // Check cache first
    const cached = await cache.get(cacheKey);
    if (cached && !options.skipCache) {
      return cached;
    }

    try {
      // Build XML request
      const xml = buildLedgerXML(options);
      
      // Send to Tally
      const response = await sendToTally(xml);
      
      // Parse response
      const data = parseLedgerResponse(response);
      
      // Cache result
      await cache.set(cacheKey, data, 300); // 5 minutes
      
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getLedgerByName(name, options = {}) {
    const cacheKey = `ledger:${name}`;
    
    const cached = await cache.get(cacheKey);
    if (cached && !options.skipCache) {
      return cached;
    }

    try {
      const xml = buildLedgerXML({ filter: { NAME: name } });
      const response = await sendToTally(xml);
      const data = parseLedgerResponse(response);
      
      await cache.set(cacheKey, data, 300);
      
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = new LedgerService();
```

### Error Handling Pattern

#### Custom Errors
```javascript
// src/utils/errors.js
class TallyError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = 'TallyError';
    this.code = code;
    this.details = details;
  }
}

class TallyOfflineError extends TallyError {
  constructor(host, port) {
    super(`Tally is not reachable at ${host}:${port}`, 'TALLY_OFFLINE', { host, port });
    this.name = 'TallyOfflineError';
  }
}

class TallyTimeoutError extends TallyError {
  constructor(timeout) {
    super(`Tally request timed out after ${timeout}ms`, 'TALLY_TIMEOUT', { timeout });
    this.name = 'TallyTimeoutError';
  }
}

class TallyParseError extends TallyError {
  constructor(xml) {
    super('Failed to parse Tally XML response', 'TALLY_PARSE_ERROR', { xml });
    this.name = 'TallyParseError';
  }
}

module.exports = {
  TallyError,
  TallyOfflineError,
  TallyTimeoutError,
  TallyParseError
};
```

#### Error Handler Middleware
```javascript
// src/middleware/errorHandler.middleware.js
const { TallyOfflineError, TallyTimeoutError } = require('../utils/errors');

function errorHandler(error, request, reply) {
  const logger = request.log;
  
  // Log error
  logger.error({ error, request }, 'Request failed');

  // Handle specific error types
  if (error instanceof TallyOfflineError) {
    return reply.code(503).send({
      success: false,
      error: 'TallyOfflineError',
      message: error.message,
      details: error.details
    });
  }

  if (error instanceof TallyTimeoutError) {
    return reply.code(504).send({
      success: false,
      error: 'TallyTimeoutError',
      message: error.message,
      details: error.details
    });
  }

  // Generic error
  return reply.code(500).send({
    success: false,
    error: 'InternalServerError',
    message: 'An unexpected error occurred'
  });
}

module.exports = { errorHandler };
```

### Caching Pattern

#### Cache Manager
```javascript
// src/utils/cacheManager.js
const Redis = require('ioredis');

class CacheManager {
  constructor() {
    this.client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    this.defaultTTL = 300; // 5 minutes
  }

  async get(key) {
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key, value, ttl = this.defaultTTL) {
    try {
      await this.client.setex(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  async invalidate(pattern) {
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
      return keys.length;
    } catch (error) {
      console.error('Cache invalidate error:', error);
      return 0;
    }
  }

  async disconnect() {
    await this.client.quit();
  }
}

module.exports = new CacheManager();
```

## 🔄 API Development

### Adding New Endpoints

#### 1. Create Route File
```javascript
// src/routes/new-endpoint.routes.js
const newEndpointService = require('../services/new-endpoint.service');

async function newEndpointRoutes(server, options) {
  server.get('/new-endpoint', async (request, reply) => {
    try {
      const result = await newEndpointService.getData(request.query);
      return reply.send(result);
    } catch (error) {
      return reply.code(500).send({
        success: false,
        error: error.message
      });
    }
  });

  server.post('/new-endpoint', async (request, reply) => {
    try {
      const result = await newEndpointService.createData(request.body);
      return reply.code(201).send(result);
    } catch (error) {
      return reply.code(500).send({
        success: false,
        error: error.message
      });
    }
  });
}

module.exports = newEndpointRoutes;
```

#### 2. Create Service
```javascript
// src/services/new-endpoint.service.js
const { sendToTally } = require('./tally.client');
const { parseNewEndpointResponse } = require('../parsers/new-endpoint.parser');

class NewEndpointService {
  async getData(options = {}) {
    try {
      const xml = this.buildRequestXML(options);
      const response = await sendToTally(xml);
      const data = parseNewEndpointResponse(response);
      
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async createData(data) {
    try {
      const xml = this.buildCreateXML(data);
      const response = await sendToTally(xml);
      const result = parseNewEndpointResponse(response);
      
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  buildRequestXML(options) {
    // Build XML request for Tally
    return `<ENVELOPE>...</ENVELOPE>`;
  }

  buildCreateXML(data) {
    // Build XML for creating data
    return `<ENVELOPE>...</ENVELOPE>`;
  }
}

module.exports = new NewEndpointService();
```

#### 3. Register Route
```javascript
// src/app.js
const newEndpointRoutes = require('./routes/new-endpoint.routes');

// In buildServer function
await server.register(newEndpointRoutes, { prefix: API_PREFIX });
```

### API Versioning

#### Version Strategy
```javascript
// Use URL path versioning
/api/v1/ledgers     // Current version
/api/v2/ledgers     // Future version with breaking changes

// Keep old versions for backward compatibility
```

#### Route Registration
```javascript
// Register different versions
await server.register(v1LedgerRoutes, { prefix: '/api/v1' });
await server.register(v2LedgerRoutes, { prefix: '/api/v2' });
```

## 🎨 Frontend Development

### React Component Structure

#### Component Example
```javascript
// frontend/src/components/LedgerList.js
import React, { useState, useEffect } from 'react';
import { useApi } from '../contexts/ApiContext';

function LedgerList() {
  const { getLedgers } = useApi();
  const [ledgers, setLedgers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLedgers();
  }, []);

  const fetchLedgers = async () => {
    try {
      setLoading(true);
      const response = await getLedgers();
      setLedgers(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="ledger-list">
      <h2>Ledgers</h2>
      <ul>
        {ledgers.map(ledger => (
          <li key={ledger.NAME}>
            {ledger.NAME} - {ledger.OPENINGBALANCE}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default LedgerList;
```

#### API Context
```javascript
// frontend/src/contexts/ApiContext.js
import React, { createContext, useContext, useReducer } from 'react';
import axios from 'axios';

const ApiContext = createContext();

const apiReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'SET_DATA':
      return { ...state, data: action.payload, loading: false, error: null };
    default:
      return state;
  }
};

const ApiProvider = ({ children }) => {
  const [state, dispatch] = useReducer(apiReducer, {
    loading: false,
    error: null,
    data: null
  });

  const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000'
  });

  const getLedgers = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await api.get('/api/v1/ledgers', {
        params: { apiKey: process.env.REACT_APP_API_KEY }
      });
      dispatch({ type: 'SET_DATA', payload: response.data });
      return response.data;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  const checkConnection = async () => {
    try {
      const response = await api.post('/api/test-connection', {
        tallyUrl: 'localhost:9000'
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  return (
    <ApiContext.Provider value={{
      ...state,
      getLedgers,
      checkConnection
    }}>
      {children}
    </ApiContext.Provider>
  );
};

export const useApi = () => {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error('useApi must be used within ApiProvider');
  }
  return context;
};

export default ApiProvider;
```

## 🚀 Performance Optimization

### Backend Optimization

#### 1. Caching Strategy
```javascript
// Implement multi-level caching
const cache = {
  // Memory cache for frequent requests
  memory: new Map(),
  
  // Redis cache for persistence
  redis: require('./cacheManager'),
  
  async get(key) {
    // Check memory first
    if (this.memory.has(key)) {
      return this.memory.get(key);
    }
    
    // Check Redis
    const value = await this.redis.get(key);
    if (value) {
      this.memory.set(key, value);
      return value;
    }
    
    return null;
  },
  
  async set(key, value, ttl) {
    this.memory.set(key, value);
    await this.redis.set(key, value, ttl);
  }
};
```

#### 2. Connection Pooling
```javascript
// Reuse HTTP connections to Tally
const axios = require('axios');
const httpAgent = new http.Agent({ keepAlive: true });
const httpsAgent = new https.Agent({ keepAlive: true });

const tallyClient = axios.create({
  baseURL: `http://${process.env.TALLY_HOST}:${process.env.TALLY_PORT}`,
  httpAgent,
  httpsAgent,
  timeout: parseInt(process.env.TALLY_TIMEOUT_MS) || 5000
});
```

#### 3. Streaming Responses
```javascript
// Stream large XML responses
const parseStream = require('xml-stream');
const { PassThrough } = require('stream');

async function streamLedgers() {
  const response = await tallyClient.post('/', xmlRequest, {
    responseType: 'stream'
  });
  
  const stream = new PassThrough();
  const parser = new parseStream(response.data);
  
  parser.on('endElement: LEDGER', (ledger) => {
    stream.push(JSON.stringify(ledger) + '\n');
  });
  
  return stream;
}
```

### Frontend Optimization

#### 1. Code Splitting
```javascript
// frontend/src/App.js
import React, { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const LedgerList = lazy(() => import('./pages/LedgerList'));
const Reports = lazy(() => import('./pages/Reports'));

function App() {
  return (
    <Router>
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/ledgers" element={<LedgerList />} />
          <Route path="/reports" element={<Reports />} />
        </Routes>
      </Suspense>
    </Router>
  );
}
```

#### 2. Virtual Scrolling
```javascript
// For large lists
import { FixedSizeList as List } from 'react-window';

function VirtualLedgerList({ ledgers }) {
  const Row = ({ index, style }) => (
    <div style={style}>
      {ledgers[index].NAME}
    </div>
  );

  return (
    <List
      height={600}
      itemCount={ledgers.length}
      itemSize={35}
    >
      {Row}
    </List>
  );
}
```

## 📝 Code Quality

### ESLint Configuration
```json
{
  "extends": [
    "eslint:recommended",
    "@typescript-eslint/recommended"
  ],
  "rules": {
    "no-console": "warn",
    "no-unused-vars": "error",
    "prefer-const": "error",
    "no-var": "error"
  },
  "env": {
    "node": true,
    "es2021": true,
    "jest": true
  }
}
```

### Prettier Configuration
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
```

### Husky Git Hooks
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "pre-push": "npm test"
    }
  },
  "lint-staged": {
    "*.js": ["eslint --fix", "prettier --write"]
  }
}
```

## 🔄 CI/CD Pipeline

### GitHub Actions
```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linting
        run: npm run lint
      
      - name: Run tests
        run: npm run test:coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker image
        run: docker build -t tally-integration:${{ github.sha }} .
      
      - name: Push to registry
        run: |
          echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
          docker push tally-integration:${{ github.sha }}

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - name: Deploy to production
        run: |
          # Deployment commands
          echo "Deploying to production..."
```

## 📚 Learning Resources

### Node.js Best Practices
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [Fastify Documentation](https://www.fastify.io/docs/latest/)
- [Jest Testing Framework](https://jestjs.io/docs/getting-started)

### Tally Integration
- Tally XML API documentation
- TDL customization guide
- Tally Prime developer resources

### React Development
- [React Documentation](https://reactjs.org/docs/)
- [React Router](https://reactrouter.com/docs)
- [Axios HTTP Client](https://axios-http.com/docs/intro)

This development guide provides everything needed to contribute to the Tally Integration project effectively.
