/**
 * News Service
 * Fetches real financial news from Alpha Vantage and analyzes with AI
 */

import { getOpenAIService } from './openai-service';

export interface NewsArticle {
  title: string;
  source: string;
  url: string;
  summary: string;
  publishedAt: string;
  timeAgo: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  impact: 'high' | 'medium' | 'low';
  ticker?: string;
  imageUrl?: string;
  topics?: string[];
}

export interface NewsSentimentAnalysis {
  sentiment: 'bullish' | 'bearish' | 'neutral';
  impact: 'high' | 'medium' | 'low';
  reasoning: string;
}

class NewsService {
  private cache: Map<string, { data: NewsArticle[]; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache
  private readonly API_KEY = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY;

  /**
   * Fetch real financial news from Alpha Vantage
   */
  async getMarketNews(
    topics: string[] = ['blockchain', 'earnings', 'ipo', 'mergers_and_acquisitions', 'financial_markets'],
    limit: number = 10
  ): Promise<NewsArticle[]> {
    const cacheKey = `news-${topics.join('-')}-${limit}`;

    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    if (!this.API_KEY) {
      console.warn('Alpha Vantage API key not found, using mock news');
      return this.getMockNews();
    }

    try {
      // Alpha Vantage News & Sentiments API
      const topicsParam = topics.join(',');
      const url = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&topics=${topicsParam}&limit=${limit}&apikey=${this.API_KEY}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.Note) {
        console.warn('Alpha Vantage API limit reached, using cached or mock data');
        return cached ? cached.data : this.getMockNews();
      }

      if (!data.feed || !Array.isArray(data.feed)) {
        console.error('Invalid news data format:', data);
        return this.getMockNews();
      }

      // Process and analyze news with AI
      const articles = await this.processNewsArticles(data.feed.slice(0, limit));

      // Cache the results
      this.cache.set(cacheKey, { data: articles, timestamp: Date.now() });

      return articles;
    } catch (error) {
      console.error('Error fetching news:', error);
      return cached ? cached.data : this.getMockNews();
    }
  }

