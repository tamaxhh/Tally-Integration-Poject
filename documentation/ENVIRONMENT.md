# Environment & Configuration Guide

Complete guide to environment variables, configuration files, and secrets management for the Tally Integration API.

## 🔧 Configuration Overview

The application uses a layered configuration system:
- **Environment variables** (highest priority)
- **Configuration files** (JSON/YAML)
- **Default values** (fallback)

### Configuration Loading Order

1. `.env` file (local development)
2. Environment variables (production)
3. `config/default.json` (defaults)
4. Hard-coded defaults (last resort)

## 📄 Environment Variables

### Core Application Settings

```bash
# Application
NODE_ENV=development                    # development|test|production
PORT=3000                               # API server port
HOST=0.0.0.0                            # Bind address
LOG_LEVEL=info                          # trace|debug|info|warn|error|silent

# API Configuration
API_KEYS=dev-key-local-only,prod-key-5678  # Comma-separated API keys
API_VERSION=v1                         # API version prefix
CORS_ORIGIN=*                          # CORS allowed origins
RATE_LIMIT_ENABLED=true                 # Enable/disable rate limiting
RATE_LIMIT_MAX=100                      # Requests per minute
RATE_LIMIT_WINDOW=60000                 # Time window in milliseconds
```

### Tally Integration Settings

```bash
# Tally Connection
TALLY_HOST=host.docker.internal         # Tally server host
TALLY_PORT=9000                         # Tally XML port
TALLY_TIMEOUT_MS=10000                  # Request timeout
TALLY_MAX_RETRIES=3                     # Max retry attempts
TALLY_RETRY_DELAY_MS=1000               # Delay between retries
TALLY_COMPANY_NAME=                    # Specific company name (optional)

# Tally Features
TALLY_ENABLE_CACHE=true                 # Cache Tally responses
TALLY_CACHE_TTL_SECONDS=300            # Cache TTL (5 minutes)
TALLY_ENABLE_CIRCUIT_BREAKER=true      # Enable circuit breaker
TALLY_CIRCUIT_BREAKER_THRESHOLD=5      # Failure threshold
TALLY_CIRCUIT_BREAKER_TIMEOUT_MS=60000  # Reset timeout
```

### Database Configuration

```bash
# PostgreSQL
DATABASE_URL=postgresql://postgres:password@localhost:5432/tally_integration
DB_HOST=localhost                       # Database host
DB_PORT=5432                            # Database port
DB_NAME=tally_integration               # Database name
DB_USER=postgres                        # Database user
DB_PASSWORD=password                    # Database password
DB_SSL=false                            # SSL connection
DB_POOL_MIN=2                           # Min pool connections
DB_POOL_MAX=10                          # Max pool connections
DB_POOL_IDLE_TIMEOUT=30000              # Idle timeout (ms)

# Database Features
DB_ENABLE_MIGRATIONS=true               # Run migrations on start
DB_ENABLE_SEEDING=false                 # Seed test data
DB_ENABLE_LOGGING=false                 # Log SQL queries
```

### Redis Configuration

```bash
# Redis Cache
REDIS_URL=redis://localhost:6379        # Redis connection URL
REDIS_HOST=localhost                    # Redis host
REDIS_PORT=6379                         # Redis port
REDIS_PASSWORD=                        # Redis password (optional)
REDIS_DB=0                              # Redis database number
REDIS_CONNECT_TIMEOUT=10000            # Connection timeout (ms)
REDIS_COMMAND_TIMEOUT=5000              # Command timeout (ms)
REDIS_RETRY_ATTEMPTS=3                  # Retry attempts
REDIS_ENABLE_CLUSTERING=false            # Redis clustering
REDIS_CLUSTER_NODES=                    # Cluster nodes (comma-separated)
```

### Security Settings

