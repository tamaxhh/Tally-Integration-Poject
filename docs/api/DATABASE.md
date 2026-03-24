# Database Documentation

Complete guide to the PostgreSQL database schema, relationships, migrations, and data management for the Tally Integration API.

## 🗄️ Database Overview

The system uses PostgreSQL as the primary database for:
- **Data snapshots** for historical analysis
- **API usage tracking** and monitoring
- **Caching persistence** for large datasets
- **Audit logs** and compliance

### Database Configuration

**Development:**
```
postgresql://postgres:password@localhost:5432/tally_integration
```

**Production:**
```
postgresql://user:password@host:5432/tally_integration_prod
```

**Test:**
```
postgresql://postgres:password@localhost:5432/tally_integration_test
```

## 📊 Schema Overview

```mermaid
erDiagram
    companies ||--o{ ledgers : has
    companies ||--o{ ledger_snapshots : snapshots
    companies ||--o{ vouchers : contains
    companies ||--o{ api_usage : tracks
    
    companies {
        int id PK
        string name
        string guid
        timestamp created_at
        timestamp updated_at
    }
    
    ledgers {
        int id PK
        int company_id FK
        string name
        string parent
        decimal opening_balance
        decimal closing_balance
        string guid
        string type
        timestamp created_at
        timestamp updated_at
    }
    
    ledger_snapshots {
        int id PK
        int company_id FK
        date snapshot_date
        jsonb ledger_data
        timestamp created_at
    }
    
    vouchers {
        int id PK
        int company_id FK
        string voucher_number
        date voucher_date
        string voucher_type
        string party_name
        decimal amount
        string narration
        string guid
        timestamp created_at
        timestamp updated_at
    }
    
    api_usage {
        int id PK
        string endpoint
        string api_key_hash
        integer response_time
        integer status_code
        jsonb request_data
        jsonb response_data
        timestamp created_at
    }
```

## 📋 Table Definitions

### 1. Companies

Stores Tally company information and metadata.

```sql
CREATE TABLE companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    guid VARCHAR(50) UNIQUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_companies_name ON companies(name);
CREATE INDEX idx_companies_guid ON companies(guid);
CREATE INDEX idx_companies_created_at ON companies(created_at);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_companies_updated_at 
    BEFORE UPDATE ON companies 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Sample Data:**
```sql
INSERT INTO companies (name, guid) VALUES 
('Demo Company', '123e4567-e89b-12d3-a456-426614174000'),
('Test Business', '456e7890-e89b-12d3-a456-426614174001');
```

### 2. Ledgers

Stores ledger account information from Tally.

```sql
CREATE TABLE ledgers (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    parent VARCHAR(255),
    opening_balance DECIMAL(15,2) DEFAULT 0,
    closing_balance DECIMAL(15,2) DEFAULT 0,
    guid VARCHAR(50),
    type VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_ledger_per_company UNIQUE(company_id, guid)
);

-- Indexes
CREATE INDEX idx_ledgers_company_id ON ledgers(company_id);
CREATE INDEX idx_ledgers_name ON ledgers(name);
CREATE INDEX idx_ledgers_parent ON ledgers(parent);
CREATE INDEX idx_ledgers_guid ON ledgers(guid);
CREATE INDEX idx_ledgers_type ON ledgers(type);
CREATE INDEX idx_ledgers_created_at ON ledgers(created_at);

-- Full-text search index
CREATE INDEX idx_ledgers_name_fts ON ledgers USING gin(to_tsvector('english', name));

-- Trigger for updated_at
CREATE TRIGGER update_ledgers_updated_at 
    BEFORE UPDATE ON ledgers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Sample Data:**
```sql
INSERT INTO ledgers (company_id, name, parent, opening_balance, closing_balance, guid, type) VALUES 
(1, 'Alfa Provisions', 'Sundry Debtors', 15000.00, 25000.00, '123e4567-e89b-12d3-a456-426614174002', 'Debtor'),
(1, 'Bank of Baroda', 'Bank Accounts', 50000.00, 75000.00, '123e4567-e89b-12d3-a456-426614174003', 'Bank');
```

### 3. Ledger Snapshots

Historical snapshots of ledger data for trend analysis.

