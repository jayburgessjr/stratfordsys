/**
 * Moving Average Crossover Strategy
 *
 * Deterministic implementation of the classic moving average crossover
 * trading strategy with configurable parameters and risk management.
 */

import { log } from '@/lib/logger';
import { calculateSMA, calculateEMA, detectMovingAverageCrossover } from '@/lib/indicators/technical-indicators';
import { DEFAULT_STRATEGIES } from '@/constants';
import type {
  StrategyConfig,
  StrategySignal,
  MovingAverageCrossoverParameters,
  Position,
  Trade,
} from '@/types/strategy';
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
import type { OHLCVData, TimeSeries } from '@/types/market-data';
import { deterministicUUID } from '@/utils/deterministic';

/**
 * Moving Average Crossover Strategy Implementation
 */
export class MovingAverageCrossoverStrategy {
  private readonly config: StrategyConfig;
  private readonly parameters: MovingAverageCrossoverParameters;
  private positions: Position[] = [];
  private trades: Trade[] = [];
  private signals: StrategySignal[] = [];

  constructor(config: StrategyConfig) {
    this.config = config;
    this.parameters = this.validateParameters(config.parameters as MovingAverageCrossoverParameters);

    log.info('Moving Average Crossover Strategy initialized', {
      strategyId: config.id,
      shortPeriod: this.parameters.shortPeriod,
      longPeriod: this.parameters.longPeriod,
      maType: this.parameters.maType
    });
  }

  /**
   * Execute strategy on time series data
   */
  execute(timeSeries: TimeSeries): StrategyExecutionResult {
    const startTime = performance.now();
    log.info('Executing Moving Average Crossover Strategy', {
      symbol: timeSeries.symbol,
      dataPoints: timeSeries.data.length
    });

    // Reset state for new execution
    this.positions = [];
    this.trades = [];
    this.signals = [];

    try {
      // Calculate moving averages
      const { shortMA, longMA } = this.calculateMovingAverages(timeSeries.data);

      // Check if we have sufficient data for analysis
      if (shortMA.length === 0 || longMA.length === 0) {
        log.warn('Insufficient data for moving average calculation', {
          shortMALength: shortMA.length,
          longMALength: longMA.length,
          dataPoints: timeSeries.data.length
        });

        return {
          signals: [],
          trades: [],
          positions: [],
          performance: this.calculateBasicPerformance(timeSeries.data),
          executionTime: performance.now() - startTime
        };
      }

      // Align moving averages to same length for crossover detection
      const minLength = Math.min(shortMA.length, longMA.length);
      const alignedShortMA = shortMA.slice(-minLength);
      const alignedLongMA = longMA.slice(-minLength);

      // Detect crossover signals
      const crossoverSignals = detectMovingAverageCrossover(alignedShortMA, alignedLongMA, timeSeries.data);

      // Generate strategy signals
      this.generateSignals(crossoverSignals, timeSeries.data);

      // Execute trades based on signals
      this.executeTrades(timeSeries.data);

      const duration = performance.now() - startTime;
      log.performance('Strategy execution completed', {
        symbol: timeSeries.symbol,
        duration,
        signals: this.signals.length,
        trades: this.trades.length,
        positions: this.positions.length
      });

      return {
        signals: this.signals,
        trades: this.trades,
        positions: this.positions,
        performance: this.calculateBasicPerformance(timeSeries.data),
        executionTime: duration
      };

    } catch (error) {
      const duration = performance.now() - startTime;
      log.error('Strategy execution failed', {
        symbol: timeSeries.symbol,
        duration,
        error
      });
      throw error;
    }
  }

  /**
   * Calculate moving averages based on strategy parameters
   */
  private calculateMovingAverages(data: readonly OHLCVData[]): {
    shortMA: number[];
    longMA: number[];
  } {
    const { shortPeriod, longPeriod, maType } = this.parameters;

    let shortMA: number[];
    let longMA: number[];

    switch (maType) {
      case MovingAverageType.SIMPLE:
        shortMA = calculateSMA(data, shortPeriod, 'close');
        longMA = calculateSMA(data, longPeriod, 'close');
        break;
      case MovingAverageType.EXPONENTIAL:
        shortMA = calculateEMA(data, shortPeriod, 'close');
        longMA = calculateEMA(data, longPeriod, 'close');
        break;
      case MovingAverageType.WEIGHTED:
        // WMA implementation would go here
        // For now, fall back to SMA
        shortMA = calculateSMA(data, shortPeriod, 'close');
        longMA = calculateSMA(data, longPeriod, 'close');
        break;
      default:
        throw new Error(`Unsupported moving average type: ${maType}`);
    }

    log.info('Moving averages calculated', {
      maType,
      shortPeriod,
      longPeriod,
      shortMAPoints: shortMA.length,
      longMAPoints: longMA.length
    });

    return { shortMA, longMA };
  }

