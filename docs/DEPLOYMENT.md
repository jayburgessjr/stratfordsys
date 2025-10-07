# 🚀 Deployment Guide

## Production Deployment Checklist

### Prerequisites

#### 1. **Infrastructure Requirements**
- **Server**: Minimum 4 CPU cores, 8GB RAM, 100GB SSD
- **Database**: PostgreSQL 15+ with TimescaleDB extension
- **Cache**: Redis 7+ cluster
- **Load Balancer**: Nginx or AWS ALB
- **CDN**: CloudFlare or AWS CloudFront
- **SSL Certificate**: Let's Encrypt or commercial certificate

#### 2. **External Services**
- **Authentication**: OAuth providers (Google, GitHub)
- **Market Data**: Alpha Vantage, Polygon.io, IEX Cloud API keys
- **Email**: SendGrid or SMTP server
- **SMS**: Twilio account
- **Monitoring**: DataDog, Sentry, New Relic accounts
- **Storage**: AWS S3 bucket for documents
- **Compliance**: Jumio, Onfido KYC/AML services

### Environment Setup

#### 1. **Clone and Install Dependencies**
```bash
git clone <your-repo-url>
cd stratford_ai
pnpm install
```

#### 2. **Environment Configuration**
```bash
# Copy environment template
cp .env.example .env

# Generate secure secrets
openssl rand -hex 32  # For NEXTAUTH_SECRET
openssl rand -hex 32  # For JWT_SECRET
openssl rand -hex 32  # For ENCRYPTION_MASTER_KEY
openssl rand -hex 32  # For SESSION_SECRET
```

#### 3. **Required Environment Variables**
```bash
# Production Configuration
NODE_ENV=production
APP_URL=https://yourdomain.com
NEXTAUTH_URL=https://yourdomain.com

# Database (Required)
DATABASE_URL="postgresql://user:pass@host:5432/stratford_prod"
REDIS_URL="redis://host:6379"

# Security (Required)
NEXTAUTH_SECRET="your-32-character-secret"
JWT_SECRET="your-32-character-secret"
ENCRYPTION_MASTER_KEY="your-32-character-secret"

# Market Data (At least one required)
NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY="your-api-key"
POLYGON_API_KEY="your-api-key"
IEX_CLOUD_API_KEY="your-api-key"

# Email (Required for notifications)
SENDGRID_API_KEY="your-sendgrid-key"
# OR
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email"
SMTP_PASS="your-password"
```

### Database Setup

#### 1. **PostgreSQL with TimescaleDB**
```sql
-- Create database and user
CREATE DATABASE stratford_prod;
CREATE USER stratford_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE stratford_prod TO stratford_user;

-- Connect to database and enable TimescaleDB
\c stratford_prod
CREATE EXTENSION IF NOT EXISTS timescaledb;
```

#### 2. **Run Database Migrations**
```bash
# Generate Prisma client
pnpm prisma generate

# Run migrations
pnpm prisma migrate deploy

# Seed initial data (optional)
pnpm prisma db seed
```

### Production Build

#### 1. **Build Application**
```bash
# Install production dependencies only
pnpm install --production

# Build Next.js application
pnpm build

# Start production server
pnpm start
```

#### 2. **Docker Deployment**
```dockerfile
# Dockerfile
FROM node:18-alpine AS base
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm

FROM base AS dependencies
RUN pnpm install --frozen-lockfile

FROM base AS build
COPY . .
COPY --from=dependencies /app/node_modules ./node_modules
RUN pnpm build

FROM base AS runtime
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=dependencies /app/node_modules ./node_modules
COPY package.json ./

EXPOSE 3000
CMD ["pnpm", "start"]
```

```bash
# Build and run with Docker
docker build -t stratford-ai .
docker run -p 3000:3000 --env-file .env stratford-ai
```

### Infrastructure Setup

#### 1. **Nginx Load Balancer**
```nginx
# /etc/nginx/sites-available/stratford-ai
upstream stratford_app {
    least_conn;
    server 127.0.0.1:3000;
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/key.pem;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";

    location / {
        proxy_pass http://stratford_app;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket support for real-time features
    location /api/ws {
        proxy_pass http://stratford_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

#### 2. **SSL Certificate with Let's Encrypt**
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Process Management

#### 1. **PM2 (Production Process Manager)**
```bash
# Install PM2
npm install -g pm2

# Create ecosystem file
```

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'stratford-ai',
    script: 'npm',
    args: 'start',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
```

```bash
# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup startup script
pm2 startup
```

#### 2. **Systemd Service (Alternative)**
```ini
# /etc/systemd/system/stratford-ai.service
[Unit]
Description=Stratford AI Wealth Engine
After=network.target

[Service]
Type=simple
User=stratford
WorkingDirectory=/opt/stratford-ai
Environment=NODE_ENV=production
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start service
sudo systemctl enable stratford-ai
sudo systemctl start stratford-ai
```

