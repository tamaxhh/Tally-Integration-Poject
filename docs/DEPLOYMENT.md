# 🚀 Deployment Guide

Complete guide for deploying the Tally Integration API in various environments.

## 📋 Deployment Options

1. **Local Development** - For development and testing
2. **Standalone Executable** - For easy distribution
3. **Docker Container** - For production deployment
4. **Cloud Deployment** - For scalable infrastructure

## 🖥️ Local Development

### Prerequisites
- Node.js v20+
- Tally Prime installed
- Redis (optional, for caching)

### Setup Steps

1. **Clone and Install**
```bash
cd c:\Users\tamash62\Downloads\Tally
npm install
```

2. **Configure Environment**
```bash
copy .env.example .env
```

Edit `.env`:
```env
NODE_ENV=development
PORT=3000
HOST=0.0.0.0
TALLY_HOST=localhost
TALLY_PORT=9000
API_KEYS=dev-key-local-only,admin-key-1234
LOG_LEVEL=info
```

3. **Start Development Server**
```bash
npm run dev
```

4. **Verify Deployment**
```bash
# Health check
curl http://localhost:3000/health

# API test
curl "http://localhost:3000/api/v1/ledgers?apiKey=dev-key-local-only"

# Frontend access
# Open: http://localhost:3000
```

## 📦 Standalone Executable

### Build Executable
```bash
npm run build:exe
```

This creates:
- `dist/tally-remote-fetcher.exe` (~39MB)
- Self-contained with all dependencies
- No Node.js installation required

### Distribution Package
Create a user-ready package:
```
Tally-Integration-Package/
├── tally-remote-fetcher.exe
├── README-USER-INSTRUCTIONS.txt
├── CONFIG-SETTINGS.txt
└── SUPPORT-CONTACT.txt
```

### User Instructions
1. **Extract the package**
2. **Run `tally-remote-fetcher.exe`**
3. **Open browser**: http://localhost:3000
4. **Configure Tally connection** in the UI

### Configuration File
Users can create `config.json`:
```json
{
  "tallyUrl": "localhost:9000",
  "apiKey": "user-provided-key",
  "port": 3000
}
```

## 🐳 Docker Deployment

### Development Docker
```bash
# Build and run
docker-compose -f docker/docker-compose.yml up -d

# View logs
docker-compose -f docker/docker-compose.yml logs -f app

# Stop
docker-compose -f docker/docker-compose.yml down
```

### Production Docker

#### 1. Production Environment
Create `.env.production`:
```env
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
TALLY_HOST=tally-server.company.com
TALLY_PORT=9000
TALLY_TIMEOUT_MS=10000
API_KEYS=prod-key-1,prod-key-2,admin-prod-key
LOG_LEVEL=warn
REDIS_URL=redis://cache-server:6379
```

#### 2. Production Docker Compose
```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: docker/Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - .env.production
    depends_on:
      - redis
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    restart: unless-stopped
    volumes:
      - redis_data:/data

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  redis_data:
```

#### 3. SSL/TLS Configuration
Create `nginx.conf`:
```nginx
events {
    worker_connections 1024;
}

http {
    upstream app {
        server app:3000;
    }

    server {
        listen 80;
        server_name your-domain.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name your-domain.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        location / {
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

#### 4. Deploy Production Stack
```bash
# Deploy production
docker-compose -f docker-compose.prod.yml up -d

# Scale if needed
docker-compose -f docker-compose.prod.yml up -d --scale app=3

# Monitor
docker-compose -f docker-compose.prod.yml logs -f
```

## ☁️ Cloud Deployment

### AWS Deployment

#### EC2 Instance
1. **Launch EC2 Instance**
   - Amazon Linux 2 or Ubuntu
   - t3.medium or larger
   - Security Group: Open ports 80, 443, 3000

2. **Install Dependencies**
```bash
# Update system
sudo yum update -y

# Install Docker
sudo yum install -y docker
sudo systemctl start docker
sudo systemctl enable docker

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

3. **Deploy Application**
```bash
# Clone repository
git clone <your-repo>
cd tally-integration

# Configure production
cp .env.example .env
# Edit .env with production values

# Deploy
docker-compose -f docker/docker-compose.yml up -d
```

#### ECS/Fargate Deployment
1. **Create ECR Repository**
```bash
aws ecr create-repository --repository-name tally-integration
```

2. **Build and Push Image**
```bash
# Build
docker build -t tally-integration .

# Tag
aws ecr get-login-password --region us-west-2 | docker login --username AWS --password-stdin <account>.dkr.ecr.us-west-2.amazonaws.com
docker tag tally-integration:latest <account>.dkr.ecr.us-west-2.amazonaws.com/tally-integration:latest

# Push
docker push <account>.dkr.ecr.us-west-2.amazonaws.com/tally-integration:latest
```

3. **Create ECS Task Definition**
```json
{
  "family": "tally-integration",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::<account>:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "tally-integration",
      "image": "<account>.dkr.ecr.us-west-2.amazonaws.com/tally-integration:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/tally-integration",
          "awslogs-region": "us-west-2",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

### Azure Deployment

#### Azure Container Instances
```bash
# Create resource group
az group create --name tally-integration --location eastus

# Deploy container
az container create \
  --resource-group tally-integration \
  --name tally-api \
  --image your-registry/tally-integration:latest \
  --cpu 1 \
  --memory 2 \
  --ports 3000 \
  --environment-variables \
    NODE_ENV=production \
    TALLY_HOST=tally.company.com \
    API_KEYS=prod-key-1
```

### Google Cloud Platform

#### Cloud Run
```bash
# Build and push
gcloud builds submit --tag gcr.io/PROJECT-ID/tally-integration

