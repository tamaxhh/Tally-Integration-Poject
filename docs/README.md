# 🚀 Tally Integration API

Production-grade integration system that connects Tally Prime to modern web applications through a secure REST API.

## 🎯 What This Project Does

Transforms Tally's desktop-only data into accessible web APIs with:
- **Real-time Data Access**: Live connection to Tally accounting data
- **Modern Web Interface**: React frontend with responsive UI
- **Production Features**: Authentication, caching, rate limiting, error handling
- **Multiple Deployment Options**: Local development, standalone executable, Docker

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React UI      │───▶│   Fastify API   │───▶│   Tally Prime   │
│  (Frontend)     │    │   (Backend)     │    │  (Desktop)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   Redis Cache   │
                       │   (Performance) │
                       └─────────────────┘
```

## 📋 Prerequisites

| Requirement | Details |
|-------------|---------|
| **Node.js** | v20+ (LTS) |
| **Tally Prime** | Installed with XML port enabled |
| **Redis** | v7+ (for caching - optional) |
| **OS** | Windows (Tally requirement) |

### Enable Tally XML Access
1. Open Tally Prime
2. Press **F12 → Configure → Advanced Configuration**
3. Set **"Allow XML Import/Export"** to **Yes**
4. Note the port (default: **9000**)
5. Restart Tally

## 🚀 Quick Start

### Option 1: Local Development
```bash
# Navigate to project
cd c:\Users\tamash62\Downloads\Tally

# Install dependencies
npm install

# Configure environment
copy .env.example .env
# Edit .env with your settings

# Start development server
npm run dev

# Access the application
# Frontend: http://localhost:3000
# API: http://localhost:3000/api/v1/ledgers
```

### Option 2: Standalone Executable
```bash
# Build executable
npm run build:exe

# Run the generated file
.\dist\tally-remote-fetcher.exe

# Access at http://localhost:3000
```

### Option 3: Docker
```bash
# Start with Docker Compose
docker-compose -f docker/docker-compose.yml up -d

# View logs
docker-compose -f docker/docker-compose.yml logs -f
```

## 🔧 Configuration

Key environment variables (see `.env.example`):

```env
# Server
NODE_ENV=development
PORT=3000
HOST=0.0.0.0

# Tally Connection
TALLY_HOST=localhost
TALLY_PORT=9000
TALLY_TIMEOUT_MS=5000

# Security
API_KEYS=dev-key-local-only,admin-key-1234

# Logging
LOG_LEVEL=info
```

## 📚 API Endpoints

All endpoints require API key authentication (except `/health`).

### Core Endpoints
```bash
# Health Check
GET /health

# List all ledgers
GET /api/v1/ledgers?apiKey=your-key

# Get specific ledger
GET /api/v1/ledgers/{ledgerName}?apiKey=your-key

# Get ledger transactions
GET /api/v1/ledgers/{ledgerName}/transactions?from=2024-01-01&to=2024-12-31&apiKey=your-key

# List vouchers
GET /api/v1/vouchers?from=2024-01-01&to=2024-12-31&apiKey=your-key

# Get reports
GET /api/v1/reports/trial-balance?apiKey=your-key
GET /api/v1/reports/profit-loss?apiKey=your-key
```

### Special Endpoints
```bash
# Test Tally connection
POST /api/test-connection
Body: { "tallyUrl": "localhost:9000" }

# Fetch specific data
POST /api/fetch-tally-data
Body: { 
  "tallyUrl": "localhost:9000",
  "requestType": "ListOfLedgers",
  "ledgerName": "Cash",
  "from": "2024-01-01",
  "to": "2024-12-31"
}
```

## 🎨 Frontend Features

The React frontend provides:
- **Dashboard**: Overview of financial data
- **Ledger Management**: View and search ledgers
- **Transaction History**: Browse transactions by date range
- **Reports**: Trial balance, P&L, balance sheet
- **Real-time Updates**: Live data from Tally
- **Responsive Design**: Works on desktop and mobile

## 🐳 Docker Deployment

### Development
```bash
docker-compose -f docker/docker-compose.yml up
```

### Production
```bash
# Set production environment
NODE_ENV=production

# Use production compose file
docker-compose -f docker/docker-compose.prod.yml up -d
```

## 🔒 Security Features

- **API Key Authentication**: Secure access control
- **Rate Limiting**: 100 requests per minute per IP
- **CORS Protection**: Configurable origin access
- **Input Validation**: Request sanitization
- **Error Handling**: Secure error responses

## 📊 Monitoring & Logging

- **Structured Logging**: JSON format with Pino
- **Health Checks**: `/health` endpoint for monitoring
- **Performance Metrics**: Response time tracking
- **Error Tracking**: Comprehensive error logging

## 🛠️ Development

### Running Tests
```bash
# Run all tests
npm test

# Unit tests only
npm run test:unit

# Integration tests
npm run test:integration
```

### Project Structure
```
src/
├── app.js                 # Main Fastify application
├── index.js               # Application entry point
├── config/                # Configuration and logging
├── middleware/            # Auth and error handling
├── routes/                # API route handlers
├── services/              # Business logic
├── parsers/               # XML parsing logic
└── utils/                 # Helper functions

frontend/
├── src/
│   ├── components/        # React components
│   ├── contexts/          # React contexts
│   ├── pages/             # Page components
│   └── App.js             # Main React app
└── package.json           # Frontend dependencies

docker/
├── Dockerfile             # Application container
├── Dockerfile.frontend    # Frontend container
└── docker-compose.yml     # Multi-container setup
```

## 🚨 Troubleshooting

### Common Issues

**"Tally is not reachable"**
1. Verify Tally is running with a company open
2. Check XML port is enabled (F12 → Configure)
3. Test connection: `curl http://localhost:9000`
4. Check Windows Firewall for port 9000

**"Invalid API key"**
1. Check API key in `.env` file
2. Ensure key is passed in query parameter or header
3. Verify no typos in the key

**"No data found"**
1. Ensure company is open in Tally
2. Check date range in queries
3. Verify ledger names exist in Tally
4. Clear cache if needed

### Debug Information

When reporting issues, include:
- Error messages (full text)
- Tally version and company name
- Network configuration
- Browser console errors (F12)
- Server logs

## 📦 Build & Distribution

### Create Standalone Executable
```bash
npm run build:exe
# Creates: dist/tally-remote-fetcher.exe
```

### Build Frontend
```bash
cd frontend
npm run build
# Creates: frontend/build/
```

## 🔄 Version History

- **v1.0.0**: Initial production release
- **v1.1.0**: Added React frontend
- **v1.2.0**: Enhanced error handling and caching
- **v1.3.0**: Docker support and deployment options

## 📞 Support

For support and questions:
- Check this documentation first
- Review server logs for errors
- Test with the health endpoint
- Verify Tally configuration

## 📄 License

MIT License - see LICENSE file for details.
