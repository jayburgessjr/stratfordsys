/**
 * Alpha Vantage API Integration
 *
 * Deterministic API client for fetching financial market data from Alpha Vantage
 * with comprehensive rate limiting, error handling, and data transformation.
 */

import { z } from 'zod';
import { log } from '@/lib/logger';
import { env } from '@/lib/env';
import { API_CONFIG, PERFORMANCE_THRESHOLDS } from '@/constants';
import {
  alphaVantageResponseSchema,
  timeSeriesSchema,
  parseAlphaVantageResponse,
  safeParse,
} from '@/schemas/validation';
import type {
  TimeSeries,
  TimeSeriesMetadata,
  OHLCVData,
  Symbol,
  TimeInterval,
  OutputSize,
  AlphaVantageResponse,
  DataValidationResult,
} from '@/types/market-data';

/**
 * Alpha Vantage API client with rate limiting and caching
 */
export class AlphaVantageClient {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://www.alphavantage.co/query';
  private readonly rateLimiter: RateLimiter;
  private readonly cache = new Map<string, CacheEntry>();

  constructor(apiKey?: string) {
    this.apiKey = apiKey || env.ALPHA_VANTAGE_API_KEY || '';
    this.rateLimiter = new RateLimiter(
      API_CONFIG.ALPHA_VANTAGE.REQUESTS_PER_MINUTE,
      60000 // 1 minute
    );

    if (!this.apiKey) {
      log.warn('Alpha Vantage API key not provided - using demo key');
    }
  }

