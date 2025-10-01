import { QueryClient } from '@tanstack/react-query'
import { redisService } from '../database/redis'

/**
 * Production-Optimized React Query Configuration
 * Intelligent caching with Redis integration and performance optimization
 */

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache for 5 minutes by default
      staleTime: 5 * 60 * 1000,

      // Keep cache for 30 minutes after component unmount
      gcTime: 30 * 60 * 1000,

      // Retry failed requests 3 times with exponential backoff
      retry: (failureCount, error: any) => {
        // Don't retry 4xx errors (client errors)
        if (error?.status >= 400 && error?.status < 500) {
          return false
        }
        return failureCount < 3
      },

      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Refetch on window focus for critical data
      refetchOnWindowFocus: true,

      // Don't refetch on reconnect for cached data
      refetchOnReconnect: 'always',

      // Network error handling
      networkMode: 'online',
    },
    mutations: {
      // Retry mutations twice
      retry: 2,
      networkMode: 'online',
    },
  },
})

// Query key factories for consistent cache management
export const queryKeys = {
  // Market Data
  marketData: {
    all: ['market-data'] as const,
    symbol: (symbol: string) => [...queryKeys.marketData.all, symbol] as const,
    symbols: (symbols: string[]) => [...queryKeys.marketData.all, 'multi', symbols.sort()] as const,
    ohlcv: (symbol: string, interval: string, range?: [Date, Date]) =>
      [...queryKeys.marketData.symbol(symbol), 'ohlcv', interval, range] as const,
    latest: (symbols: string[]) => [...queryKeys.marketData.symbols(symbols), 'latest'] as const,
    indicators: (symbol: string, indicator: string, timeframe: string) =>
      [...queryKeys.marketData.symbol(symbol), 'indicators', indicator, timeframe] as const,
  },

  // Portfolio Data
  portfolio: {
    all: ['portfolio'] as const,
    byUser: (userId: string) => [...queryKeys.portfolio.all, userId] as const,
    detail: (portfolioId: string) => [...queryKeys.portfolio.all, portfolioId] as const,
    positions: (portfolioId: string) => [...queryKeys.portfolio.detail(portfolioId), 'positions'] as const,
    performance: (portfolioId: string, range?: [Date, Date]) =>
      [...queryKeys.portfolio.detail(portfolioId), 'performance', range] as const,
    trades: (portfolioId: string, limit?: number) =>
      [...queryKeys.portfolio.detail(portfolioId), 'trades', limit] as const,
  },

  // Strategy Data
  strategy: {
    all: ['strategy'] as const,
    byUser: (userId: string) => [...queryKeys.strategy.all, userId] as const,
    detail: (strategyId: string) => [...queryKeys.strategy.all, strategyId] as const,
    backtests: (strategyId: string) => [...queryKeys.strategy.detail(strategyId), 'backtests'] as const,
    signals: (userId: string) => [...queryKeys.strategy.byUser(userId), 'signals'] as const,
  },

  // News & Sentiment
  news: {
    all: ['news'] as const,
    symbol: (symbol: string) => [...queryKeys.news.all, symbol] as const,
    search: (query: string, filters?: any) => [...queryKeys.news.all, 'search', query, filters] as const,
    sentiment: (symbol: string, timeframe: number) => [...queryKeys.news.symbol(symbol), 'sentiment', timeframe] as const,
  },

  // Social Media
  social: {
    all: ['social'] as const,
    symbol: (symbol: string, platform?: string) => [...queryKeys.social.all, symbol, platform] as const,
    sentiment: (symbol: string, platform?: string, hours?: number) =>
      [...queryKeys.social.symbol(symbol, platform), 'sentiment', hours] as const,
  },

  // User Data
  user: {
    all: ['user'] as const,
    profile: (userId: string) => [...queryKeys.user.all, userId] as const,
    preferences: (userId: string) => [...queryKeys.user.profile(userId), 'preferences'] as const,
    apiKeys: (userId: string) => [...queryKeys.user.profile(userId), 'api-keys'] as const,
    activity: (userId: string) => [...queryKeys.user.profile(userId), 'activity'] as const,
  },

  // System Data
  system: {
    all: ['system'] as const,
    health: () => [...queryKeys.system.all, 'health'] as const,
    metrics: (metric: string, range: [Date, Date]) => [...queryKeys.system.all, 'metrics', metric, range] as const,
    stats: () => [...queryKeys.system.all, 'stats'] as const,
  },
} as const

