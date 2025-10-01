/**
 * Backtest Engine Integration Tests
 *
 * Simplified integration tests focusing on system integration
 * and basic functionality rather than complex financial calculations
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { BacktestEngine, createBacktestConfig } from '@/lib/backtesting/backtest-engine';
import { createMovingAverageCrossoverStrategy } from '@/lib/strategies/moving-average-crossover';
import { PerformanceAnalyzer } from '@/lib/analysis/performance-analyzer';
import { generateDemoTimeSeries } from '@/utils/demo-data';
import type { TimeSeries, BacktestResult } from '@/types';

describe('Backtest Engine Integration', () => {
  let timeSeries: TimeSeries;
  let backtestEngine: BacktestEngine;

  beforeEach(() => {
    // Generate demo data for testing
    timeSeries = generateDemoTimeSeries('INTEG', 100, 100); // Simple 100-day dataset

    // Create strategy configuration
    const strategy = createMovingAverageCrossoverStrategy(5, 10, 'SIMPLE', 0); // Shorter periods for more signals

    // Create backtest configuration
    const backtestConfig = createBacktestConfig(
      strategy,
      'INTEG',
      {
        start: timeSeries.data[0].date,
        end: timeSeries.data[timeSeries.data.length - 1].date
      },
      10000 // Smaller initial capital for testing
    );

    backtestEngine = new BacktestEngine(backtestConfig);
  });

  describe('Basic System Integration', () => {
    it('should execute backtest successfully without errors', async () => {
      const result = await backtestEngine.execute(timeSeries);

      // Verify basic result structure exists
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.strategy).toBeDefined();
      expect(result.symbol).toBe('INTEG');
      expect(result.execution).toBeDefined();
      expect(result.performance).toBeDefined();
      expect(result.metadata).toBeDefined();
    });

    it('should return valid execution details', async () => {
      const result = await backtestEngine.execute(timeSeries);

      // Verify execution details
      expect(result.execution.initialCapital).toBe(10000);
      expect(result.execution.finalValue).toBeGreaterThan(0);
      expect(result.execution.executionTime).toBeGreaterThanOrEqual(0);
      expect(result.execution.tradingDays).toBe(100);
      expect(result.execution.startDate).toBe(timeSeries.data[0].date);
      expect(result.execution.endDate).toBe(timeSeries.data[timeSeries.data.length - 1].date);
    });

    it('should return valid array structures', async () => {
      const result = await backtestEngine.execute(timeSeries);

      // Verify arrays exist and are properly typed
      expect(Array.isArray(result.equity)).toBe(true);
      expect(Array.isArray(result.trades)).toBe(true);
      expect(Array.isArray(result.positions)).toBe(true);
      expect(Array.isArray(result.signals)).toBe(true);

      // Equity curve should match input data length
      expect(result.equity.length).toBe(timeSeries.data.length);
    });

    it('should return valid performance analysis structure', async () => {
      const result = await backtestEngine.execute(timeSeries);

      // Verify performance analysis exists with proper structure
      expect(result.performance.returns).toBeDefined();
      expect(result.performance.risk).toBeDefined();
      expect(result.performance.trading).toBeDefined();
      expect(result.performance.ratios).toBeDefined();
      expect(result.performance.drawdown).toBeDefined();
      expect(result.performance.periods).toBeDefined();

      // Check that numeric values are finite
      expect(isFinite(result.performance.returns.totalReturn)).toBe(true);
      expect(isFinite(result.performance.returns.volatility)).toBe(true);
      expect(isFinite(result.performance.trading.totalTrades)).toBe(true);
    });
  });

  describe('Data Consistency', () => {
    it('should maintain consistent data relationships', async () => {
      const result = await backtestEngine.execute(timeSeries);

      // All positions should be closed at end of backtest
      const openPositions = result.positions.filter(p => p.status === 'OPEN');
      expect(openPositions.length).toBe(0);

      // Trading statistics should be consistent
      const performance = result.performance.trading;
      expect(performance.totalTrades).toBe(result.trades.length);
      expect(performance.winningTrades + performance.losingTrades).toBeLessThanOrEqual(performance.totalTrades);
      expect(performance.hitRate).toBeGreaterThanOrEqual(0);
      expect(performance.hitRate).toBeLessThanOrEqual(1);
    });

    it('should handle deterministic execution', async () => {
      // Run backtest twice with same configuration
      const result1 = await backtestEngine.execute(timeSeries);
      const result2 = await backtestEngine.execute(timeSeries);

      // Results should be identical (deterministic)
      expect(result1.execution.finalValue).toBe(result2.execution.finalValue);
      expect(result1.trades.length).toBe(result2.trades.length);
      expect(result1.signals.length).toBe(result2.signals.length);
      expect(result1.equity.length).toBe(result2.equity.length);
    });
  });

  describe('Performance Analysis Integration', () => {
    it('should provide comprehensive performance analysis', async () => {
      const backtestResult = await backtestEngine.execute(timeSeries);

      // Verify performance analysis is included and complete
      const performance = backtestResult.performance;

      // All performance sections should exist
      expect(performance.returns).toBeDefined();
      expect(performance.risk).toBeDefined();
      expect(performance.trading).toBeDefined();
      expect(performance.ratios).toBeDefined();
      expect(performance.drawdown).toBeDefined();
      expect(performance.periods).toBeDefined();

      // Returns analysis should have valid structure
      expect(typeof performance.returns.totalReturn).toBe('number');
      expect(typeof performance.returns.annualizedReturn).toBe('number');
      expect(typeof performance.returns.volatility).toBe('number');

      // Risk analysis should have valid structure
      expect(typeof performance.risk.valueAtRisk).toBe('number');
      expect(typeof performance.risk.conditionalVaR).toBe('number');

      // Trading analysis should have valid structure
      expect(typeof performance.trading.totalTrades).toBe('number');
      expect(typeof performance.trading.hitRate).toBe('number');
    });
  });

  describe('Error Handling', () => {
    it('should handle empty time series gracefully', async () => {
      const emptyTimeSeries = {
        ...timeSeries,
        data: []
      };

      await expect(backtestEngine.execute(emptyTimeSeries)).rejects.toThrow();
    });

    it('should handle insufficient data gracefully', async () => {
      // Create very short time series (less than strategy periods)
      const shortTimeSeries = {
        ...timeSeries,
        data: timeSeries.data.slice(0, 5) // Only 5 days, but strategy needs 10
      };

      const result = await backtestEngine.execute(shortTimeSeries);

      // Should complete successfully even with no trades
      expect(result).toBeDefined();
      expect(result.equity.length).toBe(5);
      expect(result.performance).toBeDefined();
    });

    it('should validate symbol consistency', async () => {
      const differentSymbolData = generateDemoTimeSeries('WRONG', 100, 100);

      await expect(backtestEngine.execute(differentSymbolData)).rejects.toThrow(/Symbol mismatch/);
    });
  });

  describe('Configuration Validation', () => {
    it('should validate backtest configuration', () => {
      const strategy = createMovingAverageCrossoverStrategy(5, 10, 'SIMPLE', 0);

      // Invalid initial capital
      expect(() => {
        createBacktestConfig(
          strategy,
          'TEST',
          { start: '2023-01-01', end: '2023-12-31' },
          -1000 // Negative capital
        );
        new BacktestEngine(createBacktestConfig(
          strategy,
          'TEST',
          { start: '2023-01-01', end: '2023-12-31' },
          -1000
        ));
      }).toThrow();

      // Invalid date range
      expect(() => {
        new BacktestEngine(createBacktestConfig(
          strategy,
          'TEST',
          { start: '2023-12-31', end: '2023-01-01' }, // End before start
          10000
        ));
      }).toThrow();
    });
  });

  describe('Strategy Integration', () => {
    it('should properly integrate strategy with execution engine', async () => {
      const result = await backtestEngine.execute(timeSeries);

      // If signals are generated, they should lead to consistent state
      if (result.signals.length > 0) {
        expect(result.trades.length).toBeGreaterThanOrEqual(0);
      }

      // Strategy configuration should be preserved
      expect(result.strategy.type).toBe('MOVING_AVERAGE_CROSSOVER');
      expect(result.strategy.parameters.shortPeriod).toBe(5);
      expect(result.strategy.parameters.longPeriod).toBe(10);
    });
  });
});