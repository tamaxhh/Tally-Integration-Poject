# Maintenance & Operations Guide

Comprehensive guide for maintaining, monitoring, and operating the Tally Integration API in production.

## 🔧 Daily Operations

### Health Checks

**Automated Health Monitoring:**
```bash
#!/bin/bash
# scripts/daily-health-check.sh

echo "=== Daily Health Check ==="
DATE=$(date +%Y-%m-%d_%H-%M-%S)
LOG_FILE="logs/health-check-$DATE.log"

# API Health
echo "Checking API health..."
API_HEALTH=$(curl -s "http://localhost:3000/health?apiKey=dev-key-local-only")
echo "API Health: $API_HEALTH" >> $LOG_FILE

# Database Health
echo "Checking database health..."
DB_HEALTH=$(docker-compose exec -T postgres pg_isready -U postgres)
echo "Database Health: $DB_HEALTH" >> $LOG_FILE

# Redis Health
echo "Checking Redis health..."
REDIS_HEALTH=$(docker-compose exec -T redis redis-cli ping)
echo "Redis Health: $REDIS_HEALTH" >> $LOG_FILE

# Tally Health
echo "Checking Tally health..."
TALLY_HEALTH=$(curl -s http://localhost:9000)
echo "Tally Health: $TALLY_HEALTH" >> $LOG_FILE

# Resource Usage
echo "Checking resource usage..."
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" >> $LOG_FILE

echo "Health check completed. Log: $LOG_FILE"
```

**Manual Health Verification:**
```bash
# Quick health check
curl "http://localhost:3000/health?apiKey=dev-key-local-only"

# Detailed health check
curl "http://localhost:3000/health/ready?apiKey=dev-key-local-only"

# Service status
docker-compose ps

# Resource usage
docker stats --no-stream
```

### Log Monitoring

**Log Analysis Script:**
```bash
#!/bin/bash
# scripts/analyze-logs.sh

LOG_FILE="logs/app-$(date +%Y-%m-%d).log"

# Error count
ERROR_COUNT=$(grep -c "ERROR" $LOG_FILE)
echo "Errors today: $ERROR_COUNT"

# Warning count
WARN_COUNT=$(grep -c "WARN" $LOG_FILE)
echo "Warnings today: $WARN_COUNT"

# Slow requests (>1s)
SLOW_REQUESTS=$(grep -c "responseTime.*[1-9][0-9][0-9][0-9]" $LOG_FILE)
echo "Slow requests: $SLOW_REQUESTS"

# Top error messages
echo "Top error messages:"
grep "ERROR" $LOG_FILE | sort | uniq -c | sort -nr | head -5

# API usage summary
echo "API usage summary:"
grep "request completed" $LOG_FILE | awk '{print $8}' | sort | uniq -c | sort -nr | head -10
```

**Real-time Log Monitoring:**
```bash
# Follow application logs
docker-compose logs -f app

# Follow all logs
docker-compose logs -f

# Filter error logs
docker-compose logs -f app | grep ERROR

# Filter slow requests
docker-compose logs -f app | grep "responseTime.*[1-9][0-9][0-9][0-9]"
```

## 📊 Performance Monitoring

### Key Metrics to Monitor

**API Performance:**
- Request rate (requests/second)
- Response time (p50, p95, p99)
- Error rate (4xx, 5xx)
- Throughput (bytes/second)

**System Resources:**
- CPU usage percentage
- Memory usage percentage
- Disk I/O operations
- Network I/O operations

**Database Performance:**
- Connection pool usage
- Query execution time
- Slow query count
- Database size growth

**Cache Performance:**
- Cache hit rate
- Memory usage
- Eviction rate
- Connection count

### Monitoring Dashboard Setup

**Grafana Dashboard Queries:**

```sql
-- API Request Rate
SELECT 
  DATE_TRUNC('minute', created_at) as minute,
  COUNT(*) as requests_per_minute
FROM api_usage 
WHERE created_at >= NOW() - INTERVAL '1 hour'
GROUP BY minute 
ORDER BY minute DESC;

-- Average Response Time
SELECT 
  DATE_TRUNC('minute', created_at) as minute,
  AVG(response_time) as avg_response_time
FROM api_usage 
WHERE created_at >= NOW() - INTERVAL '1 hour'
GROUP BY minute 
ORDER BY minute DESC;

-- Error Rate
SELECT 
  DATE_TRUNC('minute', created_at) as minute,
  COUNT(CASE WHEN status_code >= 400 THEN 1 END) as errors,
  COUNT(*) as total,
  (COUNT(CASE WHEN status_code >= 400 THEN 1 END) * 100.0 / COUNT(*)) as error_rate
FROM api_usage 
WHERE created_at >= NOW() - INTERVAL '1 hour'
GROUP BY minute 
ORDER BY minute DESC;
```

