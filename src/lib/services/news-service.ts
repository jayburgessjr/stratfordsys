/**
 * Client-side helper for market news API.
 */

import type { NewsArticle } from '@/types/news';

interface CacheEntry {
  data: NewsArticle[];
  timestamp: number;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function postNews<T>(endpoint: string, payload: unknown): Promise<T> {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message = errorBody?.error || response.statusText || 'Failed to fetch news';
    throw new Error(message);
  }

  const data = await response.json();
  return data.articles as T;
}

class NewsService {
  private cache = new Map<string, CacheEntry>();

  private getFromCache(key: string): NewsArticle[] | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  private storeInCache(key: string, data: NewsArticle[]): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  async getMarketNews(
    topics: string[] = ['blockchain', 'earnings', 'ipo', 'mergers_and_acquisitions', 'financial_markets'],
    limit: number = 10
  ): Promise<NewsArticle[]> {
    const normalizedTopics = topics.length ? topics : ['financial_markets'];
    const cacheKey = `market-${normalizedTopics.join('|')}-${limit}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    const articles = await postNews<NewsArticle[]>(
      '/api/news/market',
      { topics: normalizedTopics, limit }
    );

    this.storeInCache(cacheKey, articles);
    return articles;
  }

  async getTickerNews(tickers: string[], limit: number = 5): Promise<NewsArticle[]> {
    const normalizedTickers = tickers.map(ticker => ticker.toUpperCase());
    const cacheKey = `tickers-${normalizedTickers.join('|')}-${limit}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    const articles = await postNews<NewsArticle[]>(
      '/api/news/tickers',
      { tickers: normalizedTickers, limit }
    );

    this.storeInCache(cacheKey, articles);
    return articles;
  }
}

let instance: NewsService | null = null;

export function getNewsService(): NewsService {
  if (!instance) {
    instance = new NewsService();
  }
  return instance;
}
