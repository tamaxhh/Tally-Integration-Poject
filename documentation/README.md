# Tally Integration API

Production-grade integration system that connects to Tally ERP/Prime via its XML API,
transforms the data into clean JSON, and exposes it through a REST API.

## 🎯 Project Overview

This system bridges the gap between Tally's legacy XML API and modern web applications. It provides:
- **Real-time access** to Tally financial data (ledgers, vouchers, reports)
- **Modern REST API** with JSON responses
- **Production-ready features**: caching, authentication, rate limiting
- **Scalable architecture** using Docker, Redis, and PostgreSQL
- **Fault-tolerant design** with circuit breakers and error handling

## 🏗️ Architecture at a Glance

```
Client → Fastify API → Auth/Rate Limit → Service Layer
                                              ↓
                                    Redis Cache (TTL-based)
                                              ↓
                                    XML Builder → Tally :9000
                                              ↓
                                    XML Parser → PostgreSQL
```

## 🛠️ Tech Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| **API Server** | Node.js 20+ + Fastify | High-performance REST API |
| **Containerization** | Docker + Docker Compose | Development & deployment |
| **Cache** | Redis 7+ | Tally response caching |
| **Database** | PostgreSQL 15+ | Data snapshots & analytics |
| **Authentication** | API Key based | Simple server-to-server auth |
| **XML Processing** | fast-xml-parser | Tally XML ↔ JSON conversion |
| **Logging** | Pino | Structured logging |
| **Testing** | Jest + Supertest | Unit & integration tests |

## 🚀 Quick Start

### Prerequisites
- **Tally ERP/Prime** running with ODBC Server enabled
- **Docker & Docker Compose** installed
- **Node.js 20+** (for local development)

### Setup & Run
```bash
# Clone and setup
git clone <repository-url>
cd tally-integration

# Start all services
docker-compose up -d --build

# Verify services
docker-compose ps
```

### Environment Variables
```bash
# Copy and configure
cp .env.example .env

# Key variables
API_KEYS=dev-key-local-only,prod-key-5678
TALLY_HOST=host.docker.internal
TALLY_PORT=9000
REDIS_URL=redis://localhost:6379
DATABASE_URL=postgresql://postgres:password@localhost:5432/tally_integration
```

## 📡 Basic Usage

### Health Check
```bash
curl "http://localhost:3000/health?apiKey=dev-key-local-only"
```

### Fetch Ledgers
```bash
curl "http://localhost:3000/api/v1/ledgers?apiKey=dev-key-local-only"
```

### Sample Response
```json
{
  "success": true,
  "ledgers": [
    {"name": "Alfa Provisions", "openingBalance": null, "closingBalance": null},
    {"name": "Bank of Baroda-Savings A/c", "openingBalance": null, "closingBalance": null}
  ],
  "count": 95
}
```

## 🔧 Development

### Local Development
```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

### Project Structure
```
├── src/                    # Source code
│   ├── connectors/         # Tally connection logic
│   ├── services/          # Business logic
│   ├── routes/            # API endpoints
│   └── utils/             # Helper functions
├── tests/                 # Test files
├── docker-compose.yml     # Docker configuration
├── package.json          # Dependencies & scripts
└── README.md             # This file
```

## 🔐 Authentication

The API uses simple API key authentication:
- **Header**: `X-API-Key: your-api-key` (preferred)
- **Query**: `?apiKey=your-api-key` (fallback)
- **Environment**: `API_KEYS=key1,key2,key3`

## 📊 Monitoring & Logging

- **Logs**: `docker-compose logs -f app`
- **Health**: `/health` endpoint
- **Metrics**: Built-in request logging
- **Error tracking**: Structured error logs

## 🚨 Production Considerations

- **Security**: Use strong API keys in production
- **Performance**: Redis caching reduces Tally load
- **Reliability**: Circuit breakers prevent cascade failures
- **Scalability**: Stateless design supports horizontal scaling

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| Tally not responding | Check if company is loaded, port 9000 accessible |
| Unauthorized error | Add `?apiKey=dev-key-local-only` to requests |
| Empty ledgers | Ensure Tally company is open (not just Tally running) |
| API down | `docker-compose restart app` |

## 📚 Additional Documentation

- [Setup Guide](./SETUP.md) - Detailed installation instructions
- [Architecture](./ARCHITECTURE.md) - System design & data flow
- [API Reference](./API.md) - Complete endpoint documentation
- [Deployment](./DEPLOYMENT.md) - Production deployment guide

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Add tests for new functionality
4. Submit pull request

## 📄 License

[Your License Here]

---

**🎉 Your production-grade Tally integration is ready!**