```sql
CREATE TABLE ledger_snapshots (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    snapshot_date DATE NOT NULL,
    ledger_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_snapshot_date UNIQUE(company_id, snapshot_date)
);

-- Indexes
CREATE INDEX idx_ledger_snapshots_company_id ON ledger_snapshots(company_id);
CREATE INDEX idx_ledger_snapshots_date ON ledger_snapshots(snapshot_date);
CREATE INDEX idx_ledger_snapshots_created_at ON ledger_snapshots(created_at);

-- JSONB indexes for querying nested data
CREATE INDEX idx_ledger_snapshots_data ON ledger_snapshots USING GIN(ledger_data);
CREATE INDEX idx_ledger_snapshots_data_names ON ledger_snapshots USING GIN((ledger_data->'ledgers'->>'name'));
```

**Sample Data:**
```sql
INSERT INTO ledger_snapshots (company_id, snapshot_date, ledger_data) VALUES 
(1, '2024-03-31', '{
    "ledgers": [
        {"name": "Alfa Provisions", "balance": 25000.00},
        {"name": "Bank of Baroda", "balance": 75000.00}
    ],
    "total": 100000.00
}');
```

### 4. Vouchers

Stores voucher/transaction information from Tally.

```sql
CREATE TABLE vouchers (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    voucher_number VARCHAR(100) NOT NULL,
    voucher_date DATE NOT NULL,
    voucher_type VARCHAR(50) NOT NULL,
    party_name VARCHAR(255),
    amount DECIMAL(15,2) NOT NULL,
    narration TEXT,
    guid VARCHAR(50),
    ledger_entries JSONB, -- Debit/Credit entries
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_voucher_per_company UNIQUE(company_id, guid)
);

-- Indexes
CREATE INDEX idx_vouchers_company_id ON vouchers(company_id);
CREATE INDEX idx_vouchers_number ON vouchers(voucher_number);
CREATE INDEX idx_vouchers_date ON vouchers(voucher_date);
CREATE INDEX idx_vouchers_type ON vouchers(voucher_type);
CREATE INDEX idx_vouchers_party ON vouchers(party_name);
CREATE INDEX idx_vouchers_amount ON vouchers(amount);
CREATE INDEX idx_vouchers_guid ON vouchers(guid);

-- Composite index for common queries
CREATE INDEX idx_vouchers_company_date ON vouchers(company_id, voucher_date);

-- JSONB index for ledger entries
CREATE INDEX idx_vouchers_ledger_entries ON vouchers USING GIN(ledger_entries);

-- Trigger for updated_at
CREATE TRIGGER update_vouchers_updated_at 
    BEFORE UPDATE ON vouchers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Sample Data:**
```sql
INSERT INTO vouchers (company_id, voucher_number, voucher_date, voucher_type, party_name, amount, narration, ledger_entries) VALUES 
(1, 'SAL-001', '2024-03-15', 'Sales', 'Alfa Provisions', 15000.00, 'Sales invoice for March', '[
    {"ledger": "Alfa Provisions", "debit": 15000.00},
    {"ledger": "Sales Account", "credit": 15000.00}
]');
```

### 5. API Usage

Tracks API requests for monitoring and analytics.

```sql
CREATE TABLE api_usage (
    id SERIAL PRIMARY KEY,
    endpoint VARCHAR(255) NOT NULL,
    api_key_hash VARCHAR(255) NOT NULL, -- Hashed API key for privacy
    response_time INTEGER NOT NULL, -- Response time in milliseconds
    status_code INTEGER NOT NULL,
    request_data JSONB,
    response_data JSONB,
    user_agent TEXT,
    ip_address INET,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_api_usage_endpoint ON api_usage(endpoint);
CREATE INDEX idx_api_usage_api_key_hash ON api_usage(api_key_hash);
CREATE INDEX idx_api_usage_status_code ON api_usage(status_code);
CREATE INDEX idx_api_usage_response_time ON api_usage(response_time);
CREATE INDEX idx_api_usage_created_at ON api_usage(created_at);

-- Composite indexes for analytics
CREATE INDEX idx_api_usage_hourly ON api_usage(date_trunc('hour', created_at), endpoint);
CREATE INDEX idx_api_usage_daily ON api_usage(date_trunc('day', created_at), endpoint);
```

**Sample Data:**
```sql
INSERT INTO api_usage (endpoint, api_key_hash, response_time, status_code, request_data, user_agent, ip_address) VALUES 
('/api/v1/ledgers', 'a1b2c3d4e5f6', 150, 200, '{"limit": 10}', 'Mozilla/5.0...', '127.0.0.1');
```

## 🔄 Migration System

### Migration Files Structure

```
migrations/
├── 001_initial_schema.sql
├── 002_add_snapshots.sql
├── 003_add_vouchers.sql
├── 004_add_api_usage.sql
├── 005_add_indexes.sql
└── 006_add_triggers.sql
```

### Migration 001: Initial Schema

```sql
-- migrations/001_initial_schema.sql
BEGIN;

-- Create companies table
CREATE TABLE companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    guid VARCHAR(50) UNIQUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create ledgers table
CREATE TABLE ledgers (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    parent VARCHAR(255),
    opening_balance DECIMAL(15,2) DEFAULT 0,
    closing_balance DECIMAL(15,2) DEFAULT 0,
    guid VARCHAR(50),
    type VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_ledgers_company_id ON ledgers(company_id);
CREATE INDEX idx_ledgers_name ON ledgers(name);
CREATE INDEX idx_companies_name ON companies(name);

COMMIT;
```

### Migration 002: Add Snapshots

```sql
-- migrations/002_add_snapshots.sql
BEGIN;

-- Create ledger snapshots table
CREATE TABLE ledger_snapshots (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    snapshot_date DATE NOT NULL,
    ledger_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT unique_snapshot_date UNIQUE(company_id, snapshot_date)
);

-- Create indexes
CREATE INDEX idx_ledger_snapshots_company_id ON ledger_snapshots(company_id);
CREATE INDEX idx_ledger_snapshots_date ON ledger_snapshots(snapshot_date);

COMMIT;
```

### Running Migrations

```bash
# Using node-pg-migrate
npm run migrate up

# Using psql directly
psql -d tally_integration -f migrations/001_initial_schema.sql
psql -d tally_integration -f migrations/002_add_snapshots.sql

# Rollback
npm run migrate down
```

## 🔍 Common Queries

### Analytics Queries

**Daily API Usage:**
```sql
SELECT 
    DATE(created_at) as date,
    endpoint,
    COUNT(*) as request_count,
    AVG(response_time) as avg_response_time,
    COUNT(CASE WHEN status_code >= 400 THEN 1 END) as error_count
FROM api_usage 
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at), endpoint
ORDER BY date DESC, endpoint;
```

**Ledger Balance Trends:**
```sql
SELECT 
    ls.snapshot_date,
    ld.name,
    (ld.ledger_data->'balance')::DECIMAL as balance
FROM ledger_snapshots ls, 
     jsonb_array_elements(ls.ledger_data->'ledgers') as ld
WHERE ls.company_id = 1
  AND ld->>'name' = 'Alfa Provisions'
ORDER BY ls.snapshot_date DESC;
```

**Top 10 Slowest Endpoints:**
```sql
SELECT 
    endpoint,
    AVG(response_time) as avg_response_time,
    COUNT(*) as request_count,
    MAX(response_time) as max_response_time
FROM api_usage 
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY endpoint
ORDER BY avg_response_time DESC
LIMIT 10;
```

### Maintenance Queries

**Clean Old API Usage Data:**
```sql
DELETE FROM api_usage 
WHERE created_at < NOW() - INTERVAL '90 days';
```

**Update Ledger Balances:**
```sql
UPDATE ledgers 
SET closing_balance = new_balance
FROM (
    SELECT guid, balance 
    FROM jsonb_to_recordset(tally_response_data) AS x(guid TEXT, balance DECIMAL)
) AS updates
WHERE ledgers.guid = updates.guid;
```

**Find Duplicate Ledgers:**
```sql
SELECT company_id, name, COUNT(*) as duplicate_count
FROM ledgers 
GROUP BY company_id, name
HAVING COUNT(*) > 1;
```

## 📊 Performance Optimization

### Indexing Strategy

**Primary Indexes:**
- All foreign keys
- Unique constraints
- Frequently queried columns

**Composite Indexes:**
```sql
-- For date-based queries
CREATE INDEX idx_vouchers_company_date ON vouchers(company_id, voucher_date);

-- For search queries
CREATE INDEX idx_ledgers_company_name ON ledgers(company_id, name);

-- For API analytics
CREATE INDEX idx_api_usage_endpoint_created ON api_usage(endpoint, created_at);
```

**JSONB Indexes:**
```sql
-- For JSON data queries
CREATE INDEX idx_ledger_snapshots_data ON ledger_snapshots USING GIN(ledger_data);

-- For specific JSON paths
CREATE INDEX idx_vouchers_party_name ON vouchers USING GIN((ledger_entries->'party_name'));
```

### Query Optimization

**Use EXPLAIN ANALYZE:**
```sql
EXPLAIN ANALYZE
SELECT * FROM ledgers 
WHERE company_id = 1 AND name LIKE '%Bank%';
```

**Optimized Query Example:**
```sql
-- Instead of this (slow):
SELECT * FROM ledgers WHERE name LIKE '%Bank%';

-- Use this (fast with proper index):
SELECT * FROM ledgers 
WHERE to_tsvector('english', name) @@ to_tsquery('english', 'Bank');
```

### Connection Pooling

**PgBouncer Configuration:**
```ini
[databases]
tally_integration = host=localhost port=5432 dbname=tally_integration

[pgbouncer]
listen_port = 6432
listen_addr = 127.0.0.1
auth_type = md5
auth_file = /etc/pgbouncer/userlist.txt
logfile = /var/log/pgbouncer/pgbouncer.log
pidfile = /var/run/pgbouncer/pgbouncer.pid
admin_users = postgres
stats_users = stats, postgres

# Pool settings
pool_mode = transaction
max_client_conn = 100
default_pool_size = 20
min_pool_size = 5
reserve_pool_size = 5
reserve_pool_timeout = 5
max_db_connections = 50
max_user_connections = 50
```

## 🔐 Security & Privacy

### Data Encryption

**Sensitive Data Encryption:**
```sql
-- Create extension for encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Encrypt API keys
INSERT INTO api_usage (api_key_hash) 
VALUES (crypt('api-key-value', gen_salt('bf')));

-- Verify API key
SELECT * FROM api_usage 
WHERE api_key_hash = crypt('provided-api-key', api_key_hash);
```

### Row-Level Security

```sql
-- Enable RLS on sensitive tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledgers ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY company_isolation ON companies
    FOR ALL TO api_user
    USING (id = current_setting('app.current_company_id')::INTEGER);

CREATE POLICY ledger_isolation ON ledgers
    FOR ALL TO api_user
    USING (company_id = current_setting('app.current_company_id')::INTEGER);
```

### Audit Logging

```sql
-- Create audit table
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(255) NOT NULL,
    operation VARCHAR(10) NOT NULL, -- INSERT, UPDATE, DELETE
    old_values JSONB,
    new_values JSONB,
    user_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (table_name, operation, old_values, user_id)
        VALUES (TG_TABLE_NAME, TG_OP, row_to_json(OLD), current_user);
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (table_name, operation, old_values, new_values, user_id)
        VALUES (TG_TABLE_NAME, TG_OP, row_to_json(OLD), row_to_json(NEW), current_user);
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (table_name, operation, new_values, user_id)
        VALUES (TG_TABLE_NAME, TG_OP, row_to_json(NEW), current_user);
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply audit triggers
CREATE TRIGGER audit_companies_trigger
    AFTER INSERT OR UPDATE OR DELETE ON companies
    FOR EACH ROW EXECUTE FUNCTION audit_trigger();
```

## 🔄 Backup & Recovery

### Backup Strategy

**Daily Full Backup:**
```bash
#!/bin/bash
# backup-db.sh
BACKUP_DIR="/backups/tally_integration"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="tally_integration"

# Create backup
pg_dump -h localhost -U postgres -d $DB_NAME \
    --format=custom \
    --compress=9 \
    --file="$BACKUP_DIR/tally_integration_$DATE.backup"

# Keep only last 30 days
find $BACKUP_DIR -name "*.backup" -mtime +30 -delete
```

**Point-in-Time Recovery:**
```bash
# Restore from backup
pg_restore -h localhost -U postgres -d tally_integration \
    --clean --if-exists \
    /backups/tally_integration_20240324_120000.backup
```

### Replication Setup

**Master Configuration:**
```sql
-- postgresql.conf
wal_level = replica
max_wal_senders = 3
wal_keep_segments = 64
archive_mode = on
archive_command = 'cp %p /var/lib/postgresql/wal_archive/%f'
```

**Replica Configuration:**
```bash
# Setup replica
pg_basebackup -h master-host -D /var/lib/postgresql/data -U replication -v -P -W
```

## 📈 Monitoring & Maintenance

### Health Check Queries

```sql
-- Database size
SELECT pg_size_pretty(pg_database_size('tally_integration'));

-- Table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Index usage
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Long-running queries
SELECT 
    pid,
    now() - pg_stat_activity.query_start AS duration,
    query,
    state
FROM pg_stat_activity 
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes';
```

### Maintenance Scripts

**Weekly Maintenance:**
```sql
-- Update table statistics
ANALYZE;

-- Reindex fragmented indexes
REINDEX INDEX CONCURRENTLY idx_ledgers_name;

-- Vacuum old data
VANUUM ANALYZE api_usage;

-- Clean up old audit logs
DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '1 year';
```

---

**🗄️ This database design ensures data integrity, performance, and scalability for the Tally Integration API.**
