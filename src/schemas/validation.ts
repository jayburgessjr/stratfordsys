/**
 * Zod Validation Schemas
 *
 * Runtime validation schemas corresponding to TypeScript type definitions.
 * Provides type-safe parsing and validation for market data, strategies,
 * and backtest results with comprehensive error handling.
 */

import { z } from 'zod';

// Base primitives with validation constraints
export const timestampSchema = z.string().datetime();
export const dateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const priceSchema = z.number().min(0.01).max(100000);
export const volumeSchema = z.number().int().min(0);
export const percentageSchema = z.number().min(-1).max(1);
export const symbolSchema = z.string().min(1).max(10).toUpperCase();
export const exchangeSchema = z.string().min(1).max(20);
export const currencySchema = z.string().length(3).toUpperCase();

// Market Data Schemas
const baseOhlcvSchema = z.object({
  date: dateStringSchema,
  open: priceSchema,
  high: priceSchema,
  low: priceSchema,
  close: priceSchema,
  volume: volumeSchema,
  adjustedClose: priceSchema.optional(),
});

export const ohlcvDataSchema = baseOhlcvSchema.refine(
  (data) => data.high >= Math.max(data.open, data.close, data.low),
  { message: "High must be >= max(open, close, low)" }
).refine(
  (data) => data.low <= Math.min(data.open, data.close, data.high),
  { message: "Low must be <= min(open, close, high)" }
);

export const marketDataPointSchema = baseOhlcvSchema.extend({
  symbol: symbolSchema,
  exchange: exchangeSchema.optional(),
  currency: currencySchema.optional(),
  timestamp: timestampSchema,
}).refine(
  (data) => data.high >= Math.max(data.open, data.close, data.low),
  { message: "High must be >= max(open, close, low)" }
).refine(
  (data) => data.low <= Math.min(data.open, data.close, data.high),
  { message: "Low must be <= min(open, close, high)" }
);

export const dataSourceSchema = z.enum([
  'ALPHA_VANTAGE',
  'YAHOO_FINANCE',
  'CSV_FILE',
  'MANUAL_INPUT'
]);

export const timeIntervalSchema = z.enum([
  '1min',
  '5min',
  '15min',
  '30min',
  '1hour',
  'daily',
  'weekly',
  'monthly'
]);

export const outputSizeSchema = z.enum(['compact', 'full']);

export const timeSeriesMetadataSchema = z.object({
  symbol: symbolSchema,
  exchange: exchangeSchema.optional(),
  currency: currencySchema,
  timeZone: z.string(),
  lastRefreshed: timestampSchema,
  dataSource: dataSourceSchema,
  interval: timeIntervalSchema,
  outputSize: outputSizeSchema,
});

export const timeSeriesSchema = z.object({
  symbol: symbolSchema,
  data: z.array(ohlcvDataSchema).min(1),
  metadata: timeSeriesMetadataSchema,
});

// Alpha Vantage API Schemas
export const alphaVantageMetaDataSchema = z.object({
  '1. Information': z.string(),
  '2. Symbol': z.string(),
  '3. Last Refreshed': z.string(),
  '4. Output Size': z.string().optional(),
  '5. Time Zone': z.string(),
  '4. Interval': z.string().optional(),
});

export const alphaVantageDataPointSchema = z.object({
  '1. open': z.string(),
  '2. high': z.string(),
  '3. low': z.string(),
  '4. close': z.string(),
  '5. volume': z.string(),
  '6. adjusted close': z.string().optional(),
});

export const alphaVantageTimeSeriesSchema = z.record(z.string(), alphaVantageDataPointSchema);

export const alphaVantageResponseSchema = z.object({
  'Meta Data': alphaVantageMetaDataSchema,
}).catchall(z.union([alphaVantageTimeSeriesSchema, alphaVantageMetaDataSchema]));

// Strategy Schemas
export const strategyTypeSchema = z.enum([
  'MOVING_AVERAGE_CROSSOVER',
  'MEAN_REVERSION',
  'MOMENTUM',
  'CUSTOM'
]);

export const movingAverageTypeSchema = z.enum([
  'SIMPLE',
  'EXPONENTIAL',
  'WEIGHTED'
]);

