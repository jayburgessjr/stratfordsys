'use client';

import { useState, useEffect } from 'react';
import { BacktestEngine, createBacktestConfig } from '@/lib/backtesting/backtest-engine';
import { createMovingAverageCrossoverStrategy } from '@/lib/strategies/moving-average-crossover';
import { generateDemoTimeSeries } from '@/utils/demo-data';
import type { BacktestResult } from '@/types';

interface UseDemoBacktestReturn {
  backtestResult: BacktestResult | null;
  isLoading: boolean;
  error: string | null;
  runBacktest: () => Promise<void>;
}

export function useDemoBacktest(): UseDemoBacktestReturn {
  const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runBacktest = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Generate demo time series data
      const timeSeries = generateDemoTimeSeries();

      // Create strategy configuration
      const strategy = createMovingAverageCrossoverStrategy(20, 50, 'SIMPLE', 0);

      // Create backtest configuration
      const backtestConfig = createBacktestConfig({
        strategy,
        symbol: 'DEMO',
        period: {
          start: timeSeries.data[0].date,
          end: timeSeries.data[timeSeries.data.length - 1].date
        },
        initialCapital: 100000,
        commission: {
          type: 'PERCENTAGE',
          value: 0.001 // 0.1%
        },
        slippage: {
          type: 'PERCENTAGE',
          value: 0.0005 // 0.05%
        }
      });

      // Run backtest
      const engine = new BacktestEngine(backtestConfig);
      const result = await engine.execute(timeSeries);

      setBacktestResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Run backtest on mount
  useEffect(() => {
    runBacktest();
  }, []);

  return {
    backtestResult,
    isLoading,
    error,
    runBacktest
  };
}