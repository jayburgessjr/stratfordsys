/**
 * Environment Configuration Utilities
 *
 * Provides type-safe access to environment variables with defaults
 * and validation for the Stratford AI application.
 */

import { z } from 'zod';
import { ENV_CONSTANTS } from '@/constants';

// Environment variable schema
const envSchema = z.object({
  // Node.js environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // API Configuration
  ALPHA_VANTAGE_API_KEY: z.string().optional(),
  ALPHA_VANTAGE_BASE_URL: z.string().url().default('https://www.alphavantage.co/query'),
  YAHOO_FINANCE_ENABLED: z.string().transform(val => val === 'true').default('true'),

  // Application Settings
  STRATFORD_RANDOM_SEED: z.string().transform(val => parseInt(val, 10)).default('42'),
  STRATFORD_SIMULATION_SEED: z.string().transform(val => parseInt(val, 10)).default('42'),
  STRATFORD_BACKTEST_SEED: z.string().transform(val => parseInt(val, 10)).default('42'),
  STRATFORD_VERSION: z.string().default('0.1.0'),
  STRATFORD_ENVIRONMENT: z.string().default('development'),

  // Development Settings
  NEXT_TELEMETRY_DISABLED: z.string().transform(val => val === '1').default('1'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error', 'silent']).default('debug'),
  ENABLE_CONSOLE_LOGS: z.string().transform(val => val === 'true').default('true'),
  ENABLE_MOCK_DATA: z.string().transform(val => val === 'true').default('true'),
  MOCK_API_DELAY_MS: z.string().transform(val => parseInt(val, 10)).default('500'),

  // Data Configuration
  CSV_DATA_PATH: z.string().default('./data/csv'),
  CACHE_PATH: z.string().default('./data/cache'),
  EXPORTS_PATH: z.string().default('./data/exports'),
  BACKTEST_RESULTS_PATH: z.string().default('./data/backtests'),
  MAX_HISTORICAL_YEARS: z.string().transform(val => parseInt(val, 10)).default('10'),
  DEFAULT_HISTORICAL_YEARS: z.string().transform(val => parseInt(val, 10)).default('5'),
  MAX_SYMBOLS_PER_REQUEST: z.string().transform(val => parseInt(val, 10)).default('5'),

  // Performance Settings
  CACHE_DURATION_MINUTES: z.string().transform(val => parseInt(val, 10)).default('60'),
  ENABLE_REDIS_CACHE: z.string().transform(val => val === 'true').default('false'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  API_TIMEOUT_MS: z.string().transform(val => parseInt(val, 10)).default('10000'),
  STRATEGY_TIMEOUT_MS: z.string().transform(val => parseInt(val, 10)).default('30000'),
  BACKTEST_TIMEOUT_MS: z.string().transform(val => parseInt(val, 10)).default('60000'),

  // Security Settings
  ENABLE_RATE_LIMITING: z.string().transform(val => val === 'true').default('true'),
  MAX_REQUESTS_PER_MINUTE: z.string().transform(val => parseInt(val, 10)).default('100'),
  ALLOWED_ORIGINS: z.string().default('http://localhost:3000'),

  // Database Configuration
  DATABASE_URL: z.string().default('file:./data/stratford.db'),
  TEST_DATABASE_URL: z.string().default('file:./data/test.db'),

  // Testing Configuration
  PLAYWRIGHT_HEADLESS: z.string().transform(val => val === 'true').default('true'),
  PLAYWRIGHT_BROWSER: z.enum(['chromium', 'firefox', 'webkit']).default('chromium'),
});

// Parse and validate environment variables
function parseEnv() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    console.error('❌ Invalid environment configuration:');
    if (error instanceof z.ZodError) {
      error.errors.forEach(err => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
    }
    throw new Error('Environment validation failed');
  }
}

// Export validated environment configuration
export const env = parseEnv();

// Environment-specific configuration
export const envConfig = ENV_CONSTANTS[env.NODE_ENV.toUpperCase() as keyof typeof ENV_CONSTANTS] || ENV_CONSTANTS.DEVELOPMENT;

// Helper functions
export const isDevelopment = env.NODE_ENV === 'development';
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';

// API configuration helpers
export const getApiConfig = () => ({
  alphaVantage: {
    apiKey: env.ALPHA_VANTAGE_API_KEY,
    baseUrl: env.ALPHA_VANTAGE_BASE_URL,
    timeout: env.API_TIMEOUT_MS,
  },
  yahooFinance: {
    enabled: env.YAHOO_FINANCE_ENABLED,
    timeout: env.API_TIMEOUT_MS,
  },
});

// Storage configuration helpers
export const getStorageConfig = () => ({
  csvDataPath: env.CSV_DATA_PATH,
  cachePath: env.CACHE_PATH,
  exportsPath: env.EXPORTS_PATH,
  backtestResultsPath: env.BACKTEST_RESULTS_PATH,
  databaseUrl: env.DATABASE_URL,
});

// Performance configuration helpers
export const getPerformanceConfig = () => ({
  cacheEnabled: env.ENABLE_REDIS_CACHE,
  cacheDurationMs: env.CACHE_DURATION_MINUTES * 60 * 1000,
  apiTimeoutMs: env.API_TIMEOUT_MS,
  strategyTimeoutMs: env.STRATEGY_TIMEOUT_MS,
  backtestTimeoutMs: env.BACKTEST_TIMEOUT_MS,
});

// Deterministic seeds
export const getSeeds = () => ({
  random: env.STRATFORD_RANDOM_SEED,
  simulation: env.STRATFORD_SIMULATION_SEED,
  backtest: env.STRATFORD_BACKTEST_SEED,
});

// Type exports for use in other modules
export type EnvConfig = typeof env;
export type ApiConfig = ReturnType<typeof getApiConfig>;
export type StorageConfig = ReturnType<typeof getStorageConfig>;
export type PerformanceConfig = ReturnType<typeof getPerformanceConfig>;