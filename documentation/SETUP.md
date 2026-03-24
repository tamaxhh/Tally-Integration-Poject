# Setup & Installation Guide

Complete step-by-step instructions to get the Tally Integration API running in your environment.

## 📋 Prerequisites

### Required Software Versions

| Software | Minimum Version | Recommended |
|----------|----------------|-------------|
| Docker | 20.10+ | Latest |
| Docker Compose | 2.0+ | Latest |
| Node.js | 20.0+ | Latest LTS |
| Tally ERP/Prime | Any recent version | Latest |
| Redis | 7.0+ | Latest (handled by Docker) |
| PostgreSQL | 15+ | Latest (handled by Docker) |

### System Requirements

- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 10GB free space
- **OS**: Windows (for Tally), Linux/macOS (for Docker)
- **Network**: Port 3000, 6379, 5432, 9000 available

## 🔧 Tally Configuration

### Enable ODBC Server in Tally

1. **Open Tally Prime**
2. **Press F12** or go to `Gateway of Tally → Configure`
3. **Navigate**: `Advanced Configuration → ODBC Server`
4. **Set**: `Enable ODBC Server = Yes`
5. **Port**: Default is 9000 (keep default)
6. **Save** and restart Tally

### Verify Tally is Ready

```bash
# Test Tally connectivity
curl http://localhost:9000

# Expected response:
<RESPONSE>TallyPrime Server is Running</RESPONSE>
```

### Important: Load a Company

Tally only serves data when a company is actively loaded:
1. Open Tally Prime
2. Select your company from the list
3. Keep the company open while testing

## 🐳 Docker Setup

### Install Docker (if not installed)

**Windows:**
```powershell
# Download and install Docker Desktop
# https://www.docker.com/products/docker-desktop
```

**Linux:**
```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose-plugin
```

**macOS:**
```bash
# Install via Homebrew
brew install --cask docker
```

### Verify Docker Installation

```bash
docker --version
docker-compose --version
```

## 📦 Project Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd tally-integration
```

### 2. Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit environment variables
notepad .env  # Windows
nano .env      # Linux/macOS
```

**Key Environment Variables:**
```bash
# API Configuration
API_KEYS=dev-key-local-only,prod-key-5678
PORT=3000
HOST=0.0.0.0

# Tally Connection
TALLY_HOST=host.docker.internal  # Docker to host
TALLY_PORT=9000
TALLY_TIMEOUT_MS=10000
TALLY_MAX_RETRIES=3

# Redis Cache
REDIS_URL=redis://localhost:6379
CACHE_TTL_SECONDS=300

# PostgreSQL Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/tally_integration

# Logging
LOG_LEVEL=info
NODE_ENV=development
```

### 3. Start Services

```bash
# Build and start all services
docker-compose up -d --build

# Check service status
docker-compose ps
```

**Expected Output:**
```
NAME              COMMAND                  SERVICE             STATUS              PORTS
tally-app-1       "node src/index.js"      app                 running             0.0.0.0:3000->3000/tcp
tally-postgres-1   "docker-entrypoint.s…"   postgres            running             0.0.0.0:5432->5432/tcp
tally-redis-1      "docker-entrypoint.s…"   redis               running             0.0.0.0:6379->6379/tcp
```

## ✅ Verification Steps

### 1. Test API Health

```bash
curl "http://localhost:3000/health?apiKey=dev-key-local-only"
```

**Expected Response:**
```json
{"status":"healthy"}
```

### 2. Test Tally Connection

```bash
curl "http://localhost:3000/api/v1/ledgers?apiKey=dev-key-local-only"
```

**Expected Response:**
```json
{
  "success": true,
  "ledgers": [...],
  "count": 95
}
```

### 3. Check Logs

```bash
# View application logs
docker-compose logs -f app

# View all services
docker-compose logs -f
```

## 🛠️ Local Development Setup

### Install Dependencies

```bash
npm install
```

### Run Tests

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration

# Test with coverage
npm run test:coverage
```

### Development Mode

```bash
# Start in development mode
npm run dev

# Or with Docker (auto-reload)
docker-compose up --build app
```

## 🔧 Common Setup Issues & Fixes

### Issue 1: "Tally fetch failed"

**Symptoms:**
```
{"error":"Tally fetch failed","message":"connect ECONNREFUSED"}
```

**Solutions:**
1. **Check Tally is running**: Verify Tally Prime is open
2. **Check company is loaded**: Ensure a company is selected in Tally
3. **Check port**: Verify port 9000 is accessible
4. **Check firewall**: Ensure port 9000 isn't blocked

```bash
# Test Tally directly
curl http://localhost:9000
```

### Issue 2: "Unauthorized" Error

**Symptoms:**
```
{"error":"Unauthorized","message":"Valid apiKey required"}
```

**Solutions:**
1. **Add API key**: Include `?apiKey=dev-key-local-only` in requests
2. **Check environment**: Verify `API_KEYS` in `.env` file
3. **Use header**: Prefer `X-API-Key: dev-key-local-only` header

### Issue 3: Docker Container Issues

**Symptoms:**
```
Container exits immediately or shows unhealthy status
```

**Solutions:**
1. **Check logs**: `docker-compose logs app`
2. **Rebuild**: `docker-compose up -d --build`
3. **Clean restart**: 
   ```bash
   docker-compose down
   docker system prune -f
   docker-compose up -d --build
   ```

### Issue 4: Port Conflicts

**Symptoms:**
```
Port 3000 already in use
```

**Solutions:**
1. **Change port**: Modify `PORT=3001` in `.env`
2. **Kill process**: Find and kill process using port 3000
3. **Check services**: Ensure no other service uses required ports

### Issue 5: Empty Ledger Response

**Symptoms:**
```
{"success":true,"ledgers":[],"count":0}
```

**Solutions:**
1. **Load company**: Open a company in Tally (not just Tally running)
2. **Check permissions**: Ensure Tally user has data access
3. **Verify company**: Company should have ledger data

## 🔄 Maintenance Commands

### Daily Operations

```bash
# Check service health
docker-compose ps

# View recent logs
docker-compose logs --tail=100 app

# Restart services
docker-compose restart app

# Update containers
docker-compose pull && docker-compose up -d
```

### Cleanup

```bash
# Clean unused Docker resources
docker system prune -f

# Remove all containers and volumes
docker-compose down -v
```

## 📚 Next Steps

After successful setup:

1. **Read Architecture Documentation**: `./ARCHITECTURE.md`
2. **Review API Reference**: `./API.md`
3. **Check Deployment Guide**: `./DEPLOYMENT.md`
4. **Explore Testing**: `./TESTING.md`

## 🆘 Support

If you encounter issues not covered here:

1. **Check logs**: `docker-compose logs app`
2. **Verify prerequisites**: Ensure all requirements are met
3. **Review troubleshooting**: Check common issues above
4. **Create issue**: Report with logs and environment details

---

**🎉 Setup complete! Your Tally Integration API is ready to use.**
