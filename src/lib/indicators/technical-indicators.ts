/**
 * Technical Indicators
 *
 * Deterministic implementation of financial technical indicators
 * for strategy analysis and signal generation.
 */

import type { OHLCVData } from '@/types/market-data';
import { log } from '@/lib/logger';

/**
 * Simple Moving Average (SMA)
 * Calculates the arithmetic mean of prices over a specified period
 */
export function calculateSMA(data: readonly OHLCVData[], period: number, priceType: PriceType = 'close'): number[] {
  if (period <= 0) {
    throw new Error('Period must be greater than 0');
  }

  if (data.length < period) {
    return [];
  }

  const prices = data.map(d => getPriceByType(d, priceType));
  const smaValues: number[] = [];

  for (let i = period - 1; i < prices.length; i++) {
    const sum = prices.slice(i - period + 1, i + 1).reduce((acc, price) => acc + price, 0);
    const sma = sum / period;
    smaValues.push(Number(sma.toFixed(4)));
  }

  log.info('SMA calculated', {
    period,
    priceType,
    dataPoints: data.length,
    smaPoints: smaValues.length
  });

  return smaValues;
}

/**
 * Exponential Moving Average (EMA)
 * Gives more weight to recent prices, responds faster to price changes
 */
export function calculateEMA(data: readonly OHLCVData[], period: number, priceType: PriceType = 'close'): number[] {
  if (period <= 0) {
    throw new Error('Period must be greater than 0');
  }

  if (data.length < period) {
    return [];
  }

  const prices = data.map(d => getPriceByType(d, priceType));
  const emaValues: number[] = [];
  const multiplier = 2 / (period + 1);

  // First EMA value is the SMA of the first 'period' values
  const firstSMA = prices.slice(0, period).reduce((acc, price) => acc + price, 0) / period;
  emaValues.push(Number(firstSMA.toFixed(4)));

  // Calculate subsequent EMA values
  for (let i = period; i < prices.length; i++) {
    const ema = (prices[i] - emaValues[emaValues.length - 1]) * multiplier + emaValues[emaValues.length - 1];
    emaValues.push(Number(ema.toFixed(4)));
  }

  log.info('EMA calculated', {
    period,
    priceType,
    dataPoints: data.length,
    emaPoints: emaValues.length
  });

  return emaValues;
}

/**
 * Weighted Moving Average (WMA)
 * Gives more weight to recent prices with linear weighting
 */
export function calculateWMA(data: readonly OHLCVData[], period: number, priceType: PriceType = 'close'): number[] {
  if (period <= 0) {
    throw new Error('Period must be greater than 0');
  }

  if (data.length < period) {
    return [];
  }

  const prices = data.map(d => getPriceByType(d, priceType));
  const wmaValues: number[] = [];
  const weightSum = (period * (period + 1)) / 2; // Sum of weights: 1+2+3+...+n

  for (let i = period - 1; i < prices.length; i++) {
    let weightedSum = 0;

    for (let j = 0; j < period; j++) {
      const weight = j + 1; // Weight increases linearly (1, 2, 3, ..., period)
      weightedSum += prices[i - period + 1 + j] * weight;
    }

    const wma = weightedSum / weightSum;
    wmaValues.push(Number(wma.toFixed(4)));
  }

  log.info('WMA calculated', {
    period,
    priceType,
    dataPoints: data.length,
    wmaPoints: wmaValues.length
  });

  return wmaValues;
}

/**
 * Bollinger Bands
 * Statistical indicator using SMA and standard deviation
 */
export function calculateBollingerBands(
  data: readonly OHLCVData[],
  period: number = 20,
  standardDeviations: number = 2,
  priceType: PriceType = 'close'
): BollingerBands[] {
  if (period <= 0) {
    throw new Error('Period must be greater than 0');
  }

  if (data.length < period) {
    return [];
  }

  const prices = data.map(d => getPriceByType(d, priceType));
  const smaValues = calculateSMA(data, period, priceType);
  const bollingerBands: BollingerBands[] = [];

  for (let i = period - 1; i < prices.length; i++) {
    const sma = smaValues[i - period + 1];
    const priceSlice = prices.slice(i - period + 1, i + 1);

    // Calculate standard deviation
    const variance = priceSlice.reduce((acc, price) => acc + Math.pow(price - sma, 2), 0) / period;
    const stdDev = Math.sqrt(variance);

    const upperBand = sma + (standardDeviations * stdDev);
    const lowerBand = sma - (standardDeviations * stdDev);

    bollingerBands.push({
      date: data[i].date,
      middle: Number(sma.toFixed(4)),
      upper: Number(upperBand.toFixed(4)),
      lower: Number(lowerBand.toFixed(4)),
      bandwidth: Number(((upperBand - lowerBand) / sma * 100).toFixed(4))
    });
  }

  log.info('Bollinger Bands calculated', {
    period,
    standardDeviations,
    priceType,
    dataPoints: data.length,
    bandPoints: bollingerBands.length
  });

  return bollingerBands;
}