  /**
   * Generate strategy signals from crossover events
   */
  private generateSignals(crossoverSignals: any[], data: readonly OHLCVData[]): void {
    for (const crossover of crossoverSignals) {
      const signalType: SignalType = crossover.type === 'bullish' ? SignalType.BUY : SignalType.SELL;
      const strength: SignalStrength = this.determineSignalStrength(crossover.strength);

      // Apply signal delay if configured
      const delayedIndex = this.findDataIndex(data, crossover.date) + this.parameters.signalDelay;
      if (delayedIndex >= data.length) continue;

      const signalData = data[delayedIndex];

      const signal: StrategySignal = {
        timestamp: new Date(signalData.date).toISOString(),
        date: signalData.date,
        symbol: this.getSymbolFromData(data),
        type: signalType,
        strength,
        price: signalData.close,
        confidence: this.calculateConfidence(crossover.strength),
        metadata: {
          indicators: {
            shortMA: crossover.shortMA,
            longMA: crossover.longMA,
            crossoverStrength: crossover.strength
          },
          conditions: {
            bullishCrossover: crossover.type === 'bullish',
            bearishCrossover: crossover.type === 'bearish'
          },
          notes: `${this.parameters.maType} MA crossover: ${this.parameters.shortPeriod}/${this.parameters.longPeriod}`
        }
      };

      this.signals.push(signal);
    }

    log.info('Strategy signals generated', {
      totalSignals: this.signals.length,
      buySignals: this.signals.filter(s => s.type === SignalType.BUY).length,
      sellSignals: this.signals.filter(s => s.type === SignalType.SELL).length
    });
  }

  /**
   * Execute trades based on generated signals
   */
  private executeTrades(data: readonly OHLCVData[]): void {
    let currentPosition: Position | null = null;

    for (const signal of this.signals) {
      const signalData = data.find(d => d.date === signal.date);
      if (!signalData) continue;

      // Apply risk management rules
      if (!this.shouldExecuteTrade(signal, currentPosition, signalData)) {
        continue;
      }

      if (signal.type === SignalType.BUY && !currentPosition) {
        // Open long position
        currentPosition = this.openPosition(signal, signalData, PositionType.LONG);
      } else if (signal.type === SignalType.SELL && currentPosition?.type === PositionType.LONG) {
        // Close long position
        this.closePosition(currentPosition, signal, signalData);
        currentPosition = null;
      }
    }

    // Close any remaining open position at the end
    if (currentPosition) {
      const lastData = data[data.length - 1];
      const closeSignal = this.createCloseSignal(lastData);
      this.closePosition(currentPosition, closeSignal, lastData);
    }

    log.info('Trade execution completed', {
      totalTrades: this.trades.length,
      openPositions: this.positions.filter(p => p.status === PositionStatus.OPEN).length,
      closedPositions: this.positions.filter(p => p.status === PositionStatus.CLOSED).length
    });
  }

  /**
   * Open a new position
   */
  private openPosition(signal: StrategySignal, data: OHLCVData, type: PositionType): Position {
    const positionSize = this.calculatePositionSize(data.close);
    const commission = this.calculateCommission(data.close * positionSize);

    const trade: Trade = {
      id: deterministicUUID(`${signal.date}-${signal.type}-open`),
      symbol: signal.symbol,
      type: TradeType.MARKET,
      side: type === PositionType.LONG ? TradeSide.BUY : TradeSide.SHORT,
      date: signal.date,
      price: data.close,
      quantity: positionSize,
      commission,
      slippage: this.calculateSlippage(data.close),
      totalCost: data.close * positionSize + commission,
      strategy: this.config.id,
      signal
    };

    const position: Position = {
      id: deterministicUUID(`${signal.date}-position`),
      symbol: signal.symbol,
      type,
      entryDate: signal.date,
      entryPrice: data.close,
      quantity: positionSize,
      currentPrice: data.close,
      currentValue: data.close * positionSize,
      unrealizedPnL: 0,
      status: PositionStatus.OPEN,
      strategy: this.config.id
    };

    this.trades.push(trade);
    this.positions.push(position);

    log.info('Position opened', {
      positionId: position.id,
      type,
      price: data.close,
      quantity: positionSize,
      totalCost: trade.totalCost
    });

    return position;
  }

