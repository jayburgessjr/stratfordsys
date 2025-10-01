/**
 * Backtest Results Type Definitions
 *
 * Comprehensive type definitions for backtesting results,
 * performance metrics, and analysis data.
 */

import type {
  DateString,
  Symbol,
  Price,
  Percentage,
  DateRange,
} from './market-data';
import type {
  StrategyConfig,
  Trade,
  Position,
  StrategySignal,
} from './strategy';

// Main backtest result structure
export interface BacktestResult {
  readonly id: string;
  readonly strategy: StrategyConfig;
  readonly symbol: Symbol;
  readonly period: DateRange;
  readonly execution: BacktestExecution;
  readonly performance: PerformanceAnalysis;
  readonly trades: readonly Trade[];
  readonly positions: readonly Position[];
  readonly signals: readonly StrategySignal[];
  readonly equity: readonly EquityPoint[];
  readonly metadata: BacktestMetadata;
}

// Backtest execution details
export interface BacktestExecution {
  readonly startDate: DateString;
  readonly endDate: DateString;
  readonly totalDays: number;
  readonly tradingDays: number;
  readonly initialCapital: Price;
  readonly finalValue: Price;
  readonly seed: number; // For reproducibility
  readonly executionTime: number; // Milliseconds
  readonly dataPoints: number;
}

// Comprehensive performance analysis
export interface PerformanceAnalysis {
  readonly returns: ReturnAnalysis;
  readonly risk: RiskAnalysis;
  readonly trading: TradingAnalysis;
  readonly ratios: PerformanceRatios;
  readonly drawdown: DrawdownAnalysis;
  readonly periods: PeriodAnalysis;
}

// Return analysis
export interface ReturnAnalysis {
  readonly totalReturn: Percentage;
  readonly annualizedReturn: Percentage;
  readonly compoundAnnualGrowthRate: Percentage; // CAGR
  readonly dailyReturns: readonly Percentage[];
  readonly monthlyReturns: readonly MonthlyReturn[];
  readonly yearlyReturns: readonly YearlyReturn[];
  readonly cumulativeReturns: readonly CumulativeReturn[];
}

export interface MonthlyReturn {
  readonly year: number;
  readonly month: number;
  readonly return: Percentage;
  readonly startValue: Price;
  readonly endValue: Price;
}

export interface YearlyReturn {
  readonly year: number;
  readonly return: Percentage;
  readonly startValue: Price;
  readonly endValue: Price;
  readonly bestMonth: Percentage;
  readonly worstMonth: Percentage;
}

export interface CumulativeReturn {
  readonly date: DateString;
  readonly return: Percentage;
  readonly value: Price;
}

// Risk analysis
export interface RiskAnalysis {
  readonly volatility: Percentage; // Annualized
  readonly downside: DownsideRisk;
  readonly valueAtRisk: ValueAtRisk;
  readonly beta?: number; // If benchmark provided
  readonly correlation?: number; // If benchmark provided
}

export interface DownsideRisk {
  readonly downsideDeviation: Percentage;
  readonly sortinoRatio: number;
  readonly negativeReturns: readonly Percentage[];
  readonly worstDay: {
    readonly date: DateString;
    readonly return: Percentage;
  };
  readonly worstMonth: {
    readonly year: number;
    readonly month: number;
    readonly return: Percentage;
  };
}

export interface ValueAtRisk {
  readonly var95: Percentage; // 95% VaR
  readonly var99: Percentage; // 99% VaR
  readonly conditionalVar95: Percentage; // Expected Shortfall
  readonly conditionalVar99: Percentage;
}

// Trading analysis
export interface TradingAnalysis {
  readonly totalTrades: number;
  readonly winningTrades: number;
  readonly losingTrades: number;
  readonly winRate: Percentage;
  readonly profitFactor: number;
  readonly averageWin: Price;
  readonly averageLoss: Price;
  readonly largestWin: Price;
  readonly largestLoss: Price;
  readonly averageHoldingPeriod: number; // Days
  readonly tradingFrequency: TradingFrequency;
  readonly commission: TradingCosts;
}

export interface TradingFrequency {
  readonly tradesPerYear: number;
  readonly tradesPerMonth: number;
  readonly averageDaysBetweenTrades: number;
}

export interface TradingCosts {
  readonly totalCommission: Price;
  readonly totalSlippage: Price;
  readonly totalCosts: Price;
  readonly costAsPercentage: Percentage;
}

// Performance ratios
export interface PerformanceRatios {
  readonly sharpeRatio: number;
  readonly sortinoRatio: number;
  readonly calmarRatio: number;
  readonly sterlingRatio: number;
  readonly burkeRatio: number;
  readonly informationRatio?: number; // If benchmark provided
  readonly treynorRatio?: number; // If benchmark provided
}

// Drawdown analysis
export interface DrawdownAnalysis {
  readonly maxDrawdown: Percentage;
  readonly maxDrawdownDuration: number; // Days
  readonly maxDrawdownPeriod: DateRange;
  readonly averageDrawdown: Percentage;
  readonly averageDrawdownDuration: number;
  readonly drawdownPeriods: readonly DrawdownPeriod[];
  readonly recovery: RecoveryAnalysis;
}

export interface DrawdownPeriod {
  readonly start: DateString;
  readonly end: DateString;
  readonly trough: DateString;
  readonly duration: number; // Days
  readonly depth: Percentage;
  readonly recovered: boolean;
  readonly recoveryDate?: DateString;
  readonly recoveryDuration?: number; // Days
}

export interface RecoveryAnalysis {
  readonly averageRecoveryTime: number; // Days
  readonly longestRecoveryTime: number;
  readonly shortestRecoveryTime: number;
  readonly currentDrawdown?: Percentage;
  readonly currentDrawdownDuration?: number;
}