/**
 * Relative Strength Index (RSI)
 * Momentum oscillator measuring speed and magnitude of price changes
 */
export function calculateRSI(data: readonly OHLCVData[], period: number = 14, priceType: PriceType = 'close'): RSIPoint[] {
  if (period <= 0) {
    throw new Error('Period must be greater than 0');
  }

  if (data.length < period + 1) {
    return [];
  }

  const prices = data.map(d => getPriceByType(d, priceType));
  const rsiValues: RSIPoint[] = [];

  // Calculate price changes
  const priceChanges: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    priceChanges.push(prices[i] - prices[i - 1]);
  }

  let avgGain = 0;
  let avgLoss = 0;

  // Calculate initial average gain and loss
  for (let i = 0; i < period; i++) {
    const change = priceChanges[i];
    if (change > 0) {
      avgGain += change;
    } else {
      avgLoss += Math.abs(change);
    }
  }
  avgGain /= period;
  avgLoss /= period;

  // Calculate RSI for each subsequent period
  for (let i = period; i < priceChanges.length; i++) {
    const change = priceChanges[i];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;

    // Smooth the averages using Wilder's smoothing method
    avgGain = ((avgGain * (period - 1)) + gain) / period;
    avgLoss = ((avgLoss * (period - 1)) + loss) / period;

    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));

    rsiValues.push({
      date: data[i + 1].date,
      rsi: Number(rsi.toFixed(4)),
      signal: rsi > 70 ? 'overbought' : rsi < 30 ? 'oversold' : 'neutral'
    });
  }

  log.info('RSI calculated', {
    period,
    priceType,
    dataPoints: data.length,
    rsiPoints: rsiValues.length
  });

  return rsiValues;
}

/**
 * MACD (Moving Average Convergence Divergence)
 * Trend-following momentum indicator
 */
