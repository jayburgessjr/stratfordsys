/**
 * Strategy Configuration Type Definitions
 *
 * Type definitions for trading strategies, parameters,
 * and execution configurations.
 */

import type { DateString, Symbol, Percentage, Price } from './market-data';

// Base strategy configuration
export interface StrategyConfig {
  readonly id: string;
  readonly name: string;
  readonly type: StrategyType;
  readonly description?: string;
  readonly parameters: StrategyParameters;
  readonly riskManagement: RiskManagementConfig;
  readonly metadata: StrategyMetadata;
}

// Strategy type enumeration
export enum StrategyType {
  MOVING_AVERAGE_CROSSOVER = 'MOVING_AVERAGE_CROSSOVER',
  MEAN_REVERSION = 'MEAN_REVERSION',
  MOMENTUM = 'MOMENTUM',
  CUSTOM = 'CUSTOM',
}

// Base strategy parameters interface
export interface StrategyParameters {
  readonly [key: string]: ParameterValue;
}

export type ParameterValue = string | number | boolean | readonly ParameterValue[];

// Moving Average Crossover specific parameters
export interface MovingAverageCrossoverParameters extends StrategyParameters {
  readonly shortPeriod: number; // e.g., 20
  readonly longPeriod: number; // e.g., 50
  readonly maType: MovingAverageType;
  readonly signalDelay: number; // Bars to wait after signal
}

export enum MovingAverageType {
  SIMPLE = 'SIMPLE', // SMA
  EXPONENTIAL = 'EXPONENTIAL', // EMA
  WEIGHTED = 'WEIGHTED', // WMA
}

// Risk management configuration
export interface RiskManagementConfig {
  readonly maxPositionSize: Percentage; // Max % of portfolio per position
  readonly stopLoss?: Percentage; // Stop loss threshold
  readonly takeProfit?: Percentage; // Take profit threshold
  readonly maxDrawdown: Percentage; // Max allowable drawdown
  readonly riskFreeRate?: Percentage; // For Sharpe ratio calculation
}

// Strategy metadata
export interface StrategyMetadata {
  readonly createdAt: string; // ISO timestamp
  readonly updatedAt: string;
  readonly version: string;
  readonly author?: string;
  readonly tags: readonly string[];
  readonly isActive: boolean;
  readonly backtestCount: number;
  readonly lastBacktestAt?: string;
}

// Strategy execution configuration
export interface StrategyExecution {
  readonly config: StrategyConfig;
  readonly symbol: Symbol;
  readonly timeframe: ExecutionTimeframe;
  readonly commission: CommissionConfig;
  readonly slippage: SlippageConfig;
  readonly seed: number; // For deterministic execution
}

export interface ExecutionTimeframe {
  readonly startDate: DateString;
  readonly endDate: DateString;
  readonly warmupPeriod?: number; // Days needed for indicator calculation
}

export interface CommissionConfig {
  readonly type: CommissionType;
  readonly value: number;
  readonly minimum?: number;
  readonly maximum?: number;
}

export enum CommissionType {
  FIXED = 'FIXED', // Fixed amount per trade
  PERCENTAGE = 'PERCENTAGE', // Percentage of trade value
  PER_SHARE = 'PER_SHARE', // Amount per share
}

export interface SlippageConfig {
  readonly type: SlippageType;
  readonly value: number;
  readonly marketImpact?: MarketImpactConfig;
}

export enum SlippageType {
  FIXED = 'FIXED', // Fixed amount
  PERCENTAGE = 'PERCENTAGE', // Percentage of price
  DYNAMIC = 'DYNAMIC', // Based on volume
}

export interface MarketImpactConfig {
  readonly volumeThreshold: Percentage; // % of average volume
  readonly impactRate: Percentage; // Additional slippage rate
}

// Strategy signals and positions
export interface StrategySignal {
  readonly timestamp: string;
  readonly date: DateString;
  readonly symbol: Symbol;
  readonly type: SignalType;
  readonly strength: SignalStrength;
  readonly price: Price;
  readonly confidence: Percentage; // 0.0 to 1.0
  readonly metadata: SignalMetadata;
}

