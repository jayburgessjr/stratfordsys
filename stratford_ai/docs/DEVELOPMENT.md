# 🛠️ Development Guide

## Getting Started

### Prerequisites

Before you begin development on the Stratford AI Wealth Engine, ensure you have the following installed:

```bash
# Required software versions
Node.js >= 20.0.0
pnpm >= 8.0.0
PostgreSQL >= 15.0
Redis >= 7.0
MongoDB >= 6.0 (optional, for document storage)
Git >= 2.30.0
```

### Environment Setup

1. **Clone the repository**
```bash
git clone https://github.com/stratford-ai/wealth-engine.git
cd stratford_ai
```

2. **Install dependencies**
```bash
pnpm install
```

3. **Environment configuration**
```bash
# Copy environment template
cp .env.example .env.local

# Configure required environment variables
DATABASE_URL="postgresql://user:password@localhost:5432/stratford_dev"
REDIS_URL="redis://localhost:6379"
NEXTAUTH_SECRET="your-32-character-secret-key"
ENCRYPTION_MASTER_KEY="your-encryption-master-key"
```

4. **Database setup**
```bash
# Start PostgreSQL and Redis services
brew services start postgresql
brew services start redis

# Initialize database
pnpm prisma migrate dev
pnpm prisma db seed
```

5. **Start development server**
```bash
pnpm dev
```

## Project Structure Deep Dive

### Domain-Driven Design Architecture

```typescript
// Core domain structure
src/
├── domain/                         # Business logic layer
│   ├── trading/                    # Trading bounded context
│   │   ├── aggregates/            # Domain aggregates
│   │   │   ├── portfolio.ts       # Portfolio aggregate root
│   │   │   ├── trade.ts           # Trade aggregate
│   │   │   └── strategy.ts        # Strategy aggregate
│   │   ├── value-objects/         # Immutable value objects
│   │   │   ├── money.ts           # Money value object
│   │   │   ├── symbol.ts          # Trading symbol
│   │   │   └── quantity.ts        # Trade quantity
│   │   ├── services/              # Domain services
│   │   │   ├── risk-calculator.ts # Risk calculation service
│   │   │   └── performance.ts     # Performance analysis
│   │   └── events/                # Domain events
│   │       ├── trade-executed.ts  # Trade execution event
│   │       └── position-updated.ts
│   │
│   ├── compliance/                 # Compliance bounded context
│   │   ├── aggregates/
│   │   │   ├── kyc-record.ts      # KYC aggregate
│   │   │   └── aml-alert.ts       # AML alert aggregate
│   │   ├── services/
│   │   │   ├── kyc-verification.ts
│   │   │   └── aml-screening.ts
│   │   └── events/
│   │       ├── kyc-approved.ts
│   │       └── aml-alert-triggered.ts
│   │
│   └── shared/                     # Shared kernel
│       ├── value-objects/
│       ├── events/
│       └── specifications/
```

### Application Layer

```typescript
// Application services coordinate domain operations
src/lib/
├── application/                    # Application services
│   ├── commands/                   # Command handlers (CQRS)
│   │   ├── create-trade.ts
│   │   ├── update-portfolio.ts
│   │   └── submit-kyc.ts
│   ├── queries/                    # Query handlers (CQRS)
│   │   ├── get-portfolio.ts
│   │   ├── get-trade-history.ts
│   │   └── get-performance.ts
│   ├── handlers/                   # Event handlers
│   │   ├── trade-executed-handler.ts
│   │   └── kyc-approved-handler.ts
│   └── workflows/                  # Business workflows
│       ├── onboarding-workflow.ts
│       └── trading-workflow.ts
```

## Development Patterns

### 1. Domain Aggregate Pattern