  /**
   * Close an existing position
   */
  private closePosition(position: Position, signal: StrategySignal, data: OHLCVData): void {
    const commission = this.calculateCommission(data.close * position.quantity);

    const trade: Trade = {
      id: deterministicUUID(`${signal.date}-${signal.type}-close`),
      symbol: signal.symbol,
      type: TradeType.MARKET,
      side: position.type === PositionType.LONG ? TradeSide.SELL : TradeSide.COVER,
      date: signal.date,
      price: data.close,
      quantity: position.quantity,
      commission,
      slippage: this.calculateSlippage(data.close),
      totalCost: data.close * position.quantity - commission,
      positionId: position.id,
      strategy: this.config.id,
      signal
    };

    // Create updated position (readonly properties require new object)
    const updatedPosition: Position = {
      ...position,
      status: PositionStatus.CLOSED,
      currentPrice: data.close,
      currentValue: data.close * position.quantity,
      unrealizedPnL: (data.close - position.entryPrice) * position.quantity
    };

    // Replace the position in the array
    const positionIndex = this.positions.findIndex(p => p.id === position.id);
    if (positionIndex !== -1) {
      this.positions[positionIndex] = updatedPosition;
    }

    this.trades.push(trade);

    log.info('Position closed', {
      positionId: position.id,
      entryPrice: position.entryPrice,
      exitPrice: data.close,
      pnl: position.unrealizedPnL,
      commission: trade.commission
    });
  }

  /**
   * Risk management: Determine if trade should be executed
   */
  private shouldExecuteTrade(
    signal: StrategySignal,
    currentPosition: Position | null,
    data: OHLCVData
  ): boolean {
    // Check maximum position size
    const positionSize = this.calculatePositionSize(data.close);
    if (positionSize === 0) return false;

    // Prevent over-trading (only one position at a time for this strategy)
    if (signal.type === SignalType.BUY && currentPosition) return false;
    if (signal.type === SignalType.SELL && !currentPosition) return false;

    // Check signal confidence threshold
    if (signal.confidence < 0.6) return false;

    return true;
  }

  /**
   * Calculate position size based on risk management rules
   */
  private calculatePositionSize(price: number): number {
    // Simplified position sizing - in practice would use more sophisticated methods
    const maxPositionValue = 10000; // Example maximum position value
    const quantity = Math.floor(maxPositionValue / price);

    return Math.max(1, quantity); // Minimum 1 share
  }

  /**
   * Calculate commission based on strategy configuration
   */
  private calculateCommission(tradeValue: number): number {
    return tradeValue * DEFAULT_STRATEGIES.MOVING_AVERAGE_CROSSOVER.COMMISSION;
  }

  /**
   * Calculate slippage based on strategy configuration
   */
  private calculateSlippage(price: number): number {
    return price * DEFAULT_STRATEGIES.MOVING_AVERAGE_CROSSOVER.SLIPPAGE;
  }

  /**
   * Determine signal strength based on crossover magnitude
   */
  private determineSignalStrength(crossoverStrength: number): SignalStrength {
    if (crossoverStrength > 0.02) return SignalStrength.STRONG;   // > 2%
    if (crossoverStrength > 0.01) return SignalStrength.MODERATE; // > 1%
    return SignalStrength.WEAK;
  }

  /**
   * Calculate signal confidence (0-1)
   */
  private calculateConfidence(crossoverStrength: number): number {
    // Convert crossover strength to confidence score
    const confidence = Math.min(crossoverStrength * 20, 1); // Scale to 0-1
    return Math.max(0.5, confidence); // Minimum 50% confidence
  }

  /**
   * Validate strategy parameters
   */
  private validateParameters(params: MovingAverageCrossoverParameters): MovingAverageCrossoverParameters {
    if (params.shortPeriod >= params.longPeriod) {
      throw new Error('Short period must be less than long period');
    }

    if (params.shortPeriod < 1 || params.longPeriod < 1) {
      throw new Error('Periods must be greater than 0');
    }

    if (params.signalDelay < 0) {
      throw new Error('Signal delay must be non-negative');
    }

    return params;
  }