```bash
# Authentication
AUTH_API_KEY_HEADER=X-API-Key           # API key header name
AUTH_API_KEY_QUERY=apiKey               # API key query parameter
AUTH_ENABLE_JWT=false                   # JWT authentication (future)
AUTH_JWT_SECRET=                        # JWT secret key
AUTH_JWT_EXPIRES_IN=24h                 # JWT expiration

# Security Headers
SECURITY_ENABLE_HELMET=true             # Security headers
SECURITY_ENABLE_RATE_LIMIT=true         # Rate limiting
SECURITY_ENABLE_CORS=true               # CORS
SECURITY_TRUST_PROXY=false              # Trust proxy headers
```

### Monitoring & Logging

```bash
# Logging
LOG_LEVEL=info                          # Log level
LOG_FORMAT=json                         # Log format (json|pretty)
LOG_FILE=                               # Log file path
LOG_MAX_SIZE=10m                       # Max log file size
LOG_MAX_FILES=5                         # Max log files
LOG_ENABLE_REQUEST_LOGGING=true         # Log HTTP requests
LOG_ENABLE_PERFORMANCE_LOGGING=true     # Log performance metrics

# Monitoring
METRICS_ENABLED=true                    # Enable metrics collection
METRICS_PORT=9090                       # Metrics port
HEALTH_CHECK_ENABLED=true               # Health checks
HEALTH_CHECK_INTERVAL=30000             # Health check interval (ms)
```

### Background Jobs & Tasks

```bash
# Background Processing
BACKGROUND_JOBS_ENABLED=true            # Enable background jobs
JOB_CONCURRENCY=5                       # Max concurrent jobs
JOB_TIMEOUT_MS=300000                   # Job timeout (5 minutes)

# Sync Jobs
SYNC_LEDGERS_CRON=0 */6 * * *           # Every 6 hours
SYNC_VOUCHERS_CRON=0 */4 * * *          # Every 4 hours
SYNC_REPORTS_CRON=0 2 * * *             # Daily at 2 AM
CLEANUP_CRON=0 3 * * 0                  # Weekly on Sunday at 3 AM
```

## 📁 Configuration Files

### `.env.example`

```bash
# Environment variables template
NODE_ENV=development
PORT=3000
HOST=0.0.0.0

# API Keys (comma-separated)
API_KEYS=dev-key-local-only

# Tally Configuration
TALLY_HOST=host.docker.internal
TALLY_PORT=9000
TALLY_TIMEOUT_MS=10000

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/tally_integration

# Redis
REDIS_URL=redis://localhost:6379

# Logging
LOG_LEVEL=info
```

### `config/default.json`

```json
{
  "app": {
    "name": "Tally Integration API",
    "version": "1.0.0",
    "description": "Production-grade Tally integration system"
  },
  "server": {
    "port": 3000,
    "host": "0.0.0.0",
    "keepAliveTimeout": 65000,
    "bodyLimit": 1048576
  },
  "tally": {
    "timeout": 10000,
    "maxRetries": 3,
    "retryDelay": 1000,
    "enableCaching": true,
    "cacheTTL": 300,
    "enableCircuitBreaker": true,
    "circuitBreaker": {
      "threshold": 5,
      "timeout": 60000
    }
  },
  "database": {
    "pool": {
      "min": 2,
      "max": 10,
      "idleTimeoutMillis": 30000
    },
    "logging": false,
    "ssl": false
  },
  "redis": {
    "connectTimeout": 10000,
    "commandTimeout": 5000,
    "retryAttempts": 3,
    "enableOfflineQueue": false
  },
  "logging": {
    "level": "info",
    "format": "json",
    "enableRequestLogging": true,
    "enablePerformanceLogging": true
  },
  "security": {
    "enableHelmet": true,
    "enableRateLimit": true,
    "enableCORS": true,
    "rateLimit": {
      "max": 100,
      "timeWindow": 60000
    }
  },
  "backgroundJobs": {
    "enabled": true,
    "concurrency": 5,
    "timeout": 300000
  }
}
```

### `config/production.json`