export const parameterValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.array(z.union([z.string(), z.number(), z.boolean()]))
]);

export const strategyParametersSchema = z.record(z.string(), parameterValueSchema);

export const movingAverageCrossoverParametersSchema = z.object({
  shortPeriod: z.number().int().min(1).max(200),
  longPeriod: z.number().int().min(1).max(200),
  maType: movingAverageTypeSchema,
  signalDelay: z.number().int().min(0).max(10),
}).and(strategyParametersSchema).refine(
  (data) => data.longPeriod > data.shortPeriod,
  { message: "Long period must be greater than short period" }
);

export const riskManagementConfigSchema = z.object({
  maxPositionSize: percentageSchema,
  stopLoss: percentageSchema.optional(),
  takeProfit: percentageSchema.optional(),
  maxDrawdown: percentageSchema,
  riskFreeRate: percentageSchema.optional(),
});

export const strategyMetadataSchema = z.object({
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
  version: z.string(),
  author: z.string().optional(),
  tags: z.array(z.string()),
  isActive: z.boolean(),
  backtestCount: z.number().int().min(0),
  lastBacktestAt: timestampSchema.optional(),
});

export const strategyConfigSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  type: strategyTypeSchema,
  description: z.string().max(500).optional(),
  parameters: strategyParametersSchema,
  riskManagement: riskManagementConfigSchema,
  metadata: strategyMetadataSchema,
});

// Signal and Position Schemas
export const signalTypeSchema = z.enum([
  'BUY',
  'SELL',
  'HOLD',
  'CLOSE_LONG',
  'CLOSE_SHORT'
]);

export const signalStrengthSchema = z.enum([
  'WEAK',
  'MODERATE',
  'STRONG'
]);

export const signalMetadataSchema = z.object({
  indicators: z.record(z.string(), z.number()),
  conditions: z.record(z.string(), z.boolean()),
  notes: z.string().optional(),
});

export const strategySignalSchema = z.object({
  timestamp: timestampSchema,
  date: dateStringSchema,
  symbol: symbolSchema,
  type: signalTypeSchema,
  strength: signalStrengthSchema,
  price: priceSchema,
  confidence: z.number().min(0).max(1),
  metadata: signalMetadataSchema,
});

export const positionTypeSchema = z.enum(['LONG', 'SHORT']);
export const positionStatusSchema = z.enum(['OPEN', 'CLOSED', 'PARTIAL']);

export const positionSchema = z.object({
  id: z.string().uuid(),
  symbol: symbolSchema,
  type: positionTypeSchema,
  entryDate: dateStringSchema,
  entryPrice: priceSchema,
  quantity: z.number().positive(),
  currentPrice: priceSchema.optional(),
  currentValue: priceSchema.optional(),
  unrealizedPnL: z.number().optional(),
  status: positionStatusSchema,
  strategy: z.string(),
});

export const tradeTypeSchema = z.enum(['MARKET', 'LIMIT', 'STOP', 'STOP_LIMIT']);
export const tradeSideSchema = z.enum(['BUY', 'SELL', 'SHORT', 'COVER']);

export const tradeSchema = z.object({
  id: z.string().uuid(),
  symbol: symbolSchema,
  type: tradeTypeSchema,
  side: tradeSideSchema,
  date: dateStringSchema,
  price: priceSchema,
  quantity: z.number().positive(),
  commission: z.number().min(0),
  slippage: z.number().min(0),
  totalCost: priceSchema,
  positionId: z.string().uuid().optional(),
  strategy: z.string(),
  signal: strategySignalSchema.optional(),
});

// Backtest Configuration Schemas
export const commissionTypeSchema = z.enum(['FIXED', 'PERCENTAGE', 'PER_SHARE']);
export const slippageTypeSchema = z.enum(['FIXED', 'PERCENTAGE', 'DYNAMIC']);

export const commissionConfigSchema = z.object({
  type: commissionTypeSchema,
  value: z.number().min(0),
  minimum: z.number().min(0).optional(),
  maximum: z.number().min(0).optional(),
});

export const slippageConfigSchema = z.object({
  type: slippageTypeSchema,
  value: z.number().min(0),
});

