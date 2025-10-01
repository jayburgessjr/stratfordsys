import { useQuery, useMutation, useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys, prefetchStrategies } from './query-client'

/**
 * Custom React Query hooks for Stratford AI
 * Optimized for financial data with intelligent caching and error handling
 */

// =============================================================================
// Market Data Hooks
// =============================================================================

export function useMarketDataQuery(symbol: string, options?: {
  enabled?: boolean
  refetchInterval?: number
}) {
  return useQuery({
    queryKey: queryKeys.marketData.symbol(symbol),
    queryFn: async () => {
      const response = await fetch(`/api/market-data/${symbol}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch market data for ${symbol}`)
      }
      return response.json()
    },
    enabled: options?.enabled ?? true,
    refetchInterval: options?.refetchInterval ?? 30000, // 30 seconds for market data
    staleTime: 15000, // 15 seconds for market data
  })
}

export function useMultipleMarketData(symbols: string[]) {
  return useQuery({
    queryKey: queryKeys.marketData.symbols(symbols),
    queryFn: async () => {
      const response = await fetch('/api/market-data/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbols })
      })
      if (!response.ok) {
        throw new Error('Failed to fetch multiple market data')
      }
      return response.json()
    },
    enabled: symbols.length > 0,
    refetchInterval: 30000,
    staleTime: 15000,
  })
}

