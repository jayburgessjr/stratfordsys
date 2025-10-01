'use client'

import { useState, useEffect, useCallback } from 'react';
import { getRealMarketDataService, RealTimeQuote } from '@/lib/services/real-market-data';

interface UseRealMarketDataOptions {
  symbols: string[];
  refreshInterval?: number; // in milliseconds, default 60000 (1 minute)
  enabled?: boolean;
}

interface UseRealMarketDataReturn {
  quotes: Record<string, RealTimeQuote>;
  isLoading: boolean;
  error: string | null;
  lastUpdate: number | null;
  refresh: () => Promise<void>;
}

export function useRealMarketData(options: UseRealMarketDataOptions): UseRealMarketDataReturn {
  const { symbols, refreshInterval = 60000, enabled = true } = options;
  const [quotes, setQuotes] = useState<Record<string, RealTimeQuote>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);

  const fetchQuotes = useCallback(async () => {
    if (!enabled || symbols.length === 0) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const service = getRealMarketDataService();
      const quotesMap: Record<string, RealTimeQuote> = {};

      // Fetch quotes one by one to respect rate limits
      for (const symbol of symbols) {
        try {
          const quote = await service.getQuote(symbol);
          quotesMap[symbol] = quote;
        } catch (err) {
          console.error(`Failed to fetch ${symbol}:`, err);
          // Continue with other symbols
        }
      }

      setQuotes(quotesMap);
      setLastUpdate(Date.now());
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch market data';
      setError(errorMessage);
      console.error('Error fetching market data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [symbols, enabled]);

  const refresh = useCallback(async () => {
    await fetchQuotes();
  }, [fetchQuotes]);

  // Initial fetch
  useEffect(() => {
    if (enabled) {
      fetchQuotes();
    }
  }, [enabled, fetchQuotes]);

  // Auto-refresh
  useEffect(() => {
    if (!enabled || refreshInterval <= 0) return;

    const intervalId = setInterval(() => {
      fetchQuotes();
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [enabled, refreshInterval, fetchQuotes]);

  return {
    quotes,
    isLoading,
    error,
    lastUpdate,
    refresh,
  };
}

/**
 * Hook for fetching crypto quotes
 */
export function useRealCryptoData(cryptoSymbols: string[], market: string = 'USD') {
  const [quotes, setQuotes] = useState<Record<string, RealTimeQuote>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCryptoQuotes = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const service = getRealMarketDataService();
        const quotesMap: Record<string, RealTimeQuote> = {};

        for (const symbol of cryptoSymbols) {
          try {
            const quote = await service.getCryptoQuote(symbol, market);
            quotesMap[symbol] = quote;
          } catch (err) {
            console.error(`Failed to fetch ${symbol}:`, err);
          }
        }

        setQuotes(quotesMap);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch crypto data';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    if (cryptoSymbols.length > 0) {
      fetchCryptoQuotes();
    }
  }, [cryptoSymbols, market]);

  return { quotes, isLoading, error };
}
