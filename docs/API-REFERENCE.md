# 📚 API Reference Guide

Complete documentation for all Tally Integration API endpoints.

## 🔐 Authentication

All endpoints (except `/health`) require authentication using an API key.

### Methods
- **Query Parameter**: `?apiKey=your-key-here`
- **Header**: `X-API-Key: your-key-here`

### Configure API Keys
Edit `.env` file:
```env
API_KEYS=key1,key2,admin-key
```

## 🏥 Health Endpoints

### GET /health
Check system health and Tally connectivity.

**Response:**
```json
{
  "success": true,
  "connected": true,
  "responseTime": 145,
  "message": "Successfully connected to Tally",
  "tallyUrl": "localhost:9000"
}
```

### POST /api/test-connection
Test connection to a specific Tally instance.

**Request Body:**
```json
{
  "tallyUrl": "localhost:9000"
}
```

**Response:**
```json
{
  "success": true,
  "connected": true,
  "responseTime": 120,
  "message": "Successfully connected to Tally",
  "tallyUrl": "localhost:9000"
}
```

## 📊 Ledger Endpoints

### GET /api/v1/ledgers
List all ledgers from Tally.

**Parameters:**
- `apiKey` (required) - Authentication key
- `company` (optional) - Filter by company name

**Example:**
```bash
curl "http://localhost:3000/api/v1/ledgers?apiKey=dev-key-local-only"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "NAME": "Cash",
      "PARENT": "Bank Accounts",
      "OPENINGBALANCE": "10000.00",
      "CLOSINGBALANCE": "15000.00"
    }
  ],
  "count": 1
}
```

### GET /api/v1/ledgers/{ledgerName}
Get details for a specific ledger.

**Parameters:**
- `ledgerName` - Ledger name (URL encoded)
- `apiKey` (required) - Authentication key

**Example:**
```bash
curl "http://localhost:3000/api/v1/ledgers/Cash?apiKey=dev-key-local-only"
```

### GET /api/v1/ledgers/{ledgerName}/transactions
Get transactions for a specific ledger.

**Parameters:**
- `ledgerName` - Ledger name (URL encoded)
- `from` (optional) - Start date (YYYY-MM-DD)
- `to` (optional) - End date (YYYY-MM-DD)
- `apiKey` (required) - Authentication key

**Example:**
```bash
curl "http://localhost:3000/api/v1/ledgers/Cash/transactions?from=2024-01-01&to=2024-12-31&apiKey=dev-key-local-only"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "ledger_name": "Cash",
      "company": "Sample Company",
      "period": {
        "from": "2024-01-01",
        "to": "2024-12-31"
      },
      "transactions": [
        {
          "date": "20240115",
          "particulars": "Sales Income",
          "voucher_type": "Receipt",
          "voucher_no": 1,
          "debit": 5000.00,
          "credit": null
        }
      ],
      "summary": {
        "opening_balance": 10000.00,
        "total_debit": 5000.00,
        "total_credit": 0.00,
        "closing_balance": 15000.00
      }
    }
  ]
}
```

## 🧾 Voucher Endpoints

### GET /api/v1/vouchers
List vouchers with date filtering.

**Parameters:**
- `apiKey` (required) - Authentication key
- `from` (optional) - Start date (YYYY-MM-DD)
- `to` (optional) - End date (YYYY-MM-DD)
- `voucherType` (optional) - Filter by voucher type

**Example:**
```bash
curl "http://localhost:3000/api/v1/vouchers?from=2024-01-01&to=2024-12-31&apiKey=dev-key-local-only"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "guid": "4f3f4b54-ded8-4f7d-9d4e-4b3b175d09d9-000001fa",
      "date": "20200401",
      "voucherType": "Journal",
      "voucherNumber": "2",
      "narration": "Recurrent Rent expenses",
      "partyName": "",
      "amount": "-50000.00",
      "ledgerEntries": [
        {
          "ledgerName": "Rent",
          "amount": "-50000.00",
          "ledgerType": "Yes"
        },
        {
          "ledgerName": "Bank of Baroda-Savings A/c",
          "amount": "50000.00",
          "ledgerType": "No"
        }
      ]
    }
  ]
}
```

## 📈 Report Endpoints

### GET /api/v1/reports/trial-balance
Get trial balance report.

**Parameters:**
- `apiKey` (required) - Authentication key
- `company` (optional) - Company name

**Example:**
```bash
curl "http://localhost:3000/api/v1/reports/trial-balance?apiKey=dev-key-local-only"
```

### GET /api/v1/reports/profit-loss
Get profit and loss statement.

**Parameters:**
- `apiKey` (required) - Authentication key
- `from` (optional) - Start date
- `to` (optional) - End date

### GET /api/v1/reports/balance-sheet
Get balance sheet report.

**Parameters:**
- `apiKey` (required) - Authentication key
- `asOf` (optional) - As of date

## 🏢 Groups Endpoints

### GET /api/v1/groups
List all account groups.

**Parameters:**
- `apiKey` (required) - Authentication key

**Example:**
```bash
curl "http://localhost:3000/api/v1/groups?apiKey=dev-key-local-only"
```

## 🔧 Special Endpoints

