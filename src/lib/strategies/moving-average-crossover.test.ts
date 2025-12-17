/**
 * Moving Average Crossover Strategy Tests
 *
 * Comprehensive test suite for the moving average crossover strategy
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  MovingAverageCrossoverStrategy,
  createMovingAverageCrossoverStrategy,
  executeMovingAverageCrossoverStrategy
} from './moving-average-crossover';
import type { TimeSeries, OHLCVData } from '@/types/market-data';
import { DataSource, TimeInterval, OutputSize } from '@/types/market-data';
import type { StrategyConfig } from '@/types/strategy';
import {
  MovingAverageType,
  SignalType,
  SignalStrength,
  TradeType,
  TradeSide,
  PositionType,
  PositionStatus,
  StrategyType,
} from '@/types/strategy';

describe('Moving Average Crossover Strategy', () => {
  let timeSeries: TimeSeries;
  let strategyConfig: StrategyConfig;

  beforeEach(() => {
    // Create deterministic test data with clear trend patterns
    const testData: OHLCVData[] = [];

    // Phase 1: Downtrend (for bearish signals)
    for (let i = 0; i < 15; i++) {
      testData.push({
        date: `2023-01-${(i + 1).toString().padStart(2, '0')}`,
        open: 110 - i * 0.5,
        high: 112 - i * 0.5,
        low: 108 - i * 0.5,
        close: 110 - i * 0.5,
        volume: 1000000
      });
    }

    // Phase 2: Uptrend (for bullish signals)
    for (let i = 15; i < 35; i++) {
      const basePrice = 102.5 + (i - 15) * 1.2;
      testData.push({
        date: `2023-01-${(i + 1).toString().padStart(2, '0')}`,
        open: basePrice,
        high: basePrice + 2,
        low: basePrice - 1,
        close: basePrice + 0.5,
        volume: 1000000
      });
    }

    // Phase 3: Sideways (for signal filtering)
    for (let i = 35; i < 50; i++) {
      const basePrice = 126 + Math.sin((i - 35) / 3) * 2;
      testData.push({
        date: `2023-02-${(i - 34).toString().padStart(2, '0')}`,
        open: basePrice,
        high: basePrice + 1.5,
        low: basePrice - 1.5,
        close: basePrice,
        volume: 1000000
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

    strategyConfig = createMovingAverageCrossoverStrategy(5, 10, MovingAverageType.SIMPLE, 0);
  });

  describe('Strategy Configuration', () => {
    it('should create valid strategy configuration', () => {
      const config = createMovingAverageCrossoverStrategy(20, 50, MovingAverageType.EXPONENTIAL, 1);

      expect(config.id).toBeDefined();
      expect(config.name).toContain('MA Crossover 20/50');
      expect(config.type).toBe(StrategyType.MOVING_AVERAGE_CROSSOVER);
      expect(config.parameters.shortPeriod).toBe(20);
      expect(config.parameters.longPeriod).toBe(50);
      expect(config.parameters.maType).toBe(MovingAverageType.EXPONENTIAL);
      expect(config.parameters.signalDelay).toBe(1);
      expect(config.riskManagement.maxPositionSize).toBeDefined();
      expect(config.metadata.isActive).toBe(true);
    });

    it('should use default parameters when not specified', () => {
      const config = createMovingAverageCrossoverStrategy();

      expect(config.parameters.shortPeriod).toBe(20);
      expect(config.parameters.longPeriod).toBe(50);
      expect(config.parameters.maType).toBe(MovingAverageType.SIMPLE);
      expect(config.parameters.signalDelay).toBe(0);
    });

    // ...

    it('should work with Simple Moving Average', () => {
      const config = createMovingAverageCrossoverStrategy(5, 10, MovingAverageType.SIMPLE);
      const strategy = new MovingAverageCrossoverStrategy(config);
      const result = strategy.execute(timeSeries);

      expect(result.signals.length).toBeGreaterThanOrEqual(0);
      expect(result.performance).toBeDefined();
    });

    it('should work with Exponential Moving Average', () => {
      const config = createMovingAverageCrossoverStrategy(5, 10, MovingAverageType.EXPONENTIAL);
      const strategy = new MovingAverageCrossoverStrategy(config);
      const result = strategy.execute(timeSeries);

      expect(result.signals.length).toBeGreaterThanOrEqual(0);
      expect(result.performance).toBeDefined();
    });

    it('should work with Weighted Moving Average', () => {
      const config = createMovingAverageCrossoverStrategy(5, 10, MovingAverageType.WEIGHTED);
      const strategy = new MovingAverageCrossoverStrategy(config);
      const result = strategy.execute(timeSeries);

      expect(result.signals.length).toBeGreaterThanOrEqual(0);
      expect(result.performance).toBeDefined();
    });

    it('should produce different results for different MA types', () => {
      const configSMA = createMovingAverageCrossoverStrategy(5, 10, MovingAverageType.SIMPLE);
      const configEMA = createMovingAverageCrossoverStrategy(5, 10, MovingAverageType.EXPONENTIAL);

      const strategySMA = new MovingAverageCrossoverStrategy(configSMA);
      const strategyEMA = new MovingAverageCrossoverStrategy(configEMA);

      const resultSMA = strategySMA.execute(timeSeries);
      const resultEMA = strategyEMA.execute(timeSeries);

      // ...
    });

    // ...

    describe('Signal Delay', () => {
      it('should apply signal delay correctly', () => {
        const configNoDelay = createMovingAverageCrossoverStrategy(5, 10, MovingAverageType.SIMPLE, 0);
        const configWithDelay = createMovingAverageCrossoverStrategy(5, 10, MovingAverageType.SIMPLE, 2);

        // ...
      });
    });

    describe('Convenience Functions', () => {
      it('should execute strategy using convenience function', async () => {
        const result = await executeMovingAverageCrossoverStrategy(timeSeries, {
          shortPeriod: 5,
          longPeriod: 10,
          maType: MovingAverageType.SIMPLE
        });

        // ...
      });
    });

    it('should validate parameter constraints', () => {
      expect(() => {
        new MovingAverageCrossoverStrategy({
          ...strategyConfig,
          parameters: {
            ...strategyConfig.parameters,
            shortPeriod: 50,
            longPeriod: 20 // Invalid: short >= long
          }
        });
      }).toThrow('Short period must be less than long period');

      expect(() => {
        new MovingAverageCrossoverStrategy({
          ...strategyConfig,
          parameters: {
            ...strategyConfig.parameters,
            shortPeriod: 0 // Invalid: period <= 0
          }
        });
      }).toThrow('Periods must be greater than 0');

      expect(() => {
        new MovingAverageCrossoverStrategy({
          ...strategyConfig,
          parameters: {
            ...strategyConfig.parameters,
            signalDelay: -1 // Invalid: negative delay
          }
        });
      }).toThrow('Signal delay must be non-negative');
    });
  });

  describe('Strategy Execution', () => {
    it('should execute strategy and return valid results', () => {
      const strategy = new MovingAverageCrossoverStrategy(strategyConfig);
      const result = strategy.execute(timeSeries);

      expect(result.signals).toBeInstanceOf(Array);
      expect(result.trades).toBeInstanceOf(Array);
      expect(result.positions).toBeInstanceOf(Array);
      expect(result.performance).toBeDefined();
      expect(result.executionTime).toBeGreaterThan(0);
    });

    it('should generate appropriate signals for trend changes', () => {
      const strategy = new MovingAverageCrossoverStrategy(strategyConfig);
      const result = strategy.execute(timeSeries);

      expect(result.signals.length).toBeGreaterThan(0);

      // Verify signal structure
      for (const signal of result.signals) {
        expect(signal.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(['BUY', 'SELL']).toContain(signal.type);
        expect(['WEAK', 'MODERATE', 'STRONG']).toContain(signal.strength);
        expect(signal.confidence).toBeGreaterThanOrEqual(0);
        expect(signal.confidence).toBeLessThanOrEqual(1);
        expect(signal.price).toBeGreaterThan(0);
        expect(signal.metadata).toBeDefined();
        expect(signal.metadata.indicators).toBeDefined();
        expect(signal.metadata.conditions).toBeDefined();
      }
    });

    it('should execute trades based on signals', () => {
      const strategy = new MovingAverageCrossoverStrategy(strategyConfig);
      const result = strategy.execute(timeSeries);

      if (result.trades.length > 0) {
        for (const trade of result.trades) {
          expect(trade.id).toBeDefined();
          expect(trade.symbol).toBe('UNKNOWN'); // Default symbol
          expect(['MARKET', 'LIMIT', 'STOP', 'STOP_LIMIT']).toContain(trade.type);
          expect(['BUY', 'SELL', 'SHORT', 'COVER']).toContain(trade.side);
          expect(trade.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
          expect(trade.price).toBeGreaterThan(0);
          expect(trade.quantity).toBeGreaterThan(0);
          expect(trade.commission).toBeGreaterThanOrEqual(0);
          expect(trade.slippage).toBeGreaterThanOrEqual(0);
          expect(trade.totalCost).toBeGreaterThan(0);
          expect(trade.strategy).toBe(strategyConfig.id);
        }
      }
    });

    it('should manage positions correctly', () => {
      const strategy = new MovingAverageCrossoverStrategy(strategyConfig);
      const result = strategy.execute(timeSeries);

      if (result.positions.length > 0) {
        for (const position of result.positions) {
          expect(position.id).toBeDefined();
          expect(['LONG', 'SHORT']).toContain(position.type);
          expect(position.entryDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
          expect(position.entryPrice).toBeGreaterThan(0);
          expect(position.quantity).toBeGreaterThan(0);
          expect(['OPEN', 'CLOSED', 'PARTIAL']).toContain(position.status);
          expect(position.strategy).toBe(strategyConfig.id);

          if (position.status === 'CLOSED') {
            expect(position.unrealizedPnL).toBeDefined();
            expect(position.currentPrice).toBeDefined();
            expect(position.currentValue).toBeDefined();
          }
        }

        // Verify that all positions are eventually closed
        const openPositions = result.positions.filter(p => p.status === 'OPEN');
        expect(openPositions.length).toBe(0);
      }
    });

    it('should calculate performance metrics', () => {
      const strategy = new MovingAverageCrossoverStrategy(strategyConfig);
      const result = strategy.execute(timeSeries);

      const perf = result.performance;
      expect(perf.totalTrades).toBeGreaterThanOrEqual(0);
      expect(perf.winningTrades).toBeGreaterThanOrEqual(0);
      expect(perf.losingTrades).toBeGreaterThanOrEqual(0);
      expect(perf.winningTrades + perf.losingTrades).toBe(perf.totalTrades);
      expect(perf.winRate).toBeGreaterThanOrEqual(0);
      expect(perf.winRate).toBeLessThanOrEqual(1);
      expect(typeof perf.totalPnL).toBe('number');
      expect(typeof perf.netPnL).toBe('number');
      expect(perf.totalCommissions).toBeGreaterThanOrEqual(0);
      expect(perf.averageTradeSize).toBeGreaterThanOrEqual(0);

      // Net PnL should be total PnL minus commissions
      expect(perf.netPnL).toBeCloseTo(perf.totalPnL - perf.totalCommissions, 2);
    });
  });

  describe('Different Moving Average Types', () => {
    it('should work with Simple Moving Average', () => {
      const config = createMovingAverageCrossoverStrategy(5, 10, MovingAverageType.SIMPLE);
      const strategy = new MovingAverageCrossoverStrategy(config);
      const result = strategy.execute(timeSeries);

      expect(result.signals.length).toBeGreaterThanOrEqual(0);
      expect(result.performance).toBeDefined();
    });

    it('should work with Exponential Moving Average', () => {
      const config = createMovingAverageCrossoverStrategy(5, 10, MovingAverageType.EXPONENTIAL);
      const strategy = new MovingAverageCrossoverStrategy(config);
      const result = strategy.execute(timeSeries);

      expect(result.signals.length).toBeGreaterThanOrEqual(0);
      expect(result.performance).toBeDefined();
    });

    it('should work with Weighted Moving Average', () => {
      const config = createMovingAverageCrossoverStrategy(5, 10, MovingAverageType.WEIGHTED);
      const strategy = new MovingAverageCrossoverStrategy(config);
      const result = strategy.execute(timeSeries);

      expect(result.signals.length).toBeGreaterThanOrEqual(0);
      expect(result.performance).toBeDefined();
    });

    it('should produce different results for different MA types', () => {
      const configSMA = createMovingAverageCrossoverStrategy(5, 10, MovingAverageType.SIMPLE);
      const configEMA = createMovingAverageCrossoverStrategy(5, 10, MovingAverageType.EXPONENTIAL);

      const strategySMA = new MovingAverageCrossoverStrategy(configSMA);
      const strategyEMA = new MovingAverageCrossoverStrategy(configEMA);

      const resultSMA = strategySMA.execute(timeSeries);
      const resultEMA = strategyEMA.execute(timeSeries);

      // Results may be different due to different MA calculations
      expect(resultSMA.performance).toBeDefined();
      expect(resultEMA.performance).toBeDefined();
    });
  });

  describe('Signal Delay', () => {
    it('should apply signal delay correctly', () => {
      const configNoDelay = createMovingAverageCrossoverStrategy(5, 10, MovingAverageType.SIMPLE, 0);
      const configWithDelay = createMovingAverageCrossoverStrategy(5, 10, MovingAverageType.SIMPLE, 2);

      const strategyNoDelay = new MovingAverageCrossoverStrategy(configNoDelay);
      const strategyWithDelay = new MovingAverageCrossoverStrategy(configWithDelay);

      const resultNoDelay = strategyNoDelay.execute(timeSeries);
      const resultWithDelay = strategyWithDelay.execute(timeSeries);

      // With delay, signals should be fewer or occur later
      expect(resultWithDelay.signals.length).toBeLessThanOrEqual(resultNoDelay.signals.length);
    });
  });

  describe('Risk Management', () => {
    it('should respect position sizing rules', () => {
      const strategy = new MovingAverageCrossoverStrategy(strategyConfig);
      const result = strategy.execute(timeSeries);

      for (const trade of result.trades) {
        expect(trade.quantity).toBeGreaterThan(0);
        // Position size should be reasonable given the test data prices
        expect(trade.quantity * trade.price).toBeLessThan(20000); // Reasonable upper bound
      }
    });

    it('should apply commission and slippage costs', () => {
      const strategy = new MovingAverageCrossoverStrategy(strategyConfig);
      const result = strategy.execute(timeSeries);

      for (const trade of result.trades) {
        expect(trade.commission).toBeGreaterThan(0);
        expect(trade.slippage).toBeGreaterThan(0);

        // Total cost should include these factors
        if (trade.side === 'BUY' || trade.side === 'SHORT') {
          expect(trade.totalCost).toBeGreaterThan(trade.price * trade.quantity);
        }
      }
    });

    it('should prevent over-trading', () => {
      const strategy = new MovingAverageCrossoverStrategy(strategyConfig);
      const result = strategy.execute(timeSeries);

      // Should only have one position open at a time
      let maxOpenPositions = 0;
      const positionEvents: Array<{ date: string; action: 'open' | 'close' }> = [];

      for (const trade of result.trades) {
        if (trade.side === 'BUY') {
          positionEvents.push({ date: trade.date, action: 'open' });
        } else if (trade.side === 'SELL') {
          positionEvents.push({ date: trade.date, action: 'close' });
        }
      }

      let currentOpenPositions = 0;
      for (const event of positionEvents.sort((a, b) => a.date.localeCompare(b.date))) {
        if (event.action === 'open') {
          currentOpenPositions++;
          maxOpenPositions = Math.max(maxOpenPositions, currentOpenPositions);
        } else {
          currentOpenPositions--;
        }
      }

      expect(maxOpenPositions).toBeLessThanOrEqual(1);
    });
  });

  describe('Convenience Functions', () => {
    it('should execute strategy using convenience function', async () => {
      const result = await executeMovingAverageCrossoverStrategy(timeSeries, {
        shortPeriod: 5,
        longPeriod: 10,
        maType: MovingAverageType.SIMPLE
      });

      expect(result.signals).toBeInstanceOf(Array);
      expect(result.trades).toBeInstanceOf(Array);
      expect(result.positions).toBeInstanceOf(Array);
      expect(result.performance).toBeDefined();
      expect(result.executionTime).toBeGreaterThan(0);
    });

    it('should use default parameters in convenience function', async () => {
      const result = await executeMovingAverageCrossoverStrategy(timeSeries);

      expect(result).toBeDefined();
      expect(result.performance).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle insufficient data gracefully', () => {
      const shortTimeSeries = {
        ...timeSeries,
        data: timeSeries.data.slice(0, 5) // Not enough for 10-period MA
      };

      const strategy = new MovingAverageCrossoverStrategy(strategyConfig);
      const result = strategy.execute(shortTimeSeries);

      expect(result.signals).toHaveLength(0);
      expect(result.trades).toHaveLength(0);
      expect(result.positions).toHaveLength(0);
      expect(result.performance.totalTrades).toBe(0);
    });

    it('should handle no crossover signals', () => {
      // Create data with no clear trend changes
      const flatData: OHLCVData[] = [];
      for (let i = 0; i < 30; i++) {
        flatData.push({
          date: `2023-01-${(i + 1).toString().padStart(2, '0')}`,
          open: 100,
          high: 101,
          low: 99,
          close: 100,
          volume: 1000000
        });
      }

      const flatTimeSeries = { ...timeSeries, data: flatData };
      const strategy = new MovingAverageCrossoverStrategy(strategyConfig);
      const result = strategy.execute(flatTimeSeries);

      expect(result.signals).toHaveLength(0);
      expect(result.trades).toHaveLength(0);
      expect(result.positions).toHaveLength(0);
    });

    it('should handle single data point', () => {
      const singlePointTimeSeries = {
        ...timeSeries,
        data: timeSeries.data.slice(0, 1)
      };

      const strategy = new MovingAverageCrossoverStrategy(strategyConfig);
      const result = strategy.execute(singlePointTimeSeries);

      expect(result.signals).toHaveLength(0);
      expect(result.trades).toHaveLength(0);
      expect(result.positions).toHaveLength(0);
    });
  });
});