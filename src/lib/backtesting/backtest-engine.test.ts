/**
 * Backtesting Engine Tests
 *
 * Comprehensive test suite for the backtesting framework
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  BacktestEngine,
  createBacktestConfig,
  executeBacktest
} from './backtest-engine';
import { createMovingAverageCrossoverStrategy } from '@/lib/strategies/moving-average-crossover';
import type { TimeSeries, OHLCVData } from '@/types/market-data';
import { TimeInterval, OutputSize, DataSource } from '@/types/market-data';
import { MovingAverageType } from '@/types/strategy';
import { CommissionType, SlippageType } from '@/types/backtest';
import type { BacktestConfig } from '@/types/backtest';

describe('Backtesting Engine', () => {
  let timeSeries: TimeSeries;
  let backtestConfig: BacktestConfig;

  beforeEach(() => {
    // Create test data with clear trends for backtesting
    const testData: OHLCVData[] = [];

    // Generate 60 days of trending data
    for (let i = 0; i < 60; i++) {
      const basePrice = 100 + i * 0.5; // Upward trend
      const variation = Math.sin(i / 5) * 2; // Add some oscillation

      testData.push({
        date: `2023-${Math.floor(i / 30) + 1 === 1 ? '01' : '02'}-${((i % 30) + 1).toString().padStart(2, '0')}`,
        open: basePrice + variation - 0.5,
        high: basePrice + variation + 1.5,
        low: basePrice + variation - 1.5,
        close: basePrice + variation,
        volume: 1000000 + i * 10000
      });
    }

    timeSeries = {
      symbol: 'TEST',
      data: testData,
      metadata: {
        symbol: 'TEST',
        currency: 'USD',
        timeZone: 'America/New_York',
        lastRefreshed: new Date().toISOString(),
        dataSource: DataSource.CSV_FILE,
        interval: TimeInterval.DAILY,
        outputSize: OutputSize.FULL
      }
    };

    const strategy = createMovingAverageCrossoverStrategy(5, 15, MovingAverageType.SIMPLE, 0);
    backtestConfig = createBacktestConfig(
      strategy,
      'TEST',
      { start: '2023-01-01', end: '2023-02-28' },
      100000
    );
  });

  describe('Configuration', () => {
    it('should create valid backtest configuration', () => {
      const strategy = createMovingAverageCrossoverStrategy(10, 20);
      const config = createBacktestConfig(
        strategy,
        'AAPL',
        { start: '2023-01-01', end: '2023-12-31' },
        50000
      );

      expect(config.strategy).toBe(strategy);
      expect(config.symbol).toBe('AAPL');
      expect(config.period.start).toBe('2023-01-01');
      expect(config.period.end).toBe('2023-12-31');
      expect(config.initialCapital).toBe(50000);
      expect(config.commission.type).toBe(CommissionType.PERCENTAGE);
      expect(config.slippage.type).toBe(SlippageType.PERCENTAGE);
      expect(config.options).toBeDefined();
    });

    it('should validate configuration parameters', () => {
      expect(() => {
        new BacktestEngine({
          ...backtestConfig,
          initialCapital: -1000 // Invalid: negative capital
        });
      }).toThrow('Initial capital must be positive');

      expect(() => {
        new BacktestEngine({
          ...backtestConfig,
          period: { start: '2023-12-31', end: '2023-01-01' } // Invalid: start after end
        });
      }).toThrow('Start date must be before end date');

      expect(() => {
        new BacktestEngine({
          ...backtestConfig,
          strategy: null as any // Invalid: missing strategy
        });
      }).toThrow('Strategy configuration is required');
    });

    it('should handle custom commission and slippage settings', () => {
      const customConfig = createBacktestConfig(
        backtestConfig.strategy,
        'TEST',
        { start: '2023-01-01', end: '2023-02-28' },
        100000,
        { maxLeverage: 2, allowShortSelling: true }
      );

      expect(customConfig.options.maxLeverage).toBe(2);
      expect(customConfig.options.allowShortSelling).toBe(true);
    });
  });

  describe('Backtest Execution', () => {
    it('should execute backtest and return valid results', async () => {
      const engine = new BacktestEngine(backtestConfig);
      const result = await engine.execute(timeSeries);

      expect(result.id).toBeDefined();
      expect(result.strategy).toBe(backtestConfig.strategy);
      expect(result.symbol).toBe('TEST');
      expect(result.period).toEqual(backtestConfig.period);
      expect(result.execution).toBeDefined();
      expect(result.performance).toBeDefined();
      expect(result.trades).toBeInstanceOf(Array);
      expect(result.positions).toBeInstanceOf(Array);
      expect(result.signals).toBeInstanceOf(Array);
      expect(result.equity).toBeInstanceOf(Array);
      expect(result.metadata).toBeDefined();
    });

    it('should validate symbol match', async () => {
      const mismatchedTimeSeries = {
        ...timeSeries,
        symbol: 'DIFFERENT'
      };

      const engine = new BacktestEngine(backtestConfig);

      await expect(engine.execute(mismatchedTimeSeries)).rejects.toThrow(
        'Symbol mismatch: expected TEST, got DIFFERENT'
      );
    });

    it('should handle unsupported strategy types', async () => {
      const unsupportedConfig = {
        ...backtestConfig,
        strategy: {
          ...backtestConfig.strategy,
          type: 'UNSUPPORTED_STRATEGY' as any
        }
      };

      const engine = new BacktestEngine(unsupportedConfig);

      await expect(engine.execute(timeSeries)).rejects.toThrow(
        'Unsupported strategy type: UNSUPPORTED_STRATEGY'
      );
    });
  });

  describe('Execution Details', () => {
    it('should calculate correct execution metrics', async () => {
      const engine = new BacktestEngine(backtestConfig);
      const result = await engine.execute(timeSeries);

      const execution = result.execution;

      expect(execution.startDate).toBe(timeSeries.data[0].date);
      expect(execution.endDate).toBe(timeSeries.data[timeSeries.data.length - 1].date);
      expect(execution.tradingDays).toBe(timeSeries.data.length);
      expect(execution.totalDays).toBeGreaterThanOrEqual(execution.tradingDays);
      expect(execution.initialCapital).toBe(backtestConfig.initialCapital);
      expect(execution.finalValue).toBeGreaterThan(0);
      expect(execution.seed).toBe(backtestConfig.seed);
      expect(execution.executionTime).toBeGreaterThan(0);
      expect(execution.dataPoints).toBe(timeSeries.data.length);
    });
  });

  describe('Performance Analysis', () => {
    it('should calculate return metrics', async () => {
      const engine = new BacktestEngine(backtestConfig);
      const result = await engine.execute(timeSeries);

      const returns = result.performance.returns;

      expect(typeof returns.totalReturn).toBe('number');
      expect(typeof returns.annualizedReturn).toBe('number');
      expect(typeof returns.averageReturn).toBe('number');
      expect(typeof returns.volatility).toBe('number');
      expect(typeof returns.skewness).toBe('number');
      expect(typeof returns.kurtosis).toBe('number');
      expect(typeof returns.positiveReturns).toBe('number');
      expect(typeof returns.negativeReturns).toBe('number');
      expect(typeof returns.largestGain).toBe('number');
      expect(typeof returns.largestLoss).toBe('number');
    });

    it('should calculate risk metrics', async () => {
      const engine = new BacktestEngine(backtestConfig);
      const result = await engine.execute(timeSeries);

      const risk = result.performance.risk;

      expect(typeof risk.valueAtRisk).toBe('number');
      expect(typeof risk.conditionalVaR).toBe('number');
      expect(typeof risk.beta).toBe('number');
      expect(typeof risk.correlation).toBe('number');
      expect(typeof risk.trackingError).toBe('number');
      expect(typeof risk.informationRatio).toBe('number');
      expect(typeof risk.sortinoRatio).toBe('number');
      expect(typeof risk.calmarRatio).toBe('number');
      expect(risk.valueAtRisk).toBeGreaterThanOrEqual(0);
      expect(risk.conditionalVaR).toBeGreaterThanOrEqual(risk.valueAtRisk);
    });

    it('should calculate trading metrics', async () => {
      const engine = new BacktestEngine(backtestConfig);
      const result = await engine.execute(timeSeries);

      const trading = result.performance.trading;

      expect(trading.totalTrades).toBeGreaterThanOrEqual(0);
      expect(trading.winningTrades).toBeGreaterThanOrEqual(0);
      expect(trading.losingTrades).toBeGreaterThanOrEqual(0);
      expect(trading.winningTrades + trading.losingTrades).toBeLessThanOrEqual(trading.totalTrades);
      expect(trading.hitRate).toBeGreaterThanOrEqual(0);
      expect(trading.hitRate).toBeLessThanOrEqual(1);
      expect(trading.profitFactor).toBeGreaterThanOrEqual(0);
      expect(typeof trading.averageTradeReturn).toBe('number');
      expect(typeof trading.averageWinningTrade).toBe('number');
      expect(typeof trading.averageLosingTrade).toBe('number');
      expect(typeof trading.averageHoldingPeriod).toBe('number');
      expect(typeof trading.turnoverRate).toBe('number');
    });

    it('should calculate performance ratios', async () => {
      const engine = new BacktestEngine(backtestConfig);
      const result = await engine.execute(timeSeries);

      const ratios = result.performance.ratios;

      expect(typeof ratios.sharpeRatio).toBe('number');
      expect(typeof ratios.sortinoRatio).toBe('number');
      expect(typeof ratios.calmarRatio).toBe('number');

      // Sortino ratio should generally be higher than Sharpe ratio
      if (ratios.sharpeRatio > 0) {
        expect(ratios.sortinoRatio).toBeGreaterThanOrEqual(ratios.sharpeRatio);
      }
    });

    it('should calculate drawdown analysis', async () => {
      const engine = new BacktestEngine(backtestConfig);
      const result = await engine.execute(timeSeries);

      const drawdown = result.performance.drawdown;

      expect(typeof drawdown.maxDrawdown).toBe('number');
      expect(drawdown.maxDrawdown).toBeGreaterThanOrEqual(0);
      expect(drawdown.maxDrawdown).toBeLessThanOrEqual(1);
      expect(typeof drawdown.drawdownPeriods).toBe('number');
      expect(typeof drawdown.maxDrawdownDuration).toBe('number');
      expect(typeof drawdown.averageDrawdown).toBe('number');
      expect(typeof drawdown.averageDrawdownDuration).toBe('number');
      expect(typeof drawdown.recoveryFactor).toBe('number');
      expect(typeof drawdown.ulcerIndex).toBe('number');
    });
  });

  describe('Equity Curve', () => {
    it('should generate equity curve', async () => {
      const engine = new BacktestEngine(backtestConfig);
      const result = await engine.execute(timeSeries);

      expect(result.equity).toBeInstanceOf(Array);
      expect(result.equity.length).toBe(timeSeries.data.length);

      for (const point of result.equity) {
        expect(point.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(point.value).toBeGreaterThan(0);
        expect(point.drawdown).toBeGreaterThanOrEqual(0);
        expect(point.drawdown).toBeLessThanOrEqual(1);
        expect(typeof point.return).toBe('number');
      }

      // First equity point should start with initial capital
      expect(result.equity[0].value).toBeCloseTo(backtestConfig.initialCapital, 1);
    });

    it('should track portfolio changes correctly', async () => {
      const engine = new BacktestEngine(backtestConfig);
      const result = await engine.execute(timeSeries);

      if (result.trades.length > 0) {
        // Equity should change when trades occur
        const tradeDate = result.trades[0].date;
        const equityOnTradeDate = result.equity.find(e => e.date === tradeDate);

        expect(equityOnTradeDate).toBeDefined();
        expect(equityOnTradeDate!.value).toBeDefined();
      }
    });
  });

  describe('Commission and Slippage', () => {
    it('should apply percentage-based commission', async () => {
      const commissionConfig = {
        ...backtestConfig,
        commission: { type: CommissionType.PERCENTAGE, value: 0.01 } // 1%
      };

      const engine = new BacktestEngine(commissionConfig);
      const result = await engine.execute(timeSeries);

      if (result.trades.length > 0) {
        for (const trade of result.trades) {
          const expectedCommission = trade.price * trade.quantity * 0.01;
          expect(trade.commission).toBeCloseTo(expectedCommission, 2);
        }
      }
    });

    it('should apply fixed commission', async () => {
      const commissionConfig = {
        ...backtestConfig,
        commission: { type: CommissionType.FIXED, value: 9.99 }
      };

      const engine = new BacktestEngine(commissionConfig);
      const result = await engine.execute(timeSeries);

      if (result.trades.length > 0) {
        for (const trade of result.trades) {
          expect(trade.commission).toBe(9.99);
        }
      }
    });

    it('should apply slippage costs', async () => {
      const slippageConfig = {
        ...backtestConfig,
        slippage: { type: SlippageType.PERCENTAGE, value: 0.001 } // 0.1%
      };

      const engine = new BacktestEngine(slippageConfig);
      const result = await engine.execute(timeSeries);

      if (result.trades.length > 0) {
        for (const trade of result.trades) {
          const expectedSlippage = trade.price * 0.001;
          expect(trade.slippage).toBeCloseTo(expectedSlippage, 4);
        }
      }
    });
  });

  describe('Trade Management', () => {
    it('should track positions correctly', async () => {
      const engine = new BacktestEngine(backtestConfig);
      const result = await engine.execute(timeSeries);

      for (const position of result.positions) {
        expect(position.id).toBeDefined();
        expect(['LONG', 'SHORT']).toContain(position.type);
        expect(position.entryDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(position.entryPrice).toBeGreaterThan(0);
        expect(position.quantity).toBeGreaterThan(0);
        expect(['OPEN', 'CLOSED', 'PARTIAL']).toContain(position.status);

        if (position.status === 'CLOSED') {
          expect(position.unrealizedPnL).toBeDefined();
        }
      }
    });

    it('should match trades to signals', async () => {
      const engine = new BacktestEngine(backtestConfig);
      const result = await engine.execute(timeSeries);

      for (const trade of result.trades) {
        expect(trade.strategy).toBe(backtestConfig.strategy.id);

        if (trade.signal) {
          expect(trade.signal.date).toBe(trade.date);
          expect(['BUY', 'SELL']).toContain(trade.signal.type);
        }
      }
    });
  });

  describe('Metadata', () => {
    it('should include comprehensive metadata', async () => {
      const engine = new BacktestEngine(backtestConfig);
      const result = await engine.execute(timeSeries);

      const metadata = result.metadata;

      expect(metadata.createdAt).toBeDefined();
      expect(metadata.version).toBeDefined();
      expect(metadata.engine).toBe('Stratford AI Backtesting Engine');
      expect(metadata.dataSource).toBeDefined();
      expect(metadata.tags).toBeInstanceOf(Array);
      expect(metadata.tags.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle no trading signals', async () => {
      // Create flat data that won't generate signals
      const flatData: OHLCVData[] = [];
      for (let i = 0; i < 30; i++) {
        flatData.push({
          date: `2023-01-${(i + 1).toString().padStart(2, '0')}`,
          open: 100,
          high: 100.5,
          low: 99.5,
          close: 100,
          volume: 1000000
        });
      }

      const flatTimeSeries = { ...timeSeries, data: flatData };
      const engine = new BacktestEngine(backtestConfig);
      const result = await engine.execute(flatTimeSeries);

      expect(result.trades).toHaveLength(0);
      expect(result.positions).toHaveLength(0);
      expect(result.signals).toHaveLength(0);
      expect(result.performance.trading.totalTrades).toBe(0);
      expect(result.performance.trading.hitRate).toBe(0);
    });

    it('should handle insufficient data', async () => {
      const shortData = timeSeries.data.slice(0, 5);
      const shortTimeSeries = { ...timeSeries, data: shortData };

      const engine = new BacktestEngine(backtestConfig);
      const result = await engine.execute(shortTimeSeries);

      // Should complete without errors even with minimal data
      expect(result.execution.tradingDays).toBe(5);
      expect(result.equity).toHaveLength(5);
    });

    it('should handle extreme market conditions', async () => {
      // Create data with extreme volatility
      const volatileData: OHLCVData[] = [];
      for (let i = 0; i < 30; i++) {
        const multiplier = i % 2 === 0 ? 1.5 : 0.5; // Extreme swings
        const basePrice = 100 * multiplier;

        volatileData.push({
          date: `2023-01-${(i + 1).toString().padStart(2, '0')}`,
          open: basePrice,
          high: basePrice * 1.1,
          low: basePrice * 0.9,
          close: basePrice,
          volume: 1000000
        });
      }

      const volatileTimeSeries = { ...timeSeries, data: volatileData };
      const engine = new BacktestEngine(backtestConfig);
      const result = await engine.execute(volatileTimeSeries);

      // Should handle extreme conditions gracefully
      expect(result.performance.returns.volatility).toBeGreaterThan(0);
      expect(result.execution.finalValue).toBeGreaterThan(0);
    });
  });

  describe('Convenience Functions', () => {
    it('should execute backtest using convenience function', async () => {
      const result = await executeBacktest(backtestConfig, timeSeries);

      expect(result.id).toBeDefined();
      expect(result.strategy).toBe(backtestConfig.strategy);
      expect(result.performance).toBeDefined();
    });
  });

  describe('Performance Calculation Edge Cases', () => {
    it('should handle zero trades scenario', async () => {
      const noTradeConfig = {
        ...backtestConfig,
        strategy: {
          ...backtestConfig.strategy,
          parameters: {
            ...backtestConfig.strategy.parameters,
            shortPeriod: 50, // Very long periods to prevent signals
            longPeriod: 100
          }
        }
      };

      const engine = new BacktestEngine(noTradeConfig);
      const result = await engine.execute(timeSeries);

      expect(result.performance.trading.totalTrades).toBe(0);
      expect(result.performance.trading.hitRate).toBe(0);
      expect(result.performance.trading.profitFactor).toBe(0);
      expect(result.performance.ratios.sharpeRatio).toBeDefined();
    });
  });
});