**Prometheus Alerting Rules:**

```yaml
# monitoring/alerts.yml
groups:
  - name: tally-api-alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }} errors per second"

      - alert: HighResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High response time"
          description: "95th percentile response time is {{ $value }} seconds"

      - alert: DatabaseConnectionPoolExhausted
        expr: pg_stat_activity_count > 80
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Database connection pool nearly exhausted"
          description: "{{ $value }} active connections"

      - alert: RedisMemoryHigh
        expr: redis_memory_used_bytes / redis_memory_max_bytes > 0.9
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Redis memory usage high"
          description: "Redis memory usage is {{ $value | humanizePercentage }}"
```

## 🔄 Backup & Recovery

### Database Backup Strategy

**Automated Daily Backup:**
```bash
#!/bin/bash
# scripts/backup-database.sh

BACKUP_DIR="/backups/tally_integration"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/tally_integration_$DATE.backup"

# Create backup directory
mkdir -p $BACKUP_DIR

# Perform backup
echo "Starting database backup..."
docker-compose exec -T postgres pg_dump -U postgres -Fc tally_integration > $BACKUP_FILE

# Verify backup
if [ $? -eq 0 ]; then
  echo "Backup successful: $BACKUP_FILE"
  
  # Compress backup
  gzip $BACKUP_FILE
  
  # Remove old backups (keep 30 days)
  find $BACKUP_DIR -name "*.backup.gz" -mtime +30 -delete
  
  echo "Backup completed and compressed"
else
  echo "Backup failed!"
  exit 1
fi
```

**Point-in-Time Recovery:**
```bash
#!/bin/bash
# scripts/restore-database.sh

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: $0 <backup_file>"
  exit 1
fi

echo "Restoring database from $BACKUP_FILE..."

# Stop application
docker-compose stop app

# Drop existing database
docker-compose exec -T postgres psql -U postgres -c "DROP DATABASE IF EXISTS tally_integration;"

# Create new database
docker-compose exec -T postgres psql -U postgres -c "CREATE DATABASE tally_integration;"

# Restore backup
if [[ $BACKUP_FILE == *.gz ]]; then
  gunzip -c $BACKUP_FILE | docker-compose exec -T postgres psql -U postgres -d tally_integration
else
  docker-compose exec -T postgres psql -U postgres -d tally_integration < $BACKUP_FILE
fi

# Start application
docker-compose start app

echo "Database restored successfully"
```

### Configuration Backup

```bash
#!/bin/bash
# scripts/backup-config.sh

BACKUP_DIR="/backups/config"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup configuration files
cp .env $BACKUP_DIR/.env.$DATE
cp docker-compose.yml $BACKUP_DIR/docker-compose.yml.$DATE
cp -r config $BACKUP_DIR/config.$DATE

# Backup secrets (if using external secret manager)
# aws secretsmanager get-secret-value --secret-id tally-api/secrets > $BACKUP_DIR/secrets.$DATE.json

echo "Configuration backed up to $BACKUP_DIR"
```

## 🧹 Maintenance Tasks

### Weekly Maintenance

**Database Maintenance:**
```bash
#!/bin/bash
# scripts/weekly-maintenance.sh

echo "=== Weekly Maintenance ==="

# Update table statistics
echo "Updating database statistics..."
docker-compose exec -T postgres psql -U postgres -d tally_integration -c "ANALYZE;"

# Reindex fragmented indexes
echo "Rebuilding indexes..."
docker-compose exec -T postgres psql -U postgres -d tally_integration -c "
REINDEX INDEX CONCURRENTLY idx_ledgers_name;
REINDEX INDEX CONCURRENTLY idx_vouchers_date;
"

# Clean up old data
echo "Cleaning up old data..."
docker-compose exec -T postgres psql -U postgres -d tally_integration -c "
DELETE FROM api_usage WHERE created_at < NOW() - INTERVAL '90 days';
DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '1 year';
"

# Vacuum database
echo "Vacuuming database..."
docker-compose exec -T postgres psql -U postgres -d tally_integration -c "VACUUM ANALYZE;"

# Clean up Redis expired keys
echo "Cleaning up Redis..."
docker-compose exec -T redis redis-cli --scan --pattern "tally:*:*" | xargs docker-compose exec -T redis redis-cli del

echo "Weekly maintenance completed"
```