export const backtestOptionsSchema = z.object({
  includePartialPositions: z.boolean(),
  adjustForDividends: z.boolean(),
  adjustForSplits: z.boolean(),
  allowShortSelling: z.boolean(),
  maxLeverage: z.number().min(1).max(10),
  marginRequirement: percentageSchema,
  interestRate: percentageSchema,
});

export const dateRangeSchema = z.object({
  start: dateStringSchema,
  end: dateStringSchema,
}).refine(
  (data) => new Date(data.start) < new Date(data.end),
  { message: "Start date must be before end date" }
);

export const backtestConfigSchema = z.object({
  strategy: strategyConfigSchema,
  symbol: symbolSchema,
  period: dateRangeSchema,
  initialCapital: priceSchema,
  benchmark: symbolSchema.optional(),
  commission: commissionConfigSchema,
  slippage: slippageConfigSchema,
  seed: z.number().int(),
  options: backtestOptionsSchema,
});

// Backtest Results Schemas
export const monthlyReturnSchema = z.object({
  year: z.number().int().min(1900).max(2100),
  month: z.number().int().min(1).max(12),
  return: percentageSchema,
  startValue: priceSchema,
  endValue: priceSchema,
});

export const yearlyReturnSchema = z.object({
  year: z.number().int().min(1900).max(2100),
  return: percentageSchema,
  startValue: priceSchema,
  endValue: priceSchema,
  bestMonth: percentageSchema,
  worstMonth: percentageSchema,
});

export const cumulativeReturnSchema = z.object({
  date: dateStringSchema,
  return: percentageSchema,
  value: priceSchema,
});

export const returnAnalysisSchema = z.object({
  totalReturn: percentageSchema,
  annualizedReturn: percentageSchema,
  compoundAnnualGrowthRate: percentageSchema,
  dailyReturns: z.array(percentageSchema),
  monthlyReturns: z.array(monthlyReturnSchema),
  yearlyReturns: z.array(yearlyReturnSchema),
  cumulativeReturns: z.array(cumulativeReturnSchema),
});

export const downsideRiskSchema = z.object({
  downsideDeviation: percentageSchema,
  sortinoRatio: z.number(),
  negativeReturns: z.array(percentageSchema),
  worstDay: z.object({
    date: dateStringSchema,
    return: percentageSchema,
  }),
  worstMonth: z.object({
    year: z.number().int(),
    month: z.number().int().min(1).max(12),
    return: percentageSchema,
  }),
});

export const valueAtRiskSchema = z.object({
  var95: percentageSchema,
  var99: percentageSchema,
  conditionalVar95: percentageSchema,
  conditionalVar99: percentageSchema,
});

export const riskAnalysisSchema = z.object({
  volatility: percentageSchema,
  downside: downsideRiskSchema,
  valueAtRisk: valueAtRiskSchema,
  beta: z.number().optional(),
  correlation: z.number().min(-1).max(1).optional(),
});

export const tradingFrequencySchema = z.object({
  tradesPerYear: z.number().min(0),
  tradesPerMonth: z.number().min(0),
  averageDaysBetweenTrades: z.number().min(0),
});

export const tradingCostsSchema = z.object({
  totalCommission: priceSchema,
  totalSlippage: priceSchema,
  totalCosts: priceSchema,
  costAsPercentage: percentageSchema,
});

export const tradingAnalysisSchema = z.object({
  totalTrades: z.number().int().min(0),
  winningTrades: z.number().int().min(0),
  losingTrades: z.number().int().min(0),
  winRate: percentageSchema,
  profitFactor: z.number().min(0),
  averageWin: priceSchema,
  averageLoss: z.number().max(0),
  largestWin: priceSchema,
  largestLoss: z.number().max(0),
  averageHoldingPeriod: z.number().min(0),
  tradingFrequency: tradingFrequencySchema,
  commission: tradingCostsSchema,
});

export const performanceRatiosSchema = z.object({
  sharpeRatio: z.number(),
  sortinoRatio: z.number(),
  calmarRatio: z.number(),
  sterlingRatio: z.number(),
  burkeRatio: z.number(),
  informationRatio: z.number().optional(),
  treynorRatio: z.number().optional(),
});