  /**
   * Get news for specific ticker symbols
   */
  async getTickerNews(tickers: string[], limit: number = 5): Promise<NewsArticle[]> {
    const cacheKey = `ticker-news-${tickers.join('-')}-${limit}`;

    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    if (!this.API_KEY) {
      return this.getMockNews().filter(news =>
        tickers.some(ticker => news.title.includes(ticker))
      );
    }

    try {
      const tickersParam = tickers.join(',');
      const url = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=${tickersParam}&limit=${limit}&apikey=${this.API_KEY}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.Note || !data.feed) {
        return cached ? cached.data : this.getMockNews();
      }

      const articles = await this.processNewsArticles(data.feed.slice(0, limit));
      this.cache.set(cacheKey, { data: articles, timestamp: Date.now() });

      return articles;
    } catch (error) {
      console.error('Error fetching ticker news:', error);
      return cached ? cached.data : this.getMockNews();
    }
  }

  /**
   * Process raw news articles and add AI sentiment analysis
   */
  private async processNewsArticles(rawArticles: any[]): Promise<NewsArticle[]> {
    const processed = await Promise.all(
      rawArticles.map(async (article) => {
        // Use Alpha Vantage's sentiment if available, otherwise analyze with AI
        let sentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral';
        let impact: 'high' | 'medium' | 'low' = 'medium';

        // Alpha Vantage provides overall_sentiment_score (-1 to 1)
        if (article.overall_sentiment_score !== undefined) {
          const score = parseFloat(article.overall_sentiment_score);
          if (score > 0.15) sentiment = 'bullish';
          else if (score < -0.15) sentiment = 'bearish';
          else sentiment = 'neutral';

          // Determine impact based on sentiment label
          if (article.overall_sentiment_label === 'Bullish' || article.overall_sentiment_label === 'Bearish') {
            impact = 'high';
          } else if (article.overall_sentiment_label === 'Somewhat-Bullish' || article.overall_sentiment_label === 'Somewhat-Bearish') {
            impact = 'medium';
          } else {
            impact = 'low';
          }
        } else {
          // Fallback: Use AI to analyze sentiment
          try {
            const analysis = await this.analyzeWithAI(article.title, article.summary || '');
            sentiment = analysis.sentiment;
            impact = analysis.impact;
          } catch (error) {
            console.error('AI sentiment analysis failed:', error);
          }
        }

        return {
          title: article.title,
          source: article.source || 'Unknown',
          url: article.url,
          summary: article.summary || '',
          publishedAt: article.time_published,
          timeAgo: this.getTimeAgo(article.time_published),
          sentiment,
          impact,
          ticker: article.ticker_sentiment?.[0]?.ticker,
          imageUrl: article.banner_image,
          topics: article.topics?.map((t: any) => t.topic) || []
        };
      })
    );

    return processed;
  }

  /**
   * Analyze news sentiment with OpenAI (fallback if Alpha Vantage doesn't provide sentiment)
   */
  private async analyzeWithAI(title: string, summary: string): Promise<NewsSentimentAnalysis> {
    try {
      const openai = getOpenAIService();
      const prompt = `Analyze this financial news headline and summary for trading sentiment:

Title: "${title}"
Summary: "${summary}"

Respond in JSON format:
{
  "sentiment": "bullish" | "bearish" | "neutral",
  "impact": "high" | "medium" | "low",
  "reasoning": "brief explanation"
}`;

      const response = await openai.chat(prompt);
      const parsed = JSON.parse(response);

      return {
        sentiment: parsed.sentiment || 'neutral',
        impact: parsed.impact || 'medium',
        reasoning: parsed.reasoning || ''
      };
    } catch (error) {
      console.error('AI analysis error:', error);
      return { sentiment: 'neutral', impact: 'medium', reasoning: 'Analysis failed' };
    }
  }

  /**
   * Convert timestamp to "time ago" format
   */
  private getTimeAgo(timestamp: string): string {
    try {
      // Alpha Vantage format: "20231201T153000" (YYYYMMDDTHHmmss)
      const year = parseInt(timestamp.substring(0, 4));
      const month = parseInt(timestamp.substring(4, 6)) - 1;
      const day = parseInt(timestamp.substring(6, 8));
      const hour = parseInt(timestamp.substring(9, 11));
      const minute = parseInt(timestamp.substring(11, 13));
      const second = parseInt(timestamp.substring(13, 15));

      const date = new Date(year, month, day, hour, minute, second);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;

      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;

      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 7) return `${diffDays}d ago`;

      return date.toLocaleDateString();
    } catch (error) {
      return 'Recently';
    }
  }

  /**
   * Mock news data for development/fallback
   */
  private getMockNews(): NewsArticle[] {
    return [
      {
        title: 'Fed Signals Pause in Rate Hikes After Strong Jobs Data',
        source: 'Bloomberg',
        url: 'https://bloomberg.com',
        summary: 'Federal Reserve officials indicated they may pause interest rate increases as inflation shows signs of cooling.',
        publishedAt: new Date().toISOString(),
        timeAgo: '5m ago',
        sentiment: 'bullish',
        impact: 'high',
        ticker: 'SPY'
      },
      {
        title: 'Bitcoin ETF Approval Expected Within Weeks, Says SEC Source',
        source: 'CoinDesk',
        url: 'https://coindesk.com',
        summary: 'Multiple Bitcoin ETF applications are nearing approval, potentially opening institutional flood gates.',
        publishedAt: new Date(Date.now() - 12 * 60000).toISOString(),
        timeAgo: '12m ago',
        sentiment: 'bullish',
        impact: 'high',
        ticker: 'BTC'
      },
      {
        title: 'NVIDIA Beats Earnings Expectations on AI Chip Demand',
        source: 'Reuters',
        url: 'https://reuters.com',
        summary: 'NVIDIA reported better-than-expected quarterly results driven by surging demand for AI processors.',
        publishedAt: new Date(Date.now() - 60 * 60000).toISOString(),
        timeAgo: '1h ago',
        sentiment: 'bullish',
        impact: 'medium',
        ticker: 'NVDA'
      },
      {
        title: 'Oil Prices Surge as OPEC Announces Production Cuts',
        source: 'MarketWatch',
        url: 'https://marketwatch.com',
        summary: 'Crude oil prices jumped 4% after OPEC+ members agreed to extend production cuts through 2024.',
        publishedAt: new Date(Date.now() - 2 * 60 * 60000).toISOString(),
        timeAgo: '2h ago',
        sentiment: 'neutral',
        impact: 'medium',
        ticker: 'USO'
      },
      {
        title: 'Tesla Faces Challenges in China Market Amid Competition',
        source: 'CNBC',
        url: 'https://cnbc.com',
        summary: 'Tesla sales in China declined as local EV manufacturers gain market share with competitive pricing.',
        publishedAt: new Date(Date.now() - 3 * 60 * 60000).toISOString(),
        timeAgo: '3h ago',
        sentiment: 'bearish',
        impact: 'medium',
        ticker: 'TSLA'
      }
    ];
  }
}

// Singleton instance
let newsServiceInstance: NewsService | null = null;

export function getNewsService(): NewsService {
  if (!newsServiceInstance) {
    newsServiceInstance = new NewsService();
  }
  return newsServiceInstance;
}