export function calculateMACD(
  data: readonly OHLCVData[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9,
  priceType: PriceType = 'close'
): MACDPoint[] {
  if (fastPeriod >= slowPeriod) {
    throw new Error('Fast period must be less than slow period');
  }

  if (data.length < slowPeriod + signalPeriod) {
    return [];
  }

  const fastEMA = calculateEMA(data, fastPeriod, priceType);
  const slowEMA = calculateEMA(data, slowPeriod, priceType);

  // Calculate MACD line (difference between fast and slow EMA)
  const macdLine: number[] = [];
  const startIndex = slowPeriod - fastPeriod; // Align the arrays

  for (let i = 0; i < slowEMA.length; i++) {
    const macd = fastEMA[i + startIndex] - slowEMA[i];
    macdLine.push(Number(macd.toFixed(4)));
  }

  // Create temporary data for signal line calculation
  const macdData: OHLCVData[] = macdLine.map((value, index) => ({
    date: data[index + slowPeriod - 1].date,
    open: value,
    high: value,
    low: value,
    close: value,
    volume: 0
  }));

  // Calculate signal line (EMA of MACD line)
  const signalLine = calculateEMA(macdData, signalPeriod, 'close');

  // Calculate histogram (MACD - Signal)
  const macdPoints: MACDPoint[] = [];
  for (let i = 0; i < signalLine.length; i++) {
    const macd = macdLine[i + signalPeriod - 1];
    const signal = signalLine[i];
    const histogram = macd - signal;

    macdPoints.push({
      date: data[i + slowPeriod + signalPeriod - 2].date,
      macd: Number(macd.toFixed(4)),
      signal: Number(signal.toFixed(4)),
      histogram: Number(histogram.toFixed(4))
    });
  }

  log.info('MACD calculated', {
    fastPeriod,
    slowPeriod,
    signalPeriod,
    priceType,
    dataPoints: data.length,
    macdPoints: macdPoints.length
  });

  return macdPoints;
}

/**
 * Moving Average Crossover Detection
 * Identifies bullish and bearish crossover signals
 */
export function detectMovingAverageCrossover(
  shortMA: number[],
  longMA: number[],
  data: readonly OHLCVData[]
): CrossoverSignal[] {
  if (shortMA.length !== longMA.length) {
    throw new Error('Moving averages must have the same length');
  }

  if (shortMA.length === 0) {
    return [];
  }

  const signals: CrossoverSignal[] = [];
  const alignedDataStart = data.length - shortMA.length;

  for (let i = 1; i < shortMA.length; i++) {
    const prevShort = shortMA[i - 1];
    const currShort = shortMA[i];
    const prevLong = longMA[i - 1];
    const currLong = longMA[i];

    let signalType: 'bullish' | 'bearish' | null = null;

    // Bullish crossover: short MA crosses above long MA
    if (prevShort <= prevLong && currShort > currLong) {
      signalType = 'bullish';
    }
    // Bearish crossover: short MA crosses below long MA
    else if (prevShort >= prevLong && currShort < currLong) {
      signalType = 'bearish';
    }

    if (signalType) {
      signals.push({
        date: data[alignedDataStart + i].date,
        type: signalType,
        shortMA: Number(currShort.toFixed(4)),
        longMA: Number(currLong.toFixed(4)),
        price: data[alignedDataStart + i].close,
        strength: Math.abs(currShort - currLong) / currLong // Signal strength as percentage difference
      });
    }
  }

  log.info('Crossover signals detected', {
    signals: signals.length,
    bullish: signals.filter(s => s.type === 'bullish').length,
    bearish: signals.filter(s => s.type === 'bearish').length
  });

  return signals;
}

/**
 * Support and Resistance Level Detection
 * Identifies key price levels using pivot points
 */
export function detectSupportResistance(
  data: readonly OHLCVData[],
  window: number = 5,
  minTouches: number = 2
): SupportResistanceLevel[] {
  if (data.length < window * 2 + 1) {
    return [];
  }

  const levels: SupportResistanceLevel[] = [];
  const pivotPoints: PivotPoint[] = [];

  // Find pivot highs and lows
  for (let i = window; i < data.length - window; i++) {
    const current = data[i];
    const leftWindow = data.slice(i - window, i);
    const rightWindow = data.slice(i + 1, i + window + 1);

    // Check for pivot high
    const isPivotHigh = leftWindow.every(d => d.high <= current.high) &&
      rightWindow.every(d => d.high <= current.high);

    // Check for pivot low
    const isPivotLow = leftWindow.every(d => d.low >= current.low) &&
      rightWindow.every(d => d.low >= current.low);

    if (isPivotHigh) {
      pivotPoints.push({
        date: current.date,
        price: current.high,
        type: 'resistance'
      });
    }

    if (isPivotLow) {
      pivotPoints.push({
        date: current.date,
        price: current.low,
        type: 'support'
      });
    }
  }

  // Group similar price levels and count touches
  const tolerance = 0.02; // 2% tolerance for grouping levels
  const groupedLevels = new Map<string, PivotPoint[]>();

  for (const pivot of pivotPoints) {
    let assigned = false;

    for (const [key, group] of groupedLevels) {
      const basePrice = parseFloat(key.split('_')[0]);
      if (Math.abs(pivot.price - basePrice) / basePrice <= tolerance) {
        group.push(pivot);
        assigned = true;
        break;
      }
    }

    if (!assigned) {
      const key = `${pivot.price}_${pivot.type}`;
      groupedLevels.set(key, [pivot]);
    }
  }

  // Create support/resistance levels with enough touches
  for (const [key, group] of groupedLevels) {
    if (group.length >= minTouches) {
      const [, type] = key.split('_');
      const avgPrice = group.reduce((sum, p) => sum + p.price, 0) / group.length;

      levels.push({
        price: Number(avgPrice.toFixed(4)),
        type: type as 'support' | 'resistance',
        touches: group.length,
        strength: Math.min(group.length / 5, 1), // Normalize strength to 0-1
        firstTouch: group[0].date,
        lastTouch: group[group.length - 1].date
      });
    }
  }

  log.info('Support/Resistance levels detected', {
    pivotPoints: pivotPoints.length,
    levels: levels.length,
    support: levels.filter(l => l.type === 'support').length,
    resistance: levels.filter(l => l.type === 'resistance').length
  });

  return levels.sort((a, b) => b.strength - a.strength);
}

/**
 * Helper function to get price by type
 */
function getPriceByType(data: OHLCVData, priceType: PriceType): number {
  switch (priceType) {
    case 'open':
      return data.open;
    case 'high':
      return data.high;
    case 'low':
      return data.low;
    case 'close':
      return data.close;
    case 'hl2':
      return (data.high + data.low) / 2;
    case 'hlc3':
      return (data.high + data.low + data.close) / 3;
    case 'ohlc4':
      return (data.open + data.high + data.low + data.close) / 4;
    default:
      return data.close;
  }
}

// Type definitions
export type PriceType = 'open' | 'high' | 'low' | 'close' | 'hl2' | 'hlc3' | 'ohlc4';

export interface BollingerBands {
  date: string;
  middle: number;
  upper: number;
  lower: number;
  bandwidth: number;
}

export interface RSIPoint {
  date: string;
  rsi: number;
  signal: 'overbought' | 'oversold' | 'neutral';
}

export interface MACDPoint {
  date: string;
  macd: number;
  signal: number;
  histogram: number;
}

export interface CrossoverSignal {
  date: string;
  type: 'bullish' | 'bearish';
  shortMA: number;
  longMA: number;
  price: number;
  strength: number;
}

export interface PivotPoint {
  date: string;
  price: number;
  type: 'support' | 'resistance';
}

export interface SupportResistanceLevel {
  price: number;
  type: 'support' | 'resistance';
  touches: number;
  strength: number;
  firstTouch: string;
  lastTouch: string;
}

/**
 * Donchian Channels
 * Trend following indicator that uses the highest high and lowest low
 */
export function calculateDonchianChannels(
  data: readonly OHLCVData[],
  period: number = 20
): DonchianChannel[] {
  if (period <= 0) {
    throw new Error('Period must be greater than 0');
  }

  if (data.length < period) {
    return [];
  }

  const channels: DonchianChannel[] = [];

  // Start from the end of the first period
  for (let i = period - 1; i < data.length; i++) {
    // Look back 'period' candles (inclusive of current for current channel value)
    // Usually Donchian is derived from *previous* N periods for signals, but standard indicator plot is current window.
    // We will calculate for [i - period + 1, i]

    const window = data.slice(i - period + 1, i + 1);

    const upper = Math.max(...window.map(d => d.high));
    const lower = Math.min(...window.map(d => d.low));
    const middle = (upper + lower) / 2;

    channels.push({
      date: data[i].date,
      upper,
      lower,
      middle
    });
  }

  return channels;
}

export interface DonchianChannel {
  date: string;
  upper: number;
  lower: number;
  middle: number;
}

/**
 * Average True Range (ATR)
 * Volatility indicator
 */
export function calculateATR(data: readonly OHLCVData[], period: number = 14): number[] {
  if (period <= 0) {
    throw new Error('Period must be greater than 0');
  }

  if (data.length < period + 1) {
    return [];
  }

  const trValues: number[] = [];

  // Calculate True Range for each candle (starting from index 1)
  for (let i = 1; i < data.length; i++) {
    const high = data[i].high;
    const low = data[i].low;
    const prevClose = data[i - 1].close;

    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    trValues.push(tr);
  }

  // Calculate ATR (Wilder's Smoothing)
  const atrValues: number[] = [];

  // First ATR is simple average of first 'period' TR values
  let firstATR = 0;
  for (let i = 0; i < period; i++) {
    firstATR += trValues[i];
  }
  firstATR /= period;
  atrValues.push(Number(firstATR.toFixed(4)));

  // Subsequent ATRs
  let prevATR = firstATR;
  for (let i = period; i < trValues.length; i++) {
    const currentTR = trValues[i];
    const atr = (prevATR * (period - 1) + currentTR) / period;
    atrValues.push(Number(atr.toFixed(4)));
    prevATR = atr;
  }

  return atrValues;
}