export enum SignalType {
  BUY = 'BUY',
  SELL = 'SELL',
  HOLD = 'HOLD',
  CLOSE_LONG = 'CLOSE_LONG',
  CLOSE_SHORT = 'CLOSE_SHORT',
}

export enum SignalStrength {
  WEAK = 'WEAK',
  MODERATE = 'MODERATE',
  STRONG = 'STRONG',
}

export interface SignalMetadata {
  readonly indicators: Record<string, number>;
  readonly conditions: Record<string, boolean>;
  readonly notes?: string;
}

// Position tracking
export interface Position {
  readonly id: string;
  readonly symbol: Symbol;
  readonly type: PositionType;
  readonly entryDate: DateString;
  readonly entryPrice: Price;
  readonly quantity: number;
  readonly currentPrice?: Price;
  readonly currentValue: Price;
  readonly unrealizedPnL?: number;
  readonly realizedPnL?: number;
  readonly exitDate?: DateString;
  readonly status: PositionStatus;
  readonly strategy: string; // Strategy ID
}

export enum PositionType {
  LONG = 'LONG',
  SHORT = 'SHORT',
}

export enum PositionStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  PARTIAL = 'PARTIAL',
}

// Trade execution records
export interface Trade {
  readonly id: string;
  readonly symbol: Symbol;
  readonly type: TradeType;
  readonly side: TradeSide;
  readonly date: DateString;
  readonly price: Price;
  readonly quantity: number;
  readonly commission: number;
  readonly slippage: number;
  readonly totalCost: Price;
  readonly positionId?: string;
  readonly strategy: string; // Strategy ID
  readonly signal?: StrategySignal;
}

export enum TradeType {
  MARKET = 'MARKET',
  LIMIT = 'LIMIT',
  STOP = 'STOP',
  STOP_LIMIT = 'STOP_LIMIT',
}

export enum TradeSide {
  BUY = 'BUY',
  SELL = 'SELL',
  SHORT = 'SHORT',
  COVER = 'COVER',
}

// Strategy validation
export interface StrategyValidationResult {
  readonly isValid: boolean;
  readonly errors: readonly StrategyValidationError[];
  readonly warnings: readonly StrategyValidationWarning[];
}

export interface StrategyValidationError {
  readonly field: string;
  readonly message: string;
  readonly value?: unknown;
}

export interface StrategyValidationWarning {
  readonly field: string;
  readonly message: string;
  readonly recommendation?: string;
}

// Parameter constraints
export interface ParameterConstraints {
  readonly [parameterName: string]: ParameterConstraint;
}

export interface ParameterConstraint {
  readonly type: ParameterType;
  readonly required: boolean;
  readonly minimum?: number;
  readonly maximum?: number;
  readonly step?: number;
  readonly options?: readonly ParameterValue[];
  readonly description?: string;
  readonly defaultValue?: ParameterValue;
}

export enum ParameterType {
  INTEGER = 'INTEGER',
  DECIMAL = 'DECIMAL',
  PERCENTAGE = 'PERCENTAGE',
  BOOLEAN = 'BOOLEAN',
  STRING = 'STRING',
  ENUM = 'ENUM',
}

// Strategy templates
export interface StrategyTemplate {
  readonly id: string;
  readonly name: string;
  readonly type: StrategyType;
  readonly description: string;
  readonly parameters: ParameterConstraints;
  readonly defaultConfig: Partial<StrategyConfig>;
  readonly examples: readonly StrategyExample[];
}

export interface StrategyExample {
  readonly name: string;
  readonly description: string;
  readonly parameters: StrategyParameters;
  readonly expectedPerformance?: PerformanceMetrics;
}

export interface PerformanceMetrics {
  readonly totalReturn: Percentage;
  readonly annualizedReturn: Percentage;
  readonly volatility: Percentage;
  readonly sharpeRatio: number;
  readonly maxDrawdown: Percentage;
  readonly winRate: Percentage;
}

// Utility types
export type StrategyFactory<T extends StrategyParameters> = (
  parameters: T
) => StrategyConfig;

export type ParameterValidator<T extends StrategyParameters> = (
  parameters: T
) => StrategyValidationResult;

export type SignalGenerator<T extends StrategyParameters> = (
  config: StrategyConfig,
  data: unknown // Will be TimeSeries when implemented
) => readonly StrategySignal[];