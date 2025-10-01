'use client'

import { WebSocketClient, WebSocketMessage, createWebSocketClient } from './websocket-client'

export interface MarketDataPoint {
  symbol: string
  price: number
  change: number
  changePercent: number
  volume: number
  timestamp: number
  high24h?: number
  low24h?: number
  marketCap?: number
}

export interface TradingSignal {
  symbol: string
  action: 'BUY' | 'SELL' | 'HOLD'
  confidence: number
  reason: string
  timestamp: number
  targetPrice?: number
  stopLoss?: number
}

export interface NewsAlert {
  id: string
  title: string
  summary: string
  source: string
  timestamp: number
  sentiment: 'positive' | 'negative' | 'neutral'
  impactScore: number
  relatedSymbols: string[]
}

export type MarketDataHandler = (data: MarketDataPoint) => void
export type TradingSignalHandler = (signal: TradingSignal) => void
export type NewsAlertHandler = (news: NewsAlert) => void

export class MarketDataProvider {
  private wsClient: WebSocketClient | null = null
  private subscribers: {
    marketData: Set<MarketDataHandler>
    tradingSignals: Set<TradingSignalHandler>
    newsAlerts: Set<NewsAlertHandler>
  }
  private subscribedSymbols: Set<string> = new Set()

  constructor() {
    this.subscribers = {
      marketData: new Set(),
      tradingSignals: new Set(),
      newsAlerts: new Set()
    }
  }

  async connect(wsUrl?: string): Promise<void> {
    if (this.wsClient?.isConnected()) {
      return
    }

    // Use mock WebSocket URL if no real endpoint provided
    const url = wsUrl || this.getMockWebSocketUrl()

    this.wsClient = createWebSocketClient({
      url,
      reconnectInterval: 2000,
      maxReconnectAttempts: 10,
      heartbeatInterval: 30000
    })

    // Set up message handlers
    this.wsClient.subscribe('market_data', this.handleMarketData.bind(this))
    this.wsClient.subscribe('trading_signal', this.handleTradingSignal.bind(this))
    this.wsClient.subscribe('news_alert', this.handleNewsAlert.bind(this))
    this.wsClient.subscribe('pong', this.handlePong.bind(this))

    await this.wsClient.connect()

    // If using mock data, start the simulation
    if (!wsUrl) {
      this.startMockDataSimulation()
    }
  }

  disconnect(): void {
    if (this.wsClient) {
      this.wsClient.disconnect()
      this.wsClient = null
    }
    this.subscribedSymbols.clear()
  }

  subscribeToMarketData(handler: MarketDataHandler): void {
    this.subscribers.marketData.add(handler)
  }

  unsubscribeFromMarketData(handler: MarketDataHandler): void {
    this.subscribers.marketData.delete(handler)
  }

  subscribeToTradingSignals(handler: TradingSignalHandler): void {
    this.subscribers.tradingSignals.add(handler)
  }

  unsubscribeFromTradingSignals(handler: TradingSignalHandler): void {
    this.subscribers.tradingSignals.delete(handler)
  }

  subscribeToNewsAlerts(handler: NewsAlertHandler): void {
    this.subscribers.newsAlerts.add(handler)
  }

  unsubscribeFromNewsAlerts(handler: NewsAlertHandler): void {
    this.subscribers.newsAlerts.delete(handler)
  }

  subscribeToSymbol(symbol: string): void {
    if (this.subscribedSymbols.has(symbol)) return

    this.subscribedSymbols.add(symbol)

    if (this.wsClient?.isConnected()) {
      this.wsClient.send({
        type: 'subscribe',
        data: { symbol }
      })
    }
  }

  unsubscribeFromSymbol(symbol: string): void {
    if (!this.subscribedSymbols.has(symbol)) return

    this.subscribedSymbols.delete(symbol)

    if (this.wsClient?.isConnected()) {
      this.wsClient.send({
        type: 'unsubscribe',
        data: { symbol }
      })
    }
  }

