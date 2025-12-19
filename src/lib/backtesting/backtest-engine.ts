/**
 * Backtesting Engine
 *
 * Comprehensive backtesting framework for strategy evaluation with
 * deterministic execution and detailed performance analysis.
 */

import { log } from '@/lib/logger';
import { deterministicUUID } from '@/utils/deterministic';
import { MovingAverageCrossoverStrategy } from '@/lib/strategies/moving-average-crossover';
import { MeanReversionStrategy } from '@/lib/strategies/mean-reversion';
import { BreakoutStrategy } from '@/lib/strategies/breakout';
import { PerformanceAnalyzer } from '@/lib/analysis/performance-analyzer';
import type {
  BacktestConfig,
  BacktestResult,
  BacktestExecution,
  PerformanceAnalysis,
  EquityPoint,
  BacktestMetadata,
} from '@/types/backtest';
import {
  Trade,
  Position,
  StrategySignal,
  StrategyConfig
} from '@/types/strategy';
import { CommissionType, SlippageType } from '@/types/backtest';
import type { TimeSeries } from '@/types/market-data';

/**
 * Backtesting Engine for strategy evaluation
 */
export class BacktestEngine {
  private readonly config: BacktestConfig;
  private trades: Trade[] = [];
  private positions: Position[] = [];
  private signals: StrategySignal[] = [];
  private equity: EquityPoint[] = [];

  constructor(config: BacktestConfig) {
    this.config = this.validateConfig(config);

    log.info('Backtest engine initialized', {
      strategy: config.strategy.name,
      symbol: config.symbol,
      period: config.period,
      initialCapital: config.initialCapital
    });
  }

  /**
   * Execute backtest with comprehensive analysis
   */
  async execute(timeSeries: TimeSeries): Promise<BacktestResult> {
    const startTime = typeof performance !== 'undefined' && performance.now
      ? (typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now())
      : Date.now();
    const backtestId = deterministicUUID(`backtest-${this.config.strategy.id}-${this.config.symbol}-${Date.now()}`);

    log.info('Starting backtest execution', {
      backtestId,
      symbol: timeSeries.symbol,
      dataPoints: timeSeries.data.length,
      strategy: this.config.strategy.name
    });

    try {
      // Reset state
      this.trades = [];
      this.positions = [];
      this.signals = [];
      this.equity = [];

      // Validate time series matches config
      if (timeSeries.symbol !== this.config.symbol) {
        throw new Error(`Symbol mismatch: expected ${this.config.symbol}, got ${timeSeries.symbol}`);
      }

      // Execute strategy
      const strategyResult = await this.executeStrategy(timeSeries);

      // Store results
      this.trades = strategyResult.trades;
      this.positions = strategyResult.positions;
      this.signals = strategyResult.signals;

      // Calculate equity curve
      this.calculateEquityCurve(timeSeries);

      // Generate execution details
      const execution = this.createExecutionDetails(timeSeries, startTime);

      // Calculate performance metrics
      const performanceMetrics = this.calculatePerformance(timeSeries);

      // Create metadata
      const metadata = this.createMetadata();

      const result: BacktestResult = {
        id: backtestId,
        strategy: this.config.strategy,
        symbol: this.config.symbol,
        period: this.config.period,
        execution,
        performance: performanceMetrics,
        trades: this.trades,
        positions: this.positions,
        signals: this.signals,
        equity: this.equity,
        metadata
      };

      const duration = (typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now()) - startTime;
      log.performance('Backtest completed successfully', {
        backtestId,
        duration,
        trades: this.trades.length,
        signals: this.signals.length,
        finalValue: execution.finalValue
      });

      return result;

    } catch (error) {
      const duration = (typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now()) - startTime;
      log.error('Backtest execution failed', {
        backtestId,
        duration,
        error
      });
      throw error;
    }
  }

