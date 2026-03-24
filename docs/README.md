# Tally Integration API

Production-grade integration system that connects to Tally ERP/Prime via its XML API,
transforms the data into clean JSON, and exposes it through a REST API.

## Architecture at a Glance

```
Client → Fastify API → Auth/Rate Limit → Service Layer
                                              ↓
                                    Redis Cache (TTL-based)
                                              ↓
                                    XML Builder → Tally :9000
                                              ↓
                                    XML Parser → PostgreSQL
```

## Prerequisites

| Requirement | Details |
|---|---|
| Node.js | v20+ (LTS) |
| Tally ERP/Prime | Must have "Enable ODBC Server" turned on |
| Redis | v7+ (for caching) |
| PostgreSQL | v15+ (for snapshots, optional) |
| OS | Any — but Tally only runs on Windows, so you'll need Windows or a Windows VM |

### Enabling Tally's ODBC Server

1. Open Tally
2. Go to **F12: Configure → Advanced Configuration**
3. Set **"Enable ODBC Server"** to **Yes**
4. Note the port (default: **9000**)
5. Open your company in Tally (Tally serves data for whichever company is open)

## Quick Start

### Option A: Local development

```bash
# 1. Clone and install
git clone <repo> && cd tally-integration
npm install

# 2. Configure
cp .env.example .env
# Edit .env — at minimum set TALLY_HOST if Tally is on a different machine

# 3. Start Redis (if not already running)
docker run -d -p 6379:6379 redis:7-alpine

# 4. Start the API
npm run dev   # nodemon watches for changes

# 5. Verify
curl http://localhost:3000/health
```

### Option B: Docker Compose (recommended)

```bash
cp .env.example .env
# Edit TALLY_HOST in docker-compose.yml if Tally is on a different machine

docker-compose -f docker/docker-compose.yml up -d

# View logs
docker-compose -f docker/docker-compose.yml logs -f app
```

## Configuration

All configuration is via environment variables. See `.env.example` for full list.

| Variable | Required | Default | Description |
|---|---|---|---|
| `TALLY_HOST` | No | `localhost` | Hostname where Tally is running |
| `TALLY_PORT` | No | `9000` | Tally ODBC server port |
| `TALLY_TIMEOUT_MS` | No | `5000` | Request timeout in milliseconds |
| `API_KEYS` | Yes | — | Comma-separated list of valid API keys |
| `REDIS_URL` | No | `redis://localhost:6379` | Redis connection URL |
| `LOG_LEVEL` | No | `info` | `debug/info/warn/error` |

## API Reference

All endpoints require the `X-API-Key` header (except `/health*`).

### Ledgers

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/ledgers` | List all ledgers |
| GET | `/api/v1/ledgers/:name` | Get ledger by name (URL-encode the name) |
| POST | `/api/v1/ledgers/sync` | Force refresh from Tally |

Query params for GET `/api/v1/ledgers`:
- `company` — Filter by Tally company name
- `page` — Page number (default: 1)
- `limit` — Results per page (default: 50, max: 500)

### Vouchers

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/vouchers` | List vouchers by date range |
| GET | `/api/v1/vouchers/:voucherNumber` | Get single voucher |
| GET | `/api/v1/vouchers/summary` | Totals grouped by voucher type |

Required query params: `fromDate` (YYYY-MM-DD), `toDate` (YYYY-MM-DD)
Optional: `voucherType` (Sales, Payment, Receipt, etc.), `company`, `page`, `limit`

Maximum date range: 366 days.

### Reports

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/reports/trial-balance` | All ledger closing balances |
| GET | `/api/v1/reports/profit-loss` | Income vs expenses |
| GET | `/api/v1/reports/balance-sheet` | Assets and liabilities |
| GET | `/api/v1/reports/day-book` | All transactions for a date range |

Required query params: `fromDate`, `toDate`

### Health

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/health` | No | Full status (Tally + Redis) |
| GET | `/health/live` | No | Liveness probe (always 200) |
| GET | `/health/ready` | No | Readiness probe (503 if Tally down) |

## Testing

```bash
# Run all tests
npm test

# Run unit tests only (fast, no network)
npm run test:unit

# Run integration tests (starts mock Tally server internally)
npm run test:integration

# Run with coverage
npx jest --coverage
```

## Understanding the Response Format

Every API response has this shape:

```json
{
  "success": true,
  "data": [ ... ],
  "meta": {
    "total": 42,
    "page": 1,
    "limit": 50,
    "fromCache": true
  }
}
```

Error responses:
```json
{
  "error": "TallyOfflineError",
  "message": "Tally is not reachable at localhost:9000...",
  "details": { "host": "localhost", "port": 9000 }
}
```

HTTP status codes used:
- `200` — Success
- `400` — Validation error (bad query params)
- `401` — Missing API key
- `403` — Invalid API key
- `404` — Resource not found in Tally
- `429` — Rate limit exceeded
- `500` — Unexpected server error
- `502` — Tally returned an error or malformed XML
- `503` — Tally is offline / circuit breaker open
- `504` — Tally request timed out

## Production Deployment

### Environment hardening checklist

- [ ] Set `NODE_ENV=production`
- [ ] Set strong, unique values for `API_KEYS` (use a secret manager)
- [ ] Set `TALLY_HOST` to the actual Tally machine IP (not localhost)
- [ ] Configure `REDIS_URL` to production Redis (consider Redis Cluster for HA)
- [ ] Configure `DATABASE_URL` to production PostgreSQL
- [ ] Set `LOG_LEVEL=warn` (not `debug` — too verbose in production)
- [ ] Set `CORS_ORIGIN` to your frontend domain(s)
- [ ] Enable TLS termination at the load balancer (do NOT expose HTTP directly)

### Cloud deployment options

**AWS EC2 (simplest)**:
- Run the Docker container on an EC2 instance
- Tally must run on a Windows EC2 in the same VPC
- Use ElastiCache (Redis) and RDS (PostgreSQL) for managed services

**AWS ECS / Fargate (recommended)**:
- Containerised, auto-scaling
- Use ECS service discovery so API containers can reach Tally's EC2 by hostname

**Important**: Tally runs only on Windows. Your API server can run on Linux,
but it must have network access to the Windows machine running Tally.

## Troubleshooting

**"Tally is not reachable"**
1. Is Tally running? Is a company open?
2. Is ODBC Server enabled in Tally F12 settings?
3. Is port 9000 open in Windows Firewall?
4. Test directly: `curl http://<tally-ip>:9000/` — should return XML

**"Circuit breaker is OPEN"**
- Tally failed too many times recently
- Wait 30 seconds (recovery timeout) and try again
- Check Tally is running and responsive

**Empty ledger list**
- Make sure a company is OPEN in Tally (not just Tally running — a company must be loaded)
- Check `TALLY_COMPANY_NAME` in .env matches exactly

**Amounts showing as null**
- The ledger has no transactions — opening and closing balance are both empty/zero in Tally
- This is correct behavior — null means "no data" vs 0 meaning "zero balance"

## Project Structure

```
src/
├── config/          # Config loading, logger
├── connectors/      # Tally HTTP client, circuit breaker
├── xml/
│   ├── builder/     # XML request templates
│   └── parser/      # XML → JSON transformers
├── services/        # Business logic, caching orchestration
├── api/
│   ├── middleware/  # Auth, error handling
│   └── routes/      # HTTP endpoints
├── cache/           # Redis client and manager
├── jobs/            # Background sync scheduler
└── utils/           # Custom errors, helpers
```

## License

MIT
