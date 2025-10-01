/**
 * MSW Request Handlers for Stratford AI
 *
 * Provides deterministic mock responses for external APIs
 * to ensure reproducible testing results.
 */

import { rest } from 'msw';
import { RANDOM_SEED } from '@/constants';
import { seededRandom } from '@/utils/deterministic';

// Reset seeded random for deterministic mock data
seededRandom.reset(RANDOM_SEED);

// Helper function to generate deterministic OHLCV data
function generateOHLCVData(symbol: string, days: number = 100) {
  const data: Record<string, any> = {};
  let basePrice = 100; // Starting price

  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateString = date.toISOString().split('T')[0];

    // Generate deterministic price movements
    const change = (seededRandom.next() - 0.5) * 0.04; // ±2% daily change
    const open = basePrice;
    const close = open * (1 + change);
    const high = Math.max(open, close) * (1 + seededRandom.next() * 0.01);
    const low = Math.min(open, close) * (1 - seededRandom.next() * 0.01);
    const volume = Math.floor(1000000 + seededRandom.next() * 5000000);

    if (dateString) {
      data[dateString] = {
        '1. open': open.toFixed(2),
        '2. high': high.toFixed(2),
        '3. low': low.toFixed(2),
        '4. close': close.toFixed(2),
        '5. volume': volume.toString(),
      };
    }

    basePrice = close;
  }

  return data;
}

// Alpha Vantage API handlers
export const alphaVantageHandlers = [
  // Daily time series data
  rest.get('https://www.alphavantage.co/query', (req, res, ctx) => {
    const func = req.url.searchParams.get('function');
    const symbol = req.url.searchParams.get('symbol') || 'AAPL';
    const apikey = req.url.searchParams.get('apikey');

    // Simulate API key validation
    if (!apikey || apikey === 'demo') {
      return res(
        ctx.status(403),
        ctx.json({
          'Error Message': 'Invalid API key or API limit reached.',
        })
      );
    }

    switch (func) {
      case 'TIME_SERIES_DAILY_ADJUSTED':
        return res(
          ctx.json({
            'Meta Data': {
              '1. Information': 'Daily Time Series with Splits and Dividend Events',
              '2. Symbol': symbol,
              '3. Last Refreshed': new Date().toISOString().split('T')[0],
              '4. Output Size': 'Compact',
              '5. Time Zone': 'US/Eastern',
            },
            'Time Series (Daily)': generateOHLCVData(symbol, 100),
          })
        );

      case 'TIME_SERIES_INTRADAY':
        return res(
          ctx.json({
            'Meta Data': {
              '1. Information': '1min Intraday Time Series',
              '2. Symbol': symbol,
              '3. Last Refreshed': new Date().toISOString(),
              '4. Interval': '1min',
              '5. Output Size': 'Compact',
              '6. Time Zone': 'US/Eastern',
            },
            'Time Series (1min)': generateOHLCVData(symbol, 20),
          })
        );

      default:
        return res(
          ctx.status(400),
          ctx.json({
            'Error Message': 'Invalid API function.',
          })
        );
    }
  }),
];

// Yahoo Finance API handlers (if we add it later)
export const yahooFinanceHandlers = [
  rest.get('https://query1.finance.yahoo.com/v8/finance/chart/:symbol', (req, res, ctx) => {
    const { symbol } = req.params;

    return res(
      ctx.json({
        chart: {
          result: [{
            meta: {
              currency: 'USD',
              symbol: symbol,
              exchangeName: 'NMS',
              instrumentType: 'EQUITY',
              firstTradeDate: 345479400,
              regularMarketTime: Math.floor(Date.now() / 1000),
              gmtoffset: -18000,
              timezone: 'EST',
              exchangeTimezoneName: 'America/New_York',
            },
            timestamp: Array.from({ length: 100 }, (_, i) =>
              Math.floor(Date.now() / 1000) - (99 - i) * 86400
            ),
            indicators: {
              quote: [{
                open: Array.from({ length: 100 }, () => 100 + seededRandom.next() * 20),
                high: Array.from({ length: 100 }, () => 105 + seededRandom.next() * 20),
                low: Array.from({ length: 100 }, () => 95 + seededRandom.next() * 20),
                close: Array.from({ length: 100 }, () => 100 + seededRandom.next() * 20),
                volume: Array.from({ length: 100 }, () => Math.floor(1000000 + seededRandom.next() * 5000000)),
              }],
            },
          }],
          error: null,
        },
      })
    );
  }),
];

// Error simulation handlers for testing error conditions
export const errorHandlers = [
  // Simulate API timeout
  rest.get('https://www.alphavantage.co/query/timeout', (req, res, ctx) => {
    // Never resolves to simulate timeout
    return new Promise(() => {});
  }),

  // Simulate rate limiting
  rest.get('https://www.alphavantage.co/query/rate-limit', (req, res, ctx) => {
    return res(
      ctx.status(429),
      ctx.json({
        'Note': 'Thank you for using Alpha Vantage! Our standard API call frequency is 5 calls per minute.',
      })
    );
  }),

  // Simulate server error
  rest.get('https://www.alphavantage.co/query/server-error', (req, res, ctx) => {
    return res(
      ctx.status(500),
      ctx.json({
        'Error Message': 'Internal server error.',
      })
    );
  }),
];

// Combined handlers for all mock scenarios
export const handlers = [
  ...alphaVantageHandlers,
  ...yahooFinanceHandlers,
  ...errorHandlers,
];