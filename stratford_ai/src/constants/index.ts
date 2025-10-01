/**
 * Stratford AI - Deterministic Constants
 *
 * This file contains all deterministic configuration values
 * to ensure reproducible results across all calculations.
 */

// Deterministic seeds for reproducible randomness
export const RANDOM_SEED = 42;
export const SIMULATION_SEED = 42;
export const BACKTEST_SEED = 42;

// Application metadata
export const APP_VERSION = '0.1.0';
export const APP_NAME = 'Stratford AI';
export const APP_DESCRIPTION = 'Deterministic AI wealth engine for solo operators';

// Data ingestion limits
export const DATA_LIMITS = {
  MAX_HISTORICAL_YEARS: 10,
  DEFAULT_HISTORICAL_YEARS: 5,
  MIN_DATA_POINTS: 100,
  MAX_MISSING_DATA_PERCENT: 5,
  MAX_SYMBOLS_PER_REQUEST: 5,
} as const;

// API configuration
export const API_CONFIG = {
  ALPHA_VANTAGE: {
    REQUESTS_PER_MINUTE: 5,
    REQUESTS_PER_DAY: 500,
    TIMEOUT_MS: 10000,
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY_MS: 1000,
  },
  YAHOO_FINANCE: {
    REQUESTS_PER_MINUTE: 60,
    TIMEOUT_MS: 5000,
    RETRY_ATTEMPTS: 2,
  },
} as const;

// Performance thresholds (in milliseconds)
export const PERFORMANCE_THRESHOLDS = {
  DATA_FETCH_TIMEOUT: 10000,
  STRATEGY_EXECUTION_TIMEOUT: 30000,
  DASHBOARD_LOAD_TIMEOUT: 2000,
  CSV_PARSE_TIMEOUT: 5000,
  BACKTEST_TIMEOUT: 60000,
} as const;

// Default strategy parameters
export const DEFAULT_STRATEGIES = {
  MOVING_AVERAGE_CROSSOVER: {
    SHORT_PERIOD: 20,
    LONG_PERIOD: 50,
    POSITION_SIZE: 1.0,
    COMMISSION: 0.001, // 0.1%
    SLIPPAGE: 0.0005, // 0.05%
  },
} as const;

// Risk management constants
export const RISK_MANAGEMENT = {
  MAX_POSITION_SIZE: 1.0,
  MIN_POSITION_SIZE: 0.01,
  MAX_DRAWDOWN_THRESHOLD: 0.2, // 20%
  MIN_SHARPE_RATIO: 0.5,
  VOLATILITY_LOOKBACK_DAYS: 252, // 1 year
} as const;

// Data validation constants
export const DATA_VALIDATION = {
  PRICE_DEVIATION_THRESHOLD: 0.5, // 50% day-over-day change
  VOLUME_SPIKE_THRESHOLD: 10.0, // 10x normal volume
  MIN_PRICE: 0.01,
  MAX_PRICE: 100000,
  REQUIRED_FIELDS: ['date', 'open', 'high', 'low', 'close', 'volume'] as const,
} as const;

// Validation settings for CSV parser and data processing
export const VALIDATION_SETTINGS = {
  MAX_DAILY_PRICE_CHANGE: 0.5, // 50% max daily price change
  VOLUME_SPIKE_THRESHOLD: 10.0, // 10x average volume spike threshold
  MAX_DATA_GAP_DAYS: 5, // Maximum allowed gap between trading days
  MIN_TRADING_DAYS_PER_YEAR: 200, // Minimum trading days expected per year
  PRICE_PRECISION: 2, // Decimal places for price values
  VOLUME_PRECISION: 0, // Decimal places for volume values
} as const;

// File paths and storage
export const STORAGE_PATHS = {
  CSV_DATA: './data/csv',
  CACHE: './data/cache',
  EXPORTS: './data/exports',
  BACKTEST_RESULTS: './data/backtests',
  LOGS: './data/logs',
} as const;

// UI configuration
export const UI_CONFIG = {
  CHART_COLORS: {
    PRIMARY: 'hsl(var(--primary))',
    SECONDARY: 'hsl(var(--secondary))',
    SUCCESS: '#22c55e',
    DANGER: '#ef4444',
    WARNING: '#f59e0b',
    UP: '#22c55e',
    DOWN: '#ef4444',
  },
  CHART_DIMENSIONS: {
    DEFAULT_HEIGHT: 400,
    DEFAULT_WIDTH: 800,
    MIN_HEIGHT: 200,
    MAX_HEIGHT: 800,
  },
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 25,
    MAX_PAGE_SIZE: 100,
  },
} as const;

// Environment-specific constants
export const ENV_CONSTANTS = {
  DEVELOPMENT: {
    LOG_LEVEL: 'debug',
    ENABLE_MOCK_DATA: true,
    CACHE_DURATION_MS: 60000, // 1 minute
  },
  PRODUCTION: {
    LOG_LEVEL: 'error',
    ENABLE_MOCK_DATA: false,
    CACHE_DURATION_MS: 3600000, // 1 hour
  },
  TEST: {
    LOG_LEVEL: 'silent',
    ENABLE_MOCK_DATA: true,
    CACHE_DURATION_MS: 0, // No cache in tests
  },
} as const;