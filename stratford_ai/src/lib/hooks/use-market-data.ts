'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  MarketDataProvider,
  MarketDataPoint,
  TradingSignal,
  NewsAlert,
  getMarketDataProvider
} from '../websocket/market-data-provider'

export interface UseMarketDataOptions {
  symbols?: string[]
  autoConnect?: boolean
  maxDataPoints?: number
}

export interface MarketDataState {
  data: Record<string, MarketDataPoint>
  isConnected: boolean
  isConnecting: boolean
  error: string | null
  lastUpdate: number | null
}

export function useMarketData(options: UseMarketDataOptions = {}) {
  const {
    symbols = [],
    autoConnect = true,
    maxDataPoints = 100
  } = options

  const [state, setState] = useState<MarketDataState>({
    data: {},
    isConnected: false,
    isConnecting: false,
    error: null,
    lastUpdate: null
  })

  const providerRef = useRef<MarketDataProvider | null>(null)
  const dataHistoryRef = useRef<Record<string, MarketDataPoint[]>>({})

  const handleMarketData = useCallback((data: MarketDataPoint) => {
    setState(prevState => {
      const newData = { ...prevState.data, [data.symbol]: data }

      // Update history
      if (!dataHistoryRef.current[data.symbol]) {
        dataHistoryRef.current[data.symbol] = []
      }

      const history = dataHistoryRef.current[data.symbol]
      history.push(data)

      // Keep only the last maxDataPoints
      if (history.length > maxDataPoints) {
        history.splice(0, history.length - maxDataPoints)
      }

      return {
        ...prevState,
        data: newData,
        lastUpdate: Date.now(),
        error: null
      }
    })
  }, [maxDataPoints])

  const connect = useCallback(async () => {
    if (providerRef.current || state.isConnecting) return

    setState(prev => ({ ...prev, isConnecting: true, error: null }))

    try {
      const provider = getMarketDataProvider()
      providerRef.current = provider

      provider.subscribeToMarketData(handleMarketData)

      await provider.connect()

      // Subscribe to requested symbols
      symbols.forEach(symbol => {
        provider.subscribeToSymbol(symbol)
      })

      setState(prev => ({
        ...prev,
        isConnected: true,
        isConnecting: false,
        error: null
      }))

    } catch (error) {
      setState(prev => ({
        ...prev,
        isConnected: false,
        isConnecting: false,
        error: error instanceof Error ? error.message : 'Connection failed'
      }))
    }
  }, [symbols, handleMarketData, state.isConnecting])

  const disconnect = useCallback(() => {
    if (providerRef.current) {
      providerRef.current.unsubscribeFromMarketData(handleMarketData)
      providerRef.current = null
    }

    setState(prev => ({
      ...prev,
      isConnected: false,
      isConnecting: false
    }))
  }, [handleMarketData])

  const subscribeToSymbol = useCallback((symbol: string) => {
    if (providerRef.current) {
      providerRef.current.subscribeToSymbol(symbol)
    }
  }, [])

  const unsubscribeFromSymbol = useCallback((symbol: string) => {
    if (providerRef.current) {
      providerRef.current.unsubscribeFromSymbol(symbol)
    }

    // Remove from local state
    setState(prev => {
      const newData = { ...prev.data }
      delete newData[symbol]
      return { ...prev, data: newData }
    })

    // Remove from history
    delete dataHistoryRef.current[symbol]
  }, [])

  const getDataHistory = useCallback((symbol: string): MarketDataPoint[] => {
    return dataHistoryRef.current[symbol] || []
  }, [])

  useEffect(() => {
    if (autoConnect) {
      connect()
    }

    return () => {
      disconnect()
    }
  }, [autoConnect, connect, disconnect])

  return {
    ...state,
    connect,
    disconnect,
    subscribeToSymbol,
    unsubscribeFromSymbol,
    getDataHistory
  }
}

export interface TradingSignalsState {
  signals: TradingSignal[]
  isConnected: boolean
  lastSignal: TradingSignal | null
}

export function useTradingSignals(maxSignals: number = 50) {
  const [state, setState] = useState<TradingSignalsState>({
    signals: [],
    isConnected: false,
    lastSignal: null
  })

  const providerRef = useRef<MarketDataProvider | null>(null)

  const handleTradingSignal = useCallback((signal: TradingSignal) => {
    setState(prevState => {
      const newSignals = [signal, ...prevState.signals].slice(0, maxSignals)

      return {
        ...prevState,
        signals: newSignals,
        lastSignal: signal
      }
    })
  }, [maxSignals])

  useEffect(() => {
    const provider = getMarketDataProvider()
    providerRef.current = provider

    provider.subscribeToTradingSignals(handleTradingSignal)

    // Connect if not already connected
    provider.connect().then(() => {
      setState(prev => ({ ...prev, isConnected: true }))
    }).catch(error => {
      console.error('Failed to connect to market data provider:', error)
    })

    return () => {
      if (providerRef.current) {
        providerRef.current.unsubscribeFromTradingSignals(handleTradingSignal)
      }
    }
  }, [handleTradingSignal])

  const getSignalsForSymbol = useCallback((symbol: string): TradingSignal[] => {
    return state.signals.filter(signal => signal.symbol === symbol)
  }, [state.signals])

  return {
    ...state,
    getSignalsForSymbol
  }
}

export interface NewsAlertsState {
  alerts: NewsAlert[]
  isConnected: boolean
  lastAlert: NewsAlert | null
  unreadCount: number
}

export function useNewsAlerts(maxAlerts: number = 100) {
  const [state, setState] = useState<NewsAlertsState>({
    alerts: [],
    isConnected: false,
    lastAlert: null,
    unreadCount: 0
  })

  const providerRef = useRef<MarketDataProvider | null>(null)

  const handleNewsAlert = useCallback((alert: NewsAlert) => {
    setState(prevState => {
      const newAlerts = [alert, ...prevState.alerts].slice(0, maxAlerts)

      return {
        ...prevState,
        alerts: newAlerts,
        lastAlert: alert,
        unreadCount: prevState.unreadCount + 1
      }
    })
  }, [maxAlerts])

  const markAsRead = useCallback(() => {
    setState(prev => ({ ...prev, unreadCount: 0 }))
  }, [])

  const getAlertsForSymbol = useCallback((symbol: string): NewsAlert[] => {
    return state.alerts.filter(alert => alert.relatedSymbols.includes(symbol))
  }, [state.alerts])

  const getAlertsBySentiment = useCallback((sentiment: NewsAlert['sentiment']): NewsAlert[] => {
    return state.alerts.filter(alert => alert.sentiment === sentiment)
  }, [state.alerts])

  useEffect(() => {
    const provider = getMarketDataProvider()
    providerRef.current = provider

    provider.subscribeToNewsAlerts(handleNewsAlert)

    // Connect if not already connected
    provider.connect().then(() => {
      setState(prev => ({ ...prev, isConnected: true }))
    }).catch(error => {
      console.error('Failed to connect to market data provider:', error)
    })

    return () => {
      if (providerRef.current) {
        providerRef.current.unsubscribeFromNewsAlerts(handleNewsAlert)
      }
    }
  }, [handleNewsAlert])

  return {
    ...state,
    markAsRead,
    getAlertsForSymbol,
    getAlertsBySentiment
  }
}