// Period-based analysis
export interface PeriodAnalysis {
  readonly monthly: readonly PeriodPerformance[];
  readonly quarterly: readonly PeriodPerformance[];
  readonly yearly: readonly PeriodPerformance[];
  readonly bestPeriods: BestWorstPeriods;
  readonly worstPeriods: BestWorstPeriods;
}

export interface PeriodPerformance {
  readonly period: string;
  readonly return: Percentage;
  readonly volatility: Percentage;
  readonly sharpeRatio: number;
  readonly maxDrawdown: Percentage;
  readonly trades: number;
}

export interface BestWorstPeriods {
  readonly bestDay: PeriodReturn;
  readonly worstDay: PeriodReturn;
  readonly bestMonth: PeriodReturn;
  readonly worstMonth: PeriodReturn;
  readonly bestYear: PeriodReturn;
  readonly worstYear: PeriodReturn;
}

export interface PeriodReturn {
  readonly period: string;
  readonly return: Percentage;
  readonly date: DateString;
}

// Equity curve data
export interface EquityPoint {
  readonly date: DateString;
  readonly value: Price;
  readonly drawdown: Percentage;
  readonly return: Percentage;
  readonly benchmark?: Price; // If benchmark provided
}

// Backtest metadata
export interface BacktestMetadata {
  readonly createdAt: string; // ISO timestamp
  readonly version: string;
  readonly engine: string; // Backtest engine identifier
  readonly dataSource: string;
  readonly benchmark?: BenchmarkInfo;
  readonly notes?: string;
  readonly tags: readonly string[];
}

export interface BenchmarkInfo {
  readonly symbol: Symbol;
  readonly name: string;
  readonly totalReturn: Percentage;
  readonly volatility: Percentage;
  readonly sharpeRatio: number;
}

// Backtest comparison
export interface BacktestComparison {
  readonly id: string;
  readonly name: string;
  readonly backtests: readonly BacktestResult[];
  readonly comparison: ComparisonMetrics;
  readonly rankings: PerformanceRankings;
  readonly createdAt: string;
}

export interface ComparisonMetrics {
  readonly returns: readonly Percentage[];
  readonly volatilities: readonly Percentage[];
  readonly sharpeRatios: readonly number[];
  readonly maxDrawdowns: readonly Percentage[];
  readonly winRates: readonly Percentage[];
  readonly profitFactors: readonly number[];
}

export interface PerformanceRankings {
  readonly byReturn: readonly RankingEntry[];
  readonly bySharpe: readonly RankingEntry[];
  readonly byDrawdown: readonly RankingEntry[];
  readonly byWinRate: readonly RankingEntry[];
}

export interface RankingEntry {
  readonly rank: number;
  readonly backtestId: string;
  readonly strategyName: string;
  readonly value: number;
}

// Backtest configuration
export interface BacktestConfig {
  readonly strategy: StrategyConfig;
  readonly symbol: Symbol;
  readonly period: DateRange;
  readonly initialCapital: Price;
  readonly benchmark?: Symbol;
  readonly commission: CommissionConfig;
  readonly slippage: SlippageConfig;
  readonly seed: number;
  readonly options: BacktestOptions;
}

export interface BacktestOptions {
  readonly includePartialPositions: boolean;
  readonly adjustForDividends: boolean;
  readonly adjustForSplits: boolean;
  readonly allowShortSelling: boolean;
  readonly maxLeverage: number;
  readonly marginRequirement: Percentage;
  readonly interestRate: Percentage;
}

export interface CommissionConfig {
  readonly type: 'FIXED' | 'PERCENTAGE' | 'PER_SHARE';
  readonly value: number;
  readonly minimum?: number;
  readonly maximum?: number;
}

export interface SlippageConfig {
  readonly type: 'FIXED' | 'PERCENTAGE' | 'DYNAMIC';
  readonly value: number;
}

// Validation and status
export interface BacktestValidation {
  readonly isValid: boolean;
  readonly errors: readonly BacktestError[];
  readonly warnings: readonly BacktestWarning[];
}

export interface BacktestError {
  readonly type: BacktestErrorType;
  readonly message: string;
  readonly field?: string;
}

export interface BacktestWarning {
  readonly type: BacktestWarningType;
  readonly message: string;
  readonly recommendation?: string;
}

export enum BacktestErrorType {
  INSUFFICIENT_DATA = 'INSUFFICIENT_DATA',
  INVALID_DATE_RANGE = 'INVALID_DATE_RANGE',
  MISSING_STRATEGY = 'MISSING_STRATEGY',
  INVALID_CAPITAL = 'INVALID_CAPITAL',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
}

export enum BacktestWarningType {
  SMALL_SAMPLE_SIZE = 'SMALL_SAMPLE_SIZE',
  HIGH_COMMISSION = 'HIGH_COMMISSION',
  LOOKBACK_BIAS = 'LOOKBACK_BIAS',
  SURVIVORSHIP_BIAS = 'SURVIVORSHIP_BIAS',
}

// Status tracking
export enum BacktestStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export interface BacktestProgress {
  readonly status: BacktestStatus;
  readonly progress: Percentage; // 0.0 to 1.0
  readonly currentDate?: DateString;
  readonly estimatedTimeRemaining?: number; // Milliseconds
  readonly message?: string;
}

// Utility types
export type BacktestAnalyzer = (result: BacktestResult) => PerformanceAnalysis;
export type BacktestComparator = (
  results: readonly BacktestResult[]
) => BacktestComparison;
export type PerformanceCalculator<T> = (data: readonly T[]) => number;