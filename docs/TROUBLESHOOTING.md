# 🔧 Troubleshooting Guide

Common issues and solutions for the Tally Integration API.

## 🚨 Quick Diagnostics

### Health Check
```bash
# Basic health
curl http://localhost:3000/health

# Detailed connection test
curl -X POST http://localhost:3000/api/test-connection \
  -H "Content-Type: application/json" \
  -d '{"tallyUrl": "localhost:9000"}'
```

### Log Locations
- **Development**: Console output
- **Production**: `/var/log/tally-integration.log`
- **Docker**: `docker logs container-name`

## 🔌 Connection Issues

### "Tally is not reachable" / ECONNREFUSED

#### Symptoms
- Error: `ECONNREFUSED` or `Tally is not reachable`
- Health check shows `connected: false`

#### Causes & Solutions

**1. Tally Not Running**
```bash
# Check if Tally process is running
tasklist | findstr tally

# Solution: Start Tally Prime
# Open Tally Prime application
```

**2. XML Port Not Enabled**
```
# In Tally Prime:
1. Press F12 → Configure
2. Go to "Advanced Configuration"
3. Set "Allow XML Import/Export" to Yes
4. Restart Tally
```

**3. Port Blocked by Firewall**
```bash
# Check Windows Firewall
netsh advfirewall firewall show rule name="Tally XML Port"

# Add firewall rule (run as Administrator)
netsh advfirewall firewall add rule name="Tally XML Port" dir=in action=allow protocol=TCP localport=9000

# Or disable temporarily for testing
netsh advfirewall set allprofiles state off
```

**4. Wrong Host/Port Configuration**
```bash
# Test connection manually
curl http://localhost:9000
curl http://127.0.0.1:9000

# Check .env file
TALLY_HOST=localhost
TALLY_PORT=9000
```

**5. Network Issues (Remote Tally)**
```bash
# Test network connectivity
ping tally-server-ip
telnet tally-server-ip 9000

# Check if Tally is listening on external IP
netstat -an | findstr 9000
```

### "Connection Timeout"

#### Symptoms
- Requests hang and eventually timeout
- Error: `ETIMEDOUT` or connection timeout

#### Solutions

**1. Increase Timeout**
```env
# In .env file
TALLY_TIMEOUT_MS=10000  # Increase from 5000
```

**2. Check Tally Performance**
- Tally might be slow due to large data
- Close unnecessary companies in Tally
- Restart Tally to clear memory

**3. Network Latency**
```bash
# Test latency
ping tally-host

# If high latency, consider:
# - Moving API server closer to Tally
# - Using faster network connection
```

## 🔐 Authentication Issues

### "Invalid API Key" / 403 Forbidden

#### Symptoms
- Error: `Invalid API key`
- HTTP 403 status code

#### Solutions

**1. Check API Key Configuration**
```bash
# Check .env file
cat .env | grep API_KEYS

# Should be comma-separated
API_KEYS=key1,key2,admin-key
```

**2. Verify Key Usage**
```bash
# Correct ways to pass API key:
curl "http://localhost:3000/api/v1/ledgers?apiKey=your-key"
curl -H "X-API-Key: your-key" http://localhost:3000/api/v1/ledgers

# Common mistakes:
# - Missing apiKey parameter
# - Typos in the key
# - Using wrong key (dev vs prod)
```

**3. Check for Special Characters**
```bash
# If API key contains special characters, URL encode:
curl "http://localhost:3000/api/v1/ledgers?apiKey=your%20key%20with%20spaces"
```

### "Missing API Key" / 401 Unauthorized

#### Symptoms
- Error: `Missing API key`
- HTTP 401 status code

#### Solutions
```bash
# Always include API key:
curl "http://localhost:3000/api/v1/ledgers?apiKey=your-key"

# Health endpoint doesn't need API key:
curl http://localhost:3000/health
```

## 📊 Data Issues

### "No Data Found" / Empty Responses

#### Symptoms
- API returns empty arrays
- Success response but no data

#### Solutions

**1. Company Not Open in Tally**
```
# In Tally:
1. Load your company
2. Keep it open while using API
3. Check company name matches exactly
```

**2. Date Range Issues**
```bash
# Check date format (YYYY-MM-DD)
curl "http://localhost:3000/api/v1/vouchers?from=2024-01-01&to=2024-12-31&apiKey=your-key"

# Common mistakes:
# - Wrong date format
# - From date after to date
# - No transactions in date range
```

