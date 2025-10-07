import { chat } from '@/lib/server/openai';
import type { NewsArticle, NewsSentimentAnalysis } from '@/types/news';

interface CacheEntry {
  data: NewsArticle[];
  timestamp: number;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const cache = new Map<string, CacheEntry>();

function getApiKey(): string | null {
  return process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY || process.env.ALPHA_VANTAGE_API_KEY || null;
}

function createCacheKey(prefix: string, parts: string[]): string {
  return `${prefix}:${parts.join('|')}`;
}

function getTimeAgo(timestamp: string): string {
  const published = new Date(timestamp);
  const diffMs = Date.now() - published.getTime();

  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

async function analyzeWithAI(title: string, summary: string): Promise<NewsSentimentAnalysis> {
  const prompt = `Analyze this financial news headline and summary for trading sentiment:

Title: "${title}"
Summary: "${summary}"

Respond in JSON format:
{
  "sentiment": "bullish" | "bearish" | "neutral",
  "impact": "high" | "medium" | "low",
  "reasoning": "brief explanation"
}`;

  try {
    const response = await chat({
      userMessage: prompt,
      context:
        'You are a financial news analyst. Evaluate sentiment and potential market impact conservatively.',
    });
    const parsed = JSON.parse(response);
    return {
      sentiment: parsed.sentiment || 'neutral',
      impact: parsed.impact || 'low',
      reasoning: parsed.reasoning || 'No reasoning provided',
    };
  } catch (error) {
    console.error('AI sentiment analysis failed:', error);
    return {
      sentiment: 'neutral',
      impact: 'low',
      reasoning: 'AI analysis unavailable',
    };
  }
}

function mapArticle(raw: any): NewsArticle {
  const sentimentScore = parseFloat(raw.overall_sentiment_score ?? '0');
  let sentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  if (sentimentScore > 0.15) sentiment = 'bullish';
  else if (sentimentScore < -0.15) sentiment = 'bearish';

  let impact: 'high' | 'medium' | 'low' = 'medium';
  switch (raw.overall_sentiment_label) {
    case 'Bullish':
    case 'Bearish':
      impact = 'high';
      break;
    case 'Somewhat-Bullish':
    case 'Somewhat-Bearish':
      impact = 'medium';
      break;
    default:
      impact = 'low';
  }

  return {
    title: raw.title,
    source: raw.source || 'Unknown',
    url: raw.url,
    summary: raw.summary || '',
    publishedAt: raw.time_published,
    timeAgo: getTimeAgo(raw.time_published),
    sentiment,
    impact,
    ticker: raw.ticker_sentiment?.[0]?.ticker,
    imageUrl: raw.banner_image,
    topics: raw.topics?.map((topic: any) => topic.topic) ?? [],
  };
}

async function processArticles(feed: any[]): Promise<NewsArticle[]> {
  return Promise.all(
    feed.map(async (item) => {
      let article = mapArticle(item);

      if (!item.overall_sentiment_score) {
        const analysis = await analyzeWithAI(article.title, article.summary);
        article = { ...article, sentiment: analysis.sentiment, impact: analysis.impact };
      }

      return article;
    })
  );
}

function getMockNews(): NewsArticle[] {
  const now = new Date().toISOString();
  return [
    {
      title: 'Federal Reserve Signals Possible Pause in Rate Hikes',
      source: 'Bloomberg',
      url: 'https://www.bloomberg.com',
      summary: 'Fed officials suggest a pause amid cooling inflation and softening labor market.',
      publishedAt: now,
      timeAgo: 'just now',
      sentiment: 'bullish',
      impact: 'high',
      ticker: 'SPY',
      imageUrl: undefined,
      topics: ['macro', 'federal_reserve'],
    },
    {
      title: 'Tech Giants Lead Market Rally on AI Optimism',
      source: 'Reuters',
      url: 'https://www.reuters.com',
      summary: 'Mega-cap tech stocks continue to outperform as investors pile into AI winners.',
      publishedAt: now,
      timeAgo: 'just now',
      sentiment: 'bullish',
      impact: 'medium',
      ticker: 'QQQ',
      imageUrl: undefined,
      topics: ['technology', 'ai'],
    },
    {
      title: 'Oil Prices Dip as Supply Concerns Ease',
      source: 'Wall Street Journal',
      url: 'https://www.wsj.com',
      summary: 'Crude prices slip below $70 as OPEC signals stable output and demand projections soften.',
      publishedAt: now,
      timeAgo: 'just now',
      sentiment: 'bearish',
      impact: 'medium',
      ticker: 'USO',
      imageUrl: undefined,
      topics: ['commodities', 'energy'],
    },
  ];
}

async function fetchFromAlphaVantage(params: URLSearchParams): Promise<any[]> {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn('Alpha Vantage API key missing, returning mock news.');
    return [];
  }

  params.set('apikey', apiKey);
  const url = `https://www.alphavantage.co/query?${params.toString()}`;
  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok || data['Note']) {
    throw new Error(data['Note'] || `Alpha Vantage request failed: ${response.status}`);
  }

  if (!Array.isArray(data.feed)) {
    throw new Error('Invalid news response format.');
  }

  return data.feed;
}

export async function getMarketNews(topics: string[], limit: number): Promise<NewsArticle[]> {
  const normalizedTopics = topics.length ? topics : ['financial_markets'];
  const cacheKey = createCacheKey('topics', [...normalizedTopics, String(limit)]);

  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    const params = new URLSearchParams({
      function: 'NEWS_SENTIMENT',
      topics: normalizedTopics.join(','),
      limit: String(limit),
    });

    const feed = await fetchFromAlphaVantage(params);
    if (!feed.length) {
      const mock = getMockNews();
      cache.set(cacheKey, { data: mock, timestamp: Date.now() });
      return mock;
    }

    const processed = await processArticles(feed.slice(0, limit));
    cache.set(cacheKey, { data: processed, timestamp: Date.now() });
    return processed;
  } catch (error) {
    console.error('News fetch failed:', error);
    const fallback = cache.get(cacheKey)?.data ?? getMockNews();
    return fallback;
  }
}

export async function getTickerNews(tickers: string[], limit: number): Promise<NewsArticle[]> {
  const normalizedTickers = tickers.map((ticker) => ticker.toUpperCase());
  const cacheKey = createCacheKey('tickers', [...normalizedTickers, String(limit)]);

  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    const params = new URLSearchParams({
      function: 'NEWS_SENTIMENT',
      tickers: normalizedTickers.join(','),
      limit: String(limit),
    });

    const feed = await fetchFromAlphaVantage(params);
    if (!feed.length) {
      const mock = getMockNews();
      cache.set(cacheKey, { data: mock, timestamp: Date.now() });
      return mock;
    }

    const processed = await processArticles(feed.slice(0, limit));
    cache.set(cacheKey, { data: processed, timestamp: Date.now() });
    return processed;
  } catch (error) {
    console.error('Ticker news fetch failed:', error);
    const fallback = cache.get(cacheKey)?.data ?? getMockNews();
    return fallback;
  }
}
