import Redis, { Redis as RedisType } from 'ioredis'

/**
 * Redis Service for High-Performance Caching and Real-Time Sessions
 * Optimized for financial data with proper TTL and serialization
 */

export interface CacheConfig {
  ttl?: number // Time to live in seconds
  compress?: boolean // Enable compression for large objects
  serialize?: boolean // Custom serialization
}

export interface SessionData {
  userId: string
  email: string
  portfolioIds: string[]
  preferences: any
  lastActivity: Date
  ipAddress?: string
  userAgent?: string
}

export class RedisService {
  private static instance: RedisService
  private redis: RedisType
  private pubRedis: RedisType // Separate connection for pub/sub
  private subRedis: RedisType

  private constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'

    // Main Redis connection
    this.redis = new Redis(redisUrl, {
      retryDelayOnFailover: 100,
      enableReadyCheck: true,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    })

    // Pub/Sub connections (separate instances to avoid blocking)
    this.pubRedis = new Redis(redisUrl, {
      retryDelayOnFailover: 100,
      enableReadyCheck: true,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    })

    this.subRedis = new Redis(redisUrl, {
      retryDelayOnFailover: 100,
      enableReadyCheck: true,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    })

    this.setupErrorHandlers()
  }

  static getInstance(): RedisService {
    if (!RedisService.instance) {
      RedisService.instance = new RedisService()
    }
    return RedisService.instance
  }

  private setupErrorHandlers(): void {
    this.redis.on('error', (error) => {
      console.error('Redis main connection error:', error)
    })

    this.redis.on('connect', () => {
      console.log('Redis main connection established')
    })

    this.redis.on('ready', () => {
      console.log('Redis main connection ready')
    })
  }

  // Connection health check
  async isHealthy(): Promise<boolean> {
    try {
      const result = await this.redis.ping()
      return result === 'PONG'
    } catch (error) {
      console.error('Redis health check failed:', error)
      return false
    }
  }

  // =============================================================================
  // Market Data Caching
  // =============================================================================

  async cacheMarketData(
    symbol: string,
    data: any,
    config: CacheConfig = { ttl: 60 }
  ): Promise<void> {
    const key = `market:${symbol}`
    const serialized = this.serialize(data, config)

    if (config.ttl) {
      await this.redis.setex(key, config.ttl, serialized)
    } else {
      await this.redis.set(key, serialized)
    }
  }

  async getMarketData(symbol: string): Promise<any | null> {
    const key = `market:${symbol}`
    const data = await this.redis.get(key)
    return data ? this.deserialize(data) : null
  }

  // Cache multiple symbols with pipeline for performance
  async cacheMultipleMarketData(
    dataMap: Record<string, any>,
    config: CacheConfig = { ttl: 60 }
  ): Promise<void> {
    const pipeline = this.redis.pipeline()

    Object.entries(dataMap).forEach(([symbol, data]) => {
      const key = `market:${symbol}`
      const serialized = this.serialize(data, config)

      if (config.ttl) {
        pipeline.setex(key, config.ttl, serialized)
      } else {
        pipeline.set(key, serialized)
      }
    })

    await pipeline.exec()
  }

  async getMultipleMarketData(symbols: string[]): Promise<Record<string, any>> {
    const keys = symbols.map(symbol => `market:${symbol}`)
    const pipeline = this.redis.pipeline()

    keys.forEach(key => pipeline.get(key))

    const results = await pipeline.exec()
    const dataMap: Record<string, any> = {}

    symbols.forEach((symbol, index) => {
      const result = results?.[index]?.[1] as string | null
      if (result) {
        dataMap[symbol] = this.deserialize(result)
      }
    })

    return dataMap
  }

  // =============================================================================
  // Session Management
  // =============================================================================

  async createSession(
    sessionToken: string,
    sessionData: SessionData,
    ttl: number = 3600 // 1 hour default
  ): Promise<void> {
    const key = `session:${sessionToken}`
    const data = {
      ...sessionData,
      lastActivity: sessionData.lastActivity.toISOString(),
    }

    await this.redis.setex(key, ttl, JSON.stringify(data))
  }

  async getSession(sessionToken: string): Promise<SessionData | null> {
    const key = `session:${sessionToken}`
    const data = await this.redis.get(key)

    if (!data) return null

    const parsed = JSON.parse(data)
    return {
      ...parsed,
      lastActivity: new Date(parsed.lastActivity),
    }
  }

  async updateSessionActivity(sessionToken: string): Promise<void> {
    const key = `session:${sessionToken}`
    const session = await this.getSession(sessionToken)

    if (session) {
      session.lastActivity = new Date()
      await this.redis.setex(key, 3600, JSON.stringify({
        ...session,
        lastActivity: session.lastActivity.toISOString(),
      }))
    }
  }

  async deleteSession(sessionToken: string): Promise<void> {
    const key = `session:${sessionToken}`
    await this.redis.del(key)
  }

  // =============================================================================
  // Trading Signals & Alerts Cache
  // =============================================================================

  async cacheTradingSignals(
    userId: string,
    signals: any[],
    ttl: number = 300 // 5 minutes
  ): Promise<void> {
    const key = `signals:${userId}`
    await this.redis.setex(key, ttl, JSON.stringify(signals))
  }

  async getTradingSignals(userId: string): Promise<any[] | null> {
    const key = `signals:${userId}`
    const data = await this.redis.get(key)
    return data ? JSON.parse(data) : null
  }

  // Alert queue for real-time notifications
  async queueAlert(alert: any): Promise<void> {
    await this.redis.lpush('alert_queue', JSON.stringify(alert))
  }

  async dequeueAlert(): Promise<any | null> {
    const data = await this.redis.brpop('alert_queue', 10) // 10 second timeout
    return data ? JSON.parse(data[1]) : null
  }

  // =============================================================================
  // Portfolio Performance Cache
  // =============================================================================

  async cachePortfolioPerformance(
    portfolioId: string,
    performance: any,
    ttl: number = 300
  ): Promise<void> {
    const key = `portfolio:${portfolioId}:performance`
    await this.redis.setex(key, ttl, JSON.stringify(performance))
  }

  async getPortfolioPerformance(portfolioId: string): Promise<any | null> {
    const key = `portfolio:${portfolioId}:performance`
    const data = await this.redis.get(key)
    return data ? JSON.parse(data) : null
  }

  // =============================================================================
  // Rate Limiting
  // =============================================================================

  async checkRateLimit(
    identifier: string,
    limit: number,
    window: number
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const key = `ratelimit:${identifier}`
    const current = await this.redis.get(key)

    if (!current) {
      await this.redis.setex(key, window, '1')
      return {
        allowed: true,
        remaining: limit - 1,
        resetTime: Date.now() + (window * 1000)
      }
    }

    const count = parseInt(current, 10)
    if (count >= limit) {
      const ttl = await this.redis.ttl(key)
      return {
        allowed: false,
        remaining: 0,
        resetTime: Date.now() + (ttl * 1000)
      }
    }

    await this.redis.incr(key)
    const ttl = await this.redis.ttl(key)

    return {
      allowed: true,
      remaining: limit - count - 1,
      resetTime: Date.now() + (ttl * 1000)
    }
  }

  // Advanced rate limiting with sliding window
  async getRequestsInWindow(key: string, windowStart: number, now: number): Promise<number> {
    const requests = await this.redis.zcount(key, windowStart, now)
    return requests
  }

  async addRequestToWindow(key: string, timestamp: number, windowMs: number): Promise<void> {
    const pipeline = this.redis.pipeline()

    // Add current request
    pipeline.zadd(key, timestamp, `${timestamp}-${Math.random()}`)

    // Remove old requests outside the window
    pipeline.zremrangebyscore(key, 0, timestamp - windowMs)

    // Set expiry for the key
    pipeline.expire(key, Math.ceil(windowMs / 1000))

    await pipeline.exec()
  }

  // =============================================================================
  // Real-Time Market Data Pub/Sub
  // =============================================================================

  async publishMarketUpdate(symbol: string, data: any): Promise<void> {
    const channel = `market_updates:${symbol}`
    await this.pubRedis.publish(channel, JSON.stringify(data))
  }

  async subscribeToMarketUpdates(
    symbols: string[],
    callback: (symbol: string, data: any) => void
  ): Promise<void> {
    const channels = symbols.map(symbol => `market_updates:${symbol}`)

    this.subRedis.subscribe(...channels)

    this.subRedis.on('message', (channel, message) => {
      const symbol = channel.replace('market_updates:', '')
      const data = JSON.parse(message)
      callback(symbol, data)
    })
  }

  async publishTradingSignal(signal: any): Promise<void> {
    await this.pubRedis.publish('trading_signals', JSON.stringify(signal))
  }

  async subscribeToTradingSignals(
    callback: (signal: any) => void
  ): Promise<void> {
    this.subRedis.subscribe('trading_signals')

    this.subRedis.on('message', (channel, message) => {
      if (channel === 'trading_signals') {
        const signal = JSON.parse(message)
        callback(signal)
      }
    })
  }

  // =============================================================================
  // Utility Methods
  // =============================================================================

  private serialize(data: any, config: CacheConfig): string {
    let serialized = JSON.stringify(data)

    if (config.compress && serialized.length > 1000) {
      // Could implement compression here if needed (gzip, etc.)
    }

    return serialized
  }

  private deserialize(data: string): any {
    try {
      return JSON.parse(data)
    } catch (error) {
      console.error('Failed to deserialize cached data:', error)
      return null
    }
  }

  // Cache invalidation patterns
  async invalidatePattern(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern)
    if (keys.length > 0) {
      await this.redis.del(...keys)
    }
  }

  async invalidateMarketData(symbol?: string): Promise<void> {
    if (symbol) {
      await this.redis.del(`market:${symbol}`)
    } else {
      await this.invalidatePattern('market:*')
    }
  }

  async invalidateUserData(userId: string): Promise<void> {
    await this.invalidatePattern(`signals:${userId}`)
    await this.invalidatePattern(`portfolio:*:performance`)
  }

  // Graceful shutdown
  async disconnect(): Promise<void> {
    await Promise.all([
      this.redis.quit(),
      this.pubRedis.quit(),
      this.subRedis.quit(),
    ])
  }

  // Get cache statistics
  async getStats(): Promise<any> {
    const info = await this.redis.info('memory')
    const keyspace = await this.redis.info('keyspace')

    return {
      memory: this.parseRedisInfo(info),
      keyspace: this.parseRedisInfo(keyspace),
      connected: this.redis.status === 'ready',
    }
  }

  private parseRedisInfo(info: string): Record<string, any> {
    const result: Record<string, any> = {}

    info.split('\r\n').forEach(line => {
      const [key, value] = line.split(':')
      if (key && value) {
        result[key] = isNaN(Number(value)) ? value : Number(value)
      }
    })

    return result
  }
}

// Export singleton instance
export const redisService = RedisService.getInstance()