  private handleMarketData(message: WebSocketMessage): void {
    const data = message.data as MarketDataPoint
    this.subscribers.marketData.forEach(handler => {
      try {
        handler(data)
      } catch (error) {
        console.error('Error in market data handler:', error)
      }
    })
  }

  private handleTradingSignal(message: WebSocketMessage): void {
    const signal = message.data as TradingSignal
    this.subscribers.tradingSignals.forEach(handler => {
      try {
        handler(signal)
      } catch (error) {
        console.error('Error in trading signal handler:', error)
      }
    })
  }

  private handleNewsAlert(message: WebSocketMessage): void {
    const news = message.data as NewsAlert
    this.subscribers.newsAlerts.forEach(handler => {
      try {
        handler(news)
      } catch (error) {
        console.error('Error in news alert handler:', error)
      }
    })
  }

  private handlePong(message: WebSocketMessage): void {
    // Handle pong response for heartbeat
    console.debug('Received pong:', message.timestamp)
  }

  private getMockWebSocketUrl(): string {
    // For development, we'll use a mock WebSocket server
    return 'wss://echo.websocket.org/' // Placeholder - will be mocked
  }

  private startMockDataSimulation(): void {
    // Simulate real-time market data updates
    const symbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'NVDA', 'BTC-USD', 'ETH-USD', 'SPY', 'QQQ']
    const baseData: Record<string, { price: number; volume: number }> = {
      'AAPL': { price: 175.50, volume: 45000000 },
      'GOOGL': { price: 2890.25, volume: 1200000 },
      'MSFT': { price: 385.75, volume: 28000000 },
      'TSLA': { price: 245.30, volume: 95000000 },
      'NVDA': { price: 875.40, volume: 42000000 },
      'BTC-USD': { price: 43250.50, volume: 2500000000 },
      'ETH-USD': { price: 2650.75, volume: 850000000 },
      'SPY': { price: 445.20, volume: 78000000 },
      'QQQ': { price: 375.85, volume: 35000000 }
    }

    // Generate market data updates every 1-5 seconds
    const generateMarketData = () => {
      const symbol = symbols[Math.floor(Math.random() * symbols.length)]
      const base = baseData[symbol]

      if (!base) return

      const priceChange = (Math.random() - 0.5) * base.price * 0.02 // ±2% max change
      const newPrice = Math.max(0.01, base.price + priceChange)
      const changePercent = (priceChange / base.price) * 100
      const volumeChange = (Math.random() - 0.5) * base.volume * 0.1
      const newVolume = Math.max(1000, Math.floor(base.volume + volumeChange))

      // Update base data for next iteration
      baseData[symbol] = {
        price: newPrice,
        volume: newVolume
      }

      const marketData: MarketDataPoint = {
        symbol,
        price: Math.round(newPrice * 100) / 100,
        change: Math.round(priceChange * 100) / 100,
        changePercent: Math.round(changePercent * 100) / 100,
        volume: newVolume,
        timestamp: Date.now(),
        high24h: Math.round((newPrice * 1.05) * 100) / 100,
        low24h: Math.round((newPrice * 0.95) * 100) / 100,
        marketCap: symbol.includes('BTC') ? 850000000000 : symbol.includes('ETH') ? 320000000000 : undefined
      }

      // Simulate WebSocket message
      setTimeout(() => {
        if (this.wsClient) {
          this.handleMarketData({
            type: 'market_data',
            data: marketData,
            timestamp: Date.now()
          })
        }
      }, 0)
    }

