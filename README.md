# 🏦 Stratford AI Wealth Engine

[![CI/CD Pipeline](https://github.com/stratford-ai/wealth-engine/actions/workflows/ci.yml/badge.svg)](https://github.com/stratford-ai/wealth-engine/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2.2-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14.0.4-black.svg)](https://nextjs.org/)
[![Security](https://img.shields.io/badge/Security-Enterprise-green.svg)](#security)
[![Compliance](https://img.shields.io/badge/Compliance-SEC%2FFINRA%2FGDPR-blue.svg)](#compliance)

**Enterprise-Grade Financial Trading Platform** with comprehensive security, compliance, and AI-powered trading capabilities. Built for institutional clients with regulatory requirements and enterprise security standards.

## 🏗️ Architecture Overview

```mermaid
graph TB
    subgraph "Frontend Layer"
        UI[Next.js UI]
        AUTH[NextAuth.js]
        DOCS[API Documentation]
    end

    subgraph "API Layer"
        API[Next.js API Routes]
        MW[Security Middleware]
        RL[Rate Limiting]
        CSRF[CSRF Protection]
    end

    subgraph "Business Logic"
        KYC[KYC/AML Service]
        TRADE[Trading Engine]
        STRAT[Strategy Engine]
        ML[AI/ML Models]
        ENCRYPT[Encryption Service]
    end

    subgraph "Data Layer"
        PG[PostgreSQL]
        TS[TimescaleDB]
        REDIS[Redis Cache]
        MONGO[MongoDB]
    end

    subgraph "Compliance"
        AUDIT[Audit Trail]
        RETENTION[Data Retention]
        REPORT[Regulatory Reporting]
    end

    UI --> AUTH
    UI --> API
    API --> MW
    MW --> RL
    MW --> CSRF
    API --> KYC
    API --> TRADE
    API --> STRAT
    API --> ML
    TRADE --> ENCRYPT
    KYC --> ENCRYPT
    API --> PG
    API --> TS
    API --> REDIS
    API --> MONGO
    API --> AUDIT
    AUDIT --> RETENTION
    RETENTION --> REPORT
```

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 15+
- Redis 7+
- MongoDB 6+
- pnpm 8+

### Installation

```bash
# Clone the repository
git clone https://github.com/stratford-ai/wealth-engine.git
cd stratford_ai

# Install dependencies
pnpm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Initialize database
pnpm prisma migrate deploy
pnpm prisma db seed

# Start development server
pnpm dev
```

### Production Deployment

```bash
# Build for production
pnpm build

# Start production server
pnpm start

# Or using Docker
docker build -t stratford-ai .
docker run -p 3000:3000 stratford-ai
```

## 📁 Project Structure

```
stratford_ai/
├── 🔧 Configuration
│   ├── .github/workflows/          # CI/CD pipeline
│   ├── prisma/                     # Database schema & migrations
│   ├── docker-compose.yml          # Development environment
│   └── Dockerfile                  # Production container
│
├── 📦 Source Code
│   ├── src/
│   │   ├── 🎨 Frontend
│   │   │   ├── pages/              # Next.js pages
│   │   │   ├── components/         # React components
│   │   │   └── hooks/              # Custom React hooks
│   │   │
│   │   ├── 🔌 API Layer
│   │   │   ├── pages/api/          # API endpoints
│   │   │   ├── lib/auth/           # Authentication
│   │   │   └── lib/security/       # Security middleware
│   │   │
│   │   ├── 💼 Business Logic
│   │   │   ├── domain/             # Domain-driven design
│   │   │   ├── lib/trading/        # Trading engine
│   │   │   ├── lib/ml/             # AI/ML integration
│   │   │   └── lib/compliance/     # KYC/AML/compliance
│   │   │
│   │   ├── 🗄️ Data Layer
│   │   │   ├── lib/database/       # Database services
│   │   │   ├── generated/          # Prisma client
│   │   │   └── types/              # TypeScript definitions
│   │   │
│   │   └── 📋 Compliance & Docs
│   │       ├── lib/docs/           # API documentation
│   │       └── lib/monitoring/     # APM & observability
│   │
└── 📚 Documentation
    ├── docs/                       # Technical documentation
    ├── ARCHITECTURE.md             # System architecture
    ├── SECURITY.md                 # Security documentation
    └── COMPLIANCE.md               # Regulatory compliance
```

## ✨ Core Features

### 🔐 Enterprise Security
- **Authentication**: NextAuth.js with JWT, OAuth, and 2FA support
- **Authorization**: Role-based access control (USER, TRADER, ADMIN, COMPLIANCE)
- **Encryption**: AES-256-GCM field-level encryption for sensitive data
- **Rate Limiting**: Configurable rate limits with Redis sliding window
- **CSRF Protection**: Token-based CSRF protection for all state-changing operations
- **Security Headers**: Comprehensive security headers (HSTS, CSP, etc.)

### 📊 Trading & Analytics
- **Real-time Trading**: High-frequency trading engine with microsecond precision
- **Strategy Engine**: Pluggable trading strategies with backtesting framework
- **AI/ML Integration**: Machine learning models for price prediction and sentiment analysis
- **Portfolio Management**: Multi-asset portfolio tracking with risk management
- **Performance Analytics**: Comprehensive performance metrics and attribution analysis

### 🏛️ Regulatory Compliance
- **KYC/AML**: Automated Know Your Customer and Anti-Money Laundering workflows
- **Audit Trails**: Complete audit logging for all user actions and system events
- **Data Retention**: Automated data retention policies (SEC: 7 years, FINRA: 3-5 years)
- **Regulatory Reporting**: Automated SAR filing and regulatory report generation
- **GDPR Compliance**: Data portability, right to erasure, and privacy by design

### 🗄️ Multi-Database Architecture
- **PostgreSQL**: Transactional data (users, portfolios, trades)
- **TimescaleDB**: Time-series market data with automatic compression
- **Redis**: Caching, sessions, and real-time pub/sub
- **MongoDB**: Unstructured data (news, sentiment, documents)

## 🔒 Security

### Authentication & Authorization
```typescript
// Role-based access control example
import { withAuth } from '@/lib/auth/middleware'
import { requireRole } from '@/lib/auth/permissions'

export default withAuth(
  requireRole(['TRADER', 'ADMIN'])(async (req, res) => {
    // Only traders and admins can access this endpoint
  })
)
```

### Data Encryption
```typescript
// Field-level encryption for sensitive data
import { fieldEncryption } from '@/lib/security/encryption'

// Encrypt SSN before storage
const encryptedSSN = fieldEncryption.encryptSSN(ssn, userId)

// Decrypt when retrieving
const decryptedSSN = fieldEncryption.decryptSSN(encryptedSSN, userId)
```

### Rate Limiting
```typescript
// Configurable rate limiting
import { withRateLimit } from '@/lib/security/rate-limiter'

export default withRateLimit({
  maxRequests: 10,
  windowMs: 60000 // 10 requests per minute
})(handler)
```

## 🏛️ Compliance

### KYC/AML Workflow
```typescript
// Automated KYC verification
import { kycAMLService } from '@/lib/compliance/kyc-aml'

const kycRecord = await kycAMLService.submitKYC(userId, {
  fullName: 'John Doe',
  dateOfBirth: new Date('1990-01-01'),
  // ... other required fields
})

// Automatic AML screening
const amlAssessment = await kycAMLService.performAMLScreening(userId, kycData)
```

### Data Retention
```typescript
// Automated data retention policies
import { dataRetentionService } from '@/lib/compliance/data-retention'

// Initialize retention policies
await dataRetentionService.initializeRetentionPolicies()

// Start automated monitoring
dataRetentionService.startRetentionMonitoring()
```

## 🧪 Testing

### Running Tests
```bash
# Unit tests
pnpm test

# Integration tests
pnpm test:integration

# End-to-end tests
pnpm test:e2e

# Test coverage
pnpm test:coverage

# All tests
pnpm test:all
```

### Test Structure
```typescript
// Example test with proper setup
import { testDb } from '@/lib/testing/database'
import { createTestUser } from '@/lib/testing/factories'

describe('Trading Engine', () => {
  beforeEach(async () => {
    await testDb.reset()
  })

  it('should execute trade with proper validation', async () => {
    const user = await createTestUser()
    // Test implementation
  })
})
```

## 🚀 Deployment

### Environment Variables & API Keys

#### ✅ **Works Out of the Box (No API Keys Required)**

The application runs perfectly without any API keys using:
- **Deterministic mock data** with seeded randomness
- **Simulated trading** with realistic market behavior
- **All features functional** (trading, crypto, lottery, gambling, analytics)

Simply run `pnpm dev` and start using the app immediately!

#### 🔑 **Optional API Keys (For Live Market Data)**

Only needed if you want **real market data** instead of simulated data:

**1. Alpha Vantage API** (Recommended - Free tier available)
```bash
# Get free API key from: https://www.alphavantage.co/support/#api-key
ALPHA_VANTAGE_API_KEY="your-api-key-here"
```
- **Used for**: Real-time stock prices, crypto data, forex rates
- **Free tier**: 5 API calls/minute, 500 calls/day
- **Cost**: Free tier sufficient for development

**2. Polygon.io API** (Optional alternative)
```bash
# Get from: https://polygon.io
POLYGON_API_KEY="your-polygon-api-key"
```
- **Used for**: Alternative stock market data provider
- **Free tier**: Delayed data (15-minute delay)

**3. IEX Cloud API** (Optional alternative)
```bash
# Get from: https://iexcloud.io
IEX_CLOUD_API_KEY="your-iex-cloud-api-key"
```
- **Used for**: Alternative financial data provider
- **Free tier**: 50,000 messages/month

#### 🗄️ **Optional Database Configuration**

Only needed for **persistent data** and **multi-user setups**:

```bash
# PostgreSQL (Primary Database)
DATABASE_URL="postgresql://stratford_user:your_password@localhost:5432/stratford_dev"

# Redis (Cache & Sessions)
REDIS_URL="redis://localhost:6379"

# MongoDB (Document Storage - Optional)
MONGODB_URL="mongodb://localhost:27017/stratford_dev"
```

**Default behavior**: Uses in-memory storage for development

#### 🔐 **Optional Authentication**

Only needed for **user login** and **multi-user access**:

```bash
# NextAuth.js Configuration
NEXTAUTH_SECRET="your-32-character-nextauth-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# OAuth Providers (Optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_ID="your-github-client-id"
GITHUB_SECRET="your-github-client-secret"
```

**Default behavior**: Single-user mode without authentication

#### 🔒 **Optional Encryption & Security**

Only needed for **production deployments** with sensitive data:

```bash
# Encryption Master Key (32 characters)
ENCRYPTION_MASTER_KEY="your-32-character-encryption-master-key"

# JWT Configuration
JWT_SECRET="your-jwt-secret-key"
JWT_EXPIRES_IN="1h"
```

#### 📊 **Optional Monitoring & Analytics**

Only needed for **production monitoring**:

```bash
# Error Tracking
SENTRY_DSN="your-sentry-dsn"

# Application Performance Monitoring
DATADOG_API_KEY="your-datadog-api-key"
NEW_RELIC_LICENSE_KEY="your-new-relic-license-key"
```

#### 🚀 **Quick Start Guide**

**Option A: Run Immediately (No Setup)**
```bash
pnpm install
pnpm dev
# Visit http://localhost:3000
# All features work with mock data!
```

**Option B: Add Live Market Data**
```bash
# 1. Get free Alpha Vantage API key
# Visit: https://www.alphavantage.co/support/#api-key

# 2. Create .env.local file
cp .env.example .env.local

# 3. Add your API key
echo "ALPHA_VANTAGE_API_KEY=your_key_here" >> .env.local

# 4. Start the app
pnpm dev
```

**Complete reference**: See `.env.example` for all available configuration options.

### CI/CD Pipeline
The project includes a comprehensive CI/CD pipeline with:
- **Security scanning** (Trivy, dependency audit)
- **Code quality** (ESLint, Prettier, TypeScript)
- **Testing** (unit, integration, e2e)
- **Compliance checks** (encryption validation, GDPR checks)
- **Automated deployment** (staging and production)

## 📚 API Documentation

Interactive API documentation is available at:
- **Development**: `http://localhost:3000/docs`
- **Production**: `https://app.stratford.ai/docs`

### Key Endpoints

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/health` | GET | System health check | No |
| `/api/auth/register` | POST | User registration | No |
| `/api/auth/signin` | POST | User authentication | No |
| `/api/portfolios` | GET | List user portfolios | Yes |
| `/api/trades` | POST | Execute trade | Yes (TRADER+) |
| `/api/kyc/submit` | POST | Submit KYC application | Yes |
| `/api/compliance/export` | GET | Export user data (GDPR) | Yes |

## 🔧 Development

### Code Quality
```bash
# Linting
pnpm lint
pnpm lint:fix

# Type checking
pnpm type-check

# Code formatting
pnpm format
pnpm format:check

# All quality checks
pnpm verify
```

### Database Management
```bash
# Generate Prisma client
pnpm prisma generate

# Run migrations
pnpm prisma migrate dev

# Reset database
pnpm prisma migrate reset

# View database
pnpm prisma studio
```

## 📊 Monitoring & Observability

### APM Integration
- **Application Performance Monitoring** with DataDog/New Relic
- **Custom metrics** for trading performance
- **Error tracking** with Sentry
- **Real-time alerting** for system failures

### Health Checks
```bash
# Application health
curl https://app.stratford.ai/api/health

# Database connectivity
curl https://app.stratford.ai/api/health/database

# Service status
curl https://app.stratford.ai/api/health/services
```

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** changes (`git commit -m 'Add amazing feature'`)
4. **Push** to branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Code Standards
- Follow TypeScript strict mode
- Maintain >90% test coverage
- Use conventional commits
- Document all public APIs
- Follow security best practices

## 📄 License

This project is proprietary software. See [LICENSE](LICENSE) for details.

## 🆘 Support

- **Documentation**: [docs.stratford.ai](https://docs.stratford.ai)
- **API Reference**: [api.stratford.ai](https://api.stratford.ai)
- **Support**: [support@stratford.ai](mailto:support@stratford.ai)
- **Issues**: [GitHub Issues](https://github.com/stratford-ai/wealth-engine/issues)

---

**Built with enterprise security and regulatory compliance for institutional financial services.**