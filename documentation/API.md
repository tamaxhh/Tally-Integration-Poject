# API Documentation

Complete reference for all Tally Integration API endpoints, request/response formats, and usage examples.

## 🔌 API Overview

The Tally Integration API provides RESTful endpoints for accessing Tally ERP/Prime data in modern JSON format.

### Base URL
```
Development: http://localhost:3000
Production:  https://your-domain.com/api
```

### Authentication
All API requests require authentication using API keys:

**Method 1: Query Parameter (Recommended for testing)**
```
?apiKey=your-api-key
```

**Method 2: HTTP Header (Recommended for production)**
```
X-API-Key: your-api-key
```

### API Keys
- **Development**: `dev-key-local-only`
- **Production**: Set via `API_KEYS` environment variable

### Content Types
- **Request**: `application/json`
- **Response**: `application/json`

## 📊 Response Format

All API responses follow this standard format:

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2024-03-24T11:30:00.000Z",
    "version": "v1",
    "cached": false
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": {
      "field": "apiKey",
      "issue": "Required field missing"
    }
  },
  "meta": {
    "timestamp": "2024-03-24T11:30:00.000Z",
    "requestId": "req-123456"
  }
}
```

## 🏥 Health Check Endpoints

### GET /health
Basic health check without authentication.

**Request:**
```bash
curl http://localhost:3000/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-03-24T11:30:00.000Z"
}
```

### GET /health/live
Liveness probe - requires authentication.

**Request:**
```bash
curl "http://localhost:3000/health/live?apiKey=dev-key-local-only"
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-03-24T11:30:00.000Z"
}
```

### GET /health/ready
Readiness probe - requires authentication.

**Request:**
```bash
curl "http://localhost:3000/health/ready?apiKey=dev-key-local-only"
```

**Response:**
```json
{
  "status": "ready",
  "timestamp": "2024-03-24T11:30:00.000Z",
  "checks": {
    "database": "ok",
    "redis": "ok",
    "tally": "ok"
  }
}
```

## 📋 Ledger Endpoints

### GET /api/v1/ledgers
Fetch all ledgers from Tally.

**Authentication**: Required

**Request Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| apiKey | string | Yes | - | API authentication key |
| company | string | No | current | Company name/GUID |
| from | string | No | current fiscal year | Start date (YYYY-MM-DD) |
| to | string | No | current fiscal year | End date (YYYY-MM-DD) |
| include | string | No | all | Comma-separated fields |
| limit | integer | No | 1000 | Maximum results |
| offset | integer | No | 0 | Pagination offset |

**Request Example:**
```bash
curl "http://localhost:3000/api/v1/ledgers?apiKey=dev-key-local-only&limit=10"
```

**Response Example:**
```json
{
  "success": true,
  "data": {
    "ledgers": [
      {
        "name": "Alfa Provisions",
        "parent": "Sundry Debtors",
        "openingBalance": 15000.00,
        "closingBalance": 25000.00,
        "guid": "123e4567-e89b-12d3-a456-426614174000",
        "type": "Debtor"
      },
      {
        "name": "Bank of Baroda-Savings A/c",
        "parent": "Bank Accounts",
        "openingBalance": 50000.00,
        "closingBalance": 75000.00,
        "guid": "123e4567-e89b-12d3-a456-426614174001",
        "type": "Bank"
      }
    ]
  },
  "meta": {
    "count": 95,
    "limit": 10,
    "offset": 0,
    "total": 95,
    "cached": false,
    "timestamp": "2024-03-24T11:30:00.000Z"
  }
}
```

### GET /api/v1/ledgers/{guid}
Fetch a specific ledger by GUID.

**Authentication**: Required

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| guid | string | Ledger unique identifier |

**Request Example:**
```bash
curl "http://localhost:3000/api/v1/ledgers/123e4567-e89b-12d3-a456-426614174000?apiKey=dev-key-local-only"
```

**Response Example:**
```json
{
  "success": true,
  "data": {
    "ledger": {
      "name": "Alfa Provisions",
      "parent": "Sundry Debtors",
      "openingBalance": 15000.00,
      "closingBalance": 25000.00,
      "guid": "123e4567-e89b-12d3-a456-426614174000",
      "type": "Debtor",
      "createdDate": "2023-01-01",
      "modifiedDate": "2024-03-24"
    }
  },
  "meta": {
    "cached": false,
    "timestamp": "2024-03-24T11:30:00.000Z"
  }
}
```

## 🧾 Voucher Endpoints

### GET /api/v1/vouchers
Fetch vouchers from Tally.

**Authentication**: Required

**Request Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| apiKey | string | Yes | - | API authentication key |
| type | string | No | all | Voucher type (Sales, Purchase, Payment, etc.) |
| from | string | No | current month | Start date (YYYY-MM-DD) |
| to | string | No | current month | End date (YYYY-MM-DD) |
| limit | integer | No | 100 | Maximum results |
| offset | integer | No | 0 | Pagination offset |

**Request Example:**
```bash
curl "http://localhost:3000/api/v1/vouchers?apiKey=dev-key-local-only&type=Sales&from=2024-03-01&to=2024-03-31"
```

**Response Example:**
```json
{
  "success": true,
  "data": {
    "vouchers": [
      {
        "voucherNumber": "SAL-001",
        "date": "2024-03-15",
        "type": "Sales",
        "partyName": "Alfa Provisions",
        "amount": 15000.00,
        "narration": "Sales invoice for March",
        "guid": "456e7890-e89b-12d3-a456-426614174000"
      }
    ]
  },
  "meta": {
    "count": 45,
    "limit": 100,
    "offset": 0,
    "total": 45,
    "cached": false,
    "timestamp": "2024-03-24T11:30:00.000Z"
  }
}
```

### GET /api/v1/vouchers/{guid}
Fetch a specific voucher by GUID.

**Authentication**: Required

**Request Example:**
```bash
curl "http://localhost:3000/api/v1/vouchers/456e7890-e89b-12d3-a456-426614174000?apiKey=dev-key-local-only"
```

## 📈 Report Endpoints

### GET /api/v1/reports/trial-balance
Generate trial balance report.

**Authentication**: Required

**Request Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| apiKey | string | Yes | - | API authentication key |
| asOf | string | No | current date | Report date (YYYY-MM-DD) |
| format | string | No | json | Response format (json, csv) |

**Request Example:**
```bash
curl "http://localhost:3000/api/v1/reports/trial-balance?apiKey=dev-key-local-only&asOf=2024-03-31"
```

**Response Example:**
```json
{
  "success": true,
  "data": {
    "report": {
      "title": "Trial Balance",
      "asOf": "2024-03-31",
      "accounts": [
        {
          "name": "Alfa Provisions",
          "debit": 0.00,
          "credit": 25000.00,
          "type": "Sundry Debtors"
        }
      ],
      "totals": {
        "debit": 150000.00,
        "credit": 150000.00
      }
    }
  },
  "meta": {
    "generatedAt": "2024-03-24T11:30:00.000Z",
    "cached": false
  }
}
```

### GET /api/v1/reports/balance-sheet
Generate balance sheet report.

**Authentication**: Required

**Request Example:**
```bash
curl "http://localhost:3000/api/v1/reports/balance-sheet?apiKey=dev-key-local-only&asOf=2024-03-31"
```

### GET /api/v1/reports/profit-loss
Generate profit and loss report.

**Authentication**: Required

**Request Example:**
```bash
curl "http://localhost:3000/api/v1/reports/profit-loss?apiKey=dev-key-local-only&from=2024-04-01&to=2024-03-31"
```

## 🔍 Search Endpoints

### GET /api/v1/search/ledgers
Search ledgers by name or other criteria.

**Authentication**: Required

**Request Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| apiKey | string | Yes | - | API authentication key |
| q | string | Yes | - | Search query |
| field | string | No | name | Search field (name, parent, type) |
| limit | integer | No | 20 | Maximum results |

**Request Example:**
```bash
curl "http://localhost:3000/api/v1/search/ledgers?apiKey=dev-key-local-only&q=Bank&limit=10"
```

**Response Example:**
```json
{
  "success": true,
  "data": {
    "ledgers": [
      {
        "name": "Bank of Baroda-Savings A/c",
        "parent": "Bank Accounts",
        "guid": "123e4567-e89b-12d3-a456-426614174001"
      }
    ]
  },
  "meta": {
    "count": 1,
    "query": "Bank",
    "timestamp": "2024-03-24T11:30:00.000Z"
  }
}
```

## 📊 Statistics Endpoints

### GET /api/v1/stats/summary
Get overall system statistics.

**Authentication**: Required

**Request Example:**
```bash
curl "http://localhost:3000/api/v1/stats/summary?apiKey=dev-key-local-only"
```

**Response Example:**
```json
{
  "success": true,
  "data": {
    "statistics": {
      "totalLedgers": 95,
      "totalVouchers": 1250,
      "companies": 1,
      "lastSync": "2024-03-24T11:25:00.000Z",
      "cacheHitRate": 0.75,
      "averageResponseTime": 150
    }
  },
  "meta": {
    "timestamp": "2024-03-24T11:30:00.000Z"
  }
}
```

## ⚠️ Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| VALIDATION_ERROR | 400 | Request validation failed |
| UNAUTHORIZED | 401 | Invalid or missing API key |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| RATE_LIMITED | 429 | Too many requests |
| TALLY_ERROR | 502 | Tally communication error |
| DATABASE_ERROR | 503 | Database connection error |
| INTERNAL_ERROR | 500 | Internal server error |

### Error Response Examples

**Validation Error (400):**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": {
      "field": "apiKey",
      "issue": "Required field missing"
    }
  }
}
```