export const drawdownPeriodSchema = z.object({
  start: dateStringSchema,
  end: dateStringSchema,
  trough: dateStringSchema,
  duration: z.number().int().min(0),
  depth: percentageSchema,
  recovered: z.boolean(),
  recoveryDate: dateStringSchema.optional(),
  recoveryDuration: z.number().int().min(0).optional(),
});

export const recoveryAnalysisSchema = z.object({
  averageRecoveryTime: z.number().min(0),
  longestRecoveryTime: z.number().min(0),
  shortestRecoveryTime: z.number().min(0),
  currentDrawdown: percentageSchema.optional(),
  currentDrawdownDuration: z.number().int().min(0).optional(),
});

export const drawdownAnalysisSchema = z.object({
  maxDrawdown: percentageSchema,
  maxDrawdownDuration: z.number().int().min(0),
  maxDrawdownPeriod: dateRangeSchema,
  averageDrawdown: percentageSchema,
  averageDrawdownDuration: z.number().min(0),
  drawdownPeriods: z.array(drawdownPeriodSchema),
  recovery: recoveryAnalysisSchema,
});

export const equityPointSchema = z.object({
  date: dateStringSchema,
  value: priceSchema,
  drawdown: percentageSchema,
  return: percentageSchema,
  benchmark: priceSchema.optional(),
});

export const backtestExecutionSchema = z.object({
  startDate: dateStringSchema,
  endDate: dateStringSchema,
  totalDays: z.number().int().min(0),
  tradingDays: z.number().int().min(0),
  initialCapital: priceSchema,
  finalValue: priceSchema,
  seed: z.number().int(),
  executionTime: z.number().min(0),
  dataPoints: z.number().int().min(0),
});

export const performanceAnalysisSchema = z.object({
  returns: returnAnalysisSchema,
  risk: riskAnalysisSchema,
  trading: tradingAnalysisSchema,
  ratios: performanceRatiosSchema,
  drawdown: drawdownAnalysisSchema,
  periods: z.object({
    monthly: z.array(z.object({
      period: z.string(),
      return: percentageSchema,
      volatility: percentageSchema,
      sharpeRatio: z.number(),
      maxDrawdown: percentageSchema,
      trades: z.number().int().min(0),
    })),
    quarterly: z.array(z.object({
      period: z.string(),
      return: percentageSchema,
      volatility: percentageSchema,
      sharpeRatio: z.number(),
      maxDrawdown: percentageSchema,
      trades: z.number().int().min(0),
    })),
    yearly: z.array(z.object({
      period: z.string(),
      return: percentageSchema,
      volatility: percentageSchema,
      sharpeRatio: z.number(),
      maxDrawdown: percentageSchema,
      trades: z.number().int().min(0),
    })),
    bestPeriods: z.object({
      bestDay: z.object({
        period: z.string(),
        return: percentageSchema,
        date: dateStringSchema,
      }),
      worstDay: z.object({
        period: z.string(),
        return: percentageSchema,
        date: dateStringSchema,
      }),
      bestMonth: z.object({
        period: z.string(),
        return: percentageSchema,
        date: dateStringSchema,
      }),
      worstMonth: z.object({
        period: z.string(),
        return: percentageSchema,
        date: dateStringSchema,
      }),
      bestYear: z.object({
        period: z.string(),
        return: percentageSchema,
        date: dateStringSchema,
      }),
      worstYear: z.object({
        period: z.string(),
        return: percentageSchema,
        date: dateStringSchema,
      }),
    }),
    worstPeriods: z.object({
      bestDay: z.object({
        period: z.string(),
        return: percentageSchema,
        date: dateStringSchema,
      }),
      worstDay: z.object({
        period: z.string(),
        return: percentageSchema,
        date: dateStringSchema,
      }),
      bestMonth: z.object({
        period: z.string(),
        return: percentageSchema,
        date: dateStringSchema,
      }),
      worstMonth: z.object({
        period: z.string(),
        return: percentageSchema,
        date: dateStringSchema,
      }),
      bestYear: z.object({
        period: z.string(),
        return: percentageSchema,
        date: dateStringSchema,
      }),
      worstYear: z.object({
        period: z.string(),
        return: percentageSchema,
        date: dateStringSchema,
      }),
    }),
  }),
});