**3. Ledger Name Issues**
```bash
# Check exact ledger name (case sensitive)
curl "http://localhost:3000/api/v1/ledgers?apiKey=your-key" | grep "Cash"

# URL encode special characters
curl "http://localhost:3000/api/v1/ledgers/Bank%20Account?apiKey=your-key"
```

**4. Company Name Mismatch**
```bash
# Check company name in Tally
# It must match exactly in API calls

# Test with different company names
curl "http://localhost:3000/api/full-company-data?company=Sample%20Company&apiKey=your-key"
```

### Amounts Showing as null or 0

#### Symptoms
- Balance amounts show as `null`
- All amounts are 0.00

#### Causes
- Ledger has no transactions
- Opening balance is empty in Tally
- Date range excludes transactions

#### Solutions
```bash
# Check date range includes transactions
curl "http://localhost:3000/api/v1/ledgers/Cash/transactions?from=2023-01-01&to=2024-12-31&apiKey=your-key"

# Verify in Tally:
# 1. Open ledger in Tally
# 2. Check opening/closing balance
# 3. Look at transaction history
```

## 🐛 Application Errors

### "Port Already in Use"

#### Symptoms
- Error: `EADDRINUSE: address already in use :::3000`
- Server won't start

#### Solutions

**1. Find Process Using Port**
```bash
# Find process
netstat -ano | findstr :3000

# Kill process (replace PID)
taskkill /PID <PID> /F
```

**2. Use Different Port**
```env
# In .env file
PORT=3001
```

**3. Restart Services**
```bash
# Stop all Node.js processes
taskkill /F /IM node.exe

# Restart application
npm run dev
```

### "Module Not Found" Errors

#### Symptoms
- Error: `Cannot find module 'module-name'`
- Application crashes on startup

#### Solutions

**1. Install Dependencies**
```bash
# Clean install
rm -rf node_modules
npm install

# Or with yarn
yarn install
```

**2. Check Package.json**
```bash
# Verify all dependencies are listed
cat package.json | grep "dependencies"

# Install missing module
npm install missing-module-name
```

**3. Node Version Issues**
```bash
# Check Node version
node --version

# Should be v20+
# Install correct version from nodejs.org
```

### Memory Issues

#### Symptoms
- Application crashes with memory errors
- Slow performance over time

#### Solutions

**1. Increase Node Memory**
```bash
# Start with more memory
node --max-old-space-size=4096 src/index.js
```

**2. Monitor Memory Usage**
```bash
# Check process memory
tasklist | findstr node

# Monitor in application
# Add memory monitoring to logs
```

**3. Optimize Caching**
```env
# Configure Redis if not using
REDIS_URL=redis://localhost:6379

# Adjust cache TTL
CACHE_TTL=300000  # 5 minutes
```

## 🐳 Docker Issues

### Container Won't Start

#### Symptoms
- Docker container exits immediately
- `docker logs` shows errors

#### Solutions

**1. Check Logs**
```bash
# View container logs
docker logs container-name

# Follow logs in real-time
docker logs -f container-name
```

**2. Debug Container**
```bash
# Run container interactively
docker run -it --entrypoint sh tally-integration

# Check environment
env | grep TALLY
```

**3. Volume Issues**
```bash
# Check volume mounts
docker inspect container-name

# Fix permissions
docker exec -it container-name chown -R node:node /app
```

### Network Issues in Docker

#### Symptoms
- Container can't reach Tally
- Network timeouts

#### Solutions

**1. Host Network Access**
```yaml
# In docker-compose.yml
services:
  app:
    network_mode: host
```

**2. DNS Configuration**
```yaml
# Add DNS settings
services:
  app:
    dns:
      - 8.8.8.8
      - 8.8.4.4
```

**3. Port Mapping**
```bash
# Ensure ports are mapped correctly
docker run -p 3000:3000 -p 9000:9000 tally-integration
```

## 📈 Performance Issues

### Slow Response Times

#### Symptoms
- API calls take >10 seconds
- Timeouts on large data requests

#### Solutions

**1. Enable Caching**
```env
# Configure Redis
REDIS_URL=redis://localhost:6379

# Check cache status
curl http://localhost:3000/api/v1/ledgers/cache/status?apiKey=your-key
```