**Unauthorized (401):**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid API key"
  }
}
```

**Tally Error (502):**
```json
{
  "success": false,
  "error": {
    "code": "TALLY_ERROR",
    "message": "Failed to communicate with Tally",
    "details": "Connection timeout"
  }
}
```

## 🔄 Rate Limiting

API requests are rate-limited to prevent abuse:

| Plan | Requests per Minute | Burst |
|------|-------------------|-------|
| Development | 100 | 20 |
| Production | 1000 | 100 |
| Enterprise | 5000 | 500 |

**Rate Limit Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1648123456
```

**Rate Limited Response (429):**
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests",
    "details": "Try again in 30 seconds"
  },
  "meta": {
    "retryAfter": 30
  }
}
```

## 🧪 Testing Endpoints

### POST /api/v1/test/connection
Test connection to Tally (development only).

**Authentication**: Required

**Request Example:**
```bash
curl -X POST "http://localhost:3000/api/v1/test/connection?apiKey=dev-key-local-only"
```

**Response Example:**
```json
{
  "success": true,
  "data": {
    "connection": {
      "status": "connected",
      "version": "TallyPrime 2.1",
      "company": "Demo Company",
      "responseTime": 45
    }
  }
}
```

## 📚 SDK Examples

### JavaScript/Node.js

```javascript
const axios = require('axios')

