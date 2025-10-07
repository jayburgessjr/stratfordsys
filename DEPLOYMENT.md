# 🚀 Stratford AI - Production Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying the Stratford AI deterministic wealth engine to production environments using modern DevOps practices.

## 🏗️ Architecture

- **Frontend**: Next.js 14 with React 18
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL (future) / File-based (current)
- **Cache**: Redis (optional)
- **Deployment**: Vercel, Docker, or traditional hosting
- **CI/CD**: GitHub Actions
- **Monitoring**: Built-in health checks + external APM

## 🔧 Prerequisites

- Node.js 20+
- pnpm 8+
- Git
- Docker (for containerized deployment)
- Vercel account (for Vercel deployment)

## 🌐 Deployment Options

### Option 1: Vercel (Recommended)

#### Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyour-username%2Fstratford-ai)

#### Manual Deployment

1. **Fork/Clone Repository**
   ```bash
   git clone https://github.com/your-username/stratford-ai.git
   cd stratford-ai
   ```

2. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

3. **Login to Vercel**
   ```bash
   vercel login
   ```

4. **Deploy**
   ```bash
   vercel
   ```

5. **Set Environment Variables**
   ```bash
   vercel env add NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY
   vercel env add STRATFORD_RANDOM_SEED
   vercel env add LOG_LEVEL
   ```

6. **Deploy to Production**
   ```bash
   vercel --prod
   ```

### Option 2: Docker Deployment

#### Single Container

```bash
# Build image
docker build -t stratford-ai:latest .

# Run container
docker run -d \
  --name stratford-ai \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e STRATFORD_RANDOM_SEED=42 \
  -e LOG_LEVEL=warn \
  stratford-ai:latest
```

#### Docker Compose

```bash
# Start all services
docker-compose up -d

# With production profile
docker-compose --profile production up -d

# With database profile
docker-compose --profile database up -d
```

### Option 3: Traditional Server Deployment

```bash
# Install dependencies
pnpm install --frozen-lockfile

# Build application
pnpm build

# Start production server
pnpm start:prod
```

## 🔐 Environment Configuration

### Required Environment Variables

```bash
# Application
NODE_ENV=production
STRATFORD_VERSION=1.0.0
STRATFORD_RANDOM_SEED=42

# API Keys
NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY=your_api_key

# Logging
LOG_LEVEL=warn
ENABLE_CONSOLE_LOGS=false

# Performance
CACHE_DURATION_MINUTES=1440
ENABLE_REDIS_CACHE=false
```

### Optional Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/db

# Cache
REDIS_URL=redis://localhost:6379

# Monitoring
SENTRY_DSN=https://...
VERCEL_ANALYTICS_ID=...

# Security
ENABLE_RATE_LIMITING=true
MAX_REQUESTS_PER_MINUTE=50
```

## 🔄 CI/CD Pipeline

The project includes a comprehensive GitHub Actions workflow:

### Workflow Stages

1. **Quality Checks**
   - ESLint
   - TypeScript type checking
   - Prettier formatting

2. **Unit Tests**
   - Vitest test runner
   - 195+ test cases
   - Coverage reporting

3. **Build**
   - Production build
   - Asset optimization
   - Build artifact upload

4. **E2E Tests**
   - Playwright browser tests
   - Visual regression testing

5. **Security Scan**
   - Dependency audit
   - Security vulnerability check

6. **Deployment**
   - Staging (develop branch)
   - Production (main branch)

### Required GitHub Secrets

```bash
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_org_id
VERCEL_PROJECT_ID=your_project_id
```

## 📊 Monitoring & Health Checks

### Health Check Endpoint

```bash
GET /api/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0",
  "environment": "production",
  "uptime": 3600,
  "build": {
    "time": "2024-01-01T00:00:00.000Z",
    "id": "abc1234"
  },
  "services": {
    "database": "connected",
    "cache": "connected",
    "external_apis": "operational"
  },
  "metrics": {
    "memory_usage": 128
  }
}
```

### Monitoring Setup

1. **Uptime Monitoring**
   - Monitor `/api/health` endpoint
   - Alert on 5xx responses
   - Check every 30 seconds

2. **Performance Monitoring**
   - Core Web Vitals tracking
   - API response times
   - Memory usage alerts

3. **Error Tracking**
   - Sentry integration (optional)
   - Console error aggregation
   - User session replay

## 🔒 Security Configuration

### Headers Applied

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: origin-when-cross-origin`
- `Strict-Transport-Security: max-age=31536000`

### Rate Limiting

- 50 requests per minute (production)
- IP-based throttling
- Graceful degradation

### HTTPS

- Automatic HTTPS (Vercel)
- HTTP to HTTPS redirect
- HSTS headers

## 🚀 Performance Optimization

### Build Optimizations

- SWC minification
- Image optimization (WebP/AVIF)
- Bundle splitting
- Tree shaking

### Runtime Optimizations

- Edge caching (CDN)
- Static asset caching (1 year)
- API response caching (1 hour)
- Redis caching (optional)

### Performance Budget

- First Contentful Paint: < 1.5s
- Largest Contentful Paint: < 2.5s
- Cumulative Layout Shift: < 0.1
- First Input Delay: < 100ms

## 🔧 Troubleshooting

### Common Issues

1. **Build Failures**
   ```bash
   # Clear cache and rebuild
   pnpm clean
   pnpm install --frozen-lockfile
   pnpm build
   ```

2. **Memory Issues**
   ```bash
   # Check memory usage
   curl https://your-domain.com/api/health

   # Increase Node.js memory limit
   export NODE_OPTIONS="--max-old-space-size=2048"
   ```

3. **Port Conflicts**
   ```bash
   # Check port usage
   lsof -i :3000

   # Use different port
   export PORT=3001
   ```

### Debug Mode

```bash
# Enable debug logging
export LOG_LEVEL=debug
export ENABLE_CONSOLE_LOGS=true

# Start with debug flags
node --inspect=0.0.0.0:9229 server.js
```

## 📱 Scaling Considerations

### Horizontal Scaling

- Multiple container instances
- Load balancer configuration
- Session affinity (if needed)

### Vertical Scaling

- Memory: 512MB minimum, 2GB recommended
- CPU: 1 vCore minimum, 2 vCore recommended
- Storage: 1GB minimum for logs/cache

### Database Scaling

- Connection pooling
- Read replicas
- Query optimization
- Caching layer

## 🆘 Support & Maintenance

### Log Analysis

```bash
# View application logs
docker logs stratford-ai

# Filter error logs
docker logs stratford-ai 2>&1 | grep ERROR

# Follow logs in real-time
docker logs -f stratford-ai
```

### Database Maintenance

```bash
# Backup (when DB is implemented)
pg_dump stratford_ai > backup.sql

# Restore
psql stratford_ai < backup.sql

# Health check
psql -c "SELECT 1" stratford_ai
```

### Cache Management

```bash
# Redis health check
redis-cli ping

# Clear cache
redis-cli FLUSHALL

# Monitor cache usage
redis-cli INFO memory
```

---

## 🎯 Production Checklist

- [ ] Environment variables configured
- [ ] SSL certificates installed
- [ ] Database migrations run
- [ ] Health checks passing
- [ ] Monitoring alerts configured
- [ ] Backup strategy implemented
- [ ] Security headers verified
- [ ] Performance metrics baseline established
- [ ] Error tracking configured
- [ ] Documentation updated

---

For additional support, please refer to the main README.md or create an issue in the repository.
