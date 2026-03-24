# Troubleshooting Guide

Comprehensive guide to diagnosing and resolving common issues with the Tally Integration API.

## 🔍 Quick Diagnosis

### Health Check Commands

```bash
# Check all services status
docker-compose ps

# Check application logs
docker-compose logs -f app

# Check specific service logs
docker-compose logs -f redis
docker-compose logs -f postgres

# Test API health
curl "http://localhost:3000/health?apiKey=dev-key-local-only"

# Test Tally connection
curl http://localhost:9000

# Check resource usage
docker stats
```

### Common Error Patterns

| Symptom | Likely Cause | Quick Fix |
|---------|--------------|-----------|
| API returns 401 | Missing/invalid API key | Add `?apiKey=dev-key-local-only` |
| Empty ledger data | No company loaded in Tally | Open company in Tally |
| Connection timeout | Tally not accessible | Check port 9000, firewall |
| High memory usage | Memory leak or insufficient resources | Restart containers, increase limits |
| Database errors | Wrong credentials or connection | Verify DATABASE_URL |

## 🚨 Critical Issues

### Issue: API Returns 401 Unauthorized

**Symptoms:**
```json
{"error":"Unauthorized","message":"Valid apiKey required"}
```

**Causes:**
1. Missing API key in request
2. Invalid API key
3. API keys not configured in environment

**Solutions:**

**1. Add API Key to Request:**
```bash
# Method 1: Query parameter
curl "http://localhost:3000/api/v1/ledgers?apiKey=dev-key-local-only"

# Method 2: Header (preferred)
curl -H "X-API-Key: dev-key-local-only" "http://localhost:3000/api/v1/ledgers"
```

**2. Check Environment Configuration:**
```bash
# Verify API keys are set
echo $API_KEYS

# Check .env file
cat .env | grep API_KEYS

# Set API keys
export API_KEYS="dev-key-local-only,prod-key-5678"
```

**3. Restart Application:**
```bash
docker-compose restart app
```

### Issue: Empty Ledger Response

**Symptoms:**
```json
{"success":true,"ledgers":[],"count":0}
```

**Causes:**
1. No company loaded in Tally
2. Tally company has no ledgers
3. XML request format incorrect
4. Tally permissions issue

**Solutions:**

**1. Verify Tally Company is Loaded:**
```bash
# Test Tally directly
curl http://localhost:9000

# Expected: <RESPONSE>TallyPrime Server is Running</RESPONSE>
```

**2. Check Tally Company Status:**
- Open Tally Prime
- Select a company from the list
- Ensure the company is actively loaded (not just Tally running)

**3. Verify Tally Configuration:**
- Go to F12 → Configure → Advanced Configuration
- Ensure "Enable ODBC Server" is set to "Yes"
- Check port is set to 9000

**4. Test with Different Company:**
```bash
# Try specifying company name
curl "http://localhost:3000/api/v1/ledgers?apiKey=dev-key-local-only&company=YourCompanyName"
```

### Issue: Tally Connection Failed

**Symptoms:**
```json
{"error":"Tally fetch failed","message":"connect ECONNREFUSED"}
```

**Causes:**
1. Tally not running
2. Port 9000 blocked
3. Network configuration issue
4. Docker networking problem

**Solutions:**

**1. Check Tally Status:**
```bash
# Test Tally connectivity
curl -v http://localhost:9000

# Check if port is listening
netstat -an | findstr :9000  # Windows
netstat -an | grep :9000      # Linux/macOS
```

**2. Verify Docker Network:**
```bash
# Check if Docker can reach host
docker-compose exec app ping host.docker.internal

# Test from container
docker-compose exec app curl http://host.docker.internal:9000
```

**3. Check Firewall:**
```bash
# Windows Firewall
# Allow port 9000 in Windows Defender Firewall

# Linux iptables
sudo iptables -A INPUT -p tcp --dport 9000 -j ACCEPT
```

**4. Update Tally Host Configuration:**
```bash
# If using Docker, ensure host is correct
echo "TALLY_HOST=host.docker.internal" >> .env

# If running locally, use localhost
echo "TALLY_HOST=localhost" >> .env
```

### Issue: Database Connection Errors

**Symptoms:**
```json
{"error":"Database connection failed","message":"ECONNREFUSED"}
```

**Causes:**
1. PostgreSQL not running
2. Incorrect database URL
3. Network connectivity issue
4. Database not created

**Solutions:**

**1. Check PostgreSQL Status:**
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Check PostgreSQL logs
docker-compose logs postgres

# Test database connection
docker-compose exec postgres psql -U postgres -d tally_integration -c "SELECT 1;"
```

**2. Verify Database Configuration:**
```bash
# Check database URL
echo $DATABASE_URL

