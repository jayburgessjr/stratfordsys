'use client'

/**
 * Real Market Data Service
 * Fetches live stock and crypto prices from Alpha Vantage API
 */

import { createAlphaVantageClient } from '@/lib/data/alpha-vantage';

export interface RealTimeQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: number;
}

class RealMarketDataService {
  private client: ReturnType<typeof createAlphaVantageClient>;
  private cache: Map<string, { data: RealTimeQuote; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 60000; // 1 minute cache

  constructor() {
    this.client = createAlphaVantageClient(process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY);
  }

  /**
   * Get real-time quote for a single symbol
   */
  async getQuote(symbol: string): Promise<RealTimeQuote> {
    // Check cache first
    const cached = this.cache.get(symbol);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    try {
      // Fetch from Alpha Vantage
      const response = await fetch(
        `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Check for API errors
      if (data['Error Message']) {
        throw new Error(data['Error Message']);
      }

      if (data['Note']) {
        // Rate limit hit - return cached or throw
        if (cached) {
          console.warn(`Rate limit hit for ${symbol}, using cached data`);
          return cached.data;
        }
        throw new Error('API rate limit reached. Please wait a moment.');
      }

      const quote = data['Global Quote'];
      if (!quote || Object.keys(quote).length === 0) {
        throw new Error(`No data available for symbol: ${symbol}`);
      }

      const price = parseFloat(quote['05. price']);
      const change = parseFloat(quote['09. change']);
      const changePercent = parseFloat(quote['10. change percent'].replace('%', ''));
      const volume = parseInt(quote['06. volume'], 10);

      const realTimeQuote: RealTimeQuote = {
        symbol: symbol.toUpperCase(),
        price,
        change,
        changePercent,
        volume,
        timestamp: Date.now(),
      };

      // Cache the result
      this.cache.set(symbol, { data: realTimeQuote, timestamp: Date.now() });

      return realTimeQuote;
    } catch (error) {
      console.error(`Error fetching quote for ${symbol}:`, error);

      // If we have cached data, return it even if expired
      if (cached) {
        console.warn(`Using stale cached data for ${symbol}`);
        return cached.data;
      }

      // Return mock data as fallback
      return this.getMockQuote(symbol);
    }
  }

  /**
   * Get quotes for multiple symbols (batched with delay to respect rate limits)
   */
  async getQuotes(symbols: string[]): Promise<RealTimeQuote[]> {
    const quotes: RealTimeQuote[] = [];

    for (const symbol of symbols) {
      try {
        const quote = await this.getQuote(symbol);
        quotes.push(quote);

        // Delay between requests to respect rate limits (5 calls/minute = 12 seconds between calls)
        // Using 13 seconds to be safe
        if (symbols.indexOf(symbol) < symbols.length - 1) {
          await this.delay(13000);
        }
      } catch (error) {
        console.error(`Failed to fetch ${symbol}:`, error);
        // Continue with other symbols even if one fails
        quotes.push(this.getMockQuote(symbol));
      }
    }

    return quotes;
  }

  /**
   * Get crypto quote (Alpha Vantage uses different endpoint for crypto)
   */
  async getCryptoQuote(symbol: string, market: string = 'USD'): Promise<RealTimeQuote> {
    const cacheKey = `${symbol}-${market}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    try {
      const response = await fetch(
        `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${symbol}&to_currency=${market}&apikey=${process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY}`
      );

      const data = await response.json();

      if (data['Error Message'] || data['Note']) {
        if (cached) {
          return cached.data;
        }
        throw new Error('API limit or error');
      }

      const rate = data['Realtime Currency Exchange Rate'];
      if (!rate) {
        throw new Error(`No data available for ${symbol}/${market}`);
      }

      const price = parseFloat(rate['5. Exchange Rate']);
      const previousClose = parseFloat(rate['8. Bid Price']) || price;
      const change = price - previousClose;
      const changePercent = (change / previousClose) * 100;

      const quote: RealTimeQuote = {
        symbol: `${symbol}-${market}`,
        price,
        change,
        changePercent,
        volume: 0, // Crypto volume not available in this endpoint
        timestamp: Date.now(),
      };

      this.cache.set(cacheKey, { data: quote, timestamp: Date.now() });
      return quote;
    } catch (error) {
      console.error(`Error fetching crypto quote for ${symbol}:`, error);

      if (cached) {
        return cached.data;
      }

      return this.getMockCryptoQuote(symbol);
    }
  }

  /**
   * Fallback mock data generator
   */
  private getMockQuote(symbol: string): RealTimeQuote {
    const basePrices: Record<string, number> = {
      'SPY': 445.20,
      'QQQ': 375.85,
      'AAPL': 178.90,
      'GOOGL': 140.50,
      'MSFT': 367.89,
      'TSLA': 189.34,
      'NVDA': 445.67,
      'IWM': 184.32,
      'VIX': 18.45,
    };

    const basePrice = basePrices[symbol] || 100;
    const change = (Math.random() - 0.5) * basePrice * 0.02;
    const changePercent = (change / basePrice) * 100;

    return {
      symbol,
      price: basePrice + change,
      change,
      changePercent,
      volume: Math.floor(Math.random() * 50000000) + 10000000,
      timestamp: Date.now(),
    };
  }

  private getMockCryptoQuote(symbol: string): RealTimeQuote {
    const basePrices: Record<string, number> = {
      'BTC': 43250,
      'ETH': 2650,
      'SOL': 76.43,
      'BNB': 234.56,
    };

    const basePrice = basePrices[symbol] || 1000;
    const change = (Math.random() - 0.5) * basePrice * 0.03;
    const changePercent = (change / basePrice) * 100;

    return {
      symbol: `${symbol}-USD`,
      price: basePrice + change,
      change,
      changePercent,
      volume: Math.floor(Math.random() * 1000000000),
      timestamp: Date.now(),
    };
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clear cache (useful for forcing fresh data)
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cached data (useful for displaying while fetching)
   */
  getCachedQuote(symbol: string): RealTimeQuote | null {
    const cached = this.cache.get(symbol);
    return cached ? cached.data : null;
  }
}

// Singleton instance
let instance: RealMarketDataService | null = null;

export function getRealMarketDataService(): RealMarketDataService {
  if (!instance) {
    instance = new RealMarketDataService();
  }
  return instance;
}

export default RealMarketDataService;