class TallyAPI {
  constructor(apiKey, baseURL = 'http://localhost:3000') {
    this.apiKey = apiKey
    this.baseURL = baseURL
    this.client = axios.create({
      baseURL: this.baseURL,
      params: { apiKey: this.apiKey }
    })
  }

  async getLedgers(options = {}) {
    const response = await this.client.get('/api/v1/ledgers', {
      params: options
    })
    return response.data
  }

  async searchLedgers(query, options = {}) {
    const response = await this.client.get('/api/v1/search/ledgers', {
      params: { q, ...options }
    })
    return response.data
  }
}

// Usage
const api = new TallyAPI('dev-key-local-only')

// Fetch all ledgers
const ledgers = await api.getLedgers({ limit: 10 })

// Search ledgers
const results = await api.searchLedgers('Bank')
```

### Python

```python
import requests

class TallyAPI:
    def __init__(self, api_key, base_url='http://localhost:3000'):
        self.api_key = api_key
        self.base_url = base_url
        self.params = {'apiKey': api_key}

    def get_ledgers(self, **options):
        response = requests.get(
            f'{self.base_url}/api/v1/ledgers',
            params={**self.params, **options}
        )
        response.raise_for_status()
        return response.json()

    def search_ledgers(self, query, **options):
        response = requests.get(
            f'{self.base_url}/api/v1/search/ledgers',
            params={**self.params, 'q': query, **options}
        )
        response.raise_for_status()
        return response.json()

# Usage
api = TallyAPI('dev-key-local-only')

# Fetch all ledgers
ledgers = api.get_ledgers(limit=10)

# Search ledgers
results = api.search_ledgers('Bank')
```

### cURL Examples

```bash
# Basic ledger fetch
curl "http://localhost:3000/api/v1/ledgers?apiKey=dev-key-local-only"

# With pagination
curl "http://localhost:3000/api/v1/ledgers?apiKey=dev-key-local-only&limit=20&offset=40"

# Date range filtering
curl "http://localhost:3000/api/v1/vouchers?apiKey=dev-key-local-only&from=2024-03-01&to=2024-03-31"

# Search
curl "http://localhost:3000/api/v1/search/ledgers?apiKey=dev-key-local-only&q=Bank&limit=5"

# Using header authentication
curl -H "X-API-Key: dev-key-local-only" \
     "http://localhost:3000/api/v1/ledgers"
```

## 📄 Postman Collection

Import this collection into Postman for easy testing:

```json
{
  "info": {
    "name": "Tally Integration API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "apiKey",
      "value": "dev-key-local-only"
    },
    {
      "key": "baseUrl",
      "value": "http://localhost:3000"
    }
  ],
  "item": [
    {
      "name": "Health",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "{{baseUrl}}/health?apiKey={{apiKey}}",
          "host": ["{{baseUrl}}"],
          "path": ["health"],
          "query": [
            {"key": "apiKey", "value": "{{apiKey}}"}
          ]
        }
      }
    },
    {
      "name": "Ledgers",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "{{baseUrl}}/api/v1/ledgers?apiKey={{apiKey}}",
          "host": ["{{baseUrl}}"],
          "path": ["api", "v1", "ledgers"],
          "query": [
            {"key": "apiKey", "value": "{{apiKey}}"}
          ]
        }
      }
    }
  ]
}
```

---

**🔌 This API provides comprehensive access to Tally data with modern RESTful patterns and robust error handling.**
