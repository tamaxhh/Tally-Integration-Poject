# Tally Integration System — Architecture Reference

## Folder Structure

```
tally-integration/
│
├── src/
│   │
│   ├── config/
│   │   ├── index.js          # Central config loader — reads .env, validates required vars
│   │   └── logger.js         # Pino logger setup (structured JSON logs for prod)
│   │
│   ├── connectors/
│   │   └── tally/
│   │       ├── client.js     # Core HTTP client — sends XML to Tally port 9000
│   │       ├── retry.js      # Retry + circuit breaker logic
│   │       └── health.js     # Polls Tally to check if it's online
│   │
│   ├── xml/
│   │   ├── builder/
│   │   │   ├── ledger.xml.js     # Builds XML request for ledger fetch
│   │   │   ├── voucher.xml.js    # Builds XML request for vouchers
│   │   │   └── report.xml.js     # Builds XML for reports (trial balance, P&L)
│   │   │
│   │   └── parser/
│   │       ├── index.js          # Shared XML → JSON parser (fast-xml-parser)
│   │       ├── ledger.parser.js  # Normalises raw ledger XML into typed JSON
│   │       ├── voucher.parser.js # Normalises voucher data
│   │       └── report.parser.js  # Normalises report data
│   │
│   ├── services/
│   │   ├── ledger.service.js     # Business logic for ledger operations
│   │   ├── voucher.service.js    # Business logic for voucher operations
│   │   └── report.service.js     # Business logic for report generation
│   │
│   ├── api/
│   │   ├── server.js             # Fastify instance creation + plugin registration
│   │   ├── middleware/
│   │   │   ├── auth.js           # API key validation
│   │   │   ├── rateLimiter.js    # Rate limiting per API key
│   │   │   └── errorHandler.js   # Global error handler (maps errors → HTTP codes)
│   │   │
│   │   └── routes/
│   │       ├── ledger.routes.js      # GET /ledgers, GET /ledgers/:name
│   │       ├── voucher.routes.js     # GET /vouchers (date range filters)
│   │       ├── report.routes.js      # GET /reports/:type
│   │       └── health.routes.js      # GET /health (liveness + Tally connectivity)
│   │
│   ├── cache/
│   │   ├── redis.js              # Redis client setup
│   │   └── cacheManager.js       # get/set/invalidate wrappers with key namespacing
│   │
│   ├── db/
│   │   ├── postgres.js           # pg pool setup
│   │   ├── migrations/           # SQL migration files (numbered)
│   │   └── models/
│   │       ├── ledger.model.js   # DB queries for ledger snapshots
│   │       └── syncLog.model.js  # Records each sync attempt + status
│   │
│   ├── jobs/
│   │   ├── scheduler.js          # node-cron setup — registers all jobs
│   │   ├── syncLedgers.job.js    # Pulls fresh ledger data every N minutes
│   │   └── syncVouchers.job.js   # Pulls today's vouchers
│   │
│   └── utils/
│       ├── errors.js             # Custom error classes (TallyOfflineError, etc.)
│       └── transform.js          # Shared data transformation helpers
│
├── tests/
│   ├── unit/
│   │   ├── xml/              # Test XML builder output, parser output
│   │   └── services/         # Test service logic with mocked connector
│   │
│   ├── integration/
│   │   ├── api/              # Test API routes with mock Tally server
│   │   └── tally-mock/       # Express server that mimics Tally XML responses
│   │
│   └── fixtures/
│       ├── ledger.xml        # Sample Tally XML responses for tests
│       └── voucher.xml
│
├── docker/
│   ├── Dockerfile
│   └── docker-compose.yml    # App + Redis + PostgreSQL
│
├── .env.example              # Template — NEVER commit .env
├── package.json
└── README.md
```

## Component Responsibilities

### `connectors/tally/client.js`
Single responsibility: send an XML string to Tally and return the raw XML response string.
Nothing else. No parsing, no business logic.

### `xml/builder/`
Each file exports a function that takes parameters and returns a valid Tally XML string.
Kept separate from the connector so you can unit test XML generation without a live Tally.

### `xml/parser/`
Each file exports a function that takes a raw XML string and returns a typed JS object.
Normalisation happens here: amount strings → numbers, date strings → Date objects.

### `services/`
Orchestrates: calls builder → calls connector → calls parser → optionally writes to DB.
This is where caching decisions live.

### `api/routes/`
Thin layer. Validates query params, calls a service, returns JSON.
No business logic in routes — they're just HTTP adapters.

### `jobs/`
Background sync: regularly pulls fresh data from Tally and stores in PostgreSQL.
This makes the API resilient — even if Tally is offline, we can serve cached DB data.

## Data Flow Summary

```
Client → Fastify → Auth middleware → Route handler
  → Service layer → Cache check (Redis)
    → [HIT] return cached JSON
    → [MISS] XML Builder → HTTP to Tally :9000
              → XML Parser → normalize → write Redis → return JSON
```

## Key Design Decisions

1. **Fastify over Express**: 2-3x faster request throughput, built-in JSON schema validation
2. **Redis for caching**: Tally is a local desktop app — hammering it with requests causes instability
3. **PostgreSQL for snapshots**: Provides historical data + makes system resilient to Tally downtime
4. **Circuit breaker pattern**: If Tally is offline, stop retrying immediately and serve stale data
5. **Separate XML builder/parser**: Testable in isolation without a live Tally instance
