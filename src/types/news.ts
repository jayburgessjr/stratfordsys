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
