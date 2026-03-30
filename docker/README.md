# Docker Setup for Tally Integration Project

This directory contains all Docker configuration files to containerize the Tally Integration project.

## 📁 Files Overview

- `Dockerfile.backend` - Backend API container configuration
- `Dockerfile.frontend` - Production frontend container configuration
- `Dockerfile.frontend.dev` - Development frontend with hot reload
- `docker-compose.yml` - Production environment setup
- `docker-compose.dev.yml` - Development environment setup
- `nginx.conf` - Nginx configuration for frontend
- `init-db.sql` - PostgreSQL initialization script
- `.dockerignore` - Files to exclude from Docker builds

## 🚀 Quick Start

### Production Environment

1. **Start all services:**
   ```bash
   cd docker
   docker-compose up -d
   ```

2. **Access the application:**
   - Frontend: http://localhost
   - Backend API: http://localhost:3000
   - PostgreSQL: localhost:5432
   - Redis: localhost:6379

### Development Environment

1. **Start development services:**
   ```bash
   cd docker
   docker-compose -f docker-compose.dev.yml up -d
   ```

2. **Access the application:**
   - Frontend (with hot reload): http://localhost:3001
   - Backend API: http://localhost:3000
   - PostgreSQL: localhost:5432
   - Redis: localhost:6379

## 📋 Services

### Backend (Node.js/Fastify)
- **Port:** 3000
- **Environment:** Production/Development
- **Health Check:** `/health` endpoint
- **Dependencies:** PostgreSQL, Redis, Tally ERP

### Frontend (React/Nginx)
- **Port:** 80 (production), 3001 (development)
- **Build:** Production-optimized Nginx setup
- **Features:** Gzip compression, security headers, API proxy

### PostgreSQL
- **Port:** 5432
- **Database:** `tally_integration`
- **Credentials:** postgres/password
- **Persistence:** Docker volume

### Redis
- **Port:** 6379
- **Purpose:** Caching layer
- **Persistence:** Docker volume

## ⚙️ Configuration

### Environment Variables

Key environment variables in `docker-compose.yml`:

```yaml
environment:
  - NODE_ENV=production
  - PORT=3000
  - TALLY_HOST=tally
  - TALLY_PORT=9000
  - REDIS_URL=redis://redis:6379
  - DATABASE_URL=postgresql://postgres:password@postgres:5432/tally_integration
  - API_KEYS=prod-key-5678
```

### Tally ERP Integration

**Important:** Tally ERP must be installed separately on:
- The host machine (recommended for development)
- Another container (advanced setup)
- A separate machine in your network

Configure Tally connection in your environment:
1. Enable ODBC Server in Tally (F12 → Configure → ODBC Server Settings)
2. Set `TALLY_HOST` to point to your Tally installation
3. Ensure port 9000 is accessible

## 🔧 Development Workflow

### Making Changes

1. **Backend changes:** Edit files in `src/` - changes are hot-reloaded in dev mode
2. **Frontend changes:** Edit files in `frontend/src/` - React hot reloads automatically
3. **Database changes:** Modify `init-db.sql` and recreate containers

### Rebuilding Containers

```bash
# Rebuild specific service
docker-compose up -d --build backend

# Rebuild all services
docker-compose up -d --build
```

### Viewing Logs

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

## 🗄️ Database Management

### Connect to PostgreSQL

```bash
docker exec -it tally-postgres psql -U postgres -d tally_integration
```

### Reset Database

```bash
docker-compose down -v
docker-compose up -d postgres
```

## 📊 Monitoring

### Health Checks

All services include health checks:

```bash
# Check service health
docker-compose ps

# View health check logs
docker inspect tally-backend | grep Health -A 10
```

### Performance Monitoring

- **Backend:** Health endpoint at `/health`
- **Frontend:** Nginx status at `/health`
- **PostgreSQL:** Built-in health checks
- **Redis:** Redis ping command

## 🔒 Security Considerations

1. **Change default passwords** in production
2. **Use proper API keys** instead of the example ones
3. **Enable HTTPS** in production (add SSL certificates)
4. **Network isolation:** Services communicate via internal Docker network
5. **Environment variables:** Store sensitive data in Docker secrets or external secret management

## 🐛 Troubleshooting

### Common Issues

1. **Port conflicts:** Check if ports 80, 3000, 5432, 6379 are available
2. **Tally connection:** Ensure Tally is running and ODBC is enabled
3. **Database connection:** Verify PostgreSQL container is healthy
4. **Permission issues:** Check Docker daemon permissions

### Debug Commands

```bash
# Enter container shell
docker exec -it tally-backend sh

# Check container logs
docker logs tally-backend

# Test network connectivity
docker exec -it tally-backend ping postgres
```

## 🚀 Deployment

### Production Deployment

1. **Update environment variables** for production
2. **Set up proper SSL certificates**
3. **Configure backup strategies** for PostgreSQL
4. **Set up monitoring and alerting**
5. **Scale services as needed**

### Scaling

```bash
# Scale backend service
docker-compose up -d --scale backend=3

# Scale frontend service (behind load balancer)
docker-compose up -d --scale frontend=2
```

## 📚 Additional Resources

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Fastify Framework](https://www.fastify.io/)
- [React Documentation](https://reactjs.org/)
- [PostgreSQL Docker Hub](https://hub.docker.com/_/postgres)
- [Redis Docker Hub](https://hub.docker.com/_/redis)