# Test connection manually
psql $DATABASE_URL -c "SELECT 1;"

# Common URL format:
# postgresql://user:password@host:port/database
```

**3. Create Database:**
```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U postgres

# Create database
CREATE DATABASE tally_integration;

# Create user
CREATE USER tally_user WITH PASSWORD 'secure_password';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE tally_integration TO tally_user;
```

**4. Run Migrations:**
```bash
# Run database migrations
npm run migrate up

# Or manually
docker-compose exec app npm run migrate up
```

### Issue: Redis Connection Errors

**Symptoms:**
```json
{"error":"Redis connection failed","message":"ECONNREFUSED"}
```

**Causes:**
1. Redis not running
2. Incorrect Redis URL
3. Network connectivity issue

**Solutions:**

**1. Check Redis Status:**
```bash
# Check if Redis is running
docker-compose ps redis

# Check Redis logs
docker-compose logs redis

# Test Redis connection
docker-compose exec redis redis-cli ping
```

**2. Verify Redis Configuration:**
```bash
# Check Redis URL
echo $REDIS_URL

# Test connection manually
redis-cli -u $REDIS_URL ping
```

**3. Restart Redis:**
```bash
# Restart Redis service
docker-compose restart redis

# Clear Redis data if corrupted
docker-compose exec redis redis-cli FLUSHALL
```

## 🐛 Performance Issues

### Issue: Slow API Responses

**Symptoms:**
- API requests taking > 5 seconds
- Timeouts occurring frequently
- High CPU/memory usage

**Diagnosis:**

**1. Check Response Times:**
```bash
# Measure API response time
time curl "http://localhost:3000/api/v1/ledgers?apiKey=dev-key-local-only"

# Check application logs for slow queries
docker-compose logs app | grep "slow"
```

**2. Monitor Resource Usage:**
```bash
# Check container resource usage
docker stats

# Check system resources
top  # Linux/macOS
tasklist  # Windows
```

**3. Analyze Database Performance:**
```bash
# Connect to database
docker-compose exec postgres psql -U postgres -d tally_integration

# Check slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

**Solutions:**

**1. Optimize Database Queries:**
```sql
-- Add missing indexes
CREATE INDEX CONCURRENTLY idx_ledgers_company_name ON ledgers(company_id, name);

-- Analyze table statistics
ANALYZE ledgers;

-- Check query plan
EXPLAIN ANALYZE SELECT * FROM ledgers WHERE company_id = 1;
```

**2. Increase Cache Hit Rate:**
```bash
# Check Redis cache statistics
docker-compose exec redis redis-cli INFO stats

# Monitor cache hit rate
docker-compose exec redis redis-cli INFO keyspace
```

**3. Scale Resources:**
```yaml
# docker-compose.yml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

### Issue: Memory Leaks

**Symptoms:**
- Memory usage continuously increasing
- Container crashes due to OOM
- Performance degradation over time

**Diagnosis:**

**1. Monitor Memory Usage:**
```bash
# Watch memory usage in real-time
watch -n 1 'docker stats --no-stream'

# Check memory usage trends
docker stats --format "table {{.Container}}\t{{.MemUsage}}\t{{.MemPerc}}"
```

**2. Analyze Node.js Memory:**
```bash
# Enable heap profiling
export NODE_OPTIONS="--max-old-space-size=1024 --inspect"

# Generate heap dump
kill -USR2 <pid>
```

**Solutions:**

**1. Optimize Memory Usage:**
```javascript
// Clear cache periodically
setInterval(() => {
  cacheManager.clear()
}, 3600000) // Every hour

// Use streams for large data
const stream = require('stream')
```

**2. Increase Memory Limits:**
```yaml
# docker-compose.yml
services:
  app:
    environment:
      - NODE_OPTIONS=--max-old-space-size=2048
    deploy:
      resources:
        limits:
          memory: 2G
```

## 🔄 Docker Issues

### Issue: Container Won't Start

**Symptoms:**
```
Container exited with code 1
or
Container keeps restarting
```

**Diagnosis:**

**1. Check Container Logs:**
```bash
# View container logs
docker-compose logs app

# View recent logs
docker-compose logs --tail=50 app

# Follow logs in real-time
docker-compose logs -f app
```

**2. Check Container Status:**
```bash
# Check container status
docker-compose ps

# Inspect container
docker-compose inspect app
```

**Solutions:**

**1. Fix Configuration Issues:**
```bash
# Check environment variables
docker-compose exec app env | grep -E "(DATABASE_URL|REDIS_URL|API_KEYS)"

