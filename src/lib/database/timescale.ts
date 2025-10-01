import { prisma } from './prisma'

/**
 * TimescaleDB Service for High-Performance Time-Series Market Data
 * Optimized for financial data with proper indexing and compression
 */

export interface MarketDataInsert {
  symbol: string
  timestamp: Date
  open: number
  high: number
  low: number
  close: number
  volume: number
  adjustedClose?: number
  splitRatio?: number
  dividendAmount?: number
  source: string
  interval: string
}

export interface TimeSeriesQuery {
  symbol?: string
  symbols?: string[]
  startDate: Date
  endDate: Date
  interval: string
  source?: string
  limit?: number
}

export class TimescaleService {
  // Initialize TimescaleDB hypertables and indexes
  static async initializeTimescaleDB(): Promise<void> {
    try {
      // Create hypertable for market data points (optimized for time-series queries)
      await prisma.$executeRaw`
        SELECT create_hypertable(
          'market_data_points',
          'timestamp',
          chunk_time_interval => INTERVAL '1 day',
          if_not_exists => TRUE
        );
      `

      // Create hypertable for technical indicators
      await prisma.$executeRaw`
        SELECT create_hypertable(
          'technical_indicators',
          'timestamp',
          chunk_time_interval => INTERVAL '1 day',
          if_not_exists => TRUE
        );
      `

      // Create hypertable for system metrics
      await prisma.$executeRaw`
        SELECT create_hypertable(
          'system_metrics',
          'timestamp',
          chunk_time_interval => INTERVAL '1 hour',
          if_not_exists => TRUE
        );
      `

      // Create composite indexes for optimal query performance
      await prisma.$executeRaw`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_market_data_symbol_time_interval
        ON market_data_points (symbol, timestamp DESC, interval);
      `

      await prisma.$executeRaw`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_market_data_time_symbol
        ON market_data_points (timestamp DESC, symbol);
      `

      await prisma.$executeRaw`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_technical_indicator_symbol_name_time
        ON technical_indicators (symbol, name, timestamp DESC);
      `

      // Set up compression policy for older data (after 7 days)
      await prisma.$executeRaw`
        SELECT add_compression_policy('market_data_points', INTERVAL '7 days', if_not_exists => TRUE);
      `

      await prisma.$executeRaw`
        SELECT add_compression_policy('technical_indicators', INTERVAL '7 days', if_not_exists => TRUE);
      `

      // Set up retention policy (keep data for 2 years)
      await prisma.$executeRaw`
        SELECT add_retention_policy('market_data_points', INTERVAL '2 years', if_not_exists => TRUE);
      `

      console.log('TimescaleDB initialized successfully')
    } catch (error) {
      console.error('Failed to initialize TimescaleDB:', error)
      // Continue without TimescaleDB optimizations if not available
    }
  }

  // Bulk insert market data with conflict resolution
  static async bulkInsertMarketData(data: MarketDataInsert[]): Promise<void> {
    if (data.length === 0) return

    const values = data.map(point => ({
      symbol: point.symbol,
      timestamp: point.timestamp,
      open: point.open,
      high: point.high,
      low: point.low,
      close: point.close,
      volume: point.volume,
      adjustedClose: point.adjustedClose,
      splitRatio: point.splitRatio,
      dividendAmount: point.dividendAmount,
      source: point.source,
      interval: point.interval,
    }))

    await prisma.marketDataPoint.createMany({
      data: values,
      skipDuplicates: true, // Handle conflicts gracefully
    })
  }

  // High-performance time-series queries with aggregation
  static async getOHLCVData(query: TimeSeriesQuery) {
    const {
      symbol,
      symbols,
      startDate,
      endDate,
      interval,
      source = '%',
      limit = 1000
    } = query

    // Build symbol filter
    const symbolFilter = symbol
      ? { equals: symbol }
      : symbols
        ? { in: symbols }
        : undefined

    return await prisma.marketDataPoint.findMany({
      where: {
        ...(symbolFilter && { symbol: symbolFilter }),
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
        interval: interval,
        ...(source !== '%' && { source }),
      },
      orderBy: [
        { symbol: 'asc' },
        { timestamp: 'asc' },
      ],
      take: limit,
      select: {
        symbol: true,
        timestamp: true,
        open: true,
        high: true,
        low: true,
        close: true,
        volume: true,
        adjustedClose: true,
      }
    })
  }