export const backtestMetadataSchema = z.object({
  createdAt: timestampSchema,
  version: z.string(),
  engine: z.string(),
  dataSource: z.string(),
  benchmark: z.object({
    symbol: symbolSchema,
    name: z.string(),
    totalReturn: percentageSchema,
    volatility: percentageSchema,
    sharpeRatio: z.number(),
  }).optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()),
});

export const backtestResultSchema = z.object({
  id: z.string().uuid(),
  strategy: strategyConfigSchema,
  symbol: symbolSchema,
  period: dateRangeSchema,
  execution: backtestExecutionSchema,
  performance: performanceAnalysisSchema,
  trades: z.array(tradeSchema),
  positions: z.array(positionSchema),
  signals: z.array(strategySignalSchema),
  equity: z.array(equityPointSchema),
  metadata: backtestMetadataSchema,
});

// CSV Import Schemas
export const csvColumnMappingSchema = z.object({
  date: z.union([z.number(), z.string()]),
  open: z.union([z.number(), z.string()]),
  high: z.union([z.number(), z.string()]),
  low: z.union([z.number(), z.string()]),
  close: z.union([z.number(), z.string()]),
  volume: z.union([z.number(), z.string()]),
  adjustedClose: z.union([z.number(), z.string()]).optional(),
});

export const csvImportOptionsSchema = z.object({
  hasHeader: z.boolean(),
  delimiter: z.string().length(1),
  dateFormat: z.string(),
  columnMapping: csvColumnMappingSchema,
  skipRows: z.number().int().min(0).optional(),
  maxRows: z.number().int().min(1).optional(),
});

// Validation Error Schemas
export const validationErrorTypeSchema = z.enum([
  'MISSING_REQUIRED_FIELD',
  'INVALID_DATA_TYPE',
  'INVALID_PRICE_RANGE',
  'INVALID_VOLUME',
  'INVALID_DATE_FORMAT',
  'DUPLICATE_DATE',
  'OHLC_VALIDATION_FAILED',
  'PRICE_DEVIATION_EXCEEDED'
]);

export const validationWarningTypeSchema = z.enum([
  'MISSING_OPTIONAL_FIELD',
  'UNUSUAL_VOLUME_SPIKE',
  'LARGE_PRICE_MOVEMENT',
  'MISSING_TRADING_DAYS',
  'DATA_GAP_DETECTED'
]);

export const dataValidationErrorSchema = z.object({
  type: validationErrorTypeSchema,
  message: z.string(),
  field: z.string().optional(),
  value: z.unknown().optional(),
  index: z.number().optional(),
});

export const dataValidationWarningSchema = z.object({
  type: validationWarningTypeSchema,
  message: z.string(),
  field: z.string().optional(),
  value: z.unknown().optional(),
  index: z.number().optional(),
});

export const dataValidationResultSchema = z.object({
  isValid: z.boolean(),
  errors: z.array(dataValidationErrorSchema),
  warnings: z.array(dataValidationWarningSchema),
  cleanedData: timeSeriesSchema.optional(),
});

// Status and Progress Schemas
export const backtestStatusSchema = z.enum([
  'PENDING',
  'RUNNING',
  'COMPLETED',
  'FAILED',
  'CANCELLED'
]);

export const backtestProgressSchema = z.object({
  status: backtestStatusSchema,
  progress: z.number().min(0).max(1),
  currentDate: dateStringSchema.optional(),
  estimatedTimeRemaining: z.number().min(0).optional(),
  message: z.string().optional(),
});

// Export utility functions
export const parseMarketData = (data: unknown) => ohlcvDataSchema.parse(data);
export const parseTimeSeries = (data: unknown) => timeSeriesSchema.parse(data);
export const parseStrategyConfig = (data: unknown) => strategyConfigSchema.parse(data);
export const parseBacktestResult = (data: unknown) => backtestResultSchema.parse(data);
export const parseAlphaVantageResponse = (data: unknown) => alphaVantageResponseSchema.parse(data);

// Utility function for safe parsing with error handling
export const safeParse = <T>(schema: z.ZodSchema<T>, data: unknown) => {
  const result = schema.safeParse(data);
  if (!result.success) {
    return {
      success: false,
      error: result.error,
      data: null,
    };
  }
  return {
    success: true,
    error: null,
    data: result.data,
  };
};