  /**
   * Fetch daily time series data for a symbol
   */
  async getDailyTimeSeries(
    symbol: Symbol,
    outputSize: OutputSize = 'compact'
  ): Promise<TimeSeries> {
    const startTime = performance.now();
    log.info('Fetching daily time series', { symbol, outputSize });

    try {
      // Check cache first
      const cacheKey = `daily_${symbol}_${outputSize}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        log.info('Returning cached data', { symbol, cacheAge: Date.now() - cached.timestamp });
        return cached.data;
      }

      // Apply rate limiting
      await this.rateLimiter.acquire();

      // Build request parameters
      const params = new URLSearchParams({
        function: 'TIME_SERIES_DAILY_ADJUSTED',
        symbol: symbol.toUpperCase(),
        outputsize: outputSize,
        apikey: this.apiKey || 'demo',
      });

      // Make API request
      const response = await this.makeRequest(params);

      // Parse and validate response
      const parsedResponse = this.parseResponse(response);

      // Transform to our format
      const timeSeries = this.transformToTimeSeries(parsedResponse, symbol, 'daily');

      // Cache the result
      this.setCache(cacheKey, timeSeries);

      const duration = performance.now() - startTime;
      log.performance('Alpha Vantage request completed', {
        symbol,
        duration,
        dataPoints: timeSeries.data.length
      });

      return timeSeries;

    } catch (error) {
      const duration = performance.now() - startTime;
      log.error('Alpha Vantage request failed', { symbol, duration, error });
      throw this.handleError(error, symbol);
    }
  }

  /**
   * Fetch intraday time series data
   */
  async getIntradayTimeSeries(
    symbol: Symbol,
    interval: TimeInterval = '1min',
    outputSize: OutputSize = 'compact'
  ): Promise<TimeSeries> {
    const startTime = performance.now();
    log.info('Fetching intraday time series', { symbol, interval, outputSize });

    try {
      const cacheKey = `intraday_${symbol}_${interval}_${outputSize}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        log.info('Returning cached intraday data', { symbol, interval });
        return cached.data;
      }

      await this.rateLimiter.acquire();

      const params = new URLSearchParams({
        function: 'TIME_SERIES_INTRADAY',
        symbol: symbol.toUpperCase(),
        interval,
        outputsize: outputSize,
        apikey: this.apiKey || 'demo',
      });

      const response = await this.makeRequest(params);
      const parsedResponse = this.parseResponse(response);
      const timeSeries = this.transformToTimeSeries(parsedResponse, symbol, interval);

      this.setCache(cacheKey, timeSeries);

      const duration = performance.now() - startTime;
      log.performance('Alpha Vantage intraday request completed', {
        symbol,
        interval,
        duration,
        dataPoints: timeSeries.data.length
      });

      return timeSeries;

    } catch (error) {
      const duration = performance.now() - startTime;
      log.error('Alpha Vantage intraday request failed', { symbol, interval, duration, error });
      throw this.handleError(error, symbol);
    }
  }

  /**
   * Check API quota status
   */
  async checkQuota(): Promise<QuotaInfo> {
    try {
      // Make a lightweight request to check quota
      const params = new URLSearchParams({
        function: 'GLOBAL_QUOTE',
        symbol: 'AAPL',
        apikey: this.apiKey || 'demo',
      });

      const startTime = Date.now();
      const response = await fetch(`${this.baseUrl}?${params}`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Stratford-AI/1.0',
        },
      });

      const responseTime = Date.now() - startTime;
      const isHealthy = response.ok && responseTime < PERFORMANCE_THRESHOLDS.DATA_FETCH_TIMEOUT;

      return {
        isHealthy,
        responseTime,
        remainingCalls: this.rateLimiter.getRemainingCalls(),
        resetTime: this.rateLimiter.getResetTime(),
      };

    } catch (error) {
      log.error('Quota check failed', { error });
      return {
        isHealthy: false,
        responseTime: PERFORMANCE_THRESHOLDS.DATA_FETCH_TIMEOUT,
        remainingCalls: 0,
        resetTime: Date.now() + 60000,
      };
    }
  }

  /**
   * Make HTTP request with retries and error handling
   */
  private async makeRequest(params: URLSearchParams): Promise<AlphaVantageResponse> {
    const url = `${this.baseUrl}?${params}`;
    let lastError: Error;

    for (let attempt = 1; attempt <= API_CONFIG.ALPHA_VANTAGE.RETRY_ATTEMPTS; attempt++) {
      try {
        log.info('Making Alpha Vantage request', { attempt, url: url.replace(/apikey=[^&]+/, 'apikey=***') });

        // Create AbortController only if supported
        let controller: AbortController | undefined;
        let timeoutId: NodeJS.Timeout | undefined;

        try {
          controller = new AbortController();
          timeoutId = setTimeout(
            () => controller?.abort(),
            API_CONFIG.ALPHA_VANTAGE.TIMEOUT_MS
          );
        } catch (error) {
          // AbortController not supported in this environment
          log.warn('AbortController not supported, using basic timeout');
        }

        const fetchOptions: RequestInit = {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Stratford-AI/1.0',
          },
        };

        if (controller) {
          fetchOptions.signal = controller.signal;
        }

        const response = await fetch(url, fetchOptions);

        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json() as AlphaVantageResponse;

        // Check for API error responses
        if ('Error Message' in data) {
          throw new Error(`API Error: ${data['Error Message']}`);
        }

        if ('Note' in data) {
          throw new Error(`API Rate Limit: ${data.Note}`);
        }

        return data;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');

        if (attempt < API_CONFIG.ALPHA_VANTAGE.RETRY_ATTEMPTS) {
          const delay = API_CONFIG.ALPHA_VANTAGE.RETRY_DELAY_MS * Math.pow(2, attempt - 1);
          log.warn('Request failed, retrying', { attempt, delay, error: lastError.message });
          await this.delay(delay);
        }
      }
    }

    throw lastError!;
  }

  /**
   * Parse and validate API response
   */
  private parseResponse(response: AlphaVantageResponse): AlphaVantageResponse {
    const parseResult = safeParse(alphaVantageResponseSchema, response);

    if (!parseResult.success) {
      log.error('Invalid API response format', { error: parseResult.error });
      throw new Error('Invalid API response format');
    }

    return parseResult.data;
  }

  /**
   * Transform Alpha Vantage response to our TimeSeries format
   */
  private transformToTimeSeries(
    response: AlphaVantageResponse,
    symbol: Symbol,
    interval: TimeInterval
  ): TimeSeries {
    const metaData = response['Meta Data'];
    const timeSeriesKey = this.getTimeSeriesKey(response);
    const timeSeriesData = response[timeSeriesKey];

    if (!timeSeriesData || typeof timeSeriesData !== 'object') {
      throw new Error('No time series data found in response');
    }

    // Transform data points
    const ohlcvData: OHLCVData[] = [];

    for (const [dateStr, dataPoint] of Object.entries(timeSeriesData)) {
      if (typeof dataPoint === 'object' && dataPoint !== null) {
        try {
          const ohlcv: OHLCVData = {
            date: this.normalizeDate(dateStr),
            open: parseFloat(dataPoint['1. open']),
            high: parseFloat(dataPoint['2. high']),
            low: parseFloat(dataPoint['3. low']),
            close: parseFloat(dataPoint['4. close']),
            volume: parseInt(dataPoint['5. volume'], 10),
            adjustedClose: dataPoint['6. adjusted close']
              ? parseFloat(dataPoint['6. adjusted close'])
              : undefined,
          };

          ohlcvData.push(ohlcv);
        } catch (error) {
          log.warn('Skipping invalid data point', { date: dateStr, error });
        }
      }
    }

    // Sort by date ascending
    ohlcvData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Create metadata
    const metadata: TimeSeriesMetadata = {
      symbol: symbol.toUpperCase(),
      exchange: 'NASDAQ', // Default assumption
      currency: 'USD',
      timeZone: metaData['5. Time Zone'] || 'US/Eastern',
      lastRefreshed: metaData['3. Last Refreshed'],
      dataSource: 'ALPHA_VANTAGE',
      interval,
      outputSize: metaData['4. Output Size'] as OutputSize || 'compact',
    };

    const timeSeries: TimeSeries = {
      symbol: symbol.toUpperCase(),
      data: ohlcvData,
      metadata,
    };

    // Validate the final result
    const validationResult = safeParse(timeSeriesSchema, timeSeries);
    if (!validationResult.success) {
      log.error('Generated TimeSeries failed validation', { error: validationResult.error });
      throw new Error('Data transformation failed validation');
    }

    return validationResult.data;
  }

  /**
   * Get the time series key from response
   */
  private getTimeSeriesKey(response: AlphaVantageResponse): string {
    const keys = Object.keys(response).filter(key => key !== 'Meta Data');

    if (keys.length === 0) {
      throw new Error('No time series data found');
    }

    return keys[0];
  }

  /**
   * Normalize date format
   */
  private normalizeDate(dateStr: string): string {
    // Handle both YYYY-MM-DD and YYYY-MM-DD HH:mm:ss formats
    return dateStr.split(' ')[0];
  }

  /**
   * Handle API errors with specific error types
   */
  private handleError(error: unknown, symbol: Symbol): AlphaVantageError {
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message.includes('rate limit') || message.includes('API calls per minute')) {
      return new AlphaVantageError('RATE_LIMIT', `Rate limit exceeded for ${symbol}`, symbol);
    }

    if (message.includes('Invalid API call') || message.includes('Error Message')) {
      return new AlphaVantageError('INVALID_SYMBOL', `Invalid symbol: ${symbol}`, symbol);
    }

    if (message.includes('timeout') || message.includes('aborted')) {
      return new AlphaVantageError('TIMEOUT', `Request timeout for ${symbol}`, symbol);
    }

    if (message.includes('HTTP 401') || message.includes('authentication')) {
      return new AlphaVantageError('AUTH_ERROR', 'Invalid API key', symbol);
    }

    return new AlphaVantageError('UNKNOWN', message, symbol);
  }

  /**
   * Cache management
   */
  private getFromCache(key: string): CacheEntry | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry;
  }

  private setCache(key: string, data: TimeSeries, ttl: number = 300000): void { // 5 minutes default
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Rate limiter for API requests
 */
class RateLimiter {
  private requests: number[] = [];
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  async acquire(): Promise<void> {
    const now = Date.now();

    // Remove old requests outside the window
    this.requests = this.requests.filter(timestamp => now - timestamp < this.windowMs);

    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = Math.min(...this.requests);
      const waitTime = this.windowMs - (now - oldestRequest) + 100; // Add 100ms buffer

      log.info('Rate limit reached, waiting', { waitTime });
      await this.delay(waitTime);
      return this.acquire(); // Recursive call after waiting
    }

    this.requests.push(now);
  }

  getRemainingCalls(): number {
    const now = Date.now();
    const recentRequests = this.requests.filter(timestamp => now - timestamp < this.windowMs);
    return Math.max(0, this.maxRequests - recentRequests.length);
  }

  getResetTime(): number {
    if (this.requests.length === 0) return Date.now();
    return Math.min(...this.requests) + this.windowMs;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Custom error class for Alpha Vantage API errors
 */
export class AlphaVantageError extends Error {
  constructor(
    public readonly type: AlphaVantageErrorType,
    message: string,
    public readonly symbol?: Symbol
  ) {
    super(message);
    this.name = 'AlphaVantageError';
  }
}

export type AlphaVantageErrorType =
  | 'RATE_LIMIT'
  | 'INVALID_SYMBOL'
  | 'TIMEOUT'
  | 'AUTH_ERROR'
  | 'UNKNOWN';

interface CacheEntry {
  data: TimeSeries;
  timestamp: number;
  ttl: number;
}

interface QuotaInfo {
  isHealthy: boolean;
  responseTime: number;
  remainingCalls: number;
  resetTime: number;
}

/**
 * Convenience function to create Alpha Vantage client
 */
export const createAlphaVantageClient = (apiKey?: string): AlphaVantageClient => {
  return new AlphaVantageClient(apiKey);
};

/**
 * Utility function for testing connectivity
 */
export const testAlphaVantageConnection = async (apiKey?: string): Promise<boolean> => {
  try {
    const client = new AlphaVantageClient(apiKey);
    const quota = await client.checkQuota();
    return quota.isHealthy;
  } catch (error) {
    log.error('Alpha Vantage connection test failed', { error });
    return false;
  }
};