### Security Hardening

#### 1. **Firewall Configuration**
```bash
# UFW (Ubuntu)
sudo ufw enable
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw deny 3000   # Block direct app access
```

#### 2. **Database Security**
```bash
# PostgreSQL security
sudo -u postgres psql
ALTER USER postgres PASSWORD 'strong_password';

# Edit pg_hba.conf for secure access
sudo nano /etc/postgresql/15/main/pg_hba.conf
# Change: local all postgres peer
# To:     local all postgres md5
```

#### 3. **Regular Security Updates**
```bash
# Setup automatic security updates
sudo apt install unattended-upgrades
sudo dpkg-reconfigure unattended-upgrades
```

### Monitoring Setup

#### 1. **Health Check Endpoint**
The application includes `/api/health` endpoint for monitoring:
```bash
# Test health check
curl https://yourdomain.com/api/health
```

#### 2. **Log Management**
```bash
# Setup log rotation
sudo nano /etc/logrotate.d/stratford-ai
```

```
/opt/stratford-ai/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    notifempty
    create 0644 stratford stratford
    postrotate
        pm2 reloadLogs
    endscript
}
```

### Backup Strategy

#### 1. **Database Backups**
```bash
# Create backup script
#!/bin/bash
# /opt/scripts/backup-db.sh
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/backups"
DB_NAME="stratford_prod"

pg_dump $DB_NAME | gzip > $BACKUP_DIR/stratford_$DATE.sql.gz

# Keep only last 30 days
find $BACKUP_DIR -name "stratford_*.sql.gz" -mtime +30 -delete
```

```bash
# Setup cron job
crontab -e
# Add: 0 2 * * * /opt/scripts/backup-db.sh
```

#### 2. **File System Backups**
```bash
# Backup application files and logs
rsync -av /opt/stratford-ai/ user@backup-server:/backups/stratford-ai/
```

### Performance Optimization

#### 1. **Redis Configuration**
```bash
# /etc/redis/redis.conf
maxmemory 2gb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
```

#### 2. **PostgreSQL Tuning**
```bash
# /etc/postgresql/15/main/postgresql.conf
shared_buffers = 2GB
effective_cache_size = 6GB
maintenance_work_mem = 512MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
```

### Compliance & Regulatory

#### 1. **Data Retention Setup**
Ensure the automated data retention service is running:
```bash
# Check if cron job is active
pm2 logs stratford-ai | grep "Data retention"
```

#### 2. **Audit Logging**
All compliance-related activities are automatically logged. Ensure log retention:
```bash
# Compliance logs are stored in database and files
# Set appropriate retention in environment:
# LOG_RETENTION_DAYS=2555  # 7 years for financial records
```

### Go-Live Checklist

#### Pre-Launch (1-2 weeks before)
- [ ] Infrastructure provisioned and tested
- [ ] SSL certificates installed and validated
- [ ] All environment variables configured
- [ ] Database migrations completed
- [ ] Backup systems tested and verified
- [ ] Monitoring and alerting configured
- [ ] Security scanning completed (no critical vulnerabilities)
- [ ] Performance testing completed
- [ ] Compliance documentation reviewed

#### Launch Day
- [ ] Final security review
- [ ] Database backup created
- [ ] DNS records updated
- [ ] Application deployed to production
- [ ] Health checks passing
- [ ] SSL/TLS verification complete
- [ ] User acceptance testing
- [ ] Compliance team sign-off
- [ ] Support team notified

#### Post-Launch (First 48 hours)
- [ ] Monitor application performance
- [ ] Check error rates and logs
- [ ] Verify backup systems
- [ ] Confirm monitoring alerts
- [ ] Review compliance logs
- [ ] User feedback collection
- [ ] Performance metrics review

### Troubleshooting

#### Common Issues and Solutions

**1. Application Won't Start**
```bash
# Check logs
pm2 logs stratford-ai
# or
journalctl -u stratford-ai -f

# Common causes:
# - Missing environment variables
# - Database connection issues
# - Port conflicts
```

**2. Database Connection Errors**
```bash
# Test database connection
psql $DATABASE_URL

# Check PostgreSQL status
sudo systemctl status postgresql
```

**3. SSL Certificate Issues**
```bash
# Test SSL configuration
openssl s_client -connect yourdomain.com:443

# Renew Let's Encrypt certificate
sudo certbot renew
```

**4. Performance Issues**
```bash
# Check system resources
htop
iostat -x 1

# Check database performance
SELECT * FROM pg_stat_activity;
```

### Support Contacts

- **Technical Issues**: Contact your DevOps team
- **Compliance Questions**: Contact your compliance officer
- **Security Incidents**: Follow incident response plan
- **Performance Issues**: Check monitoring dashboards first

This deployment guide provides a comprehensive path to production. Follow each step carefully and test thoroughly in a staging environment before going live.