// Cache prefetch strategies
export const prefetchStrategies = {
  // Prefetch related market data when viewing a symbol
  prefetchRelatedSymbols: async (symbol: string, relatedSymbols: string[]) => {
    const promises = relatedSymbols.map(relatedSymbol =>
      queryClient.prefetchQuery({
        queryKey: queryKeys.marketData.symbol(relatedSymbol),
        queryFn: () => fetchMarketData(relatedSymbol),
        staleTime: 2 * 60 * 1000, // 2 minutes for prefetched data
      })
    )

    await Promise.allSettled(promises)
  },

  // Prefetch portfolio details when listing portfolios
  prefetchPortfolioDetails: async (portfolioIds: string[]) => {
    const promises = portfolioIds.map(portfolioId =>
      queryClient.prefetchQuery({
        queryKey: queryKeys.portfolio.detail(portfolioId),
        queryFn: () => fetchPortfolioDetail(portfolioId),
        staleTime: 10 * 60 * 1000, // 10 minutes for prefetched portfolio data
      })
    )

    await Promise.allSettled(promises)
  },

  // Prefetch news sentiment when viewing news
  prefetchNewsSentiment: async (symbols: string[]) => {
    const promises = symbols.map(symbol =>
      queryClient.prefetchQuery({
        queryKey: queryKeys.news.sentiment(symbol, 24),
        queryFn: () => fetchNewsSentiment(symbol, 24),
        staleTime: 5 * 60 * 1000,
      })
    )

    await Promise.allSettled(promises)
  },
}

// Optimized data fetchers with caching
async function fetchMarketData(symbol: string) {
  // Try Redis cache first
  const cached = await redisService.getMarketData(symbol)
  if (cached) {
    return cached
  }

  // Fetch from API
  const response = await fetch(`/api/market-data/${symbol}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch market data for ${symbol}`)
  }

  const data = await response.json()

  // Cache in Redis
  await redisService.cacheMarketData(symbol, data, { ttl: 60 })

  return data
}

async function fetchPortfolioDetail(portfolioId: string) {
  const response = await fetch(`/api/portfolio/${portfolioId}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch portfolio ${portfolioId}`)
  }
  return response.json()
}

async function fetchNewsSentiment(symbol: string, hours: number) {
  const response = await fetch(`/api/news/${symbol}/sentiment?hours=${hours}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch news sentiment for ${symbol}`)
  }
  return response.json()
}

// Performance optimization utilities
export const performanceUtils = {
  // Intelligent background refetch based on data importance
  scheduleBackgroundRefetch: (queryKey: readonly unknown[], priority: 'high' | 'medium' | 'low') => {
    const delays = {
      high: 30 * 1000,      // 30 seconds
      medium: 5 * 60 * 1000, // 5 minutes
      low: 15 * 60 * 1000,   // 15 minutes
    }

    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey })
    }, delays[priority])
  },

  // Batch invalidation for related queries
  invalidateRelatedQueries: (symbol: string) => {
    // Invalidate all queries related to this symbol
    queryClient.invalidateQueries({ queryKey: queryKeys.marketData.symbol(symbol) })
    queryClient.invalidateQueries({ queryKey: queryKeys.news.symbol(symbol) })
    queryClient.invalidateQueries({ queryKey: queryKeys.social.symbol(symbol) })
  },

  // Memory optimization - remove unused queries
  cleanupStaleQueries: () => {
    queryClient.getQueryCache().clear()

    // Remove queries that haven't been accessed in 1 hour
    const oneHourAgo = Date.now() - 60 * 60 * 1000

    queryClient.getQueryCache().getAll().forEach(query => {
      if (query.state.dataUpdatedAt < oneHourAgo && query.getObserversCount() === 0) {
        queryClient.getQueryCache().remove(query)
      }
    })
  },

  // Optimize for mobile/slow connections
  optimizeForConnection: (connectionType: 'fast' | 'slow') => {
    if (connectionType === 'slow') {
      queryClient.setDefaultOptions({
        queries: {
          staleTime: 10 * 60 * 1000,  // 10 minutes for slow connections
          gcTime: 20 * 60 * 1000,     // 20 minutes garbage collection
          retry: 1,                    // Fewer retries
        }
      })
    } else {
      queryClient.setDefaultOptions({
        queries: {
          staleTime: 2 * 60 * 1000,   // 2 minutes for fast connections
          gcTime: 10 * 60 * 1000,     // 10 minutes garbage collection
          retry: 3,                    // More retries allowed
        }
      })
    }
  }
}

// Error boundary integration
export const queryErrorHandler = (error: Error, query: any) => {
  console.error('Query error:', {
    error: error.message,
    queryKey: query.queryKey,
    timestamp: new Date().toISOString(),
  })

  // Report to monitoring service
  if (process.env['NODE_ENV'] === 'production') {
    // Could integrate with Sentry or other error tracking
  }
}

// Query client persistence (for offline support)
export const persistQueryClient = {
  serialize: (persistedClient: any) => {
    return JSON.stringify({
      ...persistedClient,
      timestamp: Date.now(),
    })
  },

  deserialize: (serializedClient: string) => {
    const parsed = JSON.parse(serializedClient)

    // Don't restore cache older than 1 hour
    if (Date.now() - parsed.timestamp > 60 * 60 * 1000) {
      return {
        queries: [],
        mutations: [],
      }
    }

    return parsed
  },
}

// Development tools configuration
export const reactQueryDevtools = {
  initialIsOpen: process.env['NODE_ENV'] === 'development',
  position: 'bottom-right' as const,
  buttonPosition: 'bottom-right' as const,
}