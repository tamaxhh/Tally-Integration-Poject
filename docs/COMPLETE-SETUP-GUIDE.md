# 🚀 Complete Setup Guide - Tally Integration Project

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Prerequisites](#prerequisites)
3. [Local Development Setup](#local-development-setup)
4. [Standalone Executable Setup](#standalone-executable-setup)
5. [Remote Access Configuration](#remote-access-configuration)
6. [Multi-User Access Setup](#multi-user-access-setup)
7. [End-User Guide](#end-user-guide)
8. [Troubleshooting](#troubleshooting)
9. [Production Deployment](#production-deployment)

---

## 🎯 Project Overview

Your Tally integration project includes:
- **Fastify API Server** with real Tally data integration
- **Modern Web Frontend** (`index-v2.html`) with responsive UI
- **Standalone Executable** for easy distribution
- **Production Features**: Circuit breaker, caching, rate limiting, error handling
- **Security**: API key authentication and validation

### Current Architecture
```
Frontend (Browser) → API Server → Tally Client → Tally Prime
                      ↓
                 Cache Layer + Error Handling
```

---

## 📋 Prerequisites

### System Requirements
- ✅ **Windows OS** (you're on Windows)
- ✅ **Node.js v20.20.0** (already installed)
- ✅ **Tally Prime** (installed and configured)

### Tally Prime Configuration
Before starting, ensure Tally Prime is configured:

1. **Open Tally Prime**
2. **Press F12 → Configure**
3. **Go to "Advanced Configuration"**
4. **Enable "Allow XML Import/Export"**
5. **Set XML Port** (default: 9000)
6. **Restart Tally**

### Verify Tally Connection
```bash
# Test Tally XML port
curl http://localhost:9000
```

---

## 💻 Local Development Setup

### Step 1: Navigate to Project Directory
```bash
cd c:\Users\tamash62\Downloads\Tally
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Environment
Create `.env` file from template:
```bash
copy .env.example .env
```

Edit `.env` file:
```env
# Server Configuration
NODE_ENV=development
PORT=3000
HOST=0.0.0.0

# Tally Connection
TALLY_HOST=localhost
TALLY_PORT=9000
TALLY_TIMEOUT_MS=5000
TALLY_MAX_RETRIES=2

# API Keys (comma-separated)
API_KEYS=dev-key-local-only,admin-key-1234

# Logging
LOG_LEVEL=info
```

### Step 4: Start Development Server
```bash
# Option A: Direct Node.js
node start-server.js

# Option B: Using Batch File
.\Start-Tally-Remote-Fetcher.bat
```

### Step 5: Verify Setup
Open browser and test these URLs:
- **Health Check**: http://localhost:3000/health
- **Frontend**: http://localhost:3000/index-v2.html
- **API Documentation**: http://localhost:3000/api/v1/ledgers

### Expected Success Output
```
🚀 Tally API Server running at: http://0.0.0.0:3000
📊 Health check: http://0.0.0.0:3000/health
📚 API docs: http://0.0.0.0:3000/api/v1/ledgers
```

---

## 📦 Standalone Executable Setup

### Step 1: Build Standalone Version
```bash
cd standalone
node build.js
```

### Step 2: Verify Executable Creation
```bash
dir dist
```
You should see: `tally-remote-fetcher.exe` (~39MB)

### Step 3: Run Standalone Executable
```bash
cd dist
.\tally-remote-fetcher.exe
```

### Step 4: Test Standalone Version
Access the same URLs:
- **Frontend**: http://localhost:3000/index-v2.html
- **API**: http://localhost:3000/api/v1/ledgers

### Distribution Package
The `standalone` folder contains everything needed for distribution:
```
standalone/
├── dist/tally-remote-fetcher.exe  # Main executable
├── build.js                       # Build script
├── README.md                      # Documentation
└── build-standalone.bat          # Windows batch file
```

---

## 🌐 Remote Access Configuration

### For Local Network Access

#### Step 1: Configure Server for External Access
Edit `config.js`:
```javascript
server: {
  port: 3000,
  host: '0.0.0.0'  // Allow external connections
}
```

#### Step 2: Windows Firewall Configuration
1. **Open Windows Defender Firewall**
2. **Click "Allow an app or feature through Windows Firewall"**
3. **Click "Change settings"**
4. **Add port 3000**:
   - Click "Allow another app..."
   - Browse to your Node.js executable
   - Allow both "Private" and "Public" networks

#### Step 3: Find Your IP Address
```bash
ipconfig
```
Look for "IPv4 Address" (usually 192.168.x.x)

#### Step 4: Test Network Access
From another computer on the same network:
```
http://YOUR_IP_ADDRESS:3000/index-v2.html
```

### For Internet Access

#### Step 1: Port Forwarding
1. **Access your router** (usually 192.168.1.1)
2. **Find Port Forwarding section**
3. **Forward external port 3000** to your computer's IP:3000
4. **Save and restart router**

#### Step 2: Dynamic DNS (Optional)
Use services like:
- No-IP (free)
- Dynu (free)
- DuckDNS (free)

#### Step 3: Test Internet Access
```
http://YOUR_PUBLIC_IP:3000/index-v2.html
```

---

## 👥 Multi-User Access Setup

### Step 1: Configure Multiple API Keys
Edit `.env` file:
```env
API_KEYS=user1-key-1234,user2-key-5678,admin-key-9999
```

### Step 2: User Access Levels
Create different API keys for different users:
- **Read-only users**: Can view ledgers and reports
- **Admin users**: Can clear cache and access all endpoints

### Step 3: Rate Limiting Configuration
The system includes built-in rate limiting:
- **Default**: 100 requests per minute per IP
- **Per API key**: Additional tracking if needed

### Step 4: User Distribution Package
Create a user package:
```
User-Access-Package/
├── README-USER-INSTRUCTIONS.txt
├── tally-remote-fetcher.exe
├── CONFIG-SETTINGS.txt
└── SUPPORT-CONTACT.txt
```

---

## 📱 End-User Guide

### Quick Start for Users

#### Option 1: Using Standalone Executable
1. **Extract the provided package**
2. **Run `tally-remote-fetcher.exe`**
3. **Open browser**: http://localhost:3000/index-v2.html
4. **Use provided API key** when prompted

#### Option 2: Accessing Remote Server
1. **Open browser**
2. **Go to provided URL**: http://SERVER_IP:3000/index-v2.html
3. **Enter API key** when prompted

### Available Features for Users
- **View all ledgers** with balances
- **Filter by date range**
- **Export data** (if enabled)
- **Real-time updates** (5-minute cache refresh)

### User Troubleshooting
- **"Connection refused"**: Server not running, contact admin
- **"Invalid API key"**: Check provided key, contact admin
- **"No data found"**: Check date range, clear cache
- **"Tally offline"**: Contact Tally administrator

---

## 🛠️ Available API Endpoints

### Authentication
All endpoints require `apiKey` parameter:
```
?apiKey=your-api-key-here
```

### Core Endpoints
```bash
# Health Check
GET /health

# List all ledgers
GET /api/v1/ledgers?apiKey=your-key

# Get ledger balances
GET /api/v1/ledgers/balances?apiKey=your-key

# Get specific ledger details
GET /api/v1/ledgers/{ledgerName}?apiKey=your-key

# Get ledger transactions
GET /api/v1/ledgers/{ledgerName}/transactions?from=2024-01-01&to=2024-12-31&apiKey=your-key

# Clear cache (admin only)
POST /api/v1/ledgers/cache/invalidate
```

### Example API Calls
```bash
# Test health
curl http://localhost:3000/health

# Get ledgers with API key
curl "http://localhost:3000/api/v1/ledgers?apiKey=dev-key-local-only"

# Get transactions for specific ledger
curl "http://localhost:3000/api/v1/ledgers/Sales/transactions?from=2024-01-01&apiKey=dev-key-local-only"
```

---

## 🔧 Troubleshooting

### Common Issues and Solutions

#### 1. ECONNREFUSED Error
**Problem**: Server not running
**Solution**: 
```bash
# Start server
node start-server.js
# or run standalone executable
.\tally-remote-fetcher.exe
```

#### 2. Port Already in Use
**Problem**: Port 3000 occupied
**Solution**:
```bash
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process
taskkill /PID <PID> /F

# Or change port in config.js
```

#### 3. Tally Connection Failed
**Problem**: Cannot connect to Tally
**Solution**:
- Verify Tally is running
- Check XML port (9000)
- Test with: `curl http://localhost:9000`
- Check TDL customizations in Tally

#### 4. "No Data Found" Error
**Problem**: API returns no data
**Solution**:
- Check date range in queries
- Verify ledger names exist
- Clear cache: `POST /api/v1/ledgers/cache/invalidate`
- Check Tally company data

#### 5. Authentication Issues
**Problem**: Invalid API key
**Solution**:
- Check API key in `.env` file
- Verify key is passed correctly
- Check for typos in key

#### 6. Firewall Blocking
**Problem**: External access blocked
**Solution**:
- Configure Windows Firewall
- Check antivirus settings
- Verify port forwarding for internet access

### Debug Information Collection
When reporting issues, provide:
1. **Error messages** (full text)
2. **Tally version** and company name
3. **Network configuration** (IP, port status)
4. **Browser console errors** (F12 → Console)
5. **Server logs** (console output)

---

## 🚀 Production Deployment

### Environment Variables for Production
Create production `.env`:
```env
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Production Tally settings
TALLY_HOST=tally-server.company.com
TALLY_PORT=9000
TALLY_TIMEOUT_MS=10000
TALLY_MAX_RETRIES=3

# Production security
API_KEYS=prod-key-1,prod-key-2,admin-prod-key
LOG_LEVEL=warn

# Optional: Redis for distributed cache
REDIS_URL=redis://cache-server:6379
```

### Security Hardening
1. **Use HTTPS** with SSL certificates
2. **Implement IP whitelisting**
3. **Use strong API keys**
4. **Enable request logging**
5. **Monitor access patterns**

### Monitoring and Maintenance
- **Log rotation** for long-term operation
- **Health checks** every minute
- **Cache monitoring** and optimization
- **Backup configuration** regularly

### Performance Optimization
- **Redis cache** for multiple servers
- **Load balancing** for high traffic
- **CDN** for static assets
- **Database optimization** for large datasets

---

## 📞 Support and Maintenance

### Regular Maintenance Tasks
- [ ] **Weekly**: Check server logs for errors
- [ ] **Monthly**: Update API keys if needed
- [ ] **Quarterly**: Review and update security settings
- [ ] **Annually**: Major version updates and testing

### Contact Information
For support, provide:
- **Administrator contact**: email/phone
- **Tally support**: IT department contact
- **Network issues**: Network administrator
- **Application bugs**: Developer contact

---

## 🎉 Success Checklist

### Setup Verification
- [ ] Tally Prime running with XML port enabled
- [ ] Node.js server starts without errors
- [ ] Health endpoint returns `{"status":"healthy"}`
- [ ] Frontend loads at http://localhost:3000/index-v2.html
- [ ] API returns real Tally data (not mock data)
- [ ] Multiple users can access simultaneously
- [ ] Remote access works from other computers

### Performance Indicators
- ✅ **Fast response times** (< 2 seconds for most queries)
- ✅ **Reliable connection** to Tally (circuit breaker working)
- ✅ **Proper caching** (reduced Tally load)
- ✅ **No "No data found"** errors with valid queries
- ✅ **Stable operation** for extended periods

Your Tally integration project is now fully configured for local development, remote access, and multi-user deployment! 🚀