```json
{
  "server": {
    "port": 3000,
    "keepAliveTimeout": 65000
  },
  "tally": {
    "timeout": 15000,
    "maxRetries": 5
  },
  "database": {
    "pool": {
      "min": 5,
      "max": 20
    },
    "ssl": true
  },
  "redis": {
    "connectTimeout": 20000,
    "commandTimeout": 10000
  },
  "logging": {
    "level": "warn",
    "format": "json",
    "enableRequestLogging": false
  },
  "security": {
    "enableHelmet": true,
    "enableRateLimit": true,
    "rateLimit": {
      "max": 1000,
      "timeWindow": 60000
    }
  }
}
```

### `config/test.json`

```json
{
  "server": {
    "port": 3001
  },
  "database": {
    "url": "postgresql://postgres:password@localhost:5432/tally_integration_test",
    "pool": {
      "min": 1,
      "max": 5
    }
  },
  "redis": {
    "db": 1
  },
  "tally": {
    "timeout": 5000,
    "maxRetries": 1,
    "enableCaching": false
  },
  "logging": {
    "level": "silent"
  },
  "security": {
    "enableRateLimit": false
  },
  "backgroundJobs": {
    "enabled": false
  }
}
```

## 🔐 Secrets Management

### Development Secrets

**`.env.local` (gitignored):**
```bash
# Local development secrets
API_KEYS=dev-key-local-only,my-secret-key
DATABASE_URL=postgresql://postgres:my-password@localhost:5432/tally_integration
REDIS_PASSWORD=my-redis-password
TALLY_COMPANY_NAME=My Company
```

### Production Secrets

**Environment Variables:**
```bash
# Production secrets (set in deployment environment)
export API_KEYS="prod-key-12345,prod-key-67890"
export DATABASE_URL="postgresql://user:secure-password@db-host:5432/tally_prod"
export REDIS_PASSWORD="redis-secure-password"
export AUTH_JWT_SECRET="jwt-super-secret-key"
```

**AWS Secrets Manager:**
```json
{
  "tally-api": {
    "API_KEYS": "prod-key-12345,prod-key-67890",
    "DATABASE_URL": "postgresql://user:secure-password@db-host:5432/tally_prod",
    "REDIS_PASSWORD": "redis-secure-password",
    "AUTH_JWT_SECRET": "jwt-super-secret-key"
  }
}
```

**Kubernetes Secrets:**
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: tally-api-secrets
type: Opaque
data:
  API_KEYS: cHJvZC1rZXktMTIzNDUscHJvZC1rZXktNjc4OTA=  # base64 encoded
  DATABASE_URL: cG9zdGdyZXNxbDovdXNlcjpzZWN1cmUtcGFzc3dvcmRAZGItaG9zdDo1NDMyL3RhbGx5X3Byb2Q=
  REDIS_PASSWORD: cmVkaXMtc2VjdXJlLXBhc3N3b3Jk
  AUTH_JWT_SECRET: and0LXN1cGVyLXNlY3JldC1rZXk=
```

## 🔧 Configuration Management

### Configuration Loader (`src/utils/config.js`)

```javascript
const path = require('path')
const config = require('config')

// Load environment-specific configuration
const environment = process.env.NODE_ENV || 'development'
const configDir = path.join(__dirname, '../config')

// Override with environment variables
const overrides = {
  port: process.env.PORT || config.get('server.port'),
  host: process.env.HOST || config.get('server.host'),
  database: {
    url: process.env.DATABASE_URL || config.get('database.url')
  },
  redis: {
    url: process.env.REDIS_URL || config.get('redis.url')
  },
  tally: {
    host: process.env.TALLY_HOST || config.get('tally.host'),
    port: process.env.TALLY_PORT || config.get('tally.port')
  },
  apiKeys: process.env.API_KEYS ? process.env.API_KEYS.split(',') : config.get('security.apiKeys')
}

module.exports = { ...config, ...overrides }
```

### Environment Validation (`src/utils/env-validator.js`)

```javascript
const Joi = require('joi')

const envSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  
  PORT: Joi.number()
    .default(3000)
    .min(1)
    .max(65535),
  
  API_KEYS: Joi.string()
    .required()
    .min(1),
  
  DATABASE_URL: Joi.string()
    .uri()
    .required(),
  
  REDIS_URL: Joi.string()
    .uri()
    .required(),
  
  TALLY_HOST: Joi.string()
    .required(),
  
  TALLY_PORT: Joi.number()
    .default(9000)
    .min(1)
    .max(65535),
  
  LOG_LEVEL: Joi.string()
    .valid('trace', 'debug', 'info', 'warn', 'error', 'silent')
    .default('info')
}).unknown()

// Validate environment variables
const { error, value } = envSchema.validate(process.env)

if (error) {
  throw new Error(`Configuration validation error: ${error.message}`)
}

module.exports = value
```

## 🚀 Environment-Specific Setup

### Development Environment

**`.env.development`:**
```bash
NODE_ENV=development
PORT=3000
HOST=0.0.0.0
LOG_LEVEL=debug
API_KEYS=dev-key-local-only

# Local Tally
TALLY_HOST=localhost
TALLY_PORT=9000

# Local databases
DATABASE_URL=postgresql://postgres:password@localhost:5432/tally_integration
REDIS_URL=redis://localhost:6379

# Development features
LOG_ENABLE_REQUEST_LOGGING=true
METRICS_ENABLED=true
SECURITY_ENABLE_RATE_LIMIT=false
```

### Test Environment

**`.env.test`:**
```bash
NODE_ENV=test
PORT=3001
LOG_LEVEL=silent
API_KEYS=test-key

# Test databases
DATABASE_URL=postgresql://postgres:password@localhost:5432/tally_integration_test
REDIS_URL=redis://localhost:6379/1

# Test configuration
TALLY_TIMEOUT_MS=5000
BACKGROUND_JOBS_ENABLED=false
SECURITY_ENABLE_RATE_LIMIT=false
```

### Staging Environment

**`.env.staging`:**
```bash
NODE_ENV=production
PORT=3000
LOG_LEVEL=info
API_KEYS=staging-key-12345

# Staging infrastructure
TALLY_HOST=tally-staging.internal
DATABASE_URL=postgresql://staging_user:secure_pass@db-staging:5432/tally_staging
REDIS_URL=redis://redis-staging:6379

# Staging features
METRICS_ENABLED=true
HEALTH_CHECK_ENABLED=true
SECURITY_ENABLE_RATE_LIMIT=true
```

### Production Environment

**`.env.production`:**
```bash
NODE_ENV=production
PORT=3000
LOG_LEVEL=warn
API_KEYS=prod-key-12345,prod-key-67890

# Production infrastructure
TALLY_HOST=tally-prod.internal
DATABASE_URL=postgresql://prod_user:very_secure_pass@db-prod:5432/tally_prod
REDIS_URL=redis://redis-prod:6379

# Production security
SECURITY_ENABLE_RATE_LIMIT=true
SECURITY_TRUST_PROXY=true
RATE_LIMIT_MAX=1000

# Production performance
DB_POOL_MAX=20
REDIS_CONNECT_TIMEOUT=20000
TALLY_TIMEOUT_MS=15000
```

## 🔄 Dynamic Configuration

### Runtime Configuration Updates

```javascript
// src/utils/dynamic-config.js
class DynamicConfig {
  constructor(redisClient) {
    this.redis = redisClient
    this.config = {}
    this.watchers = new Map()
  }
  
  async get(key) {
    // Try Redis first
    const value = await this.redis.get(`config:${key}`)
    if (value) return JSON.parse(value)
    
    // Fallback to environment
    return process.env[key]
  }
  
  async set(key, value) {
    await this.redis.setex(`config:${key}`, 3600, JSON.stringify(value))
    this.config[key] = value
    
    // Notify watchers
    const watchers = this.watchers.get(key) || []
    watchers.forEach(callback => callback(value))
  }
  