  // Time-bucketed aggregations (useful for different timeframes)
  static async getAggregatedData(
    symbol: string,
    startDate: Date,
    endDate: Date,
    bucketInterval: string // '1 hour', '4 hour', '1 day', etc.
  ) {
    return await prisma.$queryRaw`
      SELECT
        symbol,
        time_bucket(${bucketInterval}::interval, timestamp) as bucket,
        FIRST(open, timestamp) as open,
        MAX(high) as high,
        MIN(low) as low,
        LAST(close, timestamp) as close,
        SUM(volume) as volume,
        COUNT(*) as data_points
      FROM market_data_points
      WHERE symbol = ${symbol}
        AND timestamp >= ${startDate}
        AND timestamp <= ${endDate}
      GROUP BY symbol, bucket
      ORDER BY bucket ASC;
    `
  }

  // Get latest prices for multiple symbols (optimized query)
  static async getLatestPrices(symbols: string[], interval: string = '1d') {
    return await prisma.$queryRaw`
      SELECT DISTINCT ON (symbol)
        symbol,
        timestamp,
        close as price,
        volume
      FROM market_data_points
      WHERE symbol = ANY(${symbols})
        AND interval = ${interval}
      ORDER BY symbol, timestamp DESC;
    `
  }

  // Technical indicator storage and retrieval
  static async storeTechnicalIndicator(
    symbol: string,
    timestamp: Date,
    name: string,
    value: number,
    timeframe: string,
    parameters?: any
  ): Promise<void> {
    await prisma.technicalIndicator.upsert({
      where: {
        symbol_timestamp_name_timeframe: {
          symbol,
          timestamp,
          name,
          timeframe,
        }
      },
      create: {
        symbol,
        timestamp,
        name,
        value,
        timeframe,
        source: 'INTERNAL',
        parameters,
      },
      update: {
        value,
        parameters,
      }
    })
  }

  // Get technical indicators with time range
  static async getTechnicalIndicators(
    symbol: string,
    indicator: string,
    startDate: Date,
    endDate: Date,
    timeframe: string = '1d'
  ) {
    return await prisma.technicalIndicator.findMany({
      where: {
        symbol,
        name: indicator,
        timeframe,
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        timestamp: 'asc'
      },
      select: {
        timestamp: true,
        value: true,
        parameters: true,
      }
    })
  }

  // System metrics for monitoring
  static async recordSystemMetric(
    name: string,
    value: number,
    unit?: string,
    tags?: any,
    source: string = 'APPLICATION'
  ): Promise<void> {
    await prisma.systemMetric.create({
      data: {
        name,
        value,
        unit,
        tags,
        source,
      }
    })
  }

  // Get system metrics for monitoring dashboard
  static async getSystemMetrics(
    metricName: string,
    startDate: Date,
    endDate: Date,
    bucketInterval: string = '5 minutes'
  ) {
    return await prisma.$queryRaw`
      SELECT
        time_bucket(${bucketInterval}::interval, timestamp) as bucket,
        AVG(value) as avg_value,
        MIN(value) as min_value,
        MAX(value) as max_value,
        COUNT(*) as count
      FROM system_metrics
      WHERE name = ${metricName}
        AND timestamp >= ${startDate}
        AND timestamp <= ${endDate}
      GROUP BY bucket
      ORDER BY bucket ASC;
    `
  }

  // Data maintenance and cleanup
  static async cleanupOldData(retentionDays: number = 730): Promise<void> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays)

    // Delete old market data
    const deletedMarketData = await prisma.marketDataPoint.deleteMany({
      where: {
        timestamp: {
          lt: cutoffDate
        }
      }
    })

    // Delete old technical indicators
    const deletedIndicators = await prisma.technicalIndicator.deleteMany({
      where: {
        timestamp: {
          lt: cutoffDate
        }
      }
    })

    console.log(`Cleaned up ${deletedMarketData.count} market data points and ${deletedIndicators.count} indicators`)
  }

  // Database statistics for monitoring
  static async getDatabaseStats() {
    const [
      marketDataCount,
      indicatorCount,
      systemMetricCount,
      latestMarketData,
      oldestMarketData
    ] = await Promise.all([
      prisma.marketDataPoint.count(),
      prisma.technicalIndicator.count(),
      prisma.systemMetric.count(),
      prisma.marketDataPoint.findFirst({
        orderBy: { timestamp: 'desc' },
        select: { timestamp: true, symbol: true }
      }),
      prisma.marketDataPoint.findFirst({
        orderBy: { timestamp: 'asc' },
        select: { timestamp: true, symbol: true }
      })
    ])

    return {
      marketDataPoints: marketDataCount,
      technicalIndicators: indicatorCount,
      systemMetrics: systemMetricCount,
      dataRange: {
        oldest: oldestMarketData?.timestamp,
        latest: latestMarketData?.timestamp,
      }
    }
  }
}

// Export singleton instance
export const timescaleService = TimescaleService