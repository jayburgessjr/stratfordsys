/**
 * APM (Application Performance Monitoring) Integration
 * Production-grade monitoring for Stratford AI Wealth Engine
 * Supports DataDog, New Relic, and custom metrics collection
 */

import { performance } from 'perf_hooks'

// APM Configuration
export interface APMConfig {
  provider: 'datadog' | 'newrelic' | 'custom'
  apiKey: string
  appName: string
  environment: 'development' | 'staging' | 'production'
  sampleRate: number
  enableRealUserMonitoring: boolean
  enableDistributedTracing: boolean
}

// Performance Metrics Interface
export interface PerformanceMetric {
  name: string
  value: number
  timestamp: number
  tags: Record<string, string>
  type: 'counter' | 'gauge' | 'histogram' | 'timing'
  unit?: string
}

// Trading Performance Metrics
export interface TradingMetrics {
  portfolioId: string
  userId: string
  symbol: string
  strategy: string
  performance: {
    totalReturn: number
    sharpeRatio: number
    maxDrawdown: number
    winRate: number
    avgHoldingPeriod: number
    volatility: number
  }
  execution: {
    latency: number
    slippage: number
    fillRate: number
    orderRejectRate: number
  }
  risk: {
    var95: number // Value at Risk 95%
    beta: number
    correlation: number
    leverage: number
  }
}

class APMService {
  private config: APMConfig
  private metrics: PerformanceMetric[] = []
  private traces: Map<string, any> = new Map()
  private isInitialized = false

  constructor(config: APMConfig) {
    this.config = config
  }

  /**
   * Initialize APM service based on provider
   */
  async initialize(): Promise<void> {
    try {
      switch (this.config.provider) {
        case 'datadog':
          await this.initializeDataDog()
          break
        case 'newrelic':
          await this.initializeNewRelic()
          break
        case 'custom':
          await this.initializeCustomAPM()
          break
      }

      this.isInitialized = true
      this.startMetricsCollection()

      console.log(`[APM] ${this.config.provider} initialized successfully`)
    } catch (error) {
      console.error('[APM] Initialization failed:', error)
      throw error
    }
  }

  /**
   * DataDog APM Integration
   */
  private async initializeDataDog(): Promise<void> {
    if (typeof window !== 'undefined') {
      // Browser-side DataDog RUM
      const { datadogRum } = await import('@datadog/browser-rum')

      datadogRum.init({
        applicationId: process.env.NEXT_PUBLIC_DD_APPLICATION_ID!,
        clientToken: process.env.NEXT_PUBLIC_DD_CLIENT_TOKEN!,
        site: 'datadoghq.com',
        service: this.config.appName,
        env: this.config.environment,
        version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
        sessionSampleRate: this.config.sampleRate,
        sessionReplaySampleRate: 20,
        trackUserInteractions: true,
        trackResources: true,
        trackLongTasks: true,
        defaultPrivacyLevel: 'mask-user-input',
      })

      datadogRum.startSessionReplayRecording()
    } else {
      // Server-side DataDog APM
      const tracer = await import('dd-trace')
      tracer.init({
        service: this.config.appName,
        env: this.config.environment,
        version: process.env.APP_VERSION || '1.0.0',
        logInjection: true,
        runtimeMetrics: true,
        profiling: true,
      })
    }
  }

  /**
   * New Relic APM Integration
   */
  private async initializeNewRelic(): Promise<void> {
    if (typeof window !== 'undefined') {
      // Browser-side New Relic
      const script = document.createElement('script')
      script.src = 'https://js-agent.newrelic.com/nr-loader-spa-current.min.js'
      script.onload = () => {
        window.NREUM.loader_config = {
          accountID: process.env.NEXT_PUBLIC_NR_ACCOUNT_ID,
          trustKey: process.env.NEXT_PUBLIC_NR_TRUST_KEY,
          agentID: process.env.NEXT_PUBLIC_NR_AGENT_ID,
          licenseKey: process.env.NEXT_PUBLIC_NR_LICENSE_KEY,
          applicationID: process.env.NEXT_PUBLIC_NR_APPLICATION_ID,
        }
        window.NREUM.loader('spa')
      }
      document.head.appendChild(script)
    } else {
      // Server-side New Relic
      require('newrelic')
    }
  }

  /**
   * Custom APM Implementation
   */
  private async initializeCustomAPM(): Promise<void> {
    // Custom metrics collection for self-hosted monitoring
    this.setupCustomMetricsCollection()
    this.setupPerformanceObserver()
    this.setupErrorTracking()
  }

  /**
   * Start Trading Performance Metrics Collection
   */
  private startMetricsCollection(): void {
    // Collect system metrics every 30 seconds
    setInterval(() => {
      this.collectSystemMetrics()
    }, 30000)

    // Collect trading metrics every 60 seconds
    setInterval(() => {
      this.collectTradingMetrics()
    }, 60000)

    // Collect API performance metrics continuously
    this.setupAPIMonitoring()
  }