  watch(key, callback) {
    if (!this.watchers.has(key)) {
      this.watchers.set(key, [])
    }
    this.watchers.get(key).push(callback)
  }
}
```

### Feature Flags

```javascript
// src/utils/feature-flags.js
class FeatureFlags {
  constructor(config) {
    this.config = config
  }
  
  isEnabled(feature) {
    const envVar = `FEATURE_${feature.toUpperCase()}`
    return process.env[envVar] === 'true' || this.config.get(`features.${feature}`)
  }
  
  getFeatures() {
    return {
      enableCache: this.isEnabled('enable_cache'),
      enableMetrics: this.isEnabled('enable_metrics'),
      enableBackgroundJobs: this.isEnabled('enable_background_jobs'),
      enableRateLimit: this.isEnabled('enable_rate_limit'),
      enableCircuitBreaker: this.isEnabled('enable_circuit_breaker')
    }
  }
}
```

## 📋 Configuration Checklist

### Pre-deployment Checklist

- [ ] **Environment variables set**
  - [ ] `API_KEYS` configured
  - [ ] `DATABASE_URL` pointing to correct database
  - [ ] `REDIS_URL` pointing to correct Redis instance
  - [ ] `TALLY_HOST` and `TALLY_PORT` configured

- [ ] **Security configuration**
  - [ ] Strong API keys generated
  - [ ] Rate limiting enabled
  - [ ] Security headers configured
  - [ ] CORS properly configured

- [ ] **Performance tuning**
  - [ ] Database connection pool sized appropriately
  - [ ] Redis connection settings optimized
  - [ ] Tally timeout settings appropriate
  - [ ] Cache TTL configured

- [ ] **Monitoring setup**
  - [ ] Log level appropriate for environment
  - [ ] Metrics collection enabled
  - [ ] Health checks configured
  - [ ] Error tracking configured

### Runtime Validation

```javascript
// src/utils/config-validator.js
class ConfigValidator {
  static validate(config) {
    const errors = []
    
    // Required fields
    const required = ['API_KEYS', 'DATABASE_URL', 'REDIS_URL', 'TALLY_HOST']
    required.forEach(field => {
      if (!config[field]) {
        errors.push(`Required field missing: ${field}`)
      }
    })
    
    // URL validation
    const urls = ['DATABASE_URL', 'REDIS_URL']
    urls.forEach(url => {
      try {
        new URL(config[url])
      } catch {
        errors.push(`Invalid URL format: ${url}`)
      }
    })
    
    // Port validation
    const ports = ['PORT', 'TALLY_PORT', 'REDIS_PORT', 'DB_PORT']
    ports.forEach(port => {
      const value = parseInt(config[port])
      if (isNaN(value) || value < 1 || value > 65535) {
        errors.push(`Invalid port number: ${port}`)
      }
    })
    
    return {
      valid: errors.length === 0,
      errors
    }
  }
}
```

## 🔍 Configuration Debugging

### Debug Commands

```bash
# Show current configuration
npm run config:show

# Validate configuration
npm run config:validate

# Test database connection
npm run test:db

# Test Redis connection
npm run test:redis

# Test Tally connection
npm run test:tally
```

### Configuration Debug Script

```bash
#!/bin/bash
# scripts/debug-config.sh

echo "=== Configuration Debug ==="
echo "Environment: $NODE_ENV"
echo "Port: $PORT"
echo "Database URL: ${DATABASE_URL//:*@***:***}"  # Hide password
echo "Redis URL: ${REDIS_URL//:*@***:***}"        # Hide password
echo "Tally Host: $TALLY_HOST"
echo "Tally Port: $TALLY_PORT"
echo "API Keys: $(echo $API_KEYS | cut -d',' -f1)***"  # Show first key only
echo "Log Level: $LOG_LEVEL"
echo "=== End Configuration ==="
```

---

**🔧 This configuration system ensures flexibility, security, and maintainability across all environments.**
