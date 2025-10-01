'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Bitcoin, TrendingUp, TrendingDown, Zap, Target, AlertTriangle } from 'lucide-react';

export default function CryptoPage() {
  const [selectedCoin, setSelectedCoin] = useState<string>('');

  const cryptoPortfolio = [
    {
      symbol: 'BTC',
      name: 'Bitcoin',
      amount: '0.234',
      value: '$8,945',
      change24h: '+2.34%',
      changeValue: '+$204',
      trend: 'up'
    },
    {
      symbol: 'ETH',
      name: 'Ethereum',
      amount: '3.67',
      value: '$7,234',
      change24h: '-1.23%',
      changeValue: '-$90',
      trend: 'down'
    },
    {
      symbol: 'SOL',
      name: 'Solana',
      amount: '45.2',
      value: '$3,456',
      change24h: '+8.91%',
      changeValue: '+$283',
      trend: 'up'
    },
    {
      symbol: 'AVAX',
      name: 'Avalanche',
      amount: '89.1',
      value: '$2,134',
      change24h: '+4.56%',
      changeValue: '+$93',
      trend: 'up'
    }
  ];

  const tradingSignals = [
    {
      coin: 'BTC',
      signal: 'BUY',
      confidence: 94,
      entry: '$38,250',
      target: '$42,100',
      stopLoss: '$36,800',
      reason: 'Golden Cross + Institutional Volume',
      timeframe: '4H'
    },
    {
      coin: 'ETH',
      signal: 'HOLD',
      confidence: 78,
      entry: '$1,967',
      target: '$2,180',
      stopLoss: '$1,850',
      reason: 'Shanghai Upgrade Momentum',
      timeframe: '1D'
    },
    {
      coin: 'SOL',
      signal: 'STRONG BUY',
      confidence: 91,
      entry: '$76.40',
      target: '$89.20',
      stopLoss: '$71.30',
      reason: 'DeFi TVL Growth + Network Activity',
      timeframe: '2H'
    },
    {
      coin: 'LINK',
      signal: 'SELL',
      confidence: 86,
      entry: '$14.80',
      target: '$12.90',
      stopLoss: '$15.60',
      reason: 'Bearish Divergence + Profit Taking',
      timeframe: '6H'
    }
  ];

  const defiOpportunities = [
    {
      protocol: 'Uniswap V3',
      pair: 'ETH/USDC',
      apy: '45.7%',
      tvl: '$234M',
      risk: 'Medium',
      strategy: 'Concentrated Liquidity',
      fees24h: '$12,450'
    },
    {
      protocol: 'Compound',
      asset: 'USDC',
      apy: '8.3%',
      tvl: '$1.2B',
      risk: 'Low',
      strategy: 'Lending',
      fees24h: '$34,200'
    },
    {
      protocol: 'Yearn Finance',
      vault: 'yvDAI',
      apy: '12.8%',
      tvl: '$89M',
      risk: 'Medium',
      strategy: 'Yield Farming',
      fees24h: '$8,900'
    },
    {
      protocol: 'Convex',
      pool: 'stETH/ETH',
      apy: '23.4%',
      tvl: '$456M',
      risk: 'High',
      strategy: 'Liquid Staking',
      fees24h: '$18,670'
    }
  ];

  const arbitrageOpps = [
    {
      coin: 'BTC',
      exchange1: 'Binance: $38,245',
      exchange2: 'Coinbase: $38,389',
      spread: '0.38%',
      profit: '$144',
      volume: '$50K max'
    },
    {
      coin: 'ETH',
      exchange1: 'Kraken: $1,967',
      exchange2: 'FTX: $1,982',
      spread: '0.76%',
      profit: '$15',
      volume: '$20K max'
    },
    {
      coin: 'SOL',
      exchange1: 'Huobi: $76.20',
      exchange2: 'Gate.io: $76.89',
      spread: '0.91%',
      profit: '$0.69',
      volume: '$30K max'
    }
  ];

  const memeCoins = [
    {
      name: 'PEPE',
      symbol: 'PEPE',
      change24h: '+127.34%',
      marketCap: '$1.2B',
      volume: '$890M',
      sentiment: 'Euphoric',
      risk: 'Extreme High'
    },
    {
      name: 'Dogecoin',
      symbol: 'DOGE',
      change24h: '+23.45%',
      marketCap: '$12.4B',
      volume: '$1.2B',
      sentiment: 'Bullish',
      risk: 'High'
    },
    {
      name: 'Shiba Inu',
      symbol: 'SHIB',
      change24h: '+45.67%',
      marketCap: '$8.9B',
      volume: '$2.1B',
      sentiment: 'FOMO',
      risk: 'Very High'
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Crypto Trading</h1>
            <p className="text-muted-foreground">
              Multi-chain DeFi opportunities and algorithmic trading
            </p>
          </div>
          <Badge variant="outline" className="text-green-600 border-green-600">
            +$23,847 Total P&L
          </Badge>
        </div>

        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
              <Bitcoin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$21,769</div>
              <p className="text-xs text-green-600">
                +$487 (2.3%) today
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Trades</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">7</div>
              <p className="text-xs text-muted-foreground">
                5 profitable
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">DeFi Yields</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">22.4%</div>
              <p className="text-xs text-muted-foreground">
                Average APY
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">73.8%</div>
              <p className="text-xs text-muted-foreground">
                Last 30 trades
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="portfolio" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
            <TabsTrigger value="signals">Trading Signals</TabsTrigger>
            <TabsTrigger value="defi">DeFi Yields</TabsTrigger>
            <TabsTrigger value="arbitrage">Arbitrage</TabsTrigger>
            <TabsTrigger value="meme">Meme Coins</TabsTrigger>
          </TabsList>

          <TabsContent value="portfolio" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {cryptoPortfolio.map((crypto, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Bitcoin className="h-5 w-5" />
                        <span>{crypto.name}</span>
                        <Badge variant="outline">{crypto.symbol}</Badge>
                      </div>
                      {crypto.trend === 'up' ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-muted-foreground">Holdings</span>
                        <div className="font-medium">{crypto.amount} {crypto.symbol}</div>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Value</span>
                        <div className="font-medium">{crypto.value}</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className={`text-sm font-medium ${crypto.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                        {crypto.change24h} ({crypto.changeValue})
                      </div>
                      <Button variant="outline" size="sm">
                        Trade
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="signals" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {tradingSignals.map((signal, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {signal.coin}
                      <Badge variant={
                        signal.signal === 'STRONG BUY' || signal.signal === 'BUY' ? 'default' :
                        signal.signal === 'SELL' ? 'destructive' : 'secondary'
                      }>
                        {signal.signal}
                      </Badge>
                    </CardTitle>
                    <CardDescription>{signal.reason}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Entry:</span>
                        <div className="font-medium">{signal.entry}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Target:</span>
                        <div className="font-medium text-green-600">{signal.target}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Stop:</span>
                        <div className="font-medium text-red-600">{signal.stopLoss}</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Confidence:</span>
                        <span className="ml-2 font-medium">{signal.confidence}%</span>
                      </div>
                      <Badge variant="outline">{signal.timeframe}</Badge>
                    </div>
                    <Progress value={signal.confidence} className="h-2" />
                    <Button className="w-full">
                      Execute Trade
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="defi" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {defiOpportunities.map((defi, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {defi.protocol}
                      <Badge variant={
                        defi.risk === 'Low' ? 'default' :
                        defi.risk === 'Medium' ? 'secondary' : 'destructive'
                      }>
                        {defi.risk} Risk
                      </Badge>
                    </CardTitle>
                    <CardDescription>{defi.strategy}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">APY:</span>
                        <div className="font-medium text-green-600 text-lg">{defi.apy}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">TVL:</span>
                        <div className="font-medium">{defi.tvl}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Asset:</span>
                        <div className="font-medium">{defi.pair || defi.asset || defi.vault || defi.pool}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">24h Fees:</span>
                        <div className="font-medium">{defi.fees24h}</div>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full">
                      <TrendingUp className="mr-2 h-4 w-4" />
                      Enter Position
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="arbitrage" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Cross-Exchange Arbitrage Opportunities</CardTitle>
                <CardDescription>
                  Real-time price differences across major exchanges
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {arbitrageOpps.map((arb, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{arb.coin}</h4>
                        <Badge variant="default" className="text-green-600">
                          {arb.spread} Spread
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                        <div>
                          <span className="text-muted-foreground">Buy:</span>
                          <div>{arb.exchange1}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Sell:</span>
                          <div>{arb.exchange2}</div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-sm">
                          <span className="text-green-600 font-medium">Profit: {arb.profit}</span>
                          <span className="text-muted-foreground ml-4">Max: {arb.volume}</span>
                        </div>
                        <Button size="sm">
                          Execute Arbitrage
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="meme" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="mr-2 h-5 w-5 text-yellow-600" />
                  Meme Coin Tracker
                </CardTitle>
                <CardDescription>
                  High-risk, high-reward momentum plays - Use extreme caution
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {memeCoins.map((meme, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{meme.name} ({meme.symbol})</h4>
                        <Badge variant="destructive">{meme.risk}</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                        <div>
                          <span className="text-muted-foreground">24h Change:</span>
                          <div className="font-medium text-green-600">{meme.change24h}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Market Cap:</span>
                          <div>{meme.marketCap}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Volume:</span>
                          <div>{meme.volume}</div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">{meme.sentiment}</Badge>
                        <Button size="sm" variant="outline">
                          <AlertTriangle className="mr-2 h-4 w-4" />
                          High Risk Trade
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}