### POST /api/fetch-tally-data
Generic endpoint for custom Tally data requests.

**Request Body:**
```json
{
  "tallyUrl": "localhost:9000",
  "requestType": "ListOfLedgers|LedgerTransactions|LedgerDetails|TrialBalance",
  "ledgerName": "Cash (optional)",
  "from": "2024-01-01 (optional)",
  "to": "2024-12-31 (optional)"
}
```

**Request Types:**
- `ListOfLedgers` - Get all ledgers
- `LedgerTransactions` - Get transactions for specific ledger
- `LedgerDetails` - Get detailed ledger information
- `TrialBalance` - Get trial balance data

**Example:**
```bash
curl -X POST "http://localhost:3000/api/fetch-tally-data" \
  -H "Content-Type: application/json" \
  -d '{
    "tallyUrl": "localhost:9000",
    "requestType": "ListOfLedgers"
  }'
```

### GET /api/full-company-data
Get complete data for a specific company.

**Parameters:**
- `company` (required) - Company name

**Example:**
```bash
curl "http://localhost:3000/api/full-company-data?company=Sample%20Company&apiKey=dev-key-local-only"
```

## 📄 Response Format

### Success Response
```json
{
  "success": true,
  "data": [...],
  "count": 42,
  "processingTime": 250
}
```

### Error Response
```json
{
  "success": false,
  "error": "TallyOfflineError",
  "message": "Tally is not reachable at localhost:9000",
  "details": {
    "host": "localhost",
    "port": 9000,
    "code": "ECONNREFUSED"
  }
}
```

## 🚨 HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 400 | Bad Request | Invalid parameters |
| 401 | Unauthorized | Missing API key |
| 403 | Forbidden | Invalid API key |
| 404 | Not Found | Resource not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Error | Server error |
| 502 | Bad Gateway | Tally returned malformed data |
| 503 | Service Unavailable | Tally offline |
| 504 | Gateway Timeout | Tally request timed out |

## 🔄 Rate Limiting

- **Default**: 100 requests per minute per IP
- **Per API Key**: Additional tracking available
- **Response Headers**:
  - `X-RateLimit-Limit`: Request limit
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Reset time (Unix timestamp)

## 🛠️ SDK Examples

### JavaScript/Node.js
```javascript
const axios = require('axios');

const API_BASE = 'http://localhost:3000';
const API_KEY = 'your-api-key';

async function getLedgers() {
  try {
    const response = await axios.get(`${API_BASE}/api/v1/ledgers`, {
      params: { apiKey: API_KEY }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching ledgers:', error.response?.data || error.message);
    throw error;
  }
}
```

### Python
```python
import requests

API_BASE = 'http://localhost:3000'
API_KEY = 'your-api-key'

def get_ledgers():
    try:
        response = requests.get(
            f'{API_BASE}/api/v1/ledgers',
            params={'apiKey': API_KEY}
        )
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f'Error fetching ledgers: {e}')
        raise
```

### cURL Examples
```bash
# Health check
curl http://localhost:3000/health

# Get ledgers
curl "http://localhost:3000/api/v1/ledgers?apiKey=your-key"

# Get specific ledger transactions
curl "http://localhost:3000/api/v1/ledgers/Cash/transactions?from=2024-01-01&to=2024-12-31&apiKey=your-key"

# Post custom request
curl -X POST "http://localhost:3000/api/fetch-tally-data" \
  -H "Content-Type: application/json" \
  -d '{"tallyUrl": "localhost:9000", "requestType": "ListOfLedgers"}'
```

## 📝 Data Types

### Amount Fields
- **Type**: String or Number
- **Format**: "12345.00" or 12345.00
- **Currency**: Depends on Tally company settings

### Date Fields
- **Type**: String
- **Formats**: 
  - Tally XML: "20240115" (YYYYMMDD)
  - API: "2024-01-15" (YYYY-MM-DD)

### GUID Fields
- **Type**: String
- **Format**: UUID with suffix
- **Example**: "4f3f4b54-ded8-4f7d-9d4e-4b3b175d09d9-000001fa"

## 🔍 Filtering and Pagination

### Date Filtering
Most endpoints support date filtering:
- `from`: Start date (YYYY-MM-DD)
- `to`: End date (YYYY-MM-DD)

### Pagination
Some endpoints support pagination:
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 50, max: 500)

### Sorting
- Default sort by date (descending)
- Some endpoints support custom sort parameters

## 🚀 Best Practices

1. **Use API Keys**: Never expose keys in client-side code
2. **Handle Errors**: Check for error responses and status codes
3. **Rate Limiting**: Implement exponential backoff for failed requests
4. **Caching**: Cache responses where appropriate to reduce Tally load
5. **Date Formats**: Always use YYYY-MM-DD for date parameters
6. **URL Encoding**: Encode special characters in ledger names

## 🐛 Debugging

### Enable Debug Logging
Set environment variable:
```env
LOG_LEVEL=debug
```

### Test Connection
Always test connection first:
```bash
curl http://localhost:3000/health
```

### Common Issues
- **ECONNREFUSED**: Tally not running or port blocked
- **Timeout**: Tally slow to respond
- **Parse Error**: Malformed XML from Tally
- **Auth Error**: Invalid or missing API key
