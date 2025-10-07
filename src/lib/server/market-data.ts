'use server';

/**
 * Server-side Alpha Vantage client wrapper with caching.
 */

import type { RealTimeQuote } from '@/lib/services/real-market-data';

interface CacheEntry {
  quote: RealTimeQuote;
  timestamp: number;
}

const CACHE_TTL = 60 * 1000; // 1 minute
const cache = new Map<string, CacheEntry>();

function getApiKey(): string {
  const key = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY || process.env.ALPHA_VANTAGE_API_KEY;
  if (!key) {
    throw new Error('NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY is not configured.');
  }
  return key;
}

function getCached(symbol: string): RealTimeQuote | null {
  const entry = cache.get(symbol);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(symbol);
    return null;
  }
  return entry.quote;
}

function setCached(symbol: string, quote: RealTimeQuote) {
  cache.set(symbol, { quote, timestamp: Date.now() });
  if (cache.size > 200) {
    const [oldestKey] = cache.keys();
    if (oldestKey) cache.delete(oldestKey);
  }
}

async function fetchStockQuote(symbol: string): Promise<RealTimeQuote> {
  const apiKey = getApiKey();
  const response = await fetch(
    `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`
  );

  if (!response.ok) {
    throw new Error(`Alpha Vantage request failed with status ${response.status}`);
  }

  const data = await response.json();

  if (data['Note']) {
    throw new Error('Alpha Vantage rate limit reached.');
  }

  const quote = data['Global Quote'];
  if (!quote || Object.keys(quote).length === 0) {
    throw new Error(`No data available for symbol ${symbol}`);
  }

  return {
    symbol,
    price: parseFloat(quote['05. price']),
    change: parseFloat(quote['09. change']),
    changePercent: parseFloat((quote['10. change percent'] || '0').replace('%', '')),
    volume: parseInt(quote['06. volume'], 10) || 0,
    timestamp: Date.now(),
  };
}

async function fetchCryptoQuote(symbol: string, market: string = 'USD'): Promise<RealTimeQuote> {
  const apiKey = getApiKey();
  const response = await fetch(
    `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${symbol}&to_currency=${market}&apikey=${apiKey}`
  );

  if (!response.ok) {
    throw new Error(`Alpha Vantage crypto request failed with status ${response.status}`);
  }

  const data = await response.json();
  if (data['Note']) {
    throw new Error('Alpha Vantage rate limit reached.');
  }

  const rate = data['Realtime Currency Exchange Rate'];
  if (!rate) {
    throw new Error(`No crypto data for ${symbol}/${market}`);
  }

  const price = parseFloat(rate['5. Exchange Rate']);
  const previousClose = parseFloat(rate['8. Bid Price']) || price;
  const change = price - previousClose;
  const changePercent = previousClose === 0 ? 0 : (change / previousClose) * 100;

  return {
    symbol: `${symbol}-${market}`,
    price,
    change,
    changePercent,
    volume: 0,
    timestamp: Date.now(),
  };
}

function getMockQuote(symbol: string): RealTimeQuote {
  const basePrices: Record<string, number> = {
    SPY: 445.2,
    QQQ: 375.85,
    AAPL: 178.9,
    GOOGL: 140.5,
    MSFT: 367.89,
    TSLA: 189.34,
    NVDA: 445.67,
    IWM: 184.32,
    VIX: 18.45,
    DIA: 342.12,
  };

  const basePrice = basePrices[symbol.replace('-USD', '')] || 100;
  const change = (Math.random() - 0.5) * basePrice * 0.02;
  const changePercent = (change / basePrice) * 100;

  return {
    symbol,
    price: parseFloat((basePrice + change).toFixed(2)),
    change: parseFloat(change.toFixed(2)),
    changePercent: parseFloat(changePercent.toFixed(2)),
    volume: Math.floor(Math.random() * 2_000_000) + 500_000,
    timestamp: Date.now(),
  };
}

function isCryptoSymbol(symbol: string): boolean {
  return symbol.includes('-') || ['BTC', 'ETH', 'SOL', 'BNB'].includes(symbol);
}

export async function getQuote(symbolInput: string): Promise<RealTimeQuote> {
  const normalized = symbolInput.toUpperCase();
  const cached = getCached(normalized);
  if (cached) {
    return cached;
  }

  try {
    const quote = isCryptoSymbol(normalized)
      ? await fetchCryptoQuote(normalized.split('-')[0], normalized.split('-')[1] || 'USD')
      : await fetchStockQuote(normalized);

    setCached(normalized, quote);
    return quote;
  } catch (error) {
    console.error(`Market data fetch failed for ${normalized}:`, error);
    const fallback = getMockQuote(normalized);
    setCached(normalized, fallback);
    return fallback;
  }
}

export async function getQuotes(symbols: string[]): Promise<Record<string, RealTimeQuote>> {
  const results: Record<string, RealTimeQuote> = {};

  for (const symbol of symbols) {
    try {
      results[symbol] = await getQuote(symbol);
    } catch (error) {
      console.error(`Failed to fetch quote for ${symbol}:`, error);
      results[symbol] = getMockQuote(symbol);
    }
  }

  return results;
}