    // Generate trading signals every 10-30 seconds
    const generateTradingSignal = () => {
      const symbol = symbols[Math.floor(Math.random() * symbols.length)]
      const actions: TradingSignal['action'][] = ['BUY', 'SELL', 'HOLD']
      const action = actions[Math.floor(Math.random() * actions.length)]

      const signal: TradingSignal = {
        symbol,
        action,
        confidence: Math.floor(Math.random() * 40) + 60, // 60-100%
        reason: this.getRandomSignalReason(action),
        timestamp: Date.now(),
        targetPrice: baseData[symbol] ? baseData[symbol].price * (1 + (Math.random() - 0.5) * 0.1) : undefined,
        stopLoss: baseData[symbol] ? baseData[symbol].price * (1 - Math.random() * 0.05) : undefined
      }

      setTimeout(() => {
        if (this.wsClient) {
          this.handleTradingSignal({
            type: 'trading_signal',
            data: signal,
            timestamp: Date.now()
          })
        }
      }, 0)
    }

    // Generate news alerts every 30-60 seconds
    const generateNewsAlert = () => {
      const newsData = this.getRandomNewsData()
      const news: NewsAlert = {
        id: `news_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...newsData,
        timestamp: Date.now()
      }

      setTimeout(() => {
        if (this.wsClient) {
          this.handleNewsAlert({
            type: 'news_alert',
            data: news,
            timestamp: Date.now()
          })
        }
      }, 0)
    }

    // Set up intervals for mock data generation
    setInterval(generateMarketData, Math.random() * 4000 + 1000) // 1-5 seconds
    setInterval(generateTradingSignal, Math.random() * 20000 + 10000) // 10-30 seconds
    setInterval(generateNewsAlert, Math.random() * 30000 + 30000) // 30-60 seconds
  }

  private getRandomSignalReason(action: TradingSignal['action']): string {
    const reasons = {
      BUY: [
        'Strong technical breakout detected',
        'Positive earnings surprise expected',
        'RSI oversold conditions',
        'Golden cross formation',
        'Increased institutional buying'
      ],
      SELL: [
        'Resistance level reached',
        'Overbought conditions detected',
        'Bearish divergence forming',
        'Profit-taking opportunity',
        'Technical breakdown imminent'
      ],
      HOLD: [
        'Consolidation pattern forming',
        'Mixed technical signals',
        'Awaiting earnings announcement',
        'Sideways trend continues',
        'Risk/reward ratio neutral'
      ]
    }

    const actionReasons = reasons[action]
    return actionReasons[Math.floor(Math.random() * actionReasons.length)]
  }

  private getRandomNewsData() {
    const newsTemplates = [
      {
        title: 'Federal Reserve announces interest rate decision',
        summary: 'The Federal Reserve maintains current interest rates amid economic uncertainty',
        source: 'Reuters',
        sentiment: 'neutral' as const,
        impactScore: 8.5,
        relatedSymbols: ['SPY', 'QQQ', 'BTC-USD']
      },
      {
        title: 'Tech stocks surge on AI breakthrough',
        summary: 'Major technology companies see gains following artificial intelligence developments',
        source: 'Bloomberg',
        sentiment: 'positive' as const,
        impactScore: 7.2,
        relatedSymbols: ['AAPL', 'GOOGL', 'MSFT', 'NVDA']
      },
      {
        title: 'Bitcoin reaches new monthly high',
        summary: 'Cryptocurrency markets show renewed strength as institutional adoption grows',
        source: 'CoinDesk',
        sentiment: 'positive' as const,
        impactScore: 6.8,
        relatedSymbols: ['BTC-USD', 'ETH-USD']
      },
      {
        title: 'Electric vehicle market faces headwinds',
        summary: 'EV manufacturers report slower than expected growth in quarterly deliveries',
        source: 'Financial Times',
        sentiment: 'negative' as const,
        impactScore: 5.5,
        relatedSymbols: ['TSLA']
      }
    ]

    return newsTemplates[Math.floor(Math.random() * newsTemplates.length)]
  }
}

// Singleton instance for global use
let marketDataProvider: MarketDataProvider | null = null

export function getMarketDataProvider(): MarketDataProvider {
  if (!marketDataProvider) {
    marketDataProvider = new MarketDataProvider()
  }
  return marketDataProvider
}