# Deploy
gcloud run deploy tally-integration \
  --image gcr.io/PROJECT-ID/tally-integration \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production,TALLY_HOST=tally.company.com
```

## 🔧 Configuration Management

### Environment Variables by Environment

#### Development
```env
NODE_ENV=development
PORT=3000
HOST=0.0.0.0
TALLY_HOST=localhost
TALLY_PORT=9000
API_KEYS=dev-key-local-only
LOG_LEVEL=debug
REDIS_URL=redis://localhost:6379
```

#### Staging
```env
NODE_ENV=staging
PORT=3000
HOST=0.0.0.0
TALLY_HOST=staging-tally.company.com
TALLY_PORT=9000
API_KEYS=staging-key-1,staging-key-2
LOG_LEVEL=info
REDIS_URL=redis://staging-redis:6379
```

#### Production
```env
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
TALLY_HOST=prod-tally.company.com
TALLY_PORT=9000
TALLY_TIMEOUT_MS=10000
API_KEYS=prod-key-1,prod-key-2,admin-prod-key
LOG_LEVEL=warn
REDIS_URL=redis://prod-redis-cluster:6379
```

### Configuration Files

#### Docker Compose Override
```yaml
# docker-compose.override.yml
version: '3.8'

services:
  app:
    environment:
      - NODE_ENV=development
    volumes:
      - ./src:/app/src
      - ./frontend:/app/frontend
    command: npm run dev
```

#### Kubernetes ConfigMap
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: tally-integration-config
data:
  NODE_ENV: "production"
  PORT: "3000"
  TALLY_HOST: "tally.company.com"
  TALLY_PORT: "9000"
  LOG_LEVEL: "warn"
```

## 🔒 Security Hardening

### Network Security
1. **Firewall Rules**
   - Only open necessary ports (80, 443, 3000)
   - Restrict access to Tally port (9000)
   - Use VPN for internal access

2. **SSL/TLS**
   - Always use HTTPS in production
   - Use valid SSL certificates
   - Implement HSTS headers

3. **API Security**
   - Use strong API keys
   - Implement rate limiting
   - Enable CORS restrictions
   - Monitor API usage

### Application Security
1. **Environment Variables**
   - Never commit `.env` files
   - Use secret management in production
   - Rotate API keys regularly

2. **Container Security**
   - Use non-root users
   - Minimal base images
   - Regular security updates
   - Image scanning

3. **Monitoring**
   - Enable security logging
   - Set up alerting
   - Monitor access patterns
   - Regular security audits

## 📊 Monitoring and Logging

### Health Checks
```bash
# Application health
curl https://your-domain.com/health

# Detailed health
curl https://your-domain.com/health/detailed
```

### Logging Configuration
```javascript
// Production logging
const logger = require('pino')({
  level: 'warn',
  transport: {
    target: 'pino/file',
    options: {
      destination: '/var/log/tally-integration.log'
    }
  }
});
```

### Monitoring Setup
1. **Application Metrics**
   - Response times
   - Error rates
   - Request counts
   - Tally connectivity

2. **Infrastructure Metrics**
   - CPU usage
   - Memory usage
   - Disk space
   - Network I/O

3. **Alerting**
   - High error rates
   - Tally disconnection
   - High response times
   - Resource exhaustion

## 🔄 CI/CD Pipeline

### GitHub Actions
```yaml
name: Deploy Tally Integration

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm test

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build Docker image
        run: docker build -t tally-integration .
      - name: Push to registry
        run: |
          echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
          docker push tally-integration

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to production
        run: |
          # Deploy commands
          ssh user@server 'docker-compose pull && docker-compose up -d'
```

## 🚨 Troubleshooting Deployment

### Common Issues

#### Container Won't Start
```bash
# Check logs
docker logs container-name

# Check configuration
docker exec -it container-name env

# Debug mode
docker run -it --entrypoint sh tally-integration
```

#### Tally Connection Issues
1. **Network Connectivity**
   ```bash
   # Test from container
   docker exec -it container-name curl http://tally-host:9000
   ```

2. **Firewall Issues**
   ```bash
   # Check firewall rules
   sudo ufw status
   sudo iptables -L
   ```

3. **DNS Resolution**
   ```bash
   # Test DNS
   nslookup tally-host
   dig tally-host
   ```

#### Performance Issues
1. **Resource Limits**
   ```bash
   # Check resource usage
   docker stats
   
   # Monitor system
   top
   htop
   ```

2. **Database Performance**
   ```bash
   # Check Redis
   redis-cli info stats
   
   # Monitor connections
   redis-cli info clients
   ```

### Debug Commands
```bash
# System health
systemctl status docker
docker version
docker-compose version

# Network debugging
docker network ls
docker network inspect network-name

# Application debugging
curl -v http://localhost:3000/health
curl -I http://localhost:3000/api/v1/ledgers
```

## 📋 Deployment Checklist

### Pre-Deployment
- [ ] Environment variables configured
- [ ] SSL certificates obtained
- [ ] Database backups created
- [ ] Security review completed
- [ ] Performance testing done

### Post-Deployment
- [ ] Health checks passing
- [ ] Monitoring configured
- [ ] Alerts set up
- [ ] Documentation updated
- [ ] Team trained

### Ongoing Maintenance
- [ ] Regular security updates
- [ ] Log rotation configured
- [ ] Backup procedures tested
- [ ] Performance monitoring
- [ ] Capacity planning

## 📞 Support

For deployment issues:
1. Check this documentation first
2. Review application logs
3. Test with health endpoints
4. Contact support with detailed information