export function useOHLCVData(
  symbol: string,
  interval: string,
  range?: [Date, Date]
) {
  return useQuery({
    queryKey: queryKeys.marketData.ohlcv(symbol, interval, range),
    queryFn: async () => {
      const params = new URLSearchParams({
        symbol,
        interval,
        ...(range && {
          startDate: range[0].toISOString(),
          endDate: range[1].toISOString(),
        })
      })

      const response = await fetch(`/api/market-data/ohlcv?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch OHLCV data')
      }
      return response.json()
    },
    staleTime: 60000, // 1 minute for historical data
    gcTime: 300000,   // 5 minutes
  })
}

export function useTechnicalIndicators(
  symbol: string,
  indicator: string,
  timeframe: string = '1d'
) {
  return useQuery({
    queryKey: queryKeys.marketData.indicators(symbol, indicator, timeframe),
    queryFn: async () => {
      const response = await fetch(`/api/technical-indicators/${symbol}/${indicator}?timeframe=${timeframe}`)
      if (!response.ok) {
        throw new Error('Failed to fetch technical indicators')
      }
      return response.json()
    },
    staleTime: 120000, // 2 minutes for technical indicators
  })
}

// =============================================================================
// Portfolio Hooks
// =============================================================================

export function useUserPortfolios(userId: string) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: queryKeys.portfolio.byUser(userId),
    queryFn: async () => {
      const response = await fetch(`/api/portfolios/user/${userId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch user portfolios')
      }
      const portfolios = await response.json()

      // Prefetch portfolio details for better UX
      prefetchStrategies.prefetchPortfolioDetails(
        portfolios.map((p: any) => p.id).slice(0, 3)
      )

      return portfolios
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Mutation for creating new portfolio
  const createPortfolio = useMutation({
    mutationFn: async (portfolioData: any) => {
      const response = await fetch('/api/portfolios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...portfolioData, userId })
      })
      if (!response.ok) {
        throw new Error('Failed to create portfolio')
      }
      return response.json()
    },
    onSuccess: () => {
      // Invalidate and refetch portfolios list
      queryClient.invalidateQueries({ queryKey: queryKeys.portfolio.byUser(userId) })
    },
  })

  return {
    ...query,
    createPortfolio: createPortfolio.mutate,
    isCreating: createPortfolio.isPending,
    createError: createPortfolio.error,
  }
}

export function usePortfolioDetail(portfolioId: string) {
  return useQuery({
    queryKey: queryKeys.portfolio.detail(portfolioId),
    queryFn: async () => {
      const response = await fetch(`/api/portfolios/${portfolioId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch portfolio detail')
      }
      return response.json()
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export function usePortfolioPerformance(portfolioId: string, range?: [Date, Date]) {
  return useQuery({
    queryKey: queryKeys.portfolio.performance(portfolioId, range),
    queryFn: async () => {
      const params = new URLSearchParams({
        ...(range && {
          startDate: range[0].toISOString(),
          endDate: range[1].toISOString(),
        })
      })

      const response = await fetch(`/api/portfolios/${portfolioId}/performance?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch portfolio performance')
      }
      return response.json()
    },
    staleTime: 3 * 60 * 1000, // 3 minutes for performance data
  })
}

export function usePortfolioTrades(portfolioId: string, limit: number = 50) {
  return useInfiniteQuery({
    queryKey: queryKeys.portfolio.trades(portfolioId, limit),
    queryFn: async ({ pageParam = 0 }) => {
      const response = await fetch(`/api/portfolios/${portfolioId}/trades?offset=${pageParam}&limit=${limit}`)
      if (!response.ok) {
        throw new Error('Failed to fetch portfolio trades')
      }
      return response.json()
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.hasMore ? allPages.length * limit : undefined
    },
    staleTime: 60000, // 1 minute
  })
}

// =============================================================================
// Strategy Hooks
// =============================================================================

export function useUserStrategies(userId: string) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: queryKeys.strategy.byUser(userId),
    queryFn: async () => {
      const response = await fetch(`/api/strategies/user/${userId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch user strategies')
      }
      return response.json()
    },
    staleTime: 5 * 60 * 1000,
  })

  const createStrategy = useMutation({
    mutationFn: async (strategyData: any) => {
      const response = await fetch('/api/strategies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...strategyData, userId })
      })
      if (!response.ok) {
        throw new Error('Failed to create strategy')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.strategy.byUser(userId) })
    },
  })

  return {
    ...query,
    createStrategy: createStrategy.mutate,
    isCreating: createStrategy.isPending,
    createError: createStrategy.error,
  }
}

export function useTradingSignals(userId: string) {
  return useQuery({
    queryKey: queryKeys.strategy.signals(userId),
    queryFn: async () => {
      const response = await fetch(`/api/trading-signals/${userId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch trading signals')
      }
      return response.json()
    },
    refetchInterval: 60000, // 1 minute for signals
    staleTime: 30000,       // 30 seconds
  })
}

// =============================================================================
// News & Sentiment Hooks
// =============================================================================

export function useNewsForSymbol(symbol: string, options?: {
  startDate?: Date
  endDate?: Date
  limit?: number
}) {
  return useQuery({
    queryKey: queryKeys.news.symbol(symbol),
    queryFn: async () => {
      const params = new URLSearchParams({
        symbol,
        limit: (options?.limit || 20).toString(),
        ...(options?.startDate && { startDate: options.startDate.toISOString() }),
        ...(options?.endDate && { endDate: options.endDate.toISOString() }),
      })

      const response = await fetch(`/api/news?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch news')
      }
      return response.json()
    },
    staleTime: 2 * 60 * 1000, // 2 minutes for news
  })
}

export function useNewsSearch(query: string, filters?: any) {
  return useQuery({
    queryKey: queryKeys.news.search(query, filters),
    queryFn: async () => {
      const response = await fetch('/api/news/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, filters })
      })
      if (!response.ok) {
        throw new Error('Failed to search news')
      }
      return response.json()
    },
    enabled: query.length > 0,
    staleTime: 5 * 60 * 1000,
  })
}

export function useNewsSentiment(symbol: string, timeframe: number = 24) {
  return useQuery({
    queryKey: queryKeys.news.sentiment(symbol, timeframe),
    queryFn: async () => {
      const response = await fetch(`/api/news/${symbol}/sentiment?hours=${timeframe}`)
      if (!response.ok) {
        throw new Error('Failed to fetch news sentiment')
      }
      return response.json()
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000, // 10 minutes
  })
}

// =============================================================================
// Social Media Hooks
// =============================================================================

export function useSocialSentiment(
  symbol: string,
  platform?: string,
  hours: number = 24
) {
  return useQuery({
    queryKey: queryKeys.social.sentiment(symbol, platform, hours),
    queryFn: async () => {
      const params = new URLSearchParams({
        symbol,
        hours: hours.toString(),
        ...(platform && { platform }),
      })

      const response = await fetch(`/api/social/sentiment?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch social sentiment')
      }
      return response.json()
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 15 * 60 * 1000, // 15 minutes
  })
}

// =============================================================================
// System & Health Hooks
// =============================================================================

export function useSystemHealth() {
  return useQuery({
    queryKey: queryKeys.system.health(),
    queryFn: async () => {
      const response = await fetch('/api/system/health')
      if (!response.ok) {
        throw new Error('Failed to fetch system health')
      }
      return response.json()
    },
    refetchInterval: 30000, // 30 seconds
    staleTime: 10000,       // 10 seconds
    retry: 1, // Don't retry health checks aggressively
  })
}

export function useSystemStats() {
  return useQuery({
    queryKey: queryKeys.system.stats(),
    queryFn: async () => {
      const response = await fetch('/api/system/stats')
      if (!response.ok) {
        throw new Error('Failed to fetch system stats')
      }
      return response.json()
    },
    staleTime: 60000, // 1 minute
  })
}

// =============================================================================
// Custom Hooks for Performance Optimization
// =============================================================================

export function usePrefetchOnHover<T>(
  queryKey: readonly unknown[],
  queryFn: () => Promise<T>
) {
  const queryClient = useQueryClient()

  return {
    onMouseEnter: () => {
      queryClient.prefetchQuery({
        queryKey,
        queryFn,
        staleTime: 2 * 60 * 1000,
      })
    }
  }
}

export function useInvalidateQueries() {
  const queryClient = useQueryClient()

  return {
    invalidateMarketData: (symbol?: string) => {
      if (symbol) {
        queryClient.invalidateQueries({ queryKey: queryKeys.marketData.symbol(symbol) })
      } else {
        queryClient.invalidateQueries({ queryKey: queryKeys.marketData.all })
      }
    },
    invalidatePortfolio: (portfolioId?: string) => {
      if (portfolioId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.portfolio.detail(portfolioId) })
      } else {
        queryClient.invalidateQueries({ queryKey: queryKeys.portfolio.all })
      }
    },
    invalidateNews: (symbol?: string) => {
      if (symbol) {
        queryClient.invalidateQueries({ queryKey: queryKeys.news.symbol(symbol) })
      } else {
        queryClient.invalidateQueries({ queryKey: queryKeys.news.all })
      }
    },
  }
}