```typescript
// Example: Portfolio Aggregate
export class Portfolio extends AggregateRoot<PortfolioId> {
  private constructor(
    id: PortfolioId,
    private userId: UserId,
    private name: string,
    private currency: Currency,
    private positions: Position[],
    private cashBalance: Money
  ) {
    super(id)
  }

  static create(
    userId: UserId,
    name: string,
    currency: Currency,
    initialCash: Money
  ): Portfolio {
    const id = PortfolioId.generate()
    const portfolio = new Portfolio(id, userId, name, currency, [], initialCash)

    // Raise domain event
    portfolio.addDomainEvent(
      new PortfolioCreated(id, userId, name, currency, initialCash)
    )

    return portfolio
  }

  buyStock(symbol: Symbol, quantity: Quantity, price: Price): void {
    // Business rule: Can't buy with insufficient funds
    const totalCost = price.multiply(quantity.value)
    if (this.cashBalance.isLessThan(totalCost)) {
      throw new InsufficientFundsError(this.cashBalance, totalCost)
    }

    // Business rule: Can't exceed position limits
    const existingPosition = this.getPosition(symbol)
    const newQuantity = existingPosition
      ? existingPosition.quantity.add(quantity)
      : quantity

    if (newQuantity.value > this.getPositionLimit(symbol)) {
      throw new PositionLimitExceededError(symbol, newQuantity, this.getPositionLimit(symbol))
    }

    // Execute trade
    this.addOrUpdatePosition(symbol, quantity, price)
    this.cashBalance = this.cashBalance.subtract(totalCost)

    // Raise domain event
    this.addDomainEvent(
      new StockPurchased(this.id, symbol, quantity, price, totalCost)
    )
  }

  private getPositionLimit(symbol: Symbol): number {
    // Business logic for position limits
    return this.calculatePositionLimit(symbol)
  }
}
```

### 2. Value Object Pattern

```typescript
// Example: Money Value Object
export class Money {
  private constructor(
    public readonly amount: number,
    public readonly currency: Currency
  ) {
    if (amount < 0) {
      throw new Error('Money amount cannot be negative')
    }
  }

  static of(amount: number, currency: Currency): Money {
    return new Money(amount, currency)
  }

  add(other: Money): Money {
    this.ensureSameCurrency(other)
    return new Money(this.amount + other.amount, this.currency)
  }

  subtract(other: Money): Money {
    this.ensureSameCurrency(other)
    const result = this.amount - other.amount
    if (result < 0) {
      throw new Error('Cannot subtract more money than available')
    }
    return new Money(result, this.currency)
  }

  multiply(factor: number): Money {
    return new Money(this.amount * factor, this.currency)
  }

  isLessThan(other: Money): boolean {
    this.ensureSameCurrency(other)
    return this.amount < other.amount
  }

  equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency
  }

  private ensureSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new Error(`Currency mismatch: ${this.currency} vs ${other.currency}`)
    }
  }
}
```

### 3. Repository Pattern

```typescript
// Example: Portfolio Repository
interface PortfolioRepository {
  save(portfolio: Portfolio): Promise<void>
  findById(id: PortfolioId): Promise<Portfolio | null>
  findByUserId(userId: UserId): Promise<Portfolio[]>
  delete(id: PortfolioId): Promise<void>
}

// Prisma implementation
export class PrismaPortfolioRepository implements PortfolioRepository {
  constructor(private prisma: PrismaClient) {}

  async save(portfolio: Portfolio): Promise<void> {
    const data = this.toPersistence(portfolio)

    await this.prisma.portfolio.upsert({
      where: { id: portfolio.id.value },
      update: data,
      create: data
    })

    // Publish domain events
    await this.publishDomainEvents(portfolio)
  }

  async findById(id: PortfolioId): Promise<Portfolio | null> {
    const data = await this.prisma.portfolio.findUnique({
      where: { id: id.value },
      include: {
        positions: true,
        trades: true
      }
    })

    return data ? this.toDomain(data) : null
  }

  private toPersistence(portfolio: Portfolio): any {
    return {
      id: portfolio.id.value,
      userId: portfolio.userId.value,
      name: portfolio.name,
      currency: portfolio.currency,
      currentValue: portfolio.currentValue.amount,
      // ... other fields
    }
  }

  private toDomain(data: any): Portfolio {
    // Reconstruct domain object from persistence data
    return Portfolio.reconstitute(
      new PortfolioId(data.id),
      new UserId(data.userId),
      data.name,
      data.currency,
      data.positions.map(this.positionToDomain),
      Money.of(data.currentValue, data.currency)
    )
  }
}
```

## Testing Strategy

### Unit Testing