**Log Rotation:**
```bash
#!/bin/bash
# scripts/rotate-logs.sh

LOG_DIR="/var/log/tally-api"
RETENTION_DAYS=30

# Create log directory if it doesn't exist
mkdir -p $LOG_DIR

# Rotate application logs
docker-compose exec app logrotate /etc/logrotate.d/tally-api

# Rotate nginx logs
if [ -f "/var/log/nginx/access.log" ]; then
  mv /var/log/nginx/access.log /var/log/nginx/access.log.$(date +%Y%m%d)
  docker-compose exec nginx nginx -s reload
fi

# Clean up old logs
find $LOG_DIR -name "*.log.*" -mtime +$RETENTION_DAYS -delete

echo "Log rotation completed"
```

### Monthly Maintenance

**Security Updates:**
```bash
#!/bin/bash
# scripts/monthly-security.sh

echo "=== Monthly Security Maintenance ==="

# Update Docker images
echo "Updating Docker images..."
docker-compose pull

# Restart services with new images
echo "Restarting services..."
docker-compose up -d

# Check for vulnerabilities
echo "Checking for security vulnerabilities..."
npm audit --audit-level high

# Update Node.js dependencies
echo "Updating dependencies..."
npm update

# Restart application
docker-compose restart app

echo "Monthly security maintenance completed"
```

**Performance Tuning:**
```bash
#!/bin/bash
# scripts/performance-tuning.sh

echo "=== Performance Tuning ==="

# Analyze slow queries
echo "Analyzing slow queries..."
docker-compose exec -T postgres psql -U postgres -d tally_integration -c "
SELECT query, mean_time, calls 
FROM pg_stat_statements 
WHERE mean_time > 1000 
ORDER BY mean_time DESC 
LIMIT 10;
"

# Check index usage
echo "Checking index usage..."
docker-compose exec -T postgres psql -U postgres -d tally_integration -c "
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
"

# Optimize Redis memory
echo "Optimizing Redis memory..."
docker-compose exec -T redis redis-cli MEMORY PURGE

echo "Performance tuning completed"
```

## 🚨 Incident Response

### Incident Classification

**Severity Levels:**
- **P1 - Critical**: Service completely down, data loss, security breach
- **P2 - High**: Major functionality impaired, significant performance degradation
- **P3 - Medium**: Partial functionality impaired, minor performance issues
- **P4 - Low**: Cosmetic issues, documentation errors

### Incident Response Procedure

**1. Detection & Assessment:**
```bash
#!/bin/bash
# scripts/incident-detect.sh

SEVERITY=$1
DESCRIPTION=$2

echo "=== Incident Detected ==="
echo "Severity: $SEVERITY"
echo "Description: $DESCRIPTION"
echo "Time: $(date)"

# Create incident log
INCIDENT_LOG="incidents/incident-$(date +%Y%m%d_%H%M%S).log"
mkdir -p incidents

cat > $INCIDENT_LOG << EOF
Incident Report
===============
Severity: $SEVERITY
Description: $DESCRIPTION
Time: $(date)
System Status:
$(docker-compose ps)
Resource Usage:
$(docker stats --no-stream)
Recent Errors:
$(docker-compose logs --tail=50 app | grep ERROR)
EOF

echo "Incident logged: $INCIDENT_LOG"

# Notify team (integrate with your notification system)
# send-alert "$SEVERITY" "$DESCRIPTION"
```

**2. Immediate Response:**
```bash
#!/bin/bash
# scripts/incident-response.sh

INCIDENT_ID=$1

case $SEVERITY in
  "P1")
    echo "Critical incident - immediate action required"
    # Scale down to prevent further damage
    docker-compose scale app=0
    
    # Preserve evidence
    docker-compose logs app > incidents/$INCIDENT_ID-app.log
    docker stats --no-stream > incidents/$INCIDENT_ID-stats.log
    
    # Notify on-call team
    # alert-oncall "Critical incident: $DESCRIPTION"
    ;;
    
  "P2")
    echo "High severity incident - investigate immediately"
    # Increase monitoring frequency
    # enable-detailed-monitoring
    
    # Check system health
    ./scripts/daily-health-check.sh
    ;;
    
  "P3"|"P4")
    echo "Medium/Low severity - add to backlog"
    # Create ticket in tracking system
    # create-ticket "$DESCRIPTION"
    ;;
esac
```

