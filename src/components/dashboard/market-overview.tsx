'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  Target,
  Bitcoin,
  Zap,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { useRealMarketData } from '@/lib/hooks/use-real-market-data';
import { formatCurrency, formatPercentage } from '@/lib/utils';
import { getNewsService, type NewsArticle } from '@/lib/services/news-service';

interface MarketData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  trend: 'up' | 'down';
  volume?: string;
  marketCap?: string;
}

// Symbol name mappings
const symbolNames: Record<string, string> = {
  'SPY': 'S&P 500',
  'QQQ': 'NASDAQ',
  'IWM': 'Russell 2000',
  'VIX': 'Volatility Index',
  'BTC-USD': 'Bitcoin',
  'ETH-USD': 'Ethereum',
  'SOL-USD': 'Solana',
  'BNB-USD': 'BNB',
  'NVDA': 'NVIDIA',
  'TSLA': 'Tesla',
  'AAPL': 'Apple',
  'MSFT': 'Microsoft'
};

export function MarketOverview() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [marketNews, setMarketNews] = useState<NewsArticle[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);

  // Fetch real market data
  const indicesData = useRealMarketData({
    symbols: ['SPY', 'QQQ', 'IWM', 'VIX'],
    refreshInterval: 300000, // Refresh every 5 minutes
    enabled: true,
  });

  const cryptoData = useRealMarketData({
    symbols: ['BTC-USD', 'ETH-USD', 'SOL-USD', 'BNB-USD'],
    refreshInterval: 300000, // Refresh every 5 minutes
    enabled: true,
  });

  const topMoversData = useRealMarketData({
    symbols: ['NVDA', 'TSLA', 'AAPL', 'MSFT'],
    refreshInterval: 300000, // Refresh every 5 minutes
    enabled: true,
  });

  // Convert quote data to MarketData format
  const convertToMarketData = (quotes: Record<string, any>): MarketData[] => {
    return Object.values(quotes).map((quote: any) => ({
      symbol: quote.symbol.replace('-USD', ''),
      name: symbolNames[quote.symbol] || quote.symbol,
      price: quote.price,
      change: quote.change,
      changePercent: quote.changePercent,
      trend: quote.change >= 0 ? 'up' : 'down'
    }));
  };

  const marketIndices = convertToMarketData(indicesData.quotes);
  const cryptoMarketData = convertToMarketData(cryptoData.quotes);
  const topMovers = convertToMarketData(topMoversData.quotes);

  const lotteryNumbers = {
    powerball: { numbers: [7, 14, 21, 35, 42], powerball: 18, jackpot: '$150M' },
    megaMillions: { numbers: [3, 19, 28, 41, 67], megaBall: 23, jackpot: '$87M' },
    confidence: 89
  };

  const aiInsights = [
    { type: 'BUY', asset: 'BTC', confidence: 94, reason: 'Golden cross formation + institutional accumulation' },
    { type: 'SELL', asset: 'TSLA', confidence: 87, reason: 'Bearish divergence + profit taking zone' },
    { type: 'HOLD', asset: 'SPY', confidence: 76, reason: 'Mixed signals, await Fed decision' },
    { type: 'LOTTERY', asset: 'Powerball', confidence: 73, reason: 'Hot number pattern detected' }
  ];

  // Fetch real news on component mount
  useEffect(() => {
    const fetchNews = async () => {
      setNewsLoading(true);
      try {
        const newsService = getNewsService();
        const news = await newsService.getMarketNews(['blockchain', 'earnings', 'financial_markets'], 5);
        setMarketNews(news);
      } catch (error) {
        console.error('Error fetching news:', error);
      } finally {
        setNewsLoading(false);
      }
    };

    fetchNews();

    // Refresh news every 5 minutes
    const interval = setInterval(fetchNews, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      // Refresh all market data
      indicesData.refresh();
      cryptoData.refresh();
      topMoversData.refresh();

      // Refresh news
      const newsService = getNewsService();
      const news = await newsService.getMarketNews(['blockchain', 'earnings', 'financial_markets'], 5);
      setMarketNews(news);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Market Overview</h2>
        <Button variant="outline" size="sm" onClick={refreshData} disabled={isRefreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Market Data Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Stock Indices */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2 h-5 w-5" />
              Market Indices
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {indicesData.isLoading && marketIndices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <RefreshCw className="h-8 w-8 mx-auto mb-2 animate-spin" />
                Loading indices...
              </div>
            ) : marketIndices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No data available
              </div>
            ) : (
              marketIndices.map((index) => (
                <div key={index.symbol} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{index.symbol}</div>
                    <div className="text-sm text-muted-foreground">{index.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatCurrency(index.price)}</div>
                    <div className={`text-sm flex items-center ${
                      index.trend === 'up' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {index.trend === 'up' ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      )}
                      {formatPercentage(index.changePercent)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Crypto Market */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bitcoin className="mr-2 h-5 w-5" />
              Cryptocurrency
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {cryptoData.isLoading && cryptoMarketData.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <RefreshCw className="h-8 w-8 mx-auto mb-2 animate-spin" />
                Loading crypto...
              </div>
            ) : cryptoMarketData.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No data available
              </div>
            ) : (
              cryptoMarketData.map((crypto) => (
                <div key={crypto.symbol} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{crypto.symbol}</div>
                    <div className="text-sm text-muted-foreground">{crypto.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatCurrency(crypto.price)}</div>
                    <div className={`text-sm flex items-center ${
                      crypto.trend === 'up' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {crypto.trend === 'up' ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      )}
                      {formatPercentage(crypto.changePercent)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Top Movers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="mr-2 h-5 w-5" />
              Top Movers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topMoversData.isLoading && topMovers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <RefreshCw className="h-8 w-8 mx-auto mb-2 animate-spin" />
                Loading stocks...
              </div>
            ) : topMovers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No data available
              </div>
            ) : (
              topMovers.map((stock) => (
                <div key={stock.symbol} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{stock.symbol}</div>
                    <div className="text-sm text-muted-foreground">{stock.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatCurrency(stock.price)}</div>
                    <div className={`text-sm flex items-center ${
                      stock.trend === 'up' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stock.trend === 'up' ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      )}
                      {formatPercentage(stock.changePercent)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* News Section - 3 Columns */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Market News */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Activity className="mr-2 h-5 w-5 text-orange-500" />
                Market News
              </div>
              {newsLoading && <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />}
            </CardTitle>
            <CardDescription>Real-time market-moving news</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {newsLoading && marketNews.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <RefreshCw className="h-8 w-8 mx-auto mb-2 animate-spin" />
                Loading real news...
              </div>
            ) : marketNews.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No news available
              </div>
            ) : (
              marketNews.map((news, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <a
                        href={news.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-sm leading-tight hover:text-primary transition-colors"
                      >
                        {news.title}
                      </a>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-muted-foreground">{news.source}</span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">{news.timeAgo}</span>
                      </div>
                    </div>
                    <div className="flex space-x-1 ml-2">
                      <Badge variant={news.sentiment === 'bullish' ? 'default' : news.sentiment === 'bearish' ? 'destructive' : 'outline'} className="text-xs">
                        {news.sentiment}
                      </Badge>
                    </div>
                  </div>
                  {index < marketNews.length - 1 && <div className="border-b"></div>}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Gambling News */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="mr-2 h-5 w-5 text-green-500" />
              Gambling News
            </CardTitle>
            <CardDescription>Sports betting & casino insights</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-medium text-sm leading-tight">NBA Playoffs: Lakers vs Warriors Betting Odds</div>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-xs text-muted-foreground">ESPN</span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">1h ago</span>
                  </div>
                </div>
                <Badge variant="default" className="text-xs ml-2">Hot</Badge>
              </div>
              <div className="border-b"></div>
            </div>
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-medium text-sm leading-tight">DraftKings Reports Record Q4 Revenue Growth</div>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-xs text-muted-foreground">Bloomberg</span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">3h ago</span>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs ml-2">News</Badge>
              </div>
              <div className="border-b"></div>
            </div>
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-medium text-sm leading-tight">NFL Week 15: Sharp Money on Underdogs</div>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-xs text-muted-foreground">Action Network</span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">5h ago</span>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs ml-2">Trending</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Trading Signals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="mr-2 h-5 w-5 text-blue-500" />
              AI Trading Signals
            </CardTitle>
            <CardDescription>Algorithmic recommendations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {aiInsights.filter(i => i.type !== 'LOTTERY').map((insight, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Badge variant={
                    insight.type === 'BUY' ? 'default' :
                    insight.type === 'SELL' ? 'destructive' : 'outline'
                  }>
                    {insight.type}
                  </Badge>
                  <div>
                    <div className="font-medium">{insight.asset}</div>
                    <div className="text-sm text-muted-foreground">{insight.reason}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{insight.confidence}%</div>
                  <Progress value={insight.confidence} className="w-16 h-2" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* AI Predictions - 3 Columns */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Lottery Predictions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="mr-2 h-5 w-5 text-purple-500" />
              Lottery Predictions
            </CardTitle>
            <CardDescription>AI-generated number combinations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Powerball</span>
                <Badge variant="outline">{lotteryNumbers.confidence}% Confidence</Badge>
              </div>
              <div className="flex space-x-2 mb-2">
                {lotteryNumbers.powerball.numbers.map((num, i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                    {num}
                  </div>
                ))}
                <div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center text-sm font-bold">
                  {lotteryNumbers.powerball.powerball}
                </div>
              </div>
              <div className="text-sm text-green-600 font-medium">Jackpot: {lotteryNumbers.powerball.jackpot}</div>
            </div>
            <div className="border-b"></div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Mega Millions</span>
                <Badge variant="outline">{lotteryNumbers.confidence - 5}% Confidence</Badge>
              </div>
              <div className="flex space-x-2 mb-2">
                {lotteryNumbers.megaMillions.numbers.map((num, i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                    {num}
                  </div>
                ))}
                <div className="w-8 h-8 rounded-full bg-yellow-500 text-white flex items-center justify-center text-sm font-bold">
                  {lotteryNumbers.megaMillions.megaBall}
                </div>
              </div>
              <div className="text-sm text-green-600 font-medium">Jackpot: {lotteryNumbers.megaMillions.jackpot}</div>
            </div>
          </CardContent>
        </Card>

        {/* Gambling Predictions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="mr-2 h-5 w-5 text-green-500" />
              Gambling Predictions
            </CardTitle>
            <CardDescription>Sports & casino AI recommendations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Badge variant="default">BET</Badge>
                <div>
                  <div className="font-medium">Lakers -3.5</div>
                  <div className="text-sm text-muted-foreground">NBA: Lakers vs Warriors</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">82%</div>
                <Progress value={82} className="w-16 h-2" />
              </div>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Badge variant="secondary">OVER</Badge>
                <div>
                  <div className="font-medium">Over 220.5</div>
                  <div className="text-sm text-muted-foreground">NFL: Chiefs vs Bills</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">76%</div>
                <Progress value={76} className="w-16 h-2" />
              </div>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Badge variant="outline">PASS</Badge>
                <div>
                  <div className="font-medium">Blackjack +EV</div>
                  <div className="text-sm text-muted-foreground">Card counting opportunity</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">68%</div>
                <Progress value={68} className="w-16 h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stock/Bitcoin Predictions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2 h-5 w-5 text-blue-500" />
              Market Predictions
            </CardTitle>
            <CardDescription>Stock & crypto AI forecasts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Badge variant="default">LONG</Badge>
                <div>
                  <div className="font-medium">BTC/USD</div>
                  <div className="text-sm text-muted-foreground">Target: $95K in 30 days</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">91%</div>
                <Progress value={91} className="w-16 h-2" />
              </div>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Badge variant="default">LONG</Badge>
                <div>
                  <div className="font-medium">NVDA</div>
                  <div className="text-sm text-muted-foreground">Target: $550 in 14 days</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">85%</div>
                <Progress value={85} className="w-16 h-2" />
              </div>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Badge variant="destructive">SHORT</Badge>
                <div>
                  <div className="font-medium">SPY</div>
                  <div className="text-sm text-muted-foreground">Target: $420 pullback</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">72%</div>
                <Progress value={72} className="w-16 h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}