```typescript
// Example: Portfolio unit tests
describe('Portfolio', () => {
  let portfolio: Portfolio
  let userId: UserId

  beforeEach(() => {
    userId = UserId.generate()
    portfolio = Portfolio.create(
      userId,
      'Test Portfolio',
      Currency.USD,
      Money.of(10000, Currency.USD)
    )
  })

  describe('buyStock', () => {
    it('should add position when buying stock', () => {
      // Arrange
      const symbol = Symbol.of('AAPL')
      const quantity = Quantity.of(100)
      const price = Price.of(150.00)

      // Act
      portfolio.buyStock(symbol, quantity, price)

      // Assert
      const position = portfolio.getPosition(symbol)
      expect(position).toBeDefined()
      expect(position!.quantity.value).toBe(100)
      expect(position!.averagePrice.amount).toBe(150.00)
    })

    it('should throw error when insufficient funds', () => {
      // Arrange
      const symbol = Symbol.of('AAPL')
      const quantity = Quantity.of(100)
      const price = Price.of(200.00) // Costs $20,000, but only $10,000 available

      // Act & Assert
      expect(() => portfolio.buyStock(symbol, quantity, price))
        .toThrow(InsufficientFundsError)
    })

    it('should raise StockPurchased domain event', () => {
      // Arrange
      const symbol = Symbol.of('AAPL')
      const quantity = Quantity.of(100)
      const price = Price.of(150.00)

      // Act
      portfolio.buyStock(symbol, quantity, price)

      // Assert
      const events = portfolio.getUncommittedEvents()
      expect(events).toHaveLength(1)
      expect(events[0]).toBeInstanceOf(StockPurchased)
    })
  })
})
```

### Integration Testing

```typescript
// Example: API integration tests
describe('Trading API', () => {
  let testDb: TestDatabase
  let testUser: User

  beforeAll(async () => {
    testDb = await TestDatabase.create()
    testUser = await testDb.createUser({
      email: 'trader@test.com',
      role: 'TRADER'
    })
  })

  afterAll(async () => {
    await testDb.cleanup()
  })

  describe('POST /api/trades', () => {
    it('should execute trade successfully', async () => {
      // Arrange
      const portfolio = await testDb.createPortfolio({
        userId: testUser.id,
        initialCash: 10000
      })

      const tradeRequest = {
        portfolioId: portfolio.id,
        symbol: 'AAPL',
        side: 'BUY',
        quantity: 100,
        orderType: 'MARKET'
      }

      // Act
      const response = await request(app)
        .post('/api/trades')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send(tradeRequest)

      // Assert
      expect(response.status).toBe(201)
      expect(response.body.trade.symbol).toBe('AAPL')
      expect(response.body.trade.quantity).toBe(100)
      expect(response.body.trade.status).toBe('FILLED')
    })

    it('should reject trade with insufficient permissions', async () => {
      // Arrange
      const regularUser = await testDb.createUser({
        email: 'user@test.com',
        role: 'USER' // No trading permissions
      })

      // Act
      const response = await request(app)
        .post('/api/trades')
        .set('Authorization', `Bearer ${regularUser.token}`)
        .send({})

      // Assert
      expect(response.status).toBe(403)
      expect(response.body.error).toBe('Forbidden')
    })
  })
})
```

### End-to-End Testing

```typescript
// Example: E2E tests with Playwright
test.describe('Trading Workflow', () => {
  test('should complete full trading workflow', async ({ page }) => {
    // Login
    await page.goto('/auth/signin')
    await page.fill('[data-testid=email]', 'trader@stratford.ai')
    await page.fill('[data-testid=password]', 'password123')
    await page.click('[data-testid=signin-button]')

    // Navigate to trading interface
    await page.click('[data-testid=trading-nav]')
    await expect(page).toHaveURL('/trading')

    // Place trade order
    await page.fill('[data-testid=symbol-input]', 'AAPL')
    await page.fill('[data-testid=quantity-input]', '100')
    await page.selectOption('[data-testid=order-type]', 'MARKET')
    await page.click('[data-testid=buy-button]')

    // Verify trade confirmation
    await expect(page.locator('[data-testid=trade-confirmation]'))
      .toContainText('Trade executed successfully')

    // Check portfolio update
    await page.click('[data-testid=portfolio-nav]')
    await expect(page.locator('[data-testid=position-AAPL]'))
      .toContainText('100 shares')
  })
})
```

## Security Development

### Secure Coding Practices

