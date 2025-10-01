/**
 * Demo Data Generation
 *
 * Generates realistic financial market data for dashboard demonstration
 */

import { seededRandom } from '@/utils/deterministic';
import type { TimeSeries, OHLCVData, DateString } from '@/types/market-data';
import { DataSource, TimeInterval, OutputSize } from '@/types/market-data';

/**
 * Generate demo time series data with realistic market patterns
 */
export function generateDemoTimeSeries(
  symbol: string = 'DEMO',
  days: number = 365,
  startPrice: number = 100
): TimeSeries {
  const data: OHLCVData[] = [];
  const rng = seededRandom;

  // Reset random generator for consistent demo data
  rng.reset();

  let currentPrice = startPrice;
  const startDate = new Date('2023-01-01');

  for (let i = 0; i < days; i++) {
    // Calculate current date
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    const dateString = currentDate.toISOString().split('T')[0];

    // Generate realistic price movements
    // Use a combination of trend and random walk
    const trendComponent = Math.sin(i / 50) * 0.001; // Long-term trend
    const cyclicalComponent = Math.sin(i / 20) * 0.005; // Medium-term cycles
    const randomComponent = rng.nextGaussian(0, 0.02); // Daily volatility

    const dailyReturn = trendComponent + cyclicalComponent + randomComponent;
    currentPrice *= (1 + dailyReturn);

    // Generate OHLC from current price
    const volatility = 0.015; // 1.5% intraday volatility
    const high = currentPrice * (1 + rng.nextFloat(0, volatility));
    const low = currentPrice * (1 - rng.nextFloat(0, volatility));
    const open = currentPrice + rng.nextGaussian(0, currentPrice * 0.005);
    const close = currentPrice;

    // Ensure OHLC constraints
    const ohlc = {
      open: Math.max(low, Math.min(high, open)),
      high: Math.max(open, close, high),
      low: Math.min(open, close, low),
      close
    };

    // Generate volume with some correlation to price movement
    const baseVolume = 1000000;
    const volumeVariation = Math.abs(dailyReturn) * 5; // Higher volume on big moves
    const volume = Math.floor(baseVolume * (1 + volumeVariation + rng.nextFloat(-0.3, 0.3)));

    data.push({
      date: dateString as DateString,
      open: Number(ohlc.open.toFixed(2)),
      high: Number(ohlc.high.toFixed(2)),
      low: Number(ohlc.low.toFixed(2)),
      close: Number(ohlc.close.toFixed(2)),
      volume
    });
  }

  return {
    symbol,
    data,
    metadata: {
      symbol,
      currency: 'USD',
      timeZone: 'America/New_York',
      lastRefreshed: new Date().toISOString(),
      dataSource: DataSource.CSV_FILE,
      interval: TimeInterval.DAILY,
      outputSize: OutputSize.FULL
    }
  };
}

/**
 * Generate demo equity curve data points
 */
export function generateDemoEquityCurve(
  initialCapital: number = 100000,
  days: number = 365
): Array<{ date: string; value: number; drawdown: number }> {
  const equity: Array<{ date: string; value: number; drawdown: number }> = [];
  const rng = seededRandom;

  rng.reset();

  let currentEquity = initialCapital;
  let peakEquity = initialCapital;
  const startDate = new Date('2023-01-01');

  for (let i = 0; i < days; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    const dateString = currentDate.toISOString().split('T')[0];

    // Generate realistic equity movements
    // Slightly positive bias to simulate a profitable strategy
    const baseDailyReturn = 0.0003; // ~11% annual return
    const volatility = 0.012; // ~19% annual volatility
    const dailyReturn = baseDailyReturn + rng.nextGaussian(0, volatility);

    currentEquity *= (1 + dailyReturn);

    // Update peak and calculate drawdown
    if (currentEquity > peakEquity) {
      peakEquity = currentEquity;
    }

    const drawdown = (peakEquity - currentEquity) / peakEquity;

    equity.push({
      date: dateString as DateString,
      value: Number(currentEquity.toFixed(2)),
      drawdown: Number(drawdown.toFixed(4))
    });
  }

  return equity;
}

/**
 * Generate demo trade data
 */
export function generateDemoTrades(days: number = 365) {
  const trades = [];
  const rng = seededRandom;

  rng.reset();

  const startDate = new Date('2023-01-01');
  let tradeId = 1;

  // Generate trades roughly every 10-30 days
  for (let day = 0; day < days; day += rng.nextInt(10, 30)) {
    const tradeDate = new Date(startDate);
    tradeDate.setDate(startDate.getDate() + day);
    const dateString = tradeDate.toISOString().split('T')[0];

    // Randomly determine if this is a profitable trade (60% win rate)
    const isWin = rng.next() < 0.6;
    const basePrice = 100 + rng.nextFloat(-20, 50);
    const quantity = rng.nextInt(50, 200);

    // Entry trade
    trades.push({
      id: `trade-${tradeId}`,
      date: dateString,
      type: 'BUY' as const,
      price: basePrice,
      quantity,
      isEntry: true,
      pnl: 0
    });

    // Exit trade (7-21 days later)
    const exitDay = day + rng.nextInt(7, 21);
    if (exitDay < days) {
      const exitDate = new Date(startDate);
      exitDate.setDate(startDate.getDate() + exitDay);
      const exitDateString = exitDate.toISOString().split('T')[0];

      const exitPrice = isWin
        ? basePrice * (1 + rng.nextFloat(0.02, 0.08)) // 2-8% gain
        : basePrice * (1 - rng.nextFloat(0.01, 0.04)); // 1-4% loss

      const pnl = (exitPrice - basePrice) * quantity;

      trades.push({
        id: `trade-${tradeId + 1}`,
        date: exitDateString,
        type: 'SELL' as const,
        price: exitPrice,
        quantity,
        isEntry: false,
        pnl
      });

      tradeId += 2;
    }
  }

  return trades;
}