# Update environment variables
docker-compose down
# Edit .env file
docker-compose up -d
```

**2. Rebuild Container:**
```bash
# Rebuild container with no cache
docker-compose build --no-cache app

# Force recreate
docker-compose up -d --force-recreate app
```

### Issue: Volume Mount Issues

**Symptoms:**
- Data not persisting
- Permission errors
- Files not found

**Solutions:**

**1. Check Volume Mounts:**
```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect tally_postgres-data

# Check mount points
docker-compose exec app ls -la /app
```

**2. Fix Permissions:**
```bash
# Fix volume permissions
sudo chown -R 1000:1000 ./data

# Or run as root (not recommended)
# Add "user: root" to docker-compose.yml
```

## 🌐 Network Issues

### Issue: Cannot Connect from Docker

**Symptoms:**
- Container cannot reach host services
- Network timeouts
- Connection refused errors

**Diagnosis:**

**1. Test Network Connectivity:**
```bash
# Test DNS resolution
docker-compose exec app nslookup google.com

# Test host connectivity
docker-compose exec app ping host.docker.internal

# Test port connectivity
docker-compose exec app nc -zv host.docker.internal 9000
```

**2. Check Network Configuration:**
```bash
# List Docker networks
docker network ls

# Inspect network
docker network inspect tally_default
```

**Solutions:**

**1. Use Host Networking:**
```yaml
# docker-compose.yml
services:
  app:
    network_mode: host
```

**2. Use Docker Host Alias:**
```yaml
# docker-compose.yml
services:
  app:
    extra_hosts:
      - "host.docker.internal:host-gateway"
```

**3. Configure Firewall:**
```bash
# Allow Docker network
sudo ufw allow from 172.16.0.0/12
sudo ufw allow from 192.168.0.0/16
```

## 📊 Monitoring & Debugging

### Enable Debug Logging

```bash
# Set debug log level
export LOG_LEVEL=debug

# Or in .env
echo "LOG_LEVEL=debug" >> .env

# Restart application
docker-compose restart app
```

### Monitor Database Performance

```sql
-- Active connections
SELECT * FROM pg_stat_activity;

-- Slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC;

-- Table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public';
```

### Monitor Redis Performance

```bash
# Redis info
docker-compose exec redis redis-cli INFO server

# Memory usage
docker-compose exec redis redis-cli INFO memory

# Connection info
docker-compose exec redis redis-cli INFO clients
```

### API Performance Testing

```bash
# Load test with curl
for i in {1..100}; do
  curl -w "@curl-format.txt" -s -o /dev/null "http://localhost:3000/api/v1/ledgers?apiKey=dev-key-local-only"
done

# curl-format.txt
%{time_total}\n
```

## 🆘 Emergency Procedures

### Complete System Reset

```bash
# Stop all services
docker-compose down

# Remove all containers
docker-compose down --remove-orphans

# Remove volumes (WARNING: This deletes all data)
docker-compose down -v

# Clean up Docker
docker system prune -f

# Rebuild from scratch
docker-compose up -d --build
```

### Database Recovery

```bash
# Restore from backup
docker-compose exec postgres psql -U postgres -d tally_integration < backup.sql

# Or restore specific table
docker-compose exec postgres psql -U postgres -d tally_integration -c "\copy ledgers FROM 'ledgers.csv' WITH CSV HEADER;"
```

### Rollback Deployment

```bash
# Get previous image
docker images | grep tally-api

# Rollback to previous version
docker-compose down
docker-compose up -d --scale app=3
# Edit docker-compose.yml to use previous image tag
```

## 📞 Getting Help

### Collect Debug Information

```bash
# Create debug bundle
mkdir debug-bundle
cd debug-bundle

# System information
docker-compose version > version.txt
docker version >> version.txt

# Configuration
cp ../.env .env.backup
cp ../docker-compose.yml .

# Logs
docker-compose logs --no-color > logs.txt

# Resource usage
docker stats --no-stream > resources.txt

# Network info
docker network ls > networks.txt
docker network inspect tally_default >> networks.txt

# Create archive
cd ..
tar -czf debug-bundle.tar.gz debug-bundle/
```

### Common Log Patterns

**Successful Request:**
```
INFO: request completed {"reqId":"req-1","res":{"statusCode":200},"responseTime":150}
```

**Tally Connection Error:**
```
ERROR: Tally fetch failed {"message":"connect ECONNREFUSED 127.0.0.1:9000"}
```

**Database Error:**
```
ERROR: Database connection failed {"message":"connection timeout"}
```

**Cache Miss:**
```
INFO: Cache miss for ledgers {"cacheKey":"tally:ledgers:default"}
```

---

**🔧 This troubleshooting guide helps diagnose and resolve common issues quickly and effectively.**
