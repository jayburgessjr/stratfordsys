/**
 * Performance Analysis Engine
 *
 * Provides comprehensive performance analysis for trading strategies
 * including advanced metrics, benchmarking, and risk analysis.
 */

import type {
  BacktestResult,
  PerformanceAnalysis,
  ReturnAnalysis,
  RiskAnalysis,
  TradingAnalysis,
  PerformanceRatios,
  DrawdownAnalysis,
  PeriodAnalysis,
  Trade,
  Position,
  TimeSeries
} from '@/types';
import { seededRandom } from '@/utils/deterministic';

export interface PerformanceAnalyzerOptions {
  readonly riskFreeRate: number;
  readonly benchmarkReturns?: readonly number[];
  readonly confidence: number;
  readonly annualizationFactor: number;
}

export class PerformanceAnalyzer {
  private readonly options: PerformanceAnalyzerOptions;

  constructor(options: Partial<PerformanceAnalyzerOptions> = {}) {
    this.options = {
      riskFreeRate: 0.02, // 2% annual risk-free rate
      confidence: 0.95, // 95% confidence level for VaR
      annualizationFactor: 252, // Trading days per year
      ...options
    };
  }

  /**
   * Analyze comprehensive performance metrics from backtest results
   */
  analyze(
    backtestResult: BacktestResult,
    timeSeries: TimeSeries
  ): PerformanceAnalysis {
    const { equityCurve, trades, positions } = backtestResult;

    if (equityCurve.length === 0) {
      return this.createEmptyAnalysis();
    }

    const returns = this.calculateReturns(equityCurve);
    const returnAnalysis = this.analyzeReturns(returns);
    const riskAnalysis = this.analyzeRisk(returns, equityCurve);
    const tradingAnalysis = this.analyzeTradingActivity(trades, positions);
    const ratios = this.calculatePerformanceRatios(returns, returnAnalysis, riskAnalysis);
    const drawdownAnalysis = this.analyzeDrawdowns(equityCurve);
    const periodAnalysis = this.analyzePeriods(equityCurve, timeSeries);

    return {
      returns: returnAnalysis,
      risk: riskAnalysis,
      trading: tradingAnalysis,
      ratios,
      drawdown: drawdownAnalysis,
      periods: periodAnalysis
    };
  }

  /**
   * Calculate returns from equity curve
   */
  private calculateReturns(equityCurve: readonly number[]): number[] {
    const returns: number[] = [];

    for (let i = 1; i < equityCurve.length; i++) {
      const prevValue = equityCurve[i - 1];
      const currentValue = equityCurve[i];

      if (prevValue > 0) {
        returns.push((currentValue - prevValue) / prevValue);
      } else {
        returns.push(0);
      }
    }

    return returns;
  }

