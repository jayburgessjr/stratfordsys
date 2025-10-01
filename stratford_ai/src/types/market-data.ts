/**
 * Market Data Type Definitions
 *
 * Comprehensive type definitions for financial market data
 * following industry standards for OHLCV data structures.
 */

// Base timestamp type for consistent date handling
export type Timestamp = string; // ISO 8601 format: YYYY-MM-DDTHH:mm:ss.sssZ
export type DateString = string; // ISO date format: YYYY-MM-DD

// Price and volume primitives with precision constraints
export type Price = number; // Decimal price (min: 0.01, max: 100000)
export type Volume = number; // Integer volume (min: 0)
export type Percentage = number; // Decimal percentage (-1.0 to 1.0 for ±100%)

// Symbol and exchange identifiers
export type Symbol = string; // Stock symbol (e.g., "AAPL", "MSFT")
export type Exchange = string; // Exchange code (e.g., "NASDAQ", "NYSE")
export type Currency = string; // Currency code (e.g., "USD", "EUR")

// Core OHLCV data structure
export interface OHLCVData {
  readonly date: DateString;
  readonly open: Price;
  readonly high: Price;
  readonly low: Price;
  readonly close: Price;
  readonly volume: Volume;
  readonly adjustedClose?: Price; // For split/dividend adjustments
}

// Extended market data with metadata
export interface MarketDataPoint extends OHLCVData {
  readonly symbol: Symbol;
  readonly exchange?: Exchange;
  readonly currency?: Currency;
  readonly timestamp: Timestamp; // When data was recorded
}

// Time series data collection
export interface TimeSeries {
  readonly symbol: Symbol;
  readonly data: readonly OHLCVData[];
  readonly metadata: TimeSeriesMetadata;
}

// Metadata for time series
export interface TimeSeriesMetadata {
  readonly symbol: Symbol;
  readonly exchange?: Exchange;
  readonly currency: Currency;
  readonly timeZone: string;
  readonly lastRefreshed: Timestamp;
  readonly dataSource: DataSource;
  readonly interval: TimeInterval;
  readonly outputSize: OutputSize;
}

// Data source enumeration
export enum DataSource {
  ALPHA_VANTAGE = 'ALPHA_VANTAGE',
  YAHOO_FINANCE = 'YAHOO_FINANCE',
  CSV_FILE = 'CSV_FILE',
  MANUAL_INPUT = 'MANUAL_INPUT',
}

// Time interval enumeration
export enum TimeInterval {
  MINUTE_1 = '1min',
  MINUTE_5 = '5min',
  MINUTE_15 = '15min',
  MINUTE_30 = '30min',
  HOUR_1 = '1hour',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}

// Output size enumeration
export enum OutputSize {
  COMPACT = 'compact', // Latest 100 data points
  FULL = 'full', // Full-length time series
}

// API response structures

// Alpha Vantage API response structure
export interface AlphaVantageResponse {
  readonly 'Meta Data': AlphaVantageMetaData;
  readonly [timeSeriesKey: string]: AlphaVantageTimeSeries | AlphaVantageMetaData;
}

export interface AlphaVantageMetaData {
  readonly '1. Information': string;
  readonly '2. Symbol': string;
  readonly '3. Last Refreshed': string;
  readonly '4. Output Size'?: string;
  readonly '5. Time Zone': string;
  readonly '4. Interval'?: string; // For intraday data
}

export interface AlphaVantageTimeSeries {
  readonly [date: string]: AlphaVantageDataPoint;
}

export interface AlphaVantageDataPoint {
  readonly '1. open': string;
  readonly '2. high': string;
  readonly '3. low': string;
  readonly '4. close': string;
  readonly '5. volume': string;
  readonly '6. adjusted close'?: string;
}

// Data validation results
export interface DataValidationResult {
  readonly isValid: boolean;
  readonly errors: readonly DataValidationError[];
  readonly warnings: readonly DataValidationWarning[];
  readonly cleanedData?: TimeSeries;
}