**3. Resolution & Recovery:**
```bash
#!/bin/bash
# scripts/incident-recovery.sh

INCIDENT_ID=$1
RESOLUTION=$2

echo "=== Incident Resolution ==="
echo "Incident ID: $INCIDENT_ID"
echo "Resolution: $RESOLUTION"
echo "Time: $(date)"

# Update incident log
echo "Resolution: $RESOLUTION" >> incidents/$INCIDENT_ID.log
echo "Resolved: $(date)" >> incidents/$INCIDENT_ID.log

# Verify system recovery
./scripts/daily-health-check.sh

# Scale back up if needed
if [ "$SEVERITY" = "P1" ]; then
  echo "Scaling service back up..."
  docker-compose scale app=3
fi

# Post-incident review
echo "=== Post-Incident Review ==="
echo "Root cause analysis required"
echo "Preventive measures needed"
echo "Update runbooks"
```

## 📈 Capacity Planning

### Resource Monitoring

**Current Usage Analysis:**
```bash
#!/bin/bash
# scripts/capacity-analysis.sh

echo "=== Capacity Analysis ==="

# CPU Usage
echo "CPU Usage:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}" | tail -n +2

# Memory Usage
echo -e "\nMemory Usage:"
docker stats --no-stream --format "table {{.Container}}\t{{.MemUsage}}\t{{.MemPerc}}" | tail -n +2

# Disk Usage
echo -e "\nDisk Usage:"
df -h

# Database Size
echo -e "\nDatabase Size:"
docker-compose exec -T postgres psql -U postgres -d tally_integration -c "
SELECT pg_size_pretty(pg_database_size('tally_integration')) as database_size;
"

# Redis Memory
echo -e "\nRedis Memory:"
docker-compose exec -T redis redis-cli INFO memory | grep used_memory_human

# API Usage Trends
echo -e "\nAPI Usage (last 24 hours):"
docker-compose exec -T postgres psql -U postgres -d tally_integration -c "
SELECT 
  DATE_TRUNC('hour', created_at) as hour,
  COUNT(*) as requests
FROM api_usage 
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY hour 
ORDER BY hour DESC;
"
```

### Scaling Recommendations

**Horizontal Scaling:**
```yaml
# docker-compose.scale.yml
services:
  app:
    image: tally-api:latest
    scale: 3  # Adjust based on load
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
```

**Vertical Scaling:**
```yaml
# docker-compose.prod.yml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
        reservations:
          cpus: '1.0'
          memory: 1G
```

### Auto-scaling Setup (Kubernetes)

```yaml
# k8s/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: tally-api-hpa
  namespace: tally-api
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: tally-api
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

## 📋 Maintenance Schedule

### Daily Tasks (Automated)

- [ ] Health checks
- [ ] Log monitoring
- [ ] Performance metrics collection
- [ ] Backup verification
- [ ] Security scan

### Weekly Tasks (Semi-automated)

- [ ] Database maintenance
- [ ] Log rotation
- [ ] Performance analysis
- [ ] Capacity review
- [ ] Security patch review

### Monthly Tasks (Manual)

- [ ] Security updates
- [ ] Dependency updates
- [ ] Performance tuning
- [ ] Backup testing
- [ ] Documentation updates

### Quarterly Tasks (Manual)

- [ ] Disaster recovery testing
- [ ] Capacity planning review
- [ ] Architecture review
- [ ] Security audit
- [ ] Cost optimization

## 📞 Support Procedures

### Escalation Matrix

| Issue Type | Level 1 | Level 2 | Level 3 |
|------------|---------|---------|---------|
| API Issues | DevOps | Development Lead | Architect |
| Database | DevOps | DBA | Database Team |
| Infrastructure | DevOps | SysAdmin | Infrastructure Lead |
| Security | Security Team | CISO | CTO |

### Contact Information

```bash
# scripts/escalation.sh
#!/bin/bash

SEVERITY=$1
COMPONENT=$2

case $COMPONENT in
  "api")
    case $SEVERITY in
      "P1") echo "Escalate to Development Lead: dev-lead@company.com" ;;
      "P2") echo "Escalate to DevOps: devops@company.com" ;;
      *) echo "Handle with Level 1 support" ;;
    esac
    ;;
    
  "database")
    case $SEVERITY in
      "P1"|"P2") echo "Escalate to DBA: dba@company.com" ;;
      *) echo "Handle with Level 1 support" ;;
    esac
    ;;
    
  "infrastructure")
    case $SEVERITY in
      "P1"|"P2") echo "Escalate to SysAdmin: sysadmin@company.com" ;;
      *) echo "Handle with Level 1 support" ;;
    esac
    ;;
esac
```

---

**🔧 This maintenance guide ensures reliable operation, quick incident response, and proactive system management for the Tally Integration API.**
