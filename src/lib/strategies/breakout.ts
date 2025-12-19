/**
 * Breakout Strategy
 *
 * Implements a Volatility Breakout strategy using Donchian Channels.
 * Capitalizes on price breaking through support/resistance levels.
 */

import { log } from '@/lib/logger';
import { calculateDonchianChannels, calculateATR } from '@/lib/indicators/technical-indicators';
import { DEFAULT_STRATEGIES } from '@/constants';
import type {
    StrategyConfig,
    StrategySignal,
    BreakoutParameters,
    Position,
    Trade,
    StrategyExecutionResult,
    BasicPerformanceMetrics,
} from '@/types/strategy';
import {
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

export class BreakoutStrategy {
    private readonly config: StrategyConfig;
    private readonly parameters: BreakoutParameters;
    private positions: Position[] = [];
    private trades: Trade[] = [];
    private signals: StrategySignal[] = [];

    constructor(config: StrategyConfig) {
        this.config = config;
        this.parameters = config.parameters as BreakoutParameters;
    }

    execute(timeSeries: TimeSeries): StrategyExecutionResult {
        const startTime = performance.now();
        this.resetState();

        try {
            const channels = calculateDonchianChannels(
                timeSeries.data,
                this.parameters.period
            );

            // Generate Signals
            this.signals = this.detectSignals(timeSeries.data, channels);

            // Execute Trades
            this.executeTrades(timeSeries.data);

            return {
                signals: this.signals,
                trades: this.trades,
                positions: this.positions,
                performance: this.calculateBasicPerformance(),
                executionTime: performance.now() - startTime
            };
        } catch (error) {
            log.error('Breakout Execution Failed', { error });
            throw error;
        }
    }

    private resetState() {
        this.positions = [];
        this.trades = [];
        this.signals = [];
    }

    private detectSignals(data: readonly OHLCVData[], channels: any[]): StrategySignal[] {
        const signals: StrategySignal[] = [];
        // Align data
        // Channel[0] corresponds to period-1 index of data
        const offset = this.parameters.period - 1;

        for (let i = 1; i < channels.length; i++) {
            // Channel at i is based on [i-period+1 ... i]. 
            // Breakout signal occurs when price closes > PREVIOUS High.
            // So we compare data[idx] close to channel[i-1].upper?
            // Standard Donchian: 
            // Buy if Close > Highest High of *previous* N days.
            // Channel[i-1] represents Highest High of previous N days relative to data[idx].

            const dataIdx = i + offset;
            if (dataIdx >= data.length) break;

            const currentPrice = data[dataIdx].close;
            const prevChannel = channels[i - 1]; // Previous N-period high/low

            let type: SignalType | null = null;

            if (currentPrice > prevChannel.upper) {
                type = SignalType.BUY;
            } else if (currentPrice < prevChannel.lower) {
                type = SignalType.SELL;
            }

            if (type) {
                signals.push({
                    timestamp: new Date(data[dataIdx].date).toISOString(),
                    date: data[dataIdx].date,
                    symbol: 'UNKNOWN',
                    type,
                    strength: SignalStrength.STRONG, // Breakouts are usually strong
                    price: currentPrice,
                    confidence: 0.7,
                    metadata: {
                        indicators: {
                            upper: prevChannel.upper,
                            lower: prevChannel.lower,
                            middle: prevChannel.middle
                        },
                        conditions: {
                            breakoutLevel: type === SignalType.BUY ? prevChannel.upper : prevChannel.lower
                        }
                    }
                });
            }
        }
        return signals;
    }

    private executeTrades(data: readonly OHLCVData[]) {
        let currentPos: Position | null = null;
        let highestPrice = 0; // For trailing stop
        let lowestPrice = Infinity;

        const combinedEvents = data.map(d => ({
            date: d.date,
            data: d,
            signal: this.signals.find(s => s.date === d.date)
        }));

        for (const event of combinedEvents) {
            const { data: quote, signal } = event;

            if (currentPos) {
                // Update trailing stop tracking
                if (currentPos.type === PositionType.LONG) {
                    highestPrice = Math.max(highestPrice, quote.high);
                } else {
                    lowestPrice = Math.min(lowestPrice, quote.low);
                }

                // Check Exit: Trailing Stop (Simplified: 2 * ATR logic or simplified %)
                // For prototype, we use fixed % trailing stop or reversal
                const trailingStopPct = 0.05; // 5% trailing

                let close = false;
                if (currentPos.type === PositionType.LONG) {
                    if (quote.close < highestPrice * (1 - trailingStopPct)) close = true;
                } else {
                    if (quote.close > lowestPrice * (1 + trailingStopPct)) close = true;
                }

                // Also Close on reversal signal
                if (signal && signal.type !== (currentPos.type === PositionType.LONG ? SignalType.BUY : SignalType.SELL)) {
                    close = true;
                }

                if (close) {
                    this.closePosition(currentPos, quote, signal || null);
                    currentPos = null;
                }
            }

            if (!currentPos && signal) {
                if (signal.type === SignalType.BUY) {
                    currentPos = this.openPosition(signal, quote, PositionType.LONG);
                    highestPrice = quote.close;
                } else if (signal.type === SignalType.SELL) {
                    currentPos = this.openPosition(signal, quote, PositionType.SHORT);
                    lowestPrice = quote.close;
                }
            }
        }
    }

    private openPosition(signal: StrategySignal, data: OHLCVData, type: PositionType): Position {
        const qty = Math.floor(10000 / data.close);
        const position: Position = {
            id: deterministicUUID(signal.date + 'pos-bo'),
            symbol: signal.symbol,
            type,
            entryDate: signal.date,
            entryPrice: data.close,
            quantity: qty,
            currentValue: qty * data.close,
            status: PositionStatus.OPEN,
            strategy: this.config.id
        };
        this.positions.push(position);

        this.trades.push({
            id: deterministicUUID(signal.date + 'trade-bo'),
            symbol: signal.symbol,
            type: TradeType.MARKET,
            side: type === PositionType.LONG ? TradeSide.BUY : TradeSide.SHORT,
            date: signal.date,
            price: data.close,
            quantity: qty,
            commission: 0,
            slippage: 0,
            totalCost: qty * data.close,
            strategy: this.config.id,
            signal
        });

        return position;
    }

    private closePosition(position: Position, data: OHLCVData, signal: StrategySignal | null) {
        const realizedPnL = (data.close - position.entryPrice) * position.quantity * (position.type === PositionType.LONG ? 1 : -1);

        const updatedPosition: Position = {
            ...position,
            status: PositionStatus.CLOSED,
            exitDate: data.date,
            realizedPnL,
            currentPrice: data.close,
            currentValue: data.close * position.quantity
        };

        const idx = this.positions.findIndex(p => p.id === position.id);
        if (idx !== -1) {
            this.positions[idx] = updatedPosition;
        }

        this.trades.push({
            id: deterministicUUID(data.date + 'close-bo'),
            symbol: position.symbol,
            type: TradeType.MARKET,
            side: position.type === PositionType.LONG ? TradeSide.SELL : TradeSide.COVER,
            date: data.date,
            price: data.close,
            quantity: position.quantity,
            commission: 0,
            slippage: 0,
            totalCost: position.quantity * data.close,
            positionId: position.id,
            strategy: this.config.id,
            signal: signal || undefined
        });
    }

    private calculateBasicPerformance(): BasicPerformanceMetrics {
        const closedPositions = this.positions.filter(p => p.status === PositionStatus.CLOSED);
        const totalTrades = this.trades.filter(t => t.side === TradeSide.BUY || t.side === TradeSide.SHORT).length;
        const winningTrades = closedPositions.filter(p => (p.realizedPnL || 0) > 0).length;

        const totalPnL = closedPositions.reduce((sum, p) => sum + (p.realizedPnL || 0), 0);
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

export function createBreakoutStrategy(
    period: number = 20,
    stopLossATR: number = 2
): StrategyConfig {
    return {
        id: deterministicUUID('bo-' + period),
        name: `volatility Breakout (${period})`,
        type: StrategyType.BREAKOUT,
        parameters: { period, stopLossATR, useTrailingStop: true },
        riskManagement: { maxDrawdown: 0.2, maxPositionSize: 0.1 },
        metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            version: '1.0.0',
            tags: ['breakout', 'donchian', 'trend'],
            isActive: true,
            backtestCount: 0
        }
    };
}