  /**
   * Execute strategy on time series data
   */
  private async executeStrategy(timeSeries: TimeSeries): Promise<{
    trades: Trade[];
    positions: Position[];
    signals: StrategySignal[];
  }> {
    // Currently supports Moving Average Crossover strategy
    // In the future, this would be extended to support multiple strategy types
    let result;

    switch (this.config.strategy.type) {
      case 'MOVING_AVERAGE_CROSSOVER':
        result = new MovingAverageCrossoverStrategy(this.config.strategy).execute(timeSeries);
        break;
      case 'MEAN_REVERSION':
        result = new MeanReversionStrategy(this.config.strategy).execute(timeSeries);
        break;
      case 'BREAKOUT':
        result = new BreakoutStrategy(this.config.strategy).execute(timeSeries);
        break;
      default:
        throw new Error(`Unsupported strategy type: ${this.config.strategy.type}`);
    }

    // Apply backtesting-specific adjustments (commission, slippage, etc.)
    const adjustedTrades = this.applyBacktestingCosts(result.trades);

    return {
      trades: adjustedTrades,
      positions: result.positions,
      signals: result.signals
    };
  }

  /**
   * Apply backtesting costs (commission, slippage) to trades
   */
  private applyBacktestingCosts(trades: Trade[]): Trade[] {
    return trades.map(trade => {
      const commission = this.calculateCommission(trade.price * trade.quantity);
      const slippage = this.calculateSlippage(trade.price);

      return {
        ...trade,
        commission,
        slippage,
        totalCost: this.calculateTotalCost(trade, commission, slippage)
      };
    });
  }

  /**
   * Calculate commission based on config
   */
  private calculateCommission(tradeValue: number): number {
    const { commission } = this.config;

    switch (commission.type) {
      case 'FIXED':
        return commission.value;
      case 'PERCENTAGE':
        return tradeValue * commission.value;
      case 'PER_SHARE':
        return commission.value; // Simplified - would need share count
      default:
        return 0;
    }
  }

  /**
   * Calculate slippage based on config
   */
  private calculateSlippage(price: number): number {
    const { slippage } = this.config;

    switch (slippage.type) {
      case 'FIXED':
        return slippage.value;
      case 'PERCENTAGE':
        return price * slippage.value;
      case 'DYNAMIC':
        // Simplified dynamic slippage - would consider volume, volatility, etc.
        return price * slippage.value;
      default:
        return 0;
    }
  }

  /**
   * Calculate total trade cost including commission and slippage
   */
  private calculateTotalCost(trade: Trade, commission: number, slippage: number): number {
    const baseValue = trade.price * trade.quantity;

    if (trade.side === 'BUY' || trade.side === 'SHORT') {
      return baseValue + commission + slippage;
    } else {
      return baseValue - commission - slippage;
    }
  }

  /**
   * Calculate equity curve over time
   */
  private calculateEquityCurve(timeSeries: TimeSeries): void {
    let currentCash = this.config.initialCapital;
    let currentShares = 0;
    let tradeIndex = 0;

    for (const dataPoint of timeSeries.data) {
      // Check for trades on this date
      while (tradeIndex < this.trades.length && this.trades[tradeIndex].date === dataPoint.date) {
        const trade = this.trades[tradeIndex];

        if (trade.side === 'BUY') {
          currentCash -= trade.totalCost;
          currentShares += trade.quantity;
        } else if (trade.side === 'SELL') {
          currentCash += trade.totalCost;
          currentShares -= trade.quantity;
        }

        tradeIndex++;
      }

      // Calculate current portfolio value
      const portfolioValue = currentCash + (currentShares * dataPoint.close);
      const totalReturn = (portfolioValue - this.config.initialCapital) / this.config.initialCapital;

      // Calculate drawdown
      const peakValue = this.equity.length > 0
        ? Math.max(...this.equity.map(e => e.value), portfolioValue)
        : portfolioValue;
      const drawdown = (peakValue - portfolioValue) / peakValue;

      this.equity.push({
        date: dataPoint.date,
        value: portfolioValue,
        drawdown,
        return: totalReturn,
        benchmark: this.config.benchmark ? dataPoint.close : undefined
      });
    }

    log.info('Equity curve calculated', {
      points: this.equity.length,
      initialValue: this.config.initialCapital,
      finalValue: this.equity[this.equity.length - 1]?.value || this.config.initialCapital
    });
  }

  /**
   * Create execution details
   */
  private createExecutionDetails(timeSeries: TimeSeries, startTime: number): BacktestExecution {
    const data = timeSeries.data;
    const finalValue = this.equity.length > 0
      ? this.equity[this.equity.length - 1].value
      : this.config.initialCapital;

    return {
      startDate: data[0].date,
      endDate: data[data.length - 1].date,
      totalDays: this.calculateTotalDays(data[0].date, data[data.length - 1].date),
      tradingDays: data.length,
      initialCapital: this.config.initialCapital,
      finalValue,
      seed: this.config.seed,
      executionTime: (typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now()) - startTime,
      dataPoints: data.length
    };
  }