```typescript
// 1. Input Validation
const tradeSchema = z.object({
  symbol: z.string().regex(/^[A-Z]{1,5}$/, 'Invalid symbol format'),
  quantity: z.number().positive().max(1000000, 'Quantity too large'),
  price: z.number().positive().max(999999.99, 'Price too large'),
  side: z.enum(['BUY', 'SELL'])
})

// 2. SQL Injection Prevention
const getUserTrades = async (userId: string, filters: TradeFilters) => {
  // Use Prisma's type-safe query builder
  return prisma.trade.findMany({
    where: {
      userId: userId, // Parameterized
      symbol: filters.symbol, // Parameterized
      executedAt: {
        gte: filters.startDate, // Parameterized
        lte: filters.endDate    // Parameterized
      }
    }
  })
}

// 3. Authentication Check
const requireAuth = async (req: NextApiRequest): Promise<User> => {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) {
    throw new AuthenticationError('No token provided')
  }

  const user = await verifyJWTToken(token)
  if (!user) {
    throw new AuthenticationError('Invalid token')
  }

  return user
}

// 4. Authorization Check
const requireRole = (roles: Role[]) => {
  return (user: User) => {
    if (!roles.includes(user.role)) {
      throw new AuthorizationError('Insufficient permissions')
    }
  }
}

// 5. Rate Limiting
const withRateLimit = (limits: RateLimitConfig) => {
  return async (req: NextApiRequest, res: NextApiResponse, next: NextFunction) => {
    const key = `${req.ip}:${req.url}`
    const allowed = await rateLimiter.checkLimit(key, limits)

    if (!allowed) {
      return res.status(429).json({ error: 'Rate limit exceeded' })
    }

    next()
  }
}
```

### Encryption Guidelines

```typescript
// Encrypt sensitive data before database storage
class EncryptionService {
  async encryptSensitiveField(
    data: string,
    context: string,
    userId: string
  ): Promise<EncryptedData> {
    // Generate unique salt and IV for each encryption
    const salt = crypto.randomBytes(32)
    const iv = crypto.randomBytes(16)

    // Derive key using PBKDF2 with context
    const key = crypto.pbkdf2Sync(
      this.masterKey + context + userId,
      salt,
      100000, // iterations
      32,     // key length
      'sha256'
    )

    // Encrypt using AES-256-GCM
    const cipher = crypto.createCipher('aes-256-gcm', key)
    cipher.setAAD(Buffer.from(context + userId))

    let encrypted = cipher.update(data, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    return {
      data: encrypted,
      salt: salt.toString('hex'),
      iv: iv.toString('hex'),
      tag: cipher.getAuthTag().toString('hex'),
      algorithm: 'aes-256-gcm'
    }
  }
}

// Usage in application
const kycService = {
  async storeKYCData(userId: string, kycData: KYCData): Promise<void> {
    // Encrypt SSN before storage
    const encryptedSSN = await encryptionService.encryptSensitiveField(
      kycData.ssn,
      'kyc:ssn',
      userId
    )

    await prisma.kycRecord.create({
      data: {
        userId,
        fullName: kycData.fullName,
        ssn: encryptedSSN, // Store encrypted
        // ... other fields
      }
    })
  }
}
```

## Performance Optimization

### Database Optimization

```typescript
// 1. Query optimization with proper indexing
// In Prisma schema
model Trade {
  id          String   @id @default(cuid())
  userId      String
  symbol      String
  executedAt  DateTime

  // Composite indexes for common queries
  @@index([userId, executedAt])      // User's trade history
  @@index([symbol, executedAt])      // Symbol trade history
  @@index([userId, symbol])          // User's trades for symbol
}

// 2. Connection pooling
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  // Configure connection pool
  __internal: {
    engine: {
      connection_limit: 20,
      pool_timeout: 10,
      socket_timeout: 10
    }
  }
})

// 3. Query batching for N+1 prevention
const getPortfoliosWithPositions = async (userIds: string[]) => {
  // Load all portfolios in one query
  const portfolios = await prisma.portfolio.findMany({
    where: { userId: { in: userIds } },
    include: {
      positions: true // Eager load positions
    }
  })

  return portfolios
}
```

### Caching Strategy

