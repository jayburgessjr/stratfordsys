/**
 * Client-side helper for requesting market data from server API.
 */

export interface RealTimeQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: number;
}

interface QuoteCacheEntry {
  quote: RealTimeQuote;
  timestamp: number;
}

interface QuotesResponse {
  quotes: Record<string, RealTimeQuote>;
}

const CACHE_TTL = 30 * 1000; // 30 seconds client cache

class RealMarketDataClient {
  private cache = new Map<string, QuoteCacheEntry>();

  private getCached(symbol: string): RealTimeQuote | null {
    const entry = this.cache.get(symbol);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > CACHE_TTL) {
      this.cache.delete(symbol);
      return null;
    }
    return entry.quote;
  }

  private setCached(symbol: string, quote: RealTimeQuote) {
    this.cache.set(symbol, { quote, timestamp: Date.now() });
  }

  private async fetchQuotes(symbols: string[]): Promise<Record<string, RealTimeQuote>> {
    const response = await fetch('/api/market-data/quotes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ symbols }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const message = errorBody?.error || response.statusText || 'Failed to fetch market data';
      throw new Error(message);
    }

    const data = (await response.json()) as QuotesResponse;
    return data.quotes;
  }

  async getQuote(symbolInput: string): Promise<RealTimeQuote> {
    const symbol = symbolInput.toUpperCase();
    const cached = this.getCached(symbol);
    if (cached) {
      return cached;
    }

    const quotes = await this.fetchQuotes([symbol]);
    const quote = quotes[symbol];
    if (!quote) {
      throw new Error(`No quote returned for ${symbol}`);
    }

    this.setCached(symbol, quote);
    return quote;
  }

  async getQuotes(symbols: string[]): Promise<Record<string, RealTimeQuote>> {
    const uniqueSymbols = Array.from(new Set(symbols.map(symbol => symbol.toUpperCase())));
    const missing = uniqueSymbols.filter((symbol) => !this.getCached(symbol));

    if (missing.length) {
      const fetched = await this.fetchQuotes(missing);
      for (const [symbol, quote] of Object.entries(fetched)) {
        this.setCached(symbol, quote);
      }
    }

    const results: Record<string, RealTimeQuote> = {};
    for (const symbol of uniqueSymbols) {
      const cached = this.getCached(symbol);
      if (cached) {
        results[symbol] = cached;
      }
    }

    return results;
  }

  clearCache() {
    this.cache.clear();
  }
}

let instance: RealMarketDataClient | null = null;

export function getRealMarketDataService(): RealMarketDataClient {
  if (!instance) {
    instance = new RealMarketDataClient();
  }
  return instance;
}
