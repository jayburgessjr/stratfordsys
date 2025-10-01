/**
 * Performance Analyzer Tests
 *
 * Comprehensive test suite for performance analysis functionality
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PerformanceAnalyzer, analyzePerformance } from './performance-analyzer';
import type { BacktestResult, TimeSeries, Trade, Position, OHLCVData } from '@/types';

describe('PerformanceAnalyzer', () => {
  let analyzer: PerformanceAnalyzer;
  let mockBacktestResult: BacktestResult;
  let mockTimeSeries: TimeSeries;

  beforeEach(() => {
    analyzer = new PerformanceAnalyzer();

    // Create mock time series data
    const testData: OHLCVData[] = [];
    for (let i = 0; i < 100; i++) {
      const basePrice = 100 + Math.sin(i / 10) * 10 + (i * 0.1);
      testData.push({
        date: `2023-${String(Math.floor(i / 30) + 1).padStart(2, '0')}-${String((i % 30) + 1).padStart(2, '0')}`,
        open: basePrice,
        high: basePrice + 2,
        low: basePrice - 2,
        close: basePrice + 1,
        volume: 1000000
      });
    }

    mockTimeSeries = {
      symbol: 'TEST',
      data: testData,
      metadata: {
        symbol: 'TEST',
        currency: 'USD',
        timeZone: 'America/New_York',
        lastRefreshed: new Date().toISOString(),
        dataSource: 'CSV_FILE',
        interval: 'daily',
        outputSize: 'full'
      }
    };

    // Create mock equity curve with some volatility
    const equityCurve: number[] = [];
    let equity = 100000;
    for (let i = 0; i < 100; i++) {
      const dailyReturn = (Math.sin(i / 5) * 0.02) + (Math.random() - 0.5) * 0.01;
      equity *= (1 + dailyReturn);
      equityCurve.push(equity);
    }

    // Create mock trades
    const trades: Trade[] = [
      {
        id: 'trade-1',
        symbol: 'TEST',
        type: 'MARKET',
        side: 'BUY',
        date: '2023-01-01',
        price: 100,
        quantity: 100,
        commission: 5,
        slippage: 0.5,
        totalCost: 10005.5,
        strategy: 'test-strategy',
        metadata: {}
      },
      {
        id: 'trade-2',
        symbol: 'TEST',
        type: 'MARKET',
        side: 'SELL',
        date: '2023-01-15',
        price: 105,
        quantity: 100,
        commission: 5,
        slippage: 0.5,
        totalCost: 10494.5,
        strategy: 'test-strategy',
        metadata: {}
      }
    ];

    // Create mock positions
    const positions: Position[] = [
      {
        id: 'position-1',
        symbol: 'TEST',
        type: 'LONG',
        entryDate: '2023-01-01',
        entryPrice: 100,
        quantity: 100,
        status: 'CLOSED',
        exitDate: '2023-01-15',
        exitPrice: 105,
        realizedPnL: 500,
        unrealizedPnL: 0,
        currentPrice: 105,
        currentValue: 10500,
        strategy: 'test-strategy',
        metadata: {}
      }
    ];

    mockBacktestResult = {
      strategy: 'test-strategy',
      symbol: 'TEST',
      startDate: '2023-01-01',
      endDate: '2023-04-10',
      initialCapital: 100000,
      finalValue: equity,
      totalPnL: equity - 100000,
      netPnL: equity - 100000 - 50, // Subtract commissions
      totalCommissions: 50,
      totalTrades: trades.length,
      winningTrades: 1,
      losingTrades: 0,
      winRate: 1.0,
      equityCurve,
      trades,
      positions,
      executionTime: 123,
      metadata: {
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        parameters: {}
      }
    };
  });

  describe('Constructor and Options', () => {
    it('should create analyzer with default options', () => {
      const defaultAnalyzer = new PerformanceAnalyzer();
      expect(defaultAnalyzer).toBeInstanceOf(PerformanceAnalyzer);
    });

    it('should create analyzer with custom options', () => {
      const customAnalyzer = new PerformanceAnalyzer({
        riskFreeRate: 0.03,
        confidence: 0.99,
        annualizationFactor: 365
      });
      expect(customAnalyzer).toBeInstanceOf(PerformanceAnalyzer);
    });
  });

  describe('Performance Analysis', () => {
    it('should analyze performance with valid data', () => {
      const analysis = analyzer.analyze(mockBacktestResult, mockTimeSeries);

      expect(analysis).toBeDefined();
      expect(analysis.returns).toBeDefined();
      expect(analysis.risk).toBeDefined();
      expect(analysis.trading).toBeDefined();
      expect(analysis.ratios).toBeDefined();
      expect(analysis.drawdown).toBeDefined();
      expect(analysis.periods).toBeDefined();
    });

    it('should handle empty equity curve', () => {
      const emptyResult = {
        ...mockBacktestResult,
        equityCurve: [],
        trades: [],
        positions: []
      };

      const analysis = analyzer.analyze(emptyResult, mockTimeSeries);

      expect(analysis.returns.totalReturn).toBe(0);
      expect(analysis.returns.annualizedReturn).toBe(0);
      expect(analysis.risk.valueAtRisk).toBe(0);
      expect(analysis.trading.totalTrades).toBe(0);
    });

    it('should calculate return metrics correctly', () => {
      const analysis = analyzer.analyze(mockBacktestResult, mockTimeSeries);

      expect(typeof analysis.returns.totalReturn).toBe('number');
      expect(typeof analysis.returns.annualizedReturn).toBe('number');
      expect(typeof analysis.returns.averageReturn).toBe('number');
      expect(typeof analysis.returns.volatility).toBe('number');
      expect(analysis.returns.volatility).toBeGreaterThanOrEqual(0);
      expect(analysis.returns.positiveReturns).toBeGreaterThanOrEqual(0);
      expect(analysis.returns.negativeReturns).toBeGreaterThanOrEqual(0);
    });

    it('should calculate risk metrics correctly', () => {
      const analysis = analyzer.analyze(mockBacktestResult, mockTimeSeries);

      expect(typeof analysis.risk.valueAtRisk).toBe('number');
      expect(typeof analysis.risk.conditionalVaR).toBe('number');
      expect(analysis.risk.valueAtRisk).toBeGreaterThanOrEqual(0);
      expect(analysis.risk.conditionalVaR).toBeGreaterThanOrEqual(0);
      expect(typeof analysis.risk.sortinoRatio).toBe('number');
      expect(typeof analysis.risk.calmarRatio).toBe('number');
    });

    it('should calculate trading metrics correctly', () => {
      const analysis = analyzer.analyze(mockBacktestResult, mockTimeSeries);

      expect(analysis.trading.totalTrades).toBe(2);
      expect(analysis.trading.winningTrades).toBeGreaterThanOrEqual(0);
      expect(analysis.trading.losingTrades).toBeGreaterThanOrEqual(0);
      expect(analysis.trading.winningTrades + analysis.trading.losingTrades).toBeLessThanOrEqual(analysis.trading.totalTrades);
      expect(analysis.trading.hitRate).toBeGreaterThanOrEqual(0);
      expect(analysis.trading.hitRate).toBeLessThanOrEqual(1);
      expect(analysis.trading.averageHoldingPeriod).toBeGreaterThanOrEqual(0);
    });

    it('should calculate performance ratios correctly', () => {
      const analysis = analyzer.analyze(mockBacktestResult, mockTimeSeries);

      expect(typeof analysis.ratios.sharpeRatio).toBe('number');
      expect(typeof analysis.ratios.treynorRatio).toBe('number');
      expect(typeof analysis.ratios.jensenAlpha).toBe('number');
      expect(typeof analysis.ratios.sortinoRatio).toBe('number');
      expect(typeof analysis.ratios.calmarRatio).toBe('number');
      expect(typeof analysis.ratios.informationRatio).toBe('number');
    });

    it('should calculate drawdown metrics correctly', () => {
      const analysis = analyzer.analyze(mockBacktestResult, mockTimeSeries);

      expect(analysis.drawdown.maxDrawdown).toBeGreaterThanOrEqual(0);
      expect(analysis.drawdown.maxDrawdownDuration).toBeGreaterThanOrEqual(0);
      expect(analysis.drawdown.averageDrawdown).toBeGreaterThanOrEqual(0);
      expect(analysis.drawdown.averageDrawdownDuration).toBeGreaterThanOrEqual(0);
      expect(analysis.drawdown.drawdownPeriods).toBeGreaterThanOrEqual(0);
      expect(typeof analysis.drawdown.ulcerIndex).toBe('number');
    });

    it('should calculate period analysis correctly', () => {
      const analysis = analyzer.analyze(mockBacktestResult, mockTimeSeries);

      expect(Array.isArray(analysis.periods.monthlyReturns)).toBe(true);
      expect(Array.isArray(analysis.periods.quarterlyReturns)).toBe(true);
      expect(Array.isArray(analysis.periods.yearlyReturns)).toBe(true);
      expect(typeof analysis.periods.bestMonth).toBe('number');
      expect(typeof analysis.periods.worstMonth).toBe('number');
      expect(typeof analysis.periods.positiveMonths).toBe('number');
      expect(typeof analysis.periods.negativeMonths).toBe('number');
    });
  });

  describe('Risk Metrics with Benchmark', () => {
    it('should calculate beta and correlation with benchmark returns', () => {
      const benchmarkReturns = Array.from({ length: 99 }, (_, i) => Math.sin(i / 8) * 0.01);

      const analyzerWithBenchmark = new PerformanceAnalyzer({
        benchmarkReturns
      });

      const analysis = analyzerWithBenchmark.analyze(mockBacktestResult, mockTimeSeries);

      expect(typeof analysis.risk.beta).toBe('number');
      expect(typeof analysis.risk.correlation).toBe('number');
      expect(analysis.risk.correlation).toBeGreaterThanOrEqual(-1);
      expect(analysis.risk.correlation).toBeLessThanOrEqual(1);
      expect(typeof analysis.risk.trackingError).toBe('number');
      expect(analysis.risk.trackingError).toBeGreaterThanOrEqual(0);
      expect(typeof analysis.risk.informationRatio).toBe('number');
    });

    it('should handle benchmark returns of different lengths', () => {
      const shortBenchmarkReturns = [0.01, 0.02, -0.01];

      const analyzerWithShortBenchmark = new PerformanceAnalyzer({
        benchmarkReturns: shortBenchmarkReturns
      });

      const analysis = analyzerWithShortBenchmark.analyze(mockBacktestResult, mockTimeSeries);

      expect(typeof analysis.risk.beta).toBe('number');
      expect(typeof analysis.risk.correlation).toBe('number');
    });
  });

  describe('Edge Cases', () => {
    it('should handle single equity point', () => {
      const singlePointResult = {
        ...mockBacktestResult,
        equityCurve: [100000],
        trades: [],
        positions: []
      };

      const analysis = analyzer.analyze(singlePointResult, mockTimeSeries);

      expect(analysis.returns.totalReturn).toBe(0);
      expect(analysis.returns.volatility).toBe(0);
      expect(analysis.trading.totalTrades).toBe(0);
    });

    it('should handle all positive returns', () => {
      const positiveCurve = [100000, 101000, 102000, 103000, 104000];
      const positiveResult = {
        ...mockBacktestResult,
        equityCurve: positiveCurve
      };

      const analysis = analyzer.analyze(positiveResult, mockTimeSeries);

      expect(analysis.returns.totalReturn).toBeGreaterThan(0);
      expect(analysis.returns.negativeReturns).toBe(0);
      expect(analysis.drawdown.maxDrawdown).toBe(0);
    });

    it('should handle all negative returns', () => {
      const negativeCurve = [100000, 99000, 98000, 97000, 96000];
      const negativeResult = {
        ...mockBacktestResult,
        equityCurve: negativeCurve
      };

      const analysis = analyzer.analyze(negativeResult, mockTimeSeries);

      expect(analysis.returns.totalReturn).toBeLessThan(0);
      expect(analysis.returns.positiveReturns).toBe(0);
      expect(analysis.drawdown.maxDrawdown).toBeGreaterThan(0);
    });

    it('should handle zero volatility', () => {
      const flatCurve = Array(10).fill(100000);
      const flatResult = {
        ...mockBacktestResult,
        equityCurve: flatCurve
      };

      const analysis = analyzer.analyze(flatResult, mockTimeSeries);

      expect(analysis.returns.volatility).toBe(0);
      expect(analysis.ratios.sharpeRatio).toBe(0);
    });

    it('should handle no trades', () => {
      const noTradesResult = {
        ...mockBacktestResult,
        trades: [],
        positions: []
      };

      const analysis = analyzer.analyze(noTradesResult, mockTimeSeries);

      expect(analysis.trading.totalTrades).toBe(0);
      expect(analysis.trading.winningTrades).toBe(0);
      expect(analysis.trading.losingTrades).toBe(0);
      expect(analysis.trading.hitRate).toBe(0);
      expect(analysis.trading.averageTradeReturn).toBe(0);
    });
  });

  describe('Statistical Calculations', () => {
    it('should calculate skewness and kurtosis correctly', () => {
      const analysis = analyzer.analyze(mockBacktestResult, mockTimeSeries);

      expect(typeof analysis.returns.skewness).toBe('number');
      expect(typeof analysis.returns.kurtosis).toBe('number');
      expect(isFinite(analysis.returns.skewness)).toBe(true);
      expect(isFinite(analysis.returns.kurtosis)).toBe(true);
    });

    it('should calculate Value at Risk correctly', () => {
      const analysis = analyzer.analyze(mockBacktestResult, mockTimeSeries);

      expect(analysis.risk.valueAtRisk).toBeGreaterThanOrEqual(0);
      expect(analysis.risk.conditionalVaR).toBeGreaterThanOrEqual(analysis.risk.valueAtRisk);
    });
  });

  describe('Convenience Functions', () => {
    it('should work with convenience function', async () => {
      const analysis = await analyzePerformance(mockBacktestResult, mockTimeSeries);

      expect(analysis).toBeDefined();
      expect(analysis.returns).toBeDefined();
      expect(analysis.risk).toBeDefined();
      expect(analysis.trading).toBeDefined();
      expect(analysis.ratios).toBeDefined();
      expect(analysis.drawdown).toBeDefined();
      expect(analysis.periods).toBeDefined();
    });

    it('should work with custom options in convenience function', async () => {
      const analysis = await analyzePerformance(mockBacktestResult, mockTimeSeries, {
        riskFreeRate: 0.03,
        confidence: 0.99
      });

      expect(analysis).toBeDefined();
    });
  });

  describe('Performance Consistency', () => {
    it('should produce consistent results for same input', () => {
      const analysis1 = analyzer.analyze(mockBacktestResult, mockTimeSeries);
      const analysis2 = analyzer.analyze(mockBacktestResult, mockTimeSeries);

      expect(analysis1.returns.totalReturn).toBe(analysis2.returns.totalReturn);
      expect(analysis1.risk.valueAtRisk).toBe(analysis2.risk.valueAtRisk);
      expect(analysis1.trading.totalTrades).toBe(analysis2.trading.totalTrades);
      expect(analysis1.ratios.sharpeRatio).toBe(analysis2.ratios.sharpeRatio);
      expect(analysis1.drawdown.maxDrawdown).toBe(analysis2.drawdown.maxDrawdown);
    });

    it('should handle large equity curves efficiently', () => {
      const largeEquityCurve = Array.from({ length: 10000 }, (_, i) => 100000 * (1 + Math.sin(i / 100) * 0.1));
      const largeResult = {
        ...mockBacktestResult,
        equityCurve: largeEquityCurve
      };

      const startTime = Date.now();
      const analysis = analyzer.analyze(largeResult, mockTimeSeries);
      const endTime = Date.now();

      expect(analysis).toBeDefined();
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });

  describe('Mathematical Properties', () => {
    it('should maintain mathematical relationships between metrics', () => {
      const analysis = analyzer.analyze(mockBacktestResult, mockTimeSeries);

      // CVaR should be >= VaR
      expect(analysis.risk.conditionalVaR).toBeGreaterThanOrEqual(analysis.risk.valueAtRisk);

      // Win rate should equal winning trades / total trades (when total > 0)
      if (analysis.trading.totalTrades > 0) {
        const expectedWinRate = analysis.trading.winningTrades / analysis.trading.totalTrades;
        expect(analysis.trading.hitRate).toBeCloseTo(expectedWinRate, 6);
      }

      // Total trades should equal winning + losing trades (for closed positions)
      expect(analysis.trading.winningTrades + analysis.trading.losingTrades).toBeLessThanOrEqual(analysis.trading.totalTrades);
    });

    it('should handle extreme values gracefully', () => {
      const extremeCurve = [100000, 1000000, 10000, 500000, 50000]; // Very volatile
      const extremeResult = {
        ...mockBacktestResult,
        equityCurve: extremeCurve
      };

      const analysis = analyzer.analyze(extremeResult, mockTimeSeries);

      expect(isFinite(analysis.returns.volatility)).toBe(true);
      expect(isFinite(analysis.ratios.sharpeRatio)).toBe(true);
      expect(isFinite(analysis.drawdown.maxDrawdown)).toBe(true);
      expect(analysis.drawdown.maxDrawdown).toBeGreaterThan(0);
    });
  });
});