```typescript
// Multi-layer caching implementation
class CacheService {
  private memoryCache = new LRU<string, any>({ max: 1000 })

  async get<T>(key: string): Promise<T | null> {
    // L1: Memory cache (fastest)
    const memoryResult = this.memoryCache.get(key)
    if (memoryResult) return memoryResult

    // L2: Redis cache (fast)
    const redisResult = await this.redis.get(key)
    if (redisResult) {
      const parsed = JSON.parse(redisResult)
      this.memoryCache.set(key, parsed)
      return parsed
    }

    return null
  }

  async set<T>(key: string, value: T, ttl: number): Promise<void> {
    // Store in both layers
    this.memoryCache.set(key, value)
    await this.redis.setex(key, ttl, JSON.stringify(value))
  }

  // Smart cache invalidation
  async invalidatePattern(pattern: string): Promise<void> {
    // Invalidate memory cache
    const keys = Array.from(this.memoryCache.keys())
    keys.forEach(key => {
      if (key.includes(pattern)) {
        this.memoryCache.delete(key)
      }
    })

    // Invalidate Redis cache
    const redisKeys = await this.redis.keys(`*${pattern}*`)
    if (redisKeys.length > 0) {
      await this.redis.del(...redisKeys)
    }
  }
}

// Usage in services
class PortfolioService {
  async getPortfolio(portfolioId: string): Promise<Portfolio> {
    const cacheKey = `portfolio:${portfolioId}`

    // Try cache first
    const cached = await this.cache.get<Portfolio>(cacheKey)
    if (cached) return cached

    // Load from database
    const portfolio = await this.repository.findById(portfolioId)
    if (!portfolio) throw new PortfolioNotFoundError(portfolioId)

    // Cache for 5 minutes
    await this.cache.set(cacheKey, portfolio, 300)

    return portfolio
  }

  async updatePortfolio(portfolio: Portfolio): Promise<void> {
    await this.repository.save(portfolio)

    // Invalidate related caches
    await this.cache.invalidatePattern(`portfolio:${portfolio.id}`)
    await this.cache.invalidatePattern(`user:${portfolio.userId}:portfolios`)
  }
}
```

## Debugging & Monitoring

### Structured Logging

```typescript
// Structured logging with correlation IDs
class Logger {
  private correlationId: string

  constructor(correlationId?: string) {
    this.correlationId = correlationId || this.generateCorrelationId()
  }

  info(message: string, metadata?: any): void {
    this.log('INFO', message, metadata)
  }

  error(message: string, error?: Error, metadata?: any): void {
    this.log('ERROR', message, { ...metadata, error: error?.stack })
  }

  private log(level: string, message: string, metadata?: any): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      correlationId: this.correlationId,
      service: 'stratford-api',
      environment: process.env.NODE_ENV,
      ...metadata
    }

    console.log(JSON.stringify(logEntry))

    // Send to external logging service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToLogService(logEntry)
    }
  }
}

// Usage in API handlers
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const logger = new Logger(req.headers['x-correlation-id'] as string)

  try {
    logger.info('Processing trade request', {
      userId: req.user.id,
      endpoint: req.url,
      method: req.method
    })

    const result = await tradeService.executeTrade(req.body)

    logger.info('Trade executed successfully', {
      tradeId: result.id,
      symbol: result.symbol,
      quantity: result.quantity
    })

    res.status(201).json(result)
  } catch (error) {
    logger.error('Trade execution failed', error as Error, {
      userId: req.user.id,
      requestBody: req.body
    })

    res.status(500).json({ error: 'Internal server error' })
  }
}
```

### Performance Monitoring

```typescript
// Performance monitoring with custom metrics
class MetricsCollector {
  private static instance: MetricsCollector

  async recordDuration(name: string, duration: number, tags?: Record<string, string>): Promise<void> {
    const metric = {
      name,
      type: 'histogram',
      value: duration,
      timestamp: Date.now(),
      tags: {
        environment: process.env.NODE_ENV,
        service: 'stratford-api',
        ...tags
      }
    }

    // Send to monitoring service (DataDog, New Relic, etc.)
    await this.sendMetric(metric)
  }

  async incrementCounter(name: string, tags?: Record<string, string>): Promise<void> {
    const metric = {
      name,
      type: 'counter',
      value: 1,
      timestamp: Date.now(),
      tags: {
        environment: process.env.NODE_ENV,
        service: 'stratford-api',
        ...tags
      }
    }

    await this.sendMetric(metric)
  }
}

// Performance measurement decorator
function measurePerformance(metricName: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const start = Date.now()
      const metrics = MetricsCollector.getInstance()

      try {
        const result = await originalMethod.apply(this, args)
        const duration = Date.now() - start

        await metrics.recordDuration(metricName, duration, {
          method: propertyKey,
          status: 'success'
        })

        return result
      } catch (error) {
        const duration = Date.now() - start

        await metrics.recordDuration(metricName, duration, {
          method: propertyKey,
          status: 'error'
        })

        throw error
      }
    }

    return descriptor
  }
}

// Usage
class TradingService {
  @measurePerformance('trading.execute_trade')
  async executeTrade(tradeRequest: TradeRequest): Promise<Trade> {
    // Implementation here
  }
}
```

This comprehensive development guide provides engineers with everything they need to effectively contribute to the Stratford AI Wealth Engine platform.