  /**
   * Helper methods
   */
  private findDataIndex(data: readonly OHLCVData[], date: string): number {
    return data.findIndex(d => d.date === date);
  }

  private getSymbolFromData(data: readonly OHLCVData[]): string {
    // In practice, this would be passed in or stored with the data
    return 'UNKNOWN';
  }

  private createCloseSignal(data: OHLCVData): StrategySignal {
    return {
      timestamp: new Date(data.date).toISOString(),
      date: data.date,
      symbol: this.getSymbolFromData([data]),
      type: SignalType.SELL,
      strength: SignalStrength.MODERATE,
      price: data.close,
      confidence: 1.0,
      metadata: {
        indicators: {},
        conditions: { endOfData: true },
        notes: 'End of data - closing position'
      }
    };
  }

  /**
   * Calculate basic performance metrics
   */
  private calculateBasicPerformance(data: readonly OHLCVData[]): BasicPerformanceMetrics {
    const closedPositions = this.positions.filter(p => p.status === PositionStatus.CLOSED);
    const totalTrades = this.trades.filter(t => t.side === TradeSide.BUY || t.side === TradeSide.SHORT).length;
    const winningTrades = closedPositions.filter(p => p.unrealizedPnL! > 0).length;

    const totalPnL = closedPositions.reduce((sum, p) => sum + (p.unrealizedPnL || 0), 0);
    const totalCommissions = this.trades.reduce((sum, t) => sum + t.commission, 0);
    const netPnL = totalPnL - totalCommissions;

    return {
      totalTrades,
      winningTrades,
      losingTrades: totalTrades - winningTrades,
      winRate: totalTrades > 0 ? winningTrades / totalTrades : 0,
      totalPnL,
      netPnL,
      totalCommissions,
      averageTradeSize: totalTrades > 0 ?
        this.trades.reduce((sum, t) => sum + (t.price * t.quantity), 0) / totalTrades : 0
    };
  }
}

/**
 * Factory function to create Moving Average Crossover strategy
 */
export function createMovingAverageCrossoverStrategy(
  shortPeriod: number = 20,
  longPeriod: number = 50,
  maType: MovingAverageType = MovingAverageType.SIMPLE,
  signalDelay: number = 0
): StrategyConfig {
  const strategyId = deterministicUUID(`ma-crossover-${shortPeriod}-${longPeriod}-${maType}`);

  return {
    id: strategyId,
    name: `MA Crossover ${shortPeriod}/${longPeriod} (${maType})`,
    type: StrategyType.MOVING_AVERAGE_CROSSOVER,
    description: `Moving average crossover strategy using ${shortPeriod}-period and ${longPeriod}-period ${maType.toLowerCase()} moving averages`,
    parameters: {
      shortPeriod,
      longPeriod,
      maType,
      signalDelay
    },
    riskManagement: {
      maxPositionSize: DEFAULT_STRATEGIES.MOVING_AVERAGE_CROSSOVER.POSITION_SIZE,
      maxDrawdown: 0.2, // 20% maximum drawdown
      riskFreeRate: 0.02, // 2% risk-free rate
    },
    metadata: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: '1.0.0',
      author: 'Stratford AI',
      tags: ['moving-average', 'crossover', 'trend-following'],
      isActive: true,
      backtestCount: 0
    }
  };
}

/**
 * Convenience function to execute strategy
 */
export async function executeMovingAverageCrossoverStrategy(
  timeSeries: TimeSeries,
  config?: Partial<MovingAverageCrossoverParameters>
): Promise<StrategyExecutionResult> {
  const strategyConfig = createMovingAverageCrossoverStrategy(
    config?.shortPeriod,
    config?.longPeriod,
    config?.maType,
    config?.signalDelay
  );

  const strategy = new MovingAverageCrossoverStrategy(strategyConfig);
  return strategy.execute(timeSeries);
}

// Type definitions
export interface StrategyExecutionResult {
  signals: StrategySignal[];
  trades: Trade[];
  positions: Position[];
  performance: BasicPerformanceMetrics;
  executionTime: number;
}

export interface BasicPerformanceMetrics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalPnL: number;
  netPnL: number;
  totalCommissions: number;
  averageTradeSize: number;
}