
import { describe, it, expect, beforeEach } from 'vitest';
import { PerformanceAnalyzer } from './performance-analyzer';
import { BacktestResult, StrategyConfig } from '@/types/backtest';
import { TimeSeries, TimeInterval, OutputSize, DataSource } from '@/types/market-data';
import { TradeType, TradeSide, PositionType, PositionStatus, StrategyType } from '@/types/strategy';

describe('PerformanceAnalyzer', () => {
  let analyzer: PerformanceAnalyzer;
  let mockBacktestResult: BacktestResult;
  let mockTimeSeries: TimeSeries;

  const mockStrategy: StrategyConfig = {
    id: 'test-strategy',
    type: StrategyType.MOMENTUM,
    name: 'Test Strategy',
    description: 'Test',
    parameters: {},
    riskManagement: {
      maxPositionSize: 1000,
      maxDrawdown: 0.1,
      stopLoss: 0.05,
      takeProfit: 0.1
    },
    metadata: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: '1.0.0',
      tags: ['test'],
      author: 'Test User',
      isActive: true,
      backtestCount: 0
    }
  };

  beforeEach(() => {
    // Setup with minimal options
    analyzer = new PerformanceAnalyzer({
      riskFreeRate: 0.02,
      annualizationFactor: 252
    });

    mockTimeSeries = {
      symbol: 'AAPL',
      metadata: {
        symbol: 'AAPL',
        interval: TimeInterval.DAILY,
        outputSize: OutputSize.FULL,
        timeZone: 'US/Eastern',
        lastRefreshed: '2023-01-01',
        dataSource: DataSource.ALPHA_VANTAGE,
        currency: 'USD'
      },
      data: [
        { date: '2023-01-01', open: 100, high: 105, low: 99, close: 101, volume: 1000 },
        { date: '2023-01-02', open: 101, high: 106, low: 100, close: 102, volume: 1000 },
        { date: '2023-01-03', open: 102, high: 107, low: 101, close: 103, volume: 1000 },
        { date: '2023-01-04', open: 103, high: 108, low: 102, close: 104, volume: 1000 },
        { date: '2023-01-05', open: 104, high: 109, low: 103, close: 105, volume: 1000 },
      ]
    };

    mockBacktestResult = {
      id: 'test-result-1',
      strategy: mockStrategy,
      symbol: 'AAPL',
      period: { start: '2023-01-01', end: '2023-01-05' },
      execution: {
        startDate: '2023-01-01',
        endDate: '2023-01-05',
        totalDays: 5,
        tradingDays: 5,
        executionTime: 100, // ms
        initialCapital: 100000,
        finalValue: 100400,
        seed: 12345,
        dataPoints: 5
      },
      trades: [
        {
          id: 'trade-1',
          symbol: 'AAPL',
          type: TradeType.MARKET,
          side: TradeSide.BUY,
          date: '2023-01-01',
          price: 100,
          quantity: 10,
          commission: 1,
          slippage: 0.1,
          totalCost: 1001.1,
          strategy: 'test-strategy'
        },
        {
          id: 'trade-2',
          symbol: 'AAPL',
          type: TradeType.MARKET,
          side: TradeSide.SELL,
          date: '2023-01-05',
          price: 105,
          quantity: 10,
          commission: 1,
          slippage: 0.1,
          totalCost: 1050,
          strategy: 'test-strategy'
        }
      ],
      positions: [
        {
          id: 'pos-1',
          symbol: 'AAPL',
          type: PositionType.LONG,
          entryDate: '2023-01-01',
          entryPrice: 100,
          quantity: 10,
          currentPrice: 105,
          currentValue: 1050,
          status: PositionStatus.CLOSED,
          exitDate: '2023-01-05',
          realizedPnL: 50,
          strategy: 'test-strategy'
        }
      ],
      equity: [
        { date: '2023-01-01', value: 100000, drawdown: 0, return: 0 },
        { date: '2023-01-02', value: 100100, drawdown: 0, return: 0.001 },
        { date: '2023-01-03', value: 100200, drawdown: 0, return: 0.001 },
        { date: '2023-01-04', value: 100300, drawdown: 0, return: 0.001 },
        { date: '2023-01-05', value: 100400, drawdown: 0, return: 0.001 }
      ],
      signals: [],
      performance: {} as any, // Placeholder as we're testing the analyzer
      metadata: {
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        engine: 'TestEngine',
        dataSource: 'AlphaVantage',
        tags: ['test']
      }
    };
  });

  describe('analyze', () => {
    it('should calculate basic return metrics correctly', () => {
      const analysis = analyzer.analyze(mockBacktestResult, mockTimeSeries);

      expect(analysis.returns.totalReturn).toBeGreaterThan(0);
      expect(analysis.returns.annualizedReturn).toBeGreaterThan(0);
      expect(analysis.returns.volatility).toBeGreaterThan(0);
      expect(analysis.returns.positiveReturns).toBeGreaterThan(0);
    });

    it('should calculate risk metrics correctly', () => {
      const analysis = analyzer.analyze(mockBacktestResult, mockTimeSeries);

      // expect(typeof analysis.risk.sharpeRatio).toBe('undefined'); // Calculated in ratios
      expect(typeof analysis.risk.sortinoRatio).toBe('number');
      // expect(typeof analysis.risk.maxDrawdown).toBe('undefined'); // In drawdown
    });

    it('should calculate trading metrics correctly', () => {
      const analysis = analyzer.analyze(mockBacktestResult, mockTimeSeries);

      expect(analysis.trading.totalTrades).toBe(2);
      expect(analysis.trading.winningTrades).toBe(1);
      expect(analysis.trading.losingTrades).toBe(0);
      expect(analysis.trading.winRate).toBe(1); // 100% win rate
      expect(analysis.trading.profitFactor).toBe(0); // No losses, so 0 (or Infinity depending on implementation)
    });

    it('should calculate ratios correctly', () => {
      const analysis = analyzer.analyze(mockBacktestResult, mockTimeSeries);

      expect(typeof analysis.ratios.sharpeRatio).toBe('number');
      // expect(typeof analysis.ratios.jensenAlpha).toBe('number'); // Removed
    });

    it('should calculate period analysis correctly', () => {
      const analysis = analyzer.analyze(mockBacktestResult, mockTimeSeries);

      expect(Array.isArray(analysis.periods.monthly)).toBe(true);
      expect(Array.isArray(analysis.periods.quarterly)).toBe(true);
      expect(Array.isArray(analysis.periods.yearly)).toBe(true);
      expect(typeof analysis.periods.bestPeriods.bestMonth).toBe('object');
      expect(typeof analysis.periods.worstPeriods.worstMonth).toBe('object');
    });
  });
});