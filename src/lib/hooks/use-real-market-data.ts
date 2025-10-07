'use client'

import { useState, useEffect, useCallback, useRef } from 'react';
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

  // Use ref to store symbols to avoid infinite re-renders
  const symbolsRef = useRef<string[]>(symbols);
  const enabledRef = useRef<boolean>(enabled);

  // Update refs when props change
  useEffect(() => {
    symbolsRef.current = symbols;
    enabledRef.current = enabled;
  }, [symbols, enabled]);

  const fetchQuotes = useCallback(async () => {
    if (!enabledRef.current || symbolsRef.current.length === 0) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const service = getRealMarketDataService();
      const quotesMap = await service.getQuotes(symbolsRef.current);

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
  }, []); // Empty dependencies - use refs instead

  const refresh = useCallback(async () => {
    await fetchQuotes();
  }, [fetchQuotes]);

  // Initial fetch - only run once on mount
  useEffect(() => {
    if (enabled) {
      fetchQuotes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

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
        const symbols = cryptoSymbols.map(symbol => `${symbol.toUpperCase()}-${market.toUpperCase()}`);
        const quotesMap = await service.getQuotes(symbols);
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