  /**
   * Record Trading Performance Metrics
   */
  recordTradingMetrics(metrics: TradingMetrics): void {
    const timestamp = Date.now()

    // Performance metrics
    this.addMetric({
      name: 'trading.performance.total_return',
      value: metrics.performance.totalReturn,
      timestamp,
      tags: {
        portfolio: metrics.portfolioId,
        user: metrics.userId,
        symbol: metrics.symbol,
        strategy: metrics.strategy,
      },
      type: 'gauge',
      unit: 'percent',
    })

    this.addMetric({
      name: 'trading.performance.sharpe_ratio',
      value: metrics.performance.sharpeRatio,
      timestamp,
      tags: {
        portfolio: metrics.portfolioId,
        strategy: metrics.strategy,
      },
      type: 'gauge',
    })

    this.addMetric({
      name: 'trading.performance.max_drawdown',
      value: metrics.performance.maxDrawdown,
      timestamp,
      tags: {
        portfolio: metrics.portfolioId,
        strategy: metrics.strategy,
      },
      type: 'gauge',
      unit: 'percent',
    })

    // Execution metrics
    this.addMetric({
      name: 'trading.execution.latency',
      value: metrics.execution.latency,
      timestamp,
      tags: {
        symbol: metrics.symbol,
        strategy: metrics.strategy,
      },
      type: 'histogram',
      unit: 'milliseconds',
    })

    this.addMetric({
      name: 'trading.execution.slippage',
      value: metrics.execution.slippage,
      timestamp,
      tags: {
        symbol: metrics.symbol,
      },
      type: 'histogram',
      unit: 'basis_points',
    })

    // Risk metrics
    this.addMetric({
      name: 'trading.risk.var_95',
      value: metrics.risk.var95,
      timestamp,
      tags: {
        portfolio: metrics.portfolioId,
      },
      type: 'gauge',
      unit: 'percent',
    })
  }

  /**
   * Start Distributed Trace
   */
  startTrace(operationName: string, tags?: Record<string, string>): string {
    const traceId = `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const trace = {
      traceId,
      operationName,
      startTime: performance.now(),
      tags: tags || {},
      spans: [],
    }

    this.traces.set(traceId, trace)
    return traceId
  }

  /**
   * Add Span to Trace
   */
  addSpan(traceId: string, spanName: string, tags?: Record<string, string>): string {
    const trace = this.traces.get(traceId)
    if (!trace) return ''

    const spanId = `span_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
    const span = {
      spanId,
      name: spanName,
      startTime: performance.now(),
      tags: tags || {},
    }

    trace.spans.push(span)
    return spanId
  }

  /**
   * Finish Trace
   */
  finishTrace(traceId: string): void {
    const trace = this.traces.get(traceId)
    if (!trace) return

    trace.endTime = performance.now()
    trace.duration = trace.endTime - trace.startTime

    // Send trace to APM provider
    this.sendTrace(trace)
    this.traces.delete(traceId)
  }