  /**
   * Analyze return characteristics
   */
  private analyzeReturns(returns: readonly number[]): ReturnAnalysis {
    if (returns.length === 0) {
      return {
        totalReturn: 0,
        annualizedReturn: 0,
        averageReturn: 0,
        volatility: 0,
        skewness: 0,
        kurtosis: 0,
        positiveReturns: 0,
        negativeReturns: 0,
        largestGain: 0,
        largestLoss: 0
      };
    }

    const totalReturn = returns.reduce((sum, ret) => sum + ret, 0);
    const averageReturn = totalReturn / returns.length;
    const annualizedReturn = Math.pow(1 + totalReturn, this.options.annualizationFactor / returns.length) - 1;

    // Calculate volatility (standard deviation)
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - averageReturn, 2), 0) / returns.length;
    const volatility = Math.sqrt(variance) * Math.sqrt(this.options.annualizationFactor);

    // Calculate skewness and kurtosis
    const skewness = this.calculateSkewness(returns, averageReturn, Math.sqrt(variance));
    const kurtosis = this.calculateKurtosis(returns, averageReturn, Math.sqrt(variance));

    const positiveReturns = returns.filter(ret => ret > 0).length;
    const negativeReturns = returns.filter(ret => ret < 0).length;
    const largestGain = Math.max(...returns, 0);
    const largestLoss = Math.min(...returns, 0);

    return {
      totalReturn,
      annualizedReturn,
      averageReturn,
      volatility,
      skewness,
      kurtosis,
      positiveReturns,
      negativeReturns,
      largestGain,
      largestLoss
    };
  }

  /**
   * Analyze risk metrics
   */
  private analyzeRisk(returns: readonly number[], equityCurve: readonly number[]): RiskAnalysis {
    if (returns.length === 0 || equityCurve.length === 0) {
      return {
        valueAtRisk: 0,
        conditionalVaR: 0,
        beta: 0,
        correlation: 0,
        trackingError: 0,
        informationRatio: 0,
        sortinoRatio: 0,
        calmarRatio: 0
      };
    }

    const valueAtRisk = this.calculateVaR(returns, this.options.confidence);
    const conditionalVaR = this.calculateCVaR(returns, this.options.confidence);

    // Beta and correlation require benchmark returns
    const beta = this.options.benchmarkReturns ? this.calculateBeta(returns, this.options.benchmarkReturns) : 0;
    const correlation = this.options.benchmarkReturns ? this.calculateCorrelation(returns, this.options.benchmarkReturns) : 0;
    const trackingError = this.options.benchmarkReturns ? this.calculateTrackingError(returns, this.options.benchmarkReturns) : 0;
    const informationRatio = this.options.benchmarkReturns ? this.calculateInformationRatio(returns, this.options.benchmarkReturns) : 0;

    const sortinoRatio = this.calculateSortinoRatio(returns);
    const calmarRatio = this.calculateCalmarRatio(returns, equityCurve);

    return {
      valueAtRisk,
      conditionalVaR,
      beta,
      correlation,
      trackingError,
      informationRatio,
      sortinoRatio,
      calmarRatio
    };
  }

  /**
   * Analyze trading activity
   */
  private analyzeTradingActivity(trades: readonly Trade[], positions: readonly Position[]): TradingAnalysis {
    if (trades.length === 0) {
      return {
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        averageTradeReturn: 0,
        averageWinningTrade: 0,
        averageLosingTrade: 0,
        profitFactor: 0,
        averageHoldingPeriod: 0,
        turnoverRate: 0,
        hitRate: 0
      };
    }

    const closedPositions = positions.filter(p => p.status === 'CLOSED');
    const totalTrades = trades.length;

    let winningTrades = 0;
    let losingTrades = 0;
    let totalWinningReturn = 0;
    let totalLosingReturn = 0;
    let totalReturn = 0;
    let totalHoldingDays = 0;

    for (const position of closedPositions) {
      if (position.realizedPnL && position.exitDate) {
        const returnValue = position.realizedPnL / (position.entryPrice * position.quantity);
        totalReturn += returnValue;

        if (position.realizedPnL > 0) {
          winningTrades++;
          totalWinningReturn += returnValue;
        } else {
          losingTrades++;
          totalLosingReturn += Math.abs(returnValue);
        }

        // Calculate holding period
        const entryDate = new Date(position.entryDate);
        const exitDate = new Date(position.exitDate);
        const holdingDays = (exitDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24);
        totalHoldingDays += holdingDays;
      }
    }

    const averageTradeReturn = totalTrades > 0 ? totalReturn / totalTrades : 0;
    const averageWinningTrade = winningTrades > 0 ? totalWinningReturn / winningTrades : 0;
    const averageLosingTrade = losingTrades > 0 ? totalLosingReturn / losingTrades : 0;
    const profitFactor = totalLosingReturn > 0 ? totalWinningReturn / totalLosingReturn : 0;
    const averageHoldingPeriod = closedPositions.length > 0 ? totalHoldingDays / closedPositions.length : 0;
    const hitRate = totalTrades > 0 ? winningTrades / totalTrades : 0;

    // Calculate turnover rate (simplified)
    const totalTradeValue = trades.reduce((sum, trade) => sum + trade.totalCost, 0);
    const averageEquity = 100000; // Assuming starting capital
    const turnoverRate = averageEquity > 0 ? totalTradeValue / averageEquity : 0;

    return {
      totalTrades,
      winningTrades,
      losingTrades,
      averageTradeReturn,
      averageWinningTrade,
      averageLosingTrade,
      profitFactor,
      averageHoldingPeriod,
      turnoverRate,
      hitRate
    };
  }

  /**
   * Calculate performance ratios
   */
  private calculatePerformanceRatios(
    returns: readonly number[],
    returnAnalysis: ReturnAnalysis,
    riskAnalysis: RiskAnalysis
  ): PerformanceRatios {
    const sharpeRatio = returnAnalysis.volatility > 0
      ? (returnAnalysis.annualizedReturn - this.options.riskFreeRate) / returnAnalysis.volatility
      : 0;

    const treynorRatio = riskAnalysis.beta !== 0
      ? (returnAnalysis.annualizedReturn - this.options.riskFreeRate) / riskAnalysis.beta
      : 0;

    const jensenAlpha = returnAnalysis.annualizedReturn - this.options.riskFreeRate -
      (riskAnalysis.beta * (0.08 - this.options.riskFreeRate)); // Assuming 8% market return

    return {
      sharpeRatio,
      treynorRatio,
      jensenAlpha,
      sortinoRatio: riskAnalysis.sortinoRatio,
      calmarRatio: riskAnalysis.calmarRatio,
      informationRatio: riskAnalysis.informationRatio
    };
  }

  /**
   * Analyze drawdown characteristics
   */
  private analyzeDrawdowns(equityCurve: readonly number[]): DrawdownAnalysis {
    if (equityCurve.length === 0) {
      return {
        maxDrawdown: 0,
        maxDrawdownDuration: 0,
        averageDrawdown: 0,
        averageDrawdownDuration: 0,
        drawdownPeriods: 0,
        recoveryFactor: 0,
        ulcerIndex: 0
      };
    }

    let peak = equityCurve[0];
    let maxDrawdown = 0;
    let currentDrawdown = 0;
    let drawdownStart = -1;
    let maxDrawdownDuration = 0;
    let currentDrawdownDuration = 0;

    const drawdowns: number[] = [];
    const drawdownDurations: number[] = [];
    let ulcerSum = 0;

    for (let i = 0; i < equityCurve.length; i++) {
      const value = equityCurve[i];

      if (value > peak) {
        // New peak reached
        if (drawdownStart >= 0) {
          // End of drawdown period
          drawdowns.push(currentDrawdown);
          drawdownDurations.push(currentDrawdownDuration);
          drawdownStart = -1;
          currentDrawdown = 0;
          currentDrawdownDuration = 0;
        }
        peak = value;
      } else {
        // In drawdown
        if (drawdownStart < 0) {
          drawdownStart = i;
        }

        currentDrawdown = (peak - value) / peak;
        currentDrawdownDuration = i - drawdownStart + 1;

        maxDrawdown = Math.max(maxDrawdown, currentDrawdown);
        maxDrawdownDuration = Math.max(maxDrawdownDuration, currentDrawdownDuration);

        // Ulcer Index calculation
        ulcerSum += Math.pow(currentDrawdown * 100, 2);
      }
    }

    // Handle ongoing drawdown
    if (drawdownStart >= 0) {
      drawdowns.push(currentDrawdown);
      drawdownDurations.push(currentDrawdownDuration);
    }

    const averageDrawdown = drawdowns.length > 0
      ? drawdowns.reduce((sum, dd) => sum + dd, 0) / drawdowns.length
      : 0;

    const averageDrawdownDuration = drawdownDurations.length > 0
      ? drawdownDurations.reduce((sum, dur) => sum + dur, 0) / drawdownDurations.length
      : 0;

    const ulcerIndex = Math.sqrt(ulcerSum / equityCurve.length);
    const recoveryFactor = maxDrawdown > 0 ? equityCurve[equityCurve.length - 1] / (peak * maxDrawdown) : 0;

    return {
      maxDrawdown,
      maxDrawdownDuration,
      averageDrawdown,
      averageDrawdownDuration,
      drawdownPeriods: drawdowns.length,
      recoveryFactor,
      ulcerIndex
    };
  }

  /**
   * Analyze performance across different time periods
   */
  private analyzePeriods(equityCurve: readonly number[], timeSeries: TimeSeries): PeriodAnalysis {
    if (equityCurve.length === 0 || timeSeries.data.length === 0) {
      return {
        monthlyReturns: [],
        quarterlyReturns: [],
        yearlyReturns: [],
        bestMonth: 0,
        worstMonth: 0,
        bestQuarter: 0,
        worstQuarter: 0,
        bestYear: 0,
        worstYear: 0,
        positiveMonths: 0,
        negativeMonths: 0
      };
    }

    // Simplified period analysis - in practice, would need more sophisticated date handling
    const returns = this.calculateReturns(equityCurve);

    // Group returns by periods (simplified approach)
    const monthlyReturns = this.groupReturnsByPeriod(returns, 21); // ~21 trading days per month
    const quarterlyReturns = this.groupReturnsByPeriod(returns, 63); // ~63 trading days per quarter
    const yearlyReturns = this.groupReturnsByPeriod(returns, 252); // ~252 trading days per year

    const bestMonth = monthlyReturns.length > 0 ? Math.max(...monthlyReturns) : 0;
    const worstMonth = monthlyReturns.length > 0 ? Math.min(...monthlyReturns) : 0;
    const bestQuarter = quarterlyReturns.length > 0 ? Math.max(...quarterlyReturns) : 0;
    const worstQuarter = quarterlyReturns.length > 0 ? Math.min(...quarterlyReturns) : 0;
    const bestYear = yearlyReturns.length > 0 ? Math.max(...yearlyReturns) : 0;
    const worstYear = yearlyReturns.length > 0 ? Math.min(...yearlyReturns) : 0;

    const positiveMonths = monthlyReturns.filter(ret => ret > 0).length;
    const negativeMonths = monthlyReturns.filter(ret => ret < 0).length;

    return {
      monthlyReturns,
      quarterlyReturns,
      yearlyReturns,
      bestMonth,
      worstMonth,
      bestQuarter,
      worstQuarter,
      bestYear,
      worstYear,
      positiveMonths,
      negativeMonths
    };
  }

  /**
   * Group returns by time periods
   */
  private groupReturnsByPeriod(returns: readonly number[], periodLength: number): number[] {
    const periodReturns: number[] = [];

    for (let i = 0; i < returns.length; i += periodLength) {
      const periodSlice = returns.slice(i, i + periodLength);
      if (periodSlice.length > 0) {
        const periodReturn = periodSlice.reduce((sum, ret) => sum + ret, 0);
        periodReturns.push(periodReturn);
      }
    }

    return periodReturns;
  }

  /**
   * Calculate Value at Risk
   */
  private calculateVaR(returns: readonly number[], confidence: number): number {
    if (returns.length === 0) return 0;

    const sortedReturns = [...returns].sort((a, b) => a - b);
    const index = Math.floor((1 - confidence) * sortedReturns.length);
    return Math.abs(sortedReturns[index] || 0);
  }

  /**
   * Calculate Conditional Value at Risk (Expected Shortfall)
   */
  private calculateCVaR(returns: readonly number[], confidence: number): number {
    if (returns.length === 0) return 0;

    const sortedReturns = [...returns].sort((a, b) => a - b);
    const index = Math.floor((1 - confidence) * sortedReturns.length);
    const tailReturns = sortedReturns.slice(0, index + 1);

    return tailReturns.length > 0
      ? Math.abs(tailReturns.reduce((sum, ret) => sum + ret, 0) / tailReturns.length)
      : 0;
  }

  /**
   * Calculate beta coefficient
   */
  private calculateBeta(returns: readonly number[], benchmarkReturns: readonly number[]): number {
    const minLength = Math.min(returns.length, benchmarkReturns.length);
    if (minLength === 0) return 0;

    const portfolioReturns = returns.slice(-minLength);
    const marketReturns = benchmarkReturns.slice(-minLength);

    const covariance = this.calculateCovariance(portfolioReturns, marketReturns);
    const marketVariance = this.calculateVariance(marketReturns);

    return marketVariance > 0 ? covariance / marketVariance : 0;
  }

  /**
   * Calculate correlation coefficient
   */
  private calculateCorrelation(returns: readonly number[], benchmarkReturns: readonly number[]): number {
    const minLength = Math.min(returns.length, benchmarkReturns.length);
    if (minLength === 0) return 0;

    const portfolioReturns = returns.slice(-minLength);
    const marketReturns = benchmarkReturns.slice(-minLength);

    const covariance = this.calculateCovariance(portfolioReturns, marketReturns);
    const portfolioStdDev = Math.sqrt(this.calculateVariance(portfolioReturns));
    const marketStdDev = Math.sqrt(this.calculateVariance(marketReturns));

    return (portfolioStdDev > 0 && marketStdDev > 0)
      ? covariance / (portfolioStdDev * marketStdDev)
      : 0;
  }

  /**
   * Calculate tracking error
   */
  private calculateTrackingError(returns: readonly number[], benchmarkReturns: readonly number[]): number {
    const minLength = Math.min(returns.length, benchmarkReturns.length);
    if (minLength === 0) return 0;

    const portfolioReturns = returns.slice(-minLength);
    const marketReturns = benchmarkReturns.slice(-minLength);

    const trackingDifferences = portfolioReturns.map((ret, i) => ret - marketReturns[i]);
    return Math.sqrt(this.calculateVariance(trackingDifferences)) * Math.sqrt(this.options.annualizationFactor);
  }

  /**
   * Calculate information ratio
   */
  private calculateInformationRatio(returns: readonly number[], benchmarkReturns: readonly number[]): number {
    const minLength = Math.min(returns.length, benchmarkReturns.length);
    if (minLength === 0) return 0;

    const portfolioReturns = returns.slice(-minLength);
    const marketReturns = benchmarkReturns.slice(-minLength);

    const excessReturns = portfolioReturns.map((ret, i) => ret - marketReturns[i]);
    const averageExcessReturn = excessReturns.reduce((sum, ret) => sum + ret, 0) / excessReturns.length;
    const trackingError = Math.sqrt(this.calculateVariance(excessReturns));

    return trackingError > 0 ? averageExcessReturn / trackingError : 0;
  }

  /**
   * Calculate Sortino ratio
   */
  private calculateSortinoRatio(returns: readonly number[]): number {
    if (returns.length === 0) return 0;

    const averageReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const negativeReturns = returns.filter(ret => ret < 0);

    if (negativeReturns.length === 0) return Infinity;

    const downsideVariance = negativeReturns.reduce((sum, ret) => sum + Math.pow(ret, 2), 0) / negativeReturns.length;
    const downsideDeviation = Math.sqrt(downsideVariance) * Math.sqrt(this.options.annualizationFactor);

    return downsideDeviation > 0
      ? (averageReturn * this.options.annualizationFactor - this.options.riskFreeRate) / downsideDeviation
      : 0;
  }

  /**
   * Calculate Calmar ratio
   */
  private calculateCalmarRatio(returns: readonly number[], equityCurve: readonly number[]): number {
    if (returns.length === 0 || equityCurve.length === 0) return 0;

    const annualizedReturn = returns.reduce((sum, ret) => sum + ret, 0) * this.options.annualizationFactor / returns.length;
    const drawdownAnalysis = this.analyzeDrawdowns(equityCurve);

    return drawdownAnalysis.maxDrawdown > 0 ? annualizedReturn / drawdownAnalysis.maxDrawdown : 0;
  }

  /**
   * Calculate skewness
   */
  private calculateSkewness(returns: readonly number[], mean: number, stdDev: number): number {
    if (returns.length === 0 || stdDev === 0) return 0;

    const skewSum = returns.reduce((sum, ret) => sum + Math.pow((ret - mean) / stdDev, 3), 0);
    return skewSum / returns.length;
  }

  /**
   * Calculate kurtosis
   */
  private calculateKurtosis(returns: readonly number[], mean: number, stdDev: number): number {
    if (returns.length === 0 || stdDev === 0) return 0;

    const kurtSum = returns.reduce((sum, ret) => sum + Math.pow((ret - mean) / stdDev, 4), 0);
    return (kurtSum / returns.length) - 3; // Excess kurtosis
  }

  /**
   * Calculate covariance between two series
   */
  private calculateCovariance(series1: readonly number[], series2: readonly number[]): number {
    if (series1.length !== series2.length || series1.length === 0) return 0;

    const mean1 = series1.reduce((sum, val) => sum + val, 0) / series1.length;
    const mean2 = series2.reduce((sum, val) => sum + val, 0) / series2.length;

    const covariance = series1.reduce((sum, val1, i) => {
      return sum + (val1 - mean1) * (series2[i] - mean2);
    }, 0) / series1.length;

    return covariance;
  }

  /**
   * Calculate variance of a series
   */
  private calculateVariance(series: readonly number[]): number {
    if (series.length === 0) return 0;

    const mean = series.reduce((sum, val) => sum + val, 0) / series.length;
    return series.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / series.length;
  }

  /**
   * Create empty analysis for edge cases
   */
  private createEmptyAnalysis(): PerformanceAnalysis {
    return {
      returns: {
        totalReturn: 0,
        annualizedReturn: 0,
        averageReturn: 0,
        volatility: 0,
        skewness: 0,
        kurtosis: 0,
        positiveReturns: 0,
        negativeReturns: 0,
        largestGain: 0,
        largestLoss: 0
      },
      risk: {
        valueAtRisk: 0,
        conditionalVaR: 0,
        beta: 0,
        correlation: 0,
        trackingError: 0,
        informationRatio: 0,
        sortinoRatio: 0,
        calmarRatio: 0
      },
      trading: {
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        averageTradeReturn: 0,
        averageWinningTrade: 0,
        averageLosingTrade: 0,
        profitFactor: 0,
        averageHoldingPeriod: 0,
        turnoverRate: 0,
        hitRate: 0
      },
      ratios: {
        sharpeRatio: 0,
        treynorRatio: 0,
        jensenAlpha: 0,
        sortinoRatio: 0,
        calmarRatio: 0,
        informationRatio: 0
      },
      drawdown: {
        maxDrawdown: 0,
        maxDrawdownDuration: 0,
        averageDrawdown: 0,
        averageDrawdownDuration: 0,
        drawdownPeriods: 0,
        recoveryFactor: 0,
        ulcerIndex: 0
      },
      periods: {
        monthlyReturns: [],
        quarterlyReturns: [],
        yearlyReturns: [],
        bestMonth: 0,
        worstMonth: 0,
        bestQuarter: 0,
        worstQuarter: 0,
        bestYear: 0,
        worstYear: 0,
        positiveMonths: 0,
        negativeMonths: 0
      }
    };
  }
}

/**
 * Convenience function to analyze performance
 */
export async function analyzePerformance(
  backtestResult: BacktestResult,
  timeSeries: TimeSeries,
  options?: Partial<PerformanceAnalyzerOptions>
): Promise<PerformanceAnalysis> {
  const analyzer = new PerformanceAnalyzer(options);
  return analyzer.analyze(backtestResult, timeSeries);
}