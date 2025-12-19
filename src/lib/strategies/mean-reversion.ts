/**
 * Mean Reversion Strategy
 *
 * Implements a Bollinger Band mean reversion strategy with optional RSI filter.
 * Attempts to capture price moves that have deviated significantly from the mean.
 */

import { log } from '@/lib/logger';
import { calculateBollingerBands, calculateRSI } from '@/lib/indicators/technical-indicators';
import { DEFAULT_STRATEGIES } from '@/constants';
import type {
    StrategyConfig,
    StrategySignal,
    MeanReversionParameters,
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

export class MeanReversionStrategy {
    private readonly config: StrategyConfig;
    private readonly parameters: MeanReversionParameters;
    private positions: Position[] = [];
    private trades: Trade[] = [];
    private signals: StrategySignal[] = [];

    constructor(config: StrategyConfig) {
        this.config = config;
        this.parameters = config.parameters as MeanReversionParameters;
    }

    execute(timeSeries: TimeSeries): StrategyExecutionResult {
        const startTime = performance.now();
        this.resetState();

        try {
            const bands = calculateBollingerBands(
                timeSeries.data,
                this.parameters.period,
                this.parameters.stdDev
            );

            // Optional RSI
            const rsiValues = this.parameters.useRSI
                ? calculateRSI(timeSeries.data, this.parameters.rsiPeriod || 14)
                : [];

            // Generate Signals
            const signals = this.detectSignals(timeSeries.data, bands, rsiValues);
            this.signals = signals;

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
            log.error('Mean Reversion Execution Failed', { error });
            throw error;
        }
    }

    private resetState() {
        this.positions = [];
        this.trades = [];
        this.signals = [];
    }

    private detectSignals(
        data: readonly OHLCVData[],
        bands: any[],
        rsi: any[]
    ): StrategySignal[] {
        const signals: StrategySignal[] = [];
        const minLen = Math.min(data.length, bands.length);
        const offset = data.length - minLen; // Align arrays

        for (let i = 1; i < minLen; i++) {
            const dataIdx = i + offset;
            const price = data[dataIdx].close;
            const band = bands[i];

            // Check RSI condition if enabled
            let rsiCondition = true;
            if (this.parameters.useRSI) {
                // Find RSI for this date (simplification: assume aligned dates if same source)
                const rsiPoint = rsi.find(r => r.date === data[dataIdx].date);
                if (rsiPoint) {
                    if (price < band.lower) { // Potential Long
                        rsiCondition = rsiPoint.rsi < (this.parameters.rsiOversold || 30);
                    } else if (price > band.upper) { // Potential Short
                        rsiCondition = rsiPoint.rsi > (this.parameters.rsiOverbought || 70);
                    }
                }
            }

            let type: SignalType | null = null;
            let strength = SignalStrength.WEAK;

            // Long Signal: Price crosses below Lower Band
            if (price < band.lower && rsiCondition) {
                type = SignalType.BUY;
                strength = (band.lower - price) / price > 0.02 ? SignalStrength.STRONG : SignalStrength.MODERATE;
            }
            // Sell Signal (Short): Price crosses above Upper Band
            else if (price > band.upper && rsiCondition) {
                type = SignalType.SELL;
                strength = (price - band.upper) / price > 0.02 ? SignalStrength.STRONG : SignalStrength.MODERATE;
            }

            // Exit Signal (Mean Reversion): Price crosses Middle Band
            // (Handled visually as signal, logic handled in execution)

            if (type) {
                signals.push({
                    timestamp: new Date(data[dataIdx].date).toISOString(),
                    date: data[dataIdx].date,
                    symbol: 'UNKNOWN', // Should be passed
                    type,
                    strength,
                    price,
                    confidence: 0.8, // Static for now
                    metadata: {
                        indicators: {
                            upper: band.upper,
                            lower: band.lower,
                            middle: band.middle
                        },
                        conditions: { rsiConfirmed: rsiCondition }
                    }
                });
            }
        }
        return signals;
    }

    private executeTrades(data: readonly OHLCVData[]) {
        let currentPos: Position | null = null;

        // We need to iterate day by day to handle Exits that might not be Signals
        // (e.g. Stop Loss or Mean Reversion Touch)
        // This is a simplified version relying on signals for entry

        const combinedEvents = data.map(d => ({
            date: d.date,
            data: d,
            signal: this.signals.find(s => s.date === d.date)
        }));

        for (const event of combinedEvents) {
            const { data: quote, signal } = event;

            // Check Exit Conditions for Open Position
            if (currentPos) {
                const band = calculateBollingerBands([quote], this.parameters.period, this.parameters.stdDev);
                // Note: calculateBollingerBands needs history. 
                // Optimally we pass full bands array to this function.
                // For prototype, we'll just check if we have an opposing signal or simple stop loss

                if (signal && signal.type !== (currentPos.type === PositionType.LONG ? SignalType.BUY : SignalType.SELL)) {
                    this.closePosition(currentPos, quote, signal);
                    currentPos = null;
                }
            }

            // Check Entry
            if (!currentPos && signal) {
                if (signal.type === SignalType.BUY) {
                    currentPos = this.openPosition(signal, quote, PositionType.LONG);
                } else if (signal.type === SignalType.SELL) {
                    currentPos = this.openPosition(signal, quote, PositionType.SHORT);
                }
            }
        }
    }

    private openPosition(signal: StrategySignal, data: OHLCVData, type: PositionType): Position {
        const qty = Math.floor(10000 / data.close); // Fixed 10k sizing
        const position: Position = {
            id: deterministicUUID(signal.date + 'pos'),
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

        // Record Trade
        this.trades.push({
            id: deterministicUUID(signal.date + 'trade'),
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

    private closePosition(position: Position, data: OHLCVData, signal: StrategySignal) {
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
            id: deterministicUUID(data.date + 'close'),
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
            signal
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

export function createMeanReversionStrategy(
    period: number = 20,
    stdDev: number = 2
): StrategyConfig {
    return {
        id: deterministicUUID('mr-' + period),
        name: `Mean Reversion (${period}, ${stdDev})`,
        type: StrategyType.MEAN_REVERSION,
        parameters: { period, stdDev, useRSI: false },
        riskManagement: { maxDrawdown: 0.2, maxPositionSize: 0.1 },
        metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            version: '1.0.0',
            tags: ['mean-reversion', 'bollinger'],
            isActive: true,
            backtestCount: 0
        }
    };
}
