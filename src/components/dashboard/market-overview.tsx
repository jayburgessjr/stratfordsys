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
  RefreshCw,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useMarketData, useTradingSignals, useNewsAlerts } from '@/lib/hooks/use-market-data';
import { formatCurrency, formatPercentage } from '@/lib/utils';
import { getNewsService, type NewsArticle } from '@/lib/services/news-service';

interface MarketData {
  symbol: string;
  name: string;
  price: string;
  change: string;
  changePercent: string;
  trend: 'up' | 'down';
  volume?: string;
  marketCap?: string;
}

export function MarketOverview() {
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [marketNews, setMarketNews] = useState<NewsArticle[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);

  // Real-time data hooks
  const marketData = useMarketData({
    symbols: ['SPY', 'QQQ', 'AAPL', 'GOOGL', 'MSFT', 'TSLA', 'BTC-USD', 'ETH-USD'],
    autoConnect: true,
    maxDataPoints: 50
  });

  const tradingSignals = useTradingSignals(20);
  const newsAlerts = useNewsAlerts(10);

  const marketIndices: MarketData[] = [
    { symbol: 'SPY', name: 'S&P 500', price: '$428.67', change: '+$2.34', changePercent: '+0.55%', trend: 'up' },
    { symbol: 'QQQ', name: 'NASDAQ', price: '$361.45', change: '-$1.23', changePercent: '-0.34%', trend: 'down' },
    { symbol: 'IWM', name: 'Russell 2000', price: '$184.32', change: '+$0.89', changePercent: '+0.48%', trend: 'up' },
    { symbol: 'VIX', name: 'Volatility Index', price: '$18.45', change: '-$0.67', changePercent: '-3.52%', trend: 'down' }
  ];

  const cryptoData: MarketData[] = [
    { symbol: 'BTC', name: 'Bitcoin', price: '$38,247', change: '+$892', changePercent: '+2.39%', trend: 'up', marketCap: '$750B' },
    { symbol: 'ETH', name: 'Ethereum', price: '$1,967', change: '-$23', changePercent: '-1.15%', trend: 'down', marketCap: '$236B' },
    { symbol: 'SOL', name: 'Solana', price: '$76.43', change: '+$6.21', changePercent: '+8.84%', trend: 'up', marketCap: '$32B' },
    { symbol: 'BNB', name: 'BNB', price: '$234.56', change: '+$3.45', changePercent: '+1.49%', trend: 'up', marketCap: '$36B' }
  ];

  const topMovers: MarketData[] = [
    { symbol: 'NVDA', name: 'NVIDIA', price: '$445.67', change: '+$23.45', changePercent: '+5.56%', trend: 'up' },
    { symbol: 'TSLA', name: 'Tesla', price: '$189.34', change: '-$8.92', changePercent: '-4.50%', trend: 'down' },
    { symbol: 'AAPL', name: 'Apple', price: '$178.90', change: '+$2.34', changePercent: '+1.33%', trend: 'up' },
    { symbol: 'MSFT', name: 'Microsoft', price: '$367.89', change: '+$4.56', changePercent: '+1.26%', trend: 'up' }
  ];

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

  const refreshData = () => {
    setIsRefreshing(true);

    // Reconnect to real-time data
    if (marketData.isConnected) {
      marketData.disconnect();
      setTimeout(() => {
        marketData.connect().finally(() => {
          setLastUpdate(new Date());
          setIsRefreshing(false);
        });
      }, 500);
    } else {
      marketData.connect().finally(() => {
        setLastUpdate(new Date());
        setIsRefreshing(false);
      });
    }
  };

  // Update lastUpdate when we receive new market data
  useEffect(() => {
    if (marketData.lastUpdate) {
      setLastUpdate(new Date(marketData.lastUpdate));
    }
  }, [marketData.lastUpdate]);

  return (
    <div className="space-y-6">
      {/* Market Status Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            {marketData.isConnected ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : marketData.isConnecting ? (
              <Activity className="h-4 w-4 text-yellow-500 animate-pulse" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-500" />
            )}
            <span className="text-sm font-medium">
              {marketData.isConnected ? 'Live Data' :
               marketData.isConnecting ? 'Connecting...' :
               'Disconnected'}
            </span>
            {marketData.error && (
              <Badge variant="destructive" className="text-xs">
                Error: {marketData.error}
              </Badge>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
          {Object.keys(marketData.data).length > 0 && (
            <div className="text-sm text-muted-foreground">
              • {Object.keys(marketData.data).length} symbols tracked
            </div>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={refreshData} disabled={isRefreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Portfolio</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">$234,567</div>
            <p className="text-xs text-green-600">+$12,345 (5.6%) today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Positions</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">47</div>
            <p className="text-xs text-muted-foreground">Across all markets</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Confidence</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">87%</div>
            <p className="text-xs text-muted-foreground">High conviction signals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Trades</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-green-600">18 profitable</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risk Level</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">Medium</div>
            <p className="text-xs text-muted-foreground">Within limits</p>
          </CardContent>
        </Card>
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
            {marketIndices.map((index) => (
              <div key={index.symbol} className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{index.symbol}</div>
                  <div className="text-sm text-muted-foreground">{index.name}</div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{index.price}</div>
                  <div className={`text-sm flex items-center ${
                    index.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {index.trend === 'up' ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    )}
                    {index.changePercent}
                  </div>
                </div>
              </div>
            ))}
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
            {cryptoData.map((crypto) => (
              <div key={crypto.symbol} className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{crypto.symbol}</div>
                  <div className="text-sm text-muted-foreground">{crypto.name}</div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{crypto.price}</div>
                  <div className={`text-sm flex items-center ${
                    crypto.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {crypto.trend === 'up' ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    )}
                    {crypto.changePercent}
                  </div>
                </div>
              </div>
            ))}
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
            {topMovers.map((stock) => (
              <div key={stock.symbol} className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{stock.symbol}</div>
                  <div className="text-sm text-muted-foreground">{stock.name}</div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{stock.price}</div>
                  <div className={`text-sm flex items-center ${
                    stock.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stock.trend === 'up' ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    )}
                    {stock.changePercent}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* AI Insights & News */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* AI Trading Signals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="mr-2 h-5 w-5 text-blue-500" />
              AI Trading Signals
            </CardTitle>
            <CardDescription>Real-time algorithmic recommendations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {aiInsights.map((insight, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Badge variant={
                    insight.type === 'BUY' ? 'default' :
                    insight.type === 'SELL' ? 'destructive' :
                    insight.type === 'LOTTERY' ? 'secondary' : 'outline'
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
            <CardDescription>Real-time market-moving news with AI sentiment analysis</CardDescription>
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
                        {news.ticker && (
                          <>
                            <span className="text-xs text-muted-foreground">•</span>
                            <Badge variant="outline" className="text-xs">{news.ticker}</Badge>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-1 ml-2">
                      <Badge variant={news.impact === 'high' ? 'destructive' : news.impact === 'medium' ? 'secondary' : 'outline'} className="text-xs">
                        {news.impact}
                      </Badge>
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
      </div>

      {/* Lottery Quick View */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="mr-2 h-5 w-5 text-purple-500" />
            Today&apos;s Lottery Predictions
          </CardTitle>
          <CardDescription>AI-generated number combinations with statistical analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}