# Stratford AI - System Architecture

## Architecture Principles

### 1. Deterministic Computing
- **Seeded Randomness**: All ML models use fixed seeds for reproducible outputs
- **Immutable Data**: Historical data never modified, only appended
- **Pure Functions**: Core calculations are side-effect free
- **Version Locking**: Dependencies pinned to exact versions

### 2. Separation of Concerns (SoC)
- **Data Layer**: Ingestion, storage, and retrieval
- **Computation Layer**: ML models and backtesting engine
- **Presentation Layer**: Dashboard and user interface
- **Configuration Layer**: Strategy parameters and system settings

### 3. DRY (Don't Repeat Yourself)
- **Shared Utilities**: Common functions for data processing and calculations
- **Component Reusability**: UI components designed for multiple contexts
- **Configuration Management**: Single source of truth for system parameters
- **Type Definitions**: Shared TypeScript interfaces across layers

### 4. Testability & Observability
- **Unit Test Coverage**: >90% for core business logic
- **Integration Tests**: API and data pipeline validation
- **End-to-End Tests**: Critical user journey validation
- **Logging & Monitoring**: Structured logging for debugging and audit trails

## Technology Stack

### Frontend Stack
```
Next.js 14.0.x        # React framework with SSR/SSG
TypeScript 5.2.x       # Type safety and developer experience
Tailwind CSS 3.3.x     # Utility-first CSS framework
shadcn/ui 0.8.x        # Accessible component library
Recharts 2.8.x         # Data visualization library
React Hook Form 7.x    # Form state management
Zod 3.22.x             # Runtime type validation
```

### Backend Stack
```
Node.js 20.x           # JavaScript runtime
Express.js 4.x         # Web application framework
Prisma 5.x             # Database ORM with type safety
SQLite 3.x (MVP)       # Local database for development
PostgreSQL 15.x (Prod) # Production database
MSW 1.3.x              # API mocking for tests
```

### Development & Testing
```
Vitest 1.x             # Unit testing framework
Playwright 1.x         # E2E testing framework
ESLint 8.x             # Code linting
Prettier 3.x           # Code formatting
pnpm 8.x               # Package manager (fast, efficient)
TypeScript 5.2.x       # Static type checking
```

### Data & ML Stack
```
Python 3.11.x          # ML model development
pandas 2.x             # Data manipulation
scikit-learn 1.3.x     # Machine learning library
numpy 1.25.x           # Numerical computing
node-fetch 3.x         # API data fetching
csv-parser 3.x         # CSV data processing
```

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                      │
├─────────────────────────────────────────────────────────────┤
│  Dashboard  │  Strategy Config  │  Backtest Results  │ Data │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/API
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Backend API (Express)                    │
├─────────────────────────────────────────────────────────────┤
│     Auth     │  Strategy API  │  Data API  │  Backtest API  │
└─────────────────────────────────────────────────────────────┘
                              │
                              │
                ┌─────────────┴─────────────┐
                │                           │
                ▼                           ▼
┌───────────────────────────┐  ┌─────────────────────────┐
│     Data Ingestion        │  │    Computation Engine   │
├───────────────────────────┤  ├─────────────────────────┤
│ • Yahoo Finance API       │  │ • Strategy Runner       │
│ • Alpha Vantage API       │  │ • Backtesting Engine    │
│ • CSV File Processing     │  │ • Risk Calculator       │
│ • Data Validation         │  │ • Performance Metrics   │
└───────────────────────────┘  └─────────────────────────┘
                │                           │
                │                           │
                └─────────────┬─────────────┘
                              │
                              ▼
                ┌─────────────────────────┐
                │      Database Layer     │
                ├─────────────────────────┤
                │ • Historical Data       │
                │ • Strategy Configs      │
                │ • Backtest Results      │
                │ • Performance Metrics   │
                └─────────────────────────┘
```

## Data Flow Architecture

### 1. Data Ingestion Pipeline
```
External APIs → Data Validator → Transform → Store → Index
     │              │              │         │       │
     │              │              │         │       └─ Search/Query
     │              │              │         └─ SQLite/PostgreSQL
     │              │              └─ Normalize & Clean
     │              └─ Schema Validation (Zod)
     └─ Yahoo Finance, Alpha Vantage, CSV
```

### 2. Strategy Execution Pipeline
```
User Config → Strategy Loader → Data Fetcher → Model Runner → Results
     │             │               │             │            │
     │             │               │             │            └─ Store & Display
     │             │               │             └─ Deterministic ML
     │             │               └─ Historical Data Query
     │             └─ Load Strategy Parameters
     └─ Time Window, Thresholds, Risk Params
```

### 3. Backtesting Pipeline
```
Strategy + Historical Data → Time-based Simulation → Performance Calculation → Visualization
                                    │                        │                     │
                                    │                        │                     └─ Charts & Tables
                                    │                        └─ Sharpe, PnL, Win Rate
                                    └─ Walk-forward Analysis
```

## Security & Privacy Architecture

### Data Protection
- **Local First**: Core data processing happens locally
- **API Key Management**: Secure storage of external API credentials
- **Data Encryption**: Sensitive data encrypted at rest
- **Audit Logging**: All data access and modifications logged

### Access Control
- **Authentication**: Local user authentication for multi-user setups
- **Authorization**: Role-based access to different features
- **API Rate Limiting**: Prevent abuse of external data sources
- **Input Validation**: All user inputs validated and sanitized

## Deployment Architecture

### Development Environment
```
Local Machine:
├── Frontend (Next.js dev server) :3000
├── Backend API (Express) :3001
├── Database (SQLite) :file
└── Tests (Vitest + Playwright)
```

### Production Environment
```
Self-Hosted/VPS:
├── Frontend (Next.js production build)
├── Backend API (Express + PM2)
├── Database (PostgreSQL)
├── Reverse Proxy (Nginx)
└── SSL/TLS (Let's Encrypt)
```

## Performance Requirements

### Response Times
- **Data Fetching**: < 2 seconds for API calls
- **Strategy Execution**: < 5 seconds for basic strategies
- **Backtesting**: < 30 seconds for 1-year historical data
- **Dashboard Loading**: < 1 second for cached data

### Scalability Targets
- **Data Storage**: 10GB+ historical market data
- **Concurrent Strategies**: 5+ strategies running simultaneously
- **Historical Range**: 10+ years of daily data
- **User Sessions**: Single user (MVP), 10+ users (future)

## Monitoring & Maintenance

### Health Checks
- **API Availability**: External data source monitoring
- **Database Performance**: Query execution time tracking
- **System Resources**: CPU, memory, disk usage monitoring
- **Error Rates**: Application error tracking and alerting

### Backup & Recovery
- **Database Backups**: Daily automated backups
- **Configuration Backups**: Strategy and system configuration versioning
- **Disaster Recovery**: Documentation for system restoration
- **Data Integrity**: Checksums and validation for critical data

## Migration & Upgrade Strategy

### Database Migration
- **Schema Versioning**: Prisma migrations for database changes
- **Data Migration**: Scripts for transforming existing data
- **Rollback Strategy**: Ability to revert to previous versions
- **Testing**: Migration testing in development environment

### Dependency Management
- **Lock Files**: pnpm-lock.yaml for exact dependency versions
- **Security Updates**: Regular vulnerability scanning and updates
- **Compatibility Testing**: Verify updates don't break functionality
- **Staged Rollouts**: Test updates in development before production