  /**
   * Record Custom Metric
   */
  addMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric)

    // Send to APM provider immediately for critical metrics
    if (this.isCriticalMetric(metric)) {
      this.sendMetrics([metric])
    }

    // Batch send metrics every 10 seconds
    if (this.metrics.length >= 100) {
      this.flushMetrics()
    }
  }

  /**
   * Record Error with Context
   */
  recordError(error: Error, context?: Record<string, any>): void {
    const errorData = {
      message: error.message,
      stack: error.stack,
      timestamp: Date.now(),
      context: context || {},
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'server',
      url: typeof window !== 'undefined' ? window.location.href : 'server',
    }

    // Send to error tracking service
    this.sendError(errorData)

    // Record error metric
    this.addMetric({
      name: 'errors.count',
      value: 1,
      timestamp: Date.now(),
      tags: {
        error_type: error.constructor.name,
        ...context,
      },
      type: 'counter',
    })
  }

  /**
   * System Metrics Collection
   */
  private collectSystemMetrics(): void {
    if (typeof window !== 'undefined') {
      // Browser metrics
      const navigation = (performance as any).getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

      if (navigation) {
        this.addMetric({
          name: 'browser.load_time',
          value: navigation.loadEventEnd - navigation.fetchStart,
          timestamp: Date.now(),
          tags: { page: window.location.pathname },
          type: 'timing',
          unit: 'milliseconds',
        })

        this.addMetric({
          name: 'browser.dom_ready',
          value: navigation.domContentLoadedEventEnd - navigation.fetchStart,
          timestamp: Date.now(),
          tags: { page: window.location.pathname },
          type: 'timing',
          unit: 'milliseconds',
        })
      }

      // Memory usage
      if ('memory' in performance) {
        const memory = (performance as any).memory
        this.addMetric({
          name: 'browser.memory.used',
          value: memory.usedJSHeapSize,
          timestamp: Date.now(),
          tags: {},
          type: 'gauge',
          unit: 'bytes',
        })
      }
    } else {
      // Server metrics
      const memUsage = process.memoryUsage()

      this.addMetric({
        name: 'server.memory.heap_used',
        value: memUsage.heapUsed,
        timestamp: Date.now(),
        tags: {},
        type: 'gauge',
        unit: 'bytes',
      })

      this.addMetric({
        name: 'server.memory.rss',
        value: memUsage.rss,
        timestamp: Date.now(),
        tags: {},
        type: 'gauge',
        unit: 'bytes',
      })
    }
  }

  /**
   * API Performance Monitoring
   */
  private setupAPIMonitoring(): void {
    // Intercept fetch requests
    if (typeof window !== 'undefined') {
      const originalFetch = window.fetch

      window.fetch = async (...args) => {
        const startTime = performance.now()
        let urlString = '';
        if (typeof args[0] === 'string') {
          urlString = args[0];
        } else if (args[0] instanceof URL) {
          urlString = args[0].href;
        } else {
          urlString = args[0].url;
        }
        const url = urlString;

        try {
          const response = await originalFetch(...args)
          const duration = performance.now() - startTime

          this.addMetric({
            name: 'api.request.duration',
            value: duration,
            timestamp: Date.now(),
            tags: {
              method: args[1]?.method || 'GET',
              status: response.status.toString(),
              endpoint: this.normalizeUrl(url),
            },
            type: 'histogram',
            unit: 'milliseconds',
          })

          return response
        } catch (error) {
          const duration = performance.now() - startTime

          this.addMetric({
            name: 'api.request.error',
            value: 1,
            timestamp: Date.now(),
            tags: {
              method: args[1]?.method || 'GET',
              endpoint: this.normalizeUrl(url),
              error: error instanceof Error ? error.message : 'unknown',
            },
            type: 'counter',
          })

          throw error
        }
      }
    }
  }

  /**
   * Performance Observer Setup
   */
  private setupPerformanceObserver(): void {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      // Observe Long Tasks
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.addMetric({
              name: 'browser.long_task.duration',
              value: entry.duration,
              timestamp: Date.now(),
              tags: {},
              type: 'histogram',
              unit: 'milliseconds',
            })
          }
        })
        longTaskObserver.observe({ entryTypes: ['longtask'] })

        // Observe Layout Shifts
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              this.addMetric({
                name: 'browser.cumulative_layout_shift',
                value: (entry as any).value,
                timestamp: Date.now(),
                tags: {},
                type: 'gauge',
              })
            }
          }
        })
        clsObserver.observe({ entryTypes: ['layout-shift'] })
      } catch (error) {
        console.warn('[APM] Performance Observer not fully supported')
      }
    }
  }

  /**
   * Error Tracking Setup
   */
  private setupErrorTracking(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.recordError(event.error, {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        })
      })

      window.addEventListener('unhandledrejection', (event) => {
        this.recordError(new Error(event.reason), {
          type: 'unhandled_promise_rejection',
        })
      })
    }
  }

  /**
   * Helper Methods
   */
  private isCriticalMetric(metric: PerformanceMetric): boolean {
    const criticalMetrics = [
      'trading.execution.latency',
      'api.request.error',
      'errors.count',
      'trading.risk.var_95',
    ]
    return criticalMetrics.includes(metric.name)
  }

  private normalizeUrl(url: string): string {
    try {
      const urlObj = new URL(url, window.location.origin)
      return urlObj.pathname.replace(/\/\d+/g, '/:id')
    } catch {
      return url
    }
  }

  private setupCustomMetricsCollection(): void {
    // Custom metrics collection logic
    console.log('[APM] Custom metrics collection enabled')
  }

  private async collectTradingMetrics(): Promise<void> {
    // Implementation would fetch current trading metrics from database
    console.log('[APM] Collecting trading metrics')
  }

  private async sendTrace(trace: any): Promise<void> {
    // Send trace to APM provider
    console.log('[APM] Sending trace:', trace.operationName)
  }

  private async sendMetrics(metrics: PerformanceMetric[]): Promise<void> {
    // Send metrics to APM provider
    console.log(`[APM] Sending ${metrics.length} metrics`)
  }

  private async sendError(errorData: any): Promise<void> {
    // Send error to tracking service
    console.error('[APM] Error recorded:', errorData.message)
  }

  private flushMetrics(): void {
    if (this.metrics.length > 0) {
      this.sendMetrics([...this.metrics])
      this.metrics = []
    }
  }
}

// Singleton instance
let apmInstance: APMService | null = null

export function initializeAPM(config: APMConfig): APMService {
  if (!apmInstance) {
    apmInstance = new APMService(config)
  }
  return apmInstance
}

export function getAPM(): APMService | null {
  return apmInstance
}

export { APMService }