  /**
   * Calculate total days between dates
   */
  private calculateTotalDays(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }

  /**
   * Calculate comprehensive performance metrics
   */
  private calculatePerformance(timeSeries: TimeSeries): PerformanceAnalysis {
    // Create a simplified backtest result for the performance analyzer
    const equityCurve = this.equity.map(e => e.value);
    const finalValue = equityCurve.length > 0
      ? equityCurve[equityCurve.length - 1]
      : this.config.initialCapital;

    const backtestResult: any = {
      strategy: this.config.strategy.id,
      symbol: this.config.symbol,
      startDate: timeSeries.data[0]?.date || '',
      endDate: timeSeries.data[timeSeries.data.length - 1]?.date || '',
      initialCapital: this.config.initialCapital,
      finalValue,
      totalPnL: finalValue - this.config.initialCapital,
      netPnL: finalValue - this.config.initialCapital - this.trades.reduce((sum, t) => sum + t.commission, 0),
      totalCommissions: this.trades.reduce((sum, t) => sum + t.commission, 0),
      totalTrades: this.trades.length,
      winningTrades: this.positions.filter(p => p.status === 'CLOSED' && (p.realizedPnL || 0) > 0).length,
      losingTrades: this.positions.filter(p => p.status === 'CLOSED' && (p.realizedPnL || 0) < 0).length,
      winRate: this.positions.filter(p => p.status === 'CLOSED').length > 0
        ? this.positions.filter(p => p.status === 'CLOSED' && (p.realizedPnL || 0) > 0).length / this.positions.filter(p => p.status === 'CLOSED').length
        : 0,
      equityCurve,
      trades: this.trades,
      positions: this.positions,
      executionTime: 0, // Will be set by caller
      metadata: this.createMetadata()
    };

    // Use the comprehensive performance analyzer
    const analyzer = new PerformanceAnalyzer({
      riskFreeRate: this.config.options.interestRate || 0.02,
      confidence: 0.95,
      annualizationFactor: 252
    });

    return analyzer.analyze(backtestResult, timeSeries);
  }


  /**
   * Create backtest metadata
   */
  private createMetadata(): BacktestMetadata {
    return {
      createdAt: new Date().toISOString(),
      version: '1.0.0',
      engine: 'Stratford AI Backtesting Engine',
      dataSource: 'CSV_FILE',
      notes: `Backtest of ${this.config.strategy.name} strategy`,
      tags: ['moving-average', 'crossover', 'backtest']
    };
  }

  /**
   * Validate backtest configuration
   */
  private validateConfig(config: BacktestConfig): BacktestConfig {
    if (config.initialCapital <= 0) {
      throw new Error('Initial capital must be positive');
    }

    if (config.period.start >= config.period.end) {
      throw new Error('Start date must be before end date');
    }

    if (!config.strategy) {
      throw new Error('Strategy configuration is required');
    }

    return config;
  }
}

/**
 * Factory function to create backtest configuration
 */
export function createBacktestConfig(
  strategy: StrategyConfig,
  symbol: string,
  period: { start: string; end: string },
  initialCapital: number = 100000,
  options: Partial<BacktestConfig['options']> = {}
): BacktestConfig {
  return {
    strategy,
    symbol,
    period,
    initialCapital,
    commission: {
      type: CommissionType.PERCENTAGE,
      value: 0.001, // 0.1%
    },
    slippage: {
      type: SlippageType.PERCENTAGE,
      value: 0.0005, // 0.05%
    },
    seed: 42,
    options: {
      includePartialPositions: false,
      adjustForDividends: false,
      adjustForSplits: false,
      allowShortSelling: false,
      maxLeverage: 1,
      marginRequirement: 0.5,
      interestRate: 0.02,
      ...options
    }
  };
}

/**
 * Convenience function to execute backtest
 */
export async function executeBacktest(
  config: BacktestConfig,
  timeSeries: TimeSeries
): Promise<BacktestResult> {
  const engine = new BacktestEngine(config);
  return engine.execute(timeSeries);
}