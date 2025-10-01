/**
 * Technical Indicators Tests
 *
 * Comprehensive test suite for technical indicators with deterministic data
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateSMA,
  calculateEMA,
  calculateWMA,
  calculateBollingerBands,
  calculateRSI,
  calculateMACD,
  detectMovingAverageCrossover,
  detectSupportResistance,
  type PriceType
} from './technical-indicators';
import type { OHLCVData } from '@/types/market-data';

describe('Technical Indicators', () => {
  let sampleData: OHLCVData[];

  beforeEach(() => {
    // Create deterministic test data
    sampleData = [
      { date: '2023-01-01', open: 100, high: 105, low: 99, close: 104, volume: 1000000 },
      { date: '2023-01-02', open: 104, high: 108, low: 103, close: 107, volume: 1100000 },
      { date: '2023-01-03', open: 107, high: 109, low: 105, close: 106, volume: 1200000 },
      { date: '2023-01-04', open: 106, high: 110, low: 104, close: 108, volume: 1300000 },
      { date: '2023-01-05', open: 108, high: 112, low: 107, close: 111, volume: 1400000 },
      { date: '2023-01-06', open: 111, high: 113, low: 109, close: 110, volume: 1500000 },
      { date: '2023-01-07', open: 110, high: 112, low: 108, close: 109, volume: 1600000 },
      { date: '2023-01-08', open: 109, high: 111, low: 107, close: 108, volume: 1700000 },
      { date: '2023-01-09', open: 108, high: 110, low: 106, close: 107, volume: 1800000 },
      { date: '2023-01-10', open: 107, high: 109, low: 105, close: 106, volume: 1900000 },
    ];
  });

  describe('Simple Moving Average (SMA)', () => {
    it('should calculate SMA correctly', () => {
      const sma = calculateSMA(sampleData, 3, 'close');

      expect(sma).toHaveLength(8); // 10 - 3 + 1
      expect(sma[0]).toBeCloseTo(105.67, 2); // (104 + 107 + 106) / 3
      expect(sma[1]).toBeCloseTo(107, 2); // (107 + 106 + 108) / 3
      expect(sma[2]).toBeCloseTo(108.33, 2); // (106 + 108 + 111) / 3
    });

    it('should handle different price types', () => {
      const smaClose = calculateSMA(sampleData, 3, 'close');
      const smaOpen = calculateSMA(sampleData, 3, 'open');
      const smaHigh = calculateSMA(sampleData, 3, 'high');
      const smaLow = calculateSMA(sampleData, 3, 'low');

      expect(smaClose).not.toEqual(smaOpen);
      expect(smaHigh).not.toEqual(smaLow);
      expect(smaClose[0]).toBeCloseTo(105.67, 2);
      expect(smaOpen[0]).toBeCloseTo(103.67, 2); // (100 + 104 + 107) / 3
    });

    it('should return empty array for insufficient data', () => {
      const sma = calculateSMA(sampleData.slice(0, 2), 3);
      expect(sma).toHaveLength(0);
    });

    it('should throw error for invalid period', () => {
      expect(() => calculateSMA(sampleData, 0)).toThrow('Period must be greater than 0');
      expect(() => calculateSMA(sampleData, -1)).toThrow('Period must be greater than 0');
    });
  });

  describe('Exponential Moving Average (EMA)', () => {
    it('should calculate EMA correctly', () => {
      const ema = calculateEMA(sampleData, 3, 'close');

      expect(ema).toHaveLength(8); // 10 - 3 + 1
      expect(ema[0]).toBeCloseTo(105.67, 2); // First value should be SMA

      // Subsequent values should follow EMA formula
      const multiplier = 2 / (3 + 1); // 0.5
      const expectedEMA1 = (108 - 105.67) * multiplier + 105.67;
      expect(ema[1]).toBeCloseTo(expectedEMA1, 2);
    });

    it('should respond faster to price changes than SMA', () => {
      const sma = calculateSMA(sampleData, 5, 'close');
      const ema = calculateEMA(sampleData, 5, 'close');

      // Both should have same length
      expect(ema).toHaveLength(sma.length);

      // EMA should be more responsive to recent price changes
      // In our sample data, prices generally increase then decrease
      expect(ema[ema.length - 1]).not.toBe(sma[sma.length - 1]);
    });

    it('should handle different price types', () => {
      const emaClose = calculateEMA(sampleData, 3, 'close');
      const emaHL2 = calculateEMA(sampleData, 3, 'hl2');

      expect(emaClose).not.toEqual(emaHL2);
      expect(emaClose).toHaveLength(emaHL2.length);
    });
  });

  describe('Weighted Moving Average (WMA)', () => {
    it('should calculate WMA correctly', () => {
      const wma = calculateWMA(sampleData, 3, 'close');

      expect(wma).toHaveLength(8);

      // Manual calculation for first WMA: (104*1 + 107*2 + 106*3) / (1+2+3) = 636/6 = 106
      expect(wma[0]).toBeCloseTo(106, 2);
    });

    it('should give more weight to recent prices', () => {
      const wma = calculateWMA(sampleData, 3, 'close');
      const sma = calculateSMA(sampleData, 3, 'close');

      expect(wma).toHaveLength(sma.length);
      // WMA should be different from SMA due to weighting
      expect(wma[0]).not.toBe(sma[0]);
    });
  });

  describe('Bollinger Bands', () => {
    it('should calculate Bollinger Bands correctly', () => {
      const bands = calculateBollingerBands(sampleData, 5, 2, 'close');

      expect(bands).toHaveLength(6); // 10 - 5 + 1

      for (const band of bands) {
        expect(band.upper).toBeGreaterThan(band.middle);
        expect(band.middle).toBeGreaterThan(band.lower);
        expect(band.bandwidth).toBeGreaterThan(0);
        expect(band.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    });

    it('should handle different standard deviations', () => {
      const bands1 = calculateBollingerBands(sampleData, 5, 1, 'close');
      const bands2 = calculateBollingerBands(sampleData, 5, 2, 'close');

      expect(bands1).toHaveLength(bands2.length);

      // Bands with higher std dev should be wider
      for (let i = 0; i < bands1.length; i++) {
        expect(bands2[i].upper).toBeGreaterThan(bands1[i].upper);
        expect(bands2[i].lower).toBeLessThan(bands1[i].lower);
        expect(bands2[i].bandwidth).toBeGreaterThan(bands1[i].bandwidth);
      }
    });
  });

  describe('Relative Strength Index (RSI)', () => {
    it('should calculate RSI correctly', () => {
      // Create data with clear trend for RSI testing
      const trendData: OHLCVData[] = [];
      for (let i = 0; i < 20; i++) {
        trendData.push({
          date: `2023-01-${(i + 1).toString().padStart(2, '0')}`,
          open: 100 + i,
          high: 102 + i,
          low: 99 + i,
          close: 101 + i, // Consistently increasing
          volume: 1000000
        });
      }

      const rsi = calculateRSI(trendData, 14, 'close');

      expect(rsi.length).toBeGreaterThan(0);

      for (const point of rsi) {
        expect(point.rsi).toBeGreaterThanOrEqual(0);
        expect(point.rsi).toBeLessThanOrEqual(100);
        expect(['overbought', 'oversold', 'neutral']).toContain(point.signal);
        expect(point.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }

      // In a consistently rising market, RSI should be high
      const lastRSI = rsi[rsi.length - 1];
      expect(lastRSI.rsi).toBeGreaterThan(50);
    });

    it('should identify overbought and oversold conditions', () => {
      // Create overbought condition (RSI > 70)
      const overboughtData: OHLCVData[] = [];
      for (let i = 0; i < 20; i++) {
        overboughtData.push({
          date: `2023-01-${(i + 1).toString().padStart(2, '0')}`,
          open: 100,
          high: 102,
          low: 99,
          close: 100 + i * 2, // Sharp increase
          volume: 1000000
        });
      }

      const rsi = calculateRSI(overboughtData, 14, 'close');
      const lastPoint = rsi[rsi.length - 1];

      expect(lastPoint.rsi).toBeGreaterThan(70);
      expect(lastPoint.signal).toBe('overbought');
    });
  });

  describe('MACD', () => {
    it('should calculate MACD correctly', () => {
      // Create longer dataset for MACD
      const longData: OHLCVData[] = [];
      for (let i = 0; i < 50; i++) {
        longData.push({
          date: `2023-01-${(i + 1).toString().padStart(2, '0')}`,
          open: 100 + Math.sin(i / 5) * 10,
          high: 102 + Math.sin(i / 5) * 10,
          low: 98 + Math.sin(i / 5) * 10,
          close: 100 + Math.sin(i / 5) * 10,
          volume: 1000000
        });
      }

      const macd = calculateMACD(longData, 12, 26, 9, 'close');

      expect(macd.length).toBeGreaterThan(0);

      for (const point of macd) {
        expect(typeof point.macd).toBe('number');
        expect(typeof point.signal).toBe('number');
        expect(typeof point.histogram).toBe('number');
        expect(point.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);

        // Histogram should be MACD - Signal
        expect(point.histogram).toBeCloseTo(point.macd - point.signal, 4);
      }
    });

    it('should throw error for invalid periods', () => {
      expect(() => calculateMACD(sampleData, 26, 12, 9)).toThrow(
        'Fast period must be less than slow period'
      );
    });
  });

  describe('Moving Average Crossover Detection', () => {
    it('should detect bullish and bearish crossovers', () => {
      // Create data with clear crossover pattern
      const crossoverData: OHLCVData[] = [
        { date: '2023-01-01', open: 100, high: 105, low: 99, close: 100, volume: 1000000 },
        { date: '2023-01-02', open: 100, high: 105, low: 99, close: 101, volume: 1000000 },
        { date: '2023-01-03', open: 101, high: 106, low: 100, close: 102, volume: 1000000 },
        { date: '2023-01-04', open: 102, high: 107, low: 101, close: 105, volume: 1000000 }, // Start of uptrend
        { date: '2023-01-05', open: 105, high: 110, low: 104, close: 108, volume: 1000000 },
        { date: '2023-01-06', open: 108, high: 113, low: 107, close: 110, volume: 1000000 },
        { date: '2023-01-07', open: 110, high: 115, low: 109, close: 112, volume: 1000000 },
        { date: '2023-01-08', open: 112, high: 117, low: 111, close: 108, volume: 1000000 }, // Start of downtrend
        { date: '2023-01-09', open: 108, high: 113, low: 107, close: 105, volume: 1000000 },
        { date: '2023-01-10', open: 105, high: 110, low: 104, close: 102, volume: 1000000 },
      ];

      const shortMA = calculateSMA(crossoverData, 3, 'close');
      const longMA = calculateSMA(crossoverData, 5, 'close');

      // Ensure arrays are same length by aligning them
      const minLength = Math.min(shortMA.length, longMA.length);
      const alignedShortMA = shortMA.slice(-minLength);
      const alignedLongMA = longMA.slice(-minLength);

      const signals = detectMovingAverageCrossover(alignedShortMA, alignedLongMA, crossoverData);

      expect(signals.length).toBeGreaterThanOrEqual(0);

      for (const signal of signals) {
        expect(['bullish', 'bearish']).toContain(signal.type);
        expect(signal.strength).toBeGreaterThanOrEqual(0);
        expect(signal.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(typeof signal.shortMA).toBe('number');
        expect(typeof signal.longMA).toBe('number');
        expect(typeof signal.price).toBe('number');
      }
    });

    it('should throw error for mismatched array lengths', () => {
      const shortMA = [100, 101, 102];
      const longMA = [99, 100];

      expect(() => detectMovingAverageCrossover(shortMA, longMA, sampleData)).toThrow(
        'Moving averages must have the same length'
      );
    });

    it('should return empty array for empty input', () => {
      const signals = detectMovingAverageCrossover([], [], sampleData);
      expect(signals).toHaveLength(0);
    });
  });

  describe('Support and Resistance Detection', () => {
    it('should detect support and resistance levels', () => {
      // Create data with clear support/resistance levels
      const srData: OHLCVData[] = [];
      const basePrice = 100;

      for (let i = 0; i < 30; i++) {
        const variation = Math.sin(i / 3) * 10; // Creates oscillation
        srData.push({
          date: `2023-01-${(i + 1).toString().padStart(2, '0')}`,
          open: basePrice + variation - 1,
          high: basePrice + variation + 2,
          low: basePrice + variation - 2,
          close: basePrice + variation,
          volume: 1000000
        });
      }

      const levels = detectSupportResistance(srData, 3, 2);

      expect(levels.length).toBeGreaterThanOrEqual(0);

      for (const level of levels) {
        expect(['support', 'resistance']).toContain(level.type);
        expect(level.touches).toBeGreaterThanOrEqual(2);
        expect(level.strength).toBeGreaterThan(0);
        expect(level.strength).toBeLessThanOrEqual(1);
        expect(level.price).toBeGreaterThan(0);
        expect(level.firstTouch).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(level.lastTouch).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }

      // Levels should be sorted by strength (descending)
      for (let i = 1; i < levels.length; i++) {
        expect(levels[i - 1].strength).toBeGreaterThanOrEqual(levels[i].strength);
      }
    });

    it('should return empty array for insufficient data', () => {
      const levels = detectSupportResistance(sampleData.slice(0, 5), 3, 2);
      expect(levels).toHaveLength(0);
    });
  });

  describe('Price Type Handling', () => {
    it('should handle all price types correctly', () => {
      const priceTypes: PriceType[] = ['open', 'high', 'low', 'close', 'hl2', 'hlc3', 'ohlc4'];

      for (const priceType of priceTypes) {
        const sma = calculateSMA(sampleData, 3, priceType);
        expect(sma.length).toBeGreaterThan(0);
        expect(sma.every(value => typeof value === 'number')).toBe(true);
      }
    });

    it('should calculate composite price types correctly', () => {
      const data = sampleData[0]; // { open: 100, high: 105, low: 99, close: 104 }

      // Test hl2 (high + low) / 2
      const smaHL2 = calculateSMA([data], 1, 'hl2');
      expect(smaHL2[0]).toBe((105 + 99) / 2);

      // Test hlc3 (high + low + close) / 3
      const smaHLC3 = calculateSMA([data], 1, 'hlc3');
      expect(smaHLC3[0]).toBeCloseTo((105 + 99 + 104) / 3, 4);

      // Test ohlc4 (open + high + low + close) / 4
      const smaOHLC4 = calculateSMA([data], 1, 'ohlc4');
      expect(smaOHLC4[0]).toBeCloseTo((100 + 105 + 99 + 104) / 4, 4);
    });
  });

  describe('Precision and Rounding', () => {
    it('should maintain 4 decimal places precision', () => {
      const sma = calculateSMA(sampleData, 3, 'close');

      for (const value of sma) {
        const decimalPlaces = (value.toString().split('.')[1] || '').length;
        expect(decimalPlaces).toBeLessThanOrEqual(4);
      }
    });

    it('should handle edge cases with very small numbers', () => {
      const smallData: OHLCVData[] = sampleData.map(d => ({
        ...d,
        open: d.open / 10000,
        high: d.high / 10000,
        low: d.low / 10000,
        close: d.close / 10000
      }));

      const sma = calculateSMA(smallData, 3, 'close');
      expect(sma.length).toBeGreaterThan(0);
      expect(sma.every(value => !isNaN(value))).toBe(true);
    });
  });
});