# Docker Setup Guide for Tally Integration Project

## 🐳 Quick Start

### Prerequisites
- Docker Desktop installed and running
- Tally ERP running on your Windows machine with ODBC Server enabled (port 9000)
- At least 4GB RAM available for Docker

### 🚀 Running the Application

#### Option 1: Using the Run Scripts (Recommended)

**Windows Users:**
```bash
# Start all services
docker\run-docker.bat up

# View logs
docker\run-docker.bat logs

# Stop services
docker\run-docker.bat down
```

**Linux/Mac Users:**
```bash
# Make script executable first
chmod +x docker/run-docker.sh

# Start all services
./docker/run-docker.sh up

# View logs
./docker/run-docker.sh logs

# Stop services
./docker/run-docker.sh down
```

#### Option 2: Using Docker Compose Directly

```bash
# Start all services
docker-compose -f docker/docker-compose.yml up -d

# View logs
docker-compose -f docker/docker-compose.yml logs -f

# Stop services
docker-compose -f docker/docker-compose.yml down
```

### 📋 Available Commands

| Command | Description |
|----------|-------------|
| `up` | Start all services (app, redis, postgres) |
| `down` | Stop all services |
| `restart` | Restart all services |
| `logs` | Follow logs for all services |
| `app-logs` | Follow logs only for the app |
| `status` | Show status of all services |
| `migrate` | Run database migrations |
| `dev-tools` | Start with Redis Commander (cache UI) |
| `clean` | Remove all containers, networks, and volumes |
| `help` | Show help message |

### 🌐 Access Points

Once services are running:

- **API Server**: http://localhost:3000
- **PostgreSQL**: localhost:5433 (User: postgres, Password: postgres)
- **Redis**: localhost:6379
- **Redis Commander** (with dev-tools): http://localhost:8081

### 🗄️ Database Setup

First time setup:
```bash
# Run database migrations
docker\run-docker.bat migrate
```

Or manually:
```bash
docker-compose -f docker/docker-compose.yml exec app node src/db/migrate.js up
```

### 🧪 Testing the API

1. **Health Check**:
```bash
curl http://localhost:3000/health
```

2. **Test Tally Connection**:
```bash
curl -X POST http://localhost:3000/api/test-connection \
  -H "Content-Type: application/json" \
  -H "X-API-Key: dev-key-local-only" \
  -d '{"tallyUrl": "localhost:9000"}'
```

3. **Get Ledgers**:
```bash
curl http://localhost:3000/api/v1/ledgers \
  -H "X-API-Key: dev-key-local-only"
```

### 🔧 Configuration

Environment variables are configured in `docker/docker-compose.yml`:

- `TALLY_HOST`: Set to `host.docker.internal` to connect to Tally on Windows host
- `TALLY_PORT`: Default `9000` (Tally's ODBC port)
- `API_KEYS`: Default `dev-key-local-only`
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string

### 🐛 Troubleshooting

#### Port Conflicts
If ports are already in use:
1. Stop the conflicting services
2. Or modify port mappings in `docker/docker-compose.yml`

#### Tally Connection Issues
1. Ensure Tally is running on Windows
2. Enable ODBC Server in Tally (F12 → Configuration → Features → Enable ODBC Server)
3. Check Windows Firewall allows port 9000
4. Verify Tally company is loaded

#### Database Connection Issues
```bash
# Check PostgreSQL status
docker-compose -f docker/docker-compose.yml ps postgres

# View PostgreSQL logs
docker-compose -f docker/docker-compose.yml logs postgres
```

#### Cache Issues
```bash
# Clear Redis cache
docker-compose -f docker/docker-compose.yml exec redis redis-cli FLUSHALL
```

### 📊 Monitoring

#### Application Logs
```bash
# Follow all logs
docker\run-docker.bat logs

# Follow only app logs
docker\run-docker.bat app-logs
```

#### Service Status
```bash
docker\run-docker.bat status
```

#### Resource Usage
```bash
# View container resource usage
docker stats
```

### 🔄 Development Workflow

1. **Start services**: `docker\run-docker.bat up`
2. **Run migrations**: `docker\run-docker.bat migrate`
3. **Test API**: Use the testing commands above
4. **View logs**: `docker\run-docker.bat app-logs`
5. **Stop when done**: `docker\run-docker.bat down`

### 🧹 Cleanup

To completely reset the environment:
```bash
docker\run-docker.bat clean
```

This removes:
- All containers
- All networks
- All volumes (database and cache data)
- Dangling images

### 📁 File Structure

```
docker/
├── Dockerfile              # Multi-stage build configuration
├── docker-compose.yml      # Service orchestration
├── .dockerignore          # Files excluded from build
├── run-docker.sh          # Linux/Mac run script
├── run-docker.bat         # Windows run script
└── DOCKER-README.md       # This file
```

### 🆘 Getting Help

If you encounter issues:

1. Check the logs: `docker\run-docker.bat logs`
2. Verify service status: `docker\run-docker.bat status`
3. Ensure Docker Desktop is running
4. Confirm Tally is accessible on localhost:9000

For additional support, refer to the main project documentation.