**2. Optimize Tally Queries**
```bash
# Use specific date ranges
curl "http://localhost:3000/api/v1/vouchers?from=2024-01-01&to=2024-01-31&apiKey=your-key"

# Limit results
curl "http://localhost:3000/api/v1/ledgers?limit=50&apiKey=your-key"
```

**3. Monitor Performance**
```bash
# Check response times
curl -w "@curl-format.txt" -o /dev/null -s "http://localhost:3000/health"

# Create curl-format.txt:
#      time_namelookup:  %{time_namelookup}\n
#         time_connect:  %{time_connect}\n
#      time_appconnect:  %{time_appconnect}\n
#     time_pretransfer:  %{time_pretransfer}\n
#        time_redirect:  %{time_redirect}\n
#   time_starttransfer:  %{time_starttransfer}\n
#                      ----------\n
#           time_total:  %{time_total}\n
```

### High Memory Usage

#### Symptoms
- Memory usage increases over time
- Application crashes with OOM errors

#### Solutions

**1. Monitor Memory**
```bash
# Check Node.js memory
node --inspect src/index.js
# Open Chrome DevTools → Node.js icon

# Monitor system memory
top
htop
```

**2. Optimize Data Processing**
```javascript
// Process data in chunks
// Avoid loading all data at once
// Stream large responses
```

**3. Configure Garbage Collection**
```bash
# Tune Node.js GC
node --max-old-space-size=2048 --expose-gc src/index.js
```

## 🔍 Debug Tools

### Enable Debug Logging
```env
# In .env file
LOG_LEVEL=debug
DEBUG=tally:*
```

### Test Endpoints Manually
```bash
# Test basic connectivity
curl -v http://localhost:3000/health

# Test with API key
curl -v "http://localhost:3000/api/v1/ledgers?apiKey=your-key"

# Test POST request
curl -v -X POST http://localhost:3000/api/test-connection \
  -H "Content-Type: application/json" \
  -d '{"tallyUrl": "localhost:9000"}'
```

### Network Debugging
```bash
# Test network connectivity
telnet localhost 9000
nc -zv localhost 9000

# Check DNS
nslookup localhost
dig localhost

# Trace route
tracert localhost
```

### Process Monitoring
```bash
# Check running processes
tasklist | findstr node
ps aux | grep node

# Monitor resources
perfmon
resource monitor
```

## 📋 Diagnostic Checklist

### Before Reporting Issues
- [ ] Tally Prime is running with company open
- [ ] XML port is enabled (F12 → Configure)
- [ ] API server is running
- [ ] Environment variables are correct
- [ ] Network connectivity is working
- [ ] Firewall allows port 9000
- [ ] API key is valid and properly passed

### Information to Collect
```bash
# System information
node --version
npm --version
tally --version  # if available

# Configuration
cat .env
netstat -an | findstr 9000

# Logs
# Last 100 lines of application logs
tail -n 100 application.log

# Test results
curl -v http://localhost:3000/health
curl -v "http://localhost:3000/api/v1/ledgers?apiKey=your-key"
```

### Common Debug Commands
```bash
# Restart everything
taskkill /F /IM node.exe
npm run dev

# Clear cache
curl -X POST "http://localhost:3000/api/v1/ledgers/cache/invalidate?apiKey=your-key"

# Test Tally directly
curl http://localhost:9000

# Check Docker status
docker ps
docker logs container-name
```

## 🆘 Getting Help

### Self-Service Resources
1. **Check this guide first**
2. **Review application logs**
3. **Test with health endpoints**
4. **Verify Tally configuration**

### When to Contact Support
Contact support when:
- You've tried all solutions in this guide
- Error messages are unclear
- Issues persist after troubleshooting
- You need help with configuration

### Information to Provide
When contacting support, include:
1. **Exact error messages** (full text)
2. **Steps to reproduce** the issue
3. **System information** (OS, Node.js, Tally versions)
4. **Configuration** (sanitized .env file)
5. **Logs** (relevant portions)
6. **Network setup** (local vs remote Tally)

### Support Channels
- **Documentation**: This guide and API reference
- **Community**: GitHub issues, forums
- **Email**: support@your-domain.com
- **Chat**: Discord/Slack community

## 📚 Additional Resources

### Tally Documentation
- Tally Prime user manual
- XML API documentation
- TDL customization guide

### Node.js Resources
- Node.js debugging guide
- Memory management best practices
- Performance optimization tips

### Network Troubleshooting
- Windows firewall guide
- Network debugging tools
- Port forwarding documentation