export interface DataValidationError {
  readonly type: ValidationErrorType;
  readonly message: string;
  readonly field?: string;
  readonly value?: unknown;
  readonly index?: number;
}

export interface DataValidationWarning {
  readonly type: ValidationWarningType;
  readonly message: string;
  readonly field?: string;
  readonly value?: unknown;
  readonly index?: number;
}

export enum ValidationErrorType {
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_DATA_TYPE = 'INVALID_DATA_TYPE',
  INVALID_PRICE_RANGE = 'INVALID_PRICE_RANGE',
  INVALID_VOLUME = 'INVALID_VOLUME',
  INVALID_DATE_FORMAT = 'INVALID_DATE_FORMAT',
  DUPLICATE_DATE = 'DUPLICATE_DATE',
  OHLC_VALIDATION_FAILED = 'OHLC_VALIDATION_FAILED',
  PRICE_DEVIATION_EXCEEDED = 'PRICE_DEVIATION_EXCEEDED',
}

export enum ValidationWarningType {
  MISSING_OPTIONAL_FIELD = 'MISSING_OPTIONAL_FIELD',
  UNUSUAL_VOLUME_SPIKE = 'UNUSUAL_VOLUME_SPIKE',
  LARGE_PRICE_MOVEMENT = 'LARGE_PRICE_MOVEMENT',
  MISSING_TRADING_DAYS = 'MISSING_TRADING_DAYS',
  DATA_GAP_DETECTED = 'DATA_GAP_DETECTED',
}

// CSV import structures
export interface CSVImportOptions {
  readonly hasHeader: boolean;
  readonly delimiter: string;
  readonly dateFormat: string;
  readonly columnMapping: CSVColumnMapping;
  readonly skipRows?: number;
  readonly maxRows?: number;
}

export interface CSVColumnMapping {
  readonly date: number | string; // Column index or name
  readonly open: number | string;
  readonly high: number | string;
  readonly low: number | string;
  readonly close: number | string;
  readonly volume: number | string;
  readonly adjustedClose?: number | string;
}

export interface CSVImportResult {
  readonly success: boolean;
  readonly timeSeries?: TimeSeries;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
  readonly rowsProcessed: number;
  readonly rowsSkipped: number;
}

// Data aggregation and statistics
export interface DataStatistics {
  readonly symbol: Symbol;
  readonly period: DateRange;
  readonly totalDays: number;
  readonly tradingDays: number;
  readonly missingDays: number;
  readonly priceStatistics: PriceStatistics;
  readonly volumeStatistics: VolumeStatistics;
  readonly returns: ReturnStatistics;
}

export interface DateRange {
  readonly start: DateString;
  readonly end: DateString;
}

export interface PriceStatistics {
  readonly min: Price;
  readonly max: Price;
  readonly mean: Price;
  readonly median: Price;
  readonly standardDeviation: Price;
  readonly percentiles: {
    readonly p25: Price;
    readonly p75: Price;
    readonly p95: Price;
    readonly p99: Price;
  };
}

export interface VolumeStatistics {
  readonly min: Volume;
  readonly max: Volume;
  readonly mean: Volume;
  readonly median: Volume;
  readonly standardDeviation: Volume;
  readonly totalVolume: Volume;
}

export interface ReturnStatistics {
  readonly dailyReturns: readonly Percentage[];
  readonly meanReturn: Percentage;
  readonly volatility: Percentage; // Annualized standard deviation
  readonly sharpeRatio?: number; // If risk-free rate provided
  readonly maxDrawdown: Percentage;
  readonly maxDrawdownPeriod: DateRange;
}

// Utility types for data processing
export type DataProcessor<T, R> = (data: T) => R;
export type DataValidator<T> = (data: T) => DataValidationResult;
export type DataTransformer<T, R> = (data: T) => R;

// Common types are already exported above