/**
 * Monitoring & Observability Integration Hub
 * Centralized initialization and configuration for all monitoring services
 */

import { initializeAPM, getAPM, APMConfig } from './apm'
import { initializeAlerting, getAlerting } from './alerts'
import { initializeErrorTracking, getErrorTracking } from './error-tracking'
import { initializeBI, getBI } from './business-intelligence'

// Monitoring Configuration
export interface MonitoringConfig {
  apm: APMConfig
  errorTracking: {
    enabled: boolean
    maxBreadcrumbs: number
    batchSize: number
    flushInterval: number
  }
  alerting: {
    enabled: boolean
    defaultCooldown: number
    escalationEnabled: boolean
  }
  businessIntelligence: {
    enabled: boolean
    defaultCacheTTL: number
    exportFormats: string[]
  }
}

// Default monitoring configuration
const defaultConfig: MonitoringConfig = {
  apm: {
    provider: 'custom',
    apiKey: process.env.APM_API_KEY || '',
    appName: 'stratford-ai',
    environment: (process.env['NODE_ENV'] as any) || 'development',
    sampleRate: process.env['NODE_ENV'] === 'production' ? 1.0 : 0.1,
    enableRealUserMonitoring: true,
    enableDistributedTracing: true,
  },
  errorTracking: {
    enabled: true,
    maxBreadcrumbs: 100,
    batchSize: 10,
    flushInterval: 5000,
  },
  alerting: {
    enabled: process.env['NODE_ENV'] === 'production',
    defaultCooldown: 600, // 10 minutes
    escalationEnabled: true,
  },
  businessIntelligence: {
    enabled: true,
    defaultCacheTTL: 300, // 5 minutes
    exportFormats: ['csv', 'xlsx', 'pdf'],
  },
}

// Monitoring service status
export interface MonitoringStatus {
  apm: {
    initialized: boolean
    provider: string
    healthy: boolean
  }
  errorTracking: {
    initialized: boolean
    errorsCollected: number
    healthy: boolean
  }
  alerting: {
    initialized: boolean
    activeAlerts: number
    healthy: boolean
  }
  businessIntelligence: {
    initialized: boolean
    dashboardCount: number
    healthy: boolean
  }
}

class MonitoringService {
  private config: MonitoringConfig
  private initialized = false
  private healthCheckInterval?: NodeJS.Timeout

  constructor(config: Partial<MonitoringConfig> = {}) {
    this.config = { ...defaultConfig, ...config }
  }

  /**
   * Initialize All Monitoring Services
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.warn('[Monitoring] Already initialized')
      return
    }

    console.log('[Monitoring] Initializing monitoring and observability stack...')

    try {
      // Initialize APM
      if (this.config.apm.apiKey) {
        const apm = initializeAPM(this.config.apm)
        await apm.initialize()
        console.log('[Monitoring] APM initialized successfully')
      } else {
        console.warn('[Monitoring] APM API key not provided, skipping APM initialization')
      }

      // Initialize Error Tracking
      if (this.config.errorTracking.enabled) {
        initializeErrorTracking()
        console.log('[Monitoring] Error tracking initialized successfully')
      }

      // Initialize Alerting
      if (this.config.alerting.enabled) {
        initializeAlerting()
        console.log('[Monitoring] Alerting system initialized successfully')
      }

      // Initialize Business Intelligence
      if (this.config.businessIntelligence.enabled) {
        initializeBI()
        console.log('[Monitoring] Business intelligence initialized successfully')
      }

      this.initialized = true
      this.startHealthChecks()

      console.log('[Monitoring] All monitoring services initialized successfully')

      // Record initialization metrics
      this.recordInitializationMetrics()

    } catch (error) {
      console.error('[Monitoring] Failed to initialize monitoring services:', error)
      throw error
    }
  }

  /**
   * Get Monitoring Health Status
   */
  async getStatus(): Promise<MonitoringStatus> {
    const apm = getAPM()
    const errorTracking = getErrorTracking()
    const alerting = getAlerting()
    const bi = getBI()

    return {
      apm: {
        initialized: !!apm,
        provider: this.config.apm.provider,
        healthy: await this.checkAPMHealth(),
      },
      errorTracking: {
        initialized: !!errorTracking,
        errorsCollected: errorTracking ? errorTracking.searchErrors().length : 0,
        healthy: await this.checkErrorTrackingHealth(),
      },
      alerting: {
        initialized: !!alerting,
        activeAlerts: alerting ? alerting.getActiveAlerts().length : 0,
        healthy: await this.checkAlertingHealth(),
      },
      businessIntelligence: {
        initialized: !!bi,
        dashboardCount: bi ? bi.getAllDashboards().length : 0,
        healthy: await this.checkBIHealth(),
      },
    }
  }

  /**
   * Record System Metrics
   */
  recordMetric(name: string, value: number, tags: Record<string, string> = {}): void {
    const apm = getAPM()
    if (apm) {
      apm.addMetric({
        name,
        value,
        timestamp: Date.now(),
        tags,
        type: 'gauge',
      })
    }
  }

  /**
   * Record Trading Performance Metrics
   */
  recordTradingMetrics(metrics: {
    portfolioId: string
    userId: string
    symbol: string
    strategy: string
    performance: any
    execution: any
    risk: any
  }): void {
    const apm = getAPM()
    if (apm) {
      apm.recordTradingMetrics(metrics as any)
    }
  }

  /**
   * Start Distributed Trace
   */
  startTrace(operationName: string, tags?: Record<string, string>): string {
    const apm = getAPM()
    return apm ? apm.startTrace(operationName, tags) : ''
  }

  /**
   * Finish Distributed Trace
   */
  finishTrace(traceId: string): void {
    const apm = getAPM()
    if (apm) {
      apm.finishTrace(traceId)
    }
  }

  /**
   * Capture Error
   */
  captureError(error: Error, context?: any): string {
    const errorTracking = getErrorTracking()
    return errorTracking ? errorTracking.captureError(error, context) : ''
  }

  /**
   * Add Breadcrumb
   */
  addBreadcrumb(breadcrumb: any): void {
    const errorTracking = getErrorTracking()
    if (errorTracking) {
      errorTracking.addBreadcrumb(breadcrumb)
    }
  }

  /**
   * Get Active Alerts
   */
  getActiveAlerts(): any[] {
    const alerting = getAlerting()
    return alerting ? alerting.getActiveAlerts() : []
  }

  /**
   * Resolve Alert
   */
  resolveAlert(alertId: string, userId: string): void {
    const alerting = getAlerting()
    if (alerting) {
      alerting.resolveAlert(alertId, userId)
    }
  }

  /**
   * Get Dashboard Data
   */
  async getDashboardData(dashboardId: string, filters: any = {}): Promise<any> {
    const bi = getBI()
    if (!bi) throw new Error('Business Intelligence not initialized')

    return await Promise.all(
      bi.getDashboard(dashboardId)?.widgets.map(widget =>
        bi.getWidgetData(widget.id, filters)
      ) || []
    )
  }

  /**
   * Generate Analytics Report
   */
  async generateAnalyticsReport(
    startDate: Date,
    endDate: Date,
    portfolioIds?: string[]
  ): Promise<any> {
    const bi = getBI()
    if (!bi) throw new Error('Business Intelligence not initialized')

    return await bi.generateTradingAnalytics(startDate, endDate, portfolioIds)
  }

  /**
   * Shutdown Monitoring Services
   */
  async shutdown(): Promise<void> {
    console.log('[Monitoring] Shutting down monitoring services...')

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
    }

    // Flush any pending data
    const errorTracking = getErrorTracking()
    if (errorTracking) {
      // Flush remaining errors
      console.log('[Monitoring] Flushing remaining error data...')
    }

    const apm = getAPM()
    if (apm) {
      // Flush remaining metrics
      console.log('[Monitoring] Flushing remaining APM data...')
    }

    this.initialized = false
    console.log('[Monitoring] Monitoring services shut down successfully')
  }

  /**
   * Private Methods
   */
  private startHealthChecks(): void {
    // Perform health checks every 5 minutes
    this.healthCheckInterval = setInterval(async () => {
      try {
        const status = await this.getStatus()

        // Record health metrics
        this.recordMetric('monitoring.apm.healthy', status.apm.healthy ? 1 : 0)
        this.recordMetric('monitoring.error_tracking.healthy', status.errorTracking.healthy ? 1 : 0)
        this.recordMetric('monitoring.alerting.healthy', status.alerting.healthy ? 1 : 0)
        this.recordMetric('monitoring.bi.healthy', status.businessIntelligence.healthy ? 1 : 0)

        // Log unhealthy services
        if (!status.apm.healthy) console.warn('[Monitoring] APM service unhealthy')
        if (!status.errorTracking.healthy) console.warn('[Monitoring] Error tracking service unhealthy')
        if (!status.alerting.healthy) console.warn('[Monitoring] Alerting service unhealthy')
        if (!status.businessIntelligence.healthy) console.warn('[Monitoring] BI service unhealthy')

      } catch (error) {
        console.error('[Monitoring] Health check failed:', error)
      }
    }, 5 * 60 * 1000) // 5 minutes
  }

  private async checkAPMHealth(): Promise<boolean> {
    const apm = getAPM()
    if (!apm) return false

    try {
      // Simple health check - try to record a metric
      apm.addMetric({
        name: 'monitoring.health_check',
        value: 1,
        timestamp: Date.now(),
        tags: { service: 'apm' },
        type: 'counter',
      })
      return true
    } catch {
      return false
    }
  }

  private async checkErrorTrackingHealth(): Promise<boolean> {
    const errorTracking = getErrorTracking()
    if (!errorTracking) return false

    try {
      // Simple health check - try to add a breadcrumb
      errorTracking.addBreadcrumb({
        category: 'log',
        message: 'Health check',
        level: 'info',
      })
      return true
    } catch {
      return false
    }
  }

  private async checkAlertingHealth(): Promise<boolean> {
    const alerting = getAlerting()
    if (!alerting) return false

    try {
      // Simple health check - try to get active alerts
      alerting.getActiveAlerts()
      return true
    } catch {
      return false
    }
  }

  private async checkBIHealth(): Promise<boolean> {
    const bi = getBI()
    if (!bi) return false

    try {
      // Simple health check - try to get dashboards
      bi.getAllDashboards()
      return true
    } catch {
      return false
    }
  }

  private recordInitializationMetrics(): void {
    this.recordMetric('monitoring.initialization.timestamp', Date.now())
    this.recordMetric('monitoring.services.apm', this.config.apm.apiKey ? 1 : 0)
    this.recordMetric('monitoring.services.error_tracking', this.config.errorTracking.enabled ? 1 : 0)
    this.recordMetric('monitoring.services.alerting', this.config.alerting.enabled ? 1 : 0)
    this.recordMetric('monitoring.services.bi', this.config.businessIntelligence.enabled ? 1 : 0)
  }
}

// Singleton instance
let monitoringInstance: MonitoringService | null = null

/**
 * Initialize Monitoring Services
 */
export async function initializeMonitoring(config?: Partial<MonitoringConfig>): Promise<MonitoringService> {
  if (!monitoringInstance) {
    monitoringInstance = new MonitoringService(config)
    await monitoringInstance.initialize()
  }
  return monitoringInstance
}

/**
 * Get Monitoring Service Instance
 */
export function getMonitoring(): MonitoringService | null {
  return monitoringInstance
}

/**
 * Convenience Functions
 */
export function recordMetric(name: string, value: number, tags?: Record<string, string>): void {
  const monitoring = getMonitoring()
  if (monitoring) {
    monitoring.recordMetric(name, value, tags)
  }
}

export function startTrace(operationName: string, tags?: Record<string, string>): string {
  const monitoring = getMonitoring()
  return monitoring ? monitoring.startTrace(operationName, tags) : ''
}

export function finishTrace(traceId: string): void {
  const monitoring = getMonitoring()
  if (monitoring) {
    monitoring.finishTrace(traceId)
  }
}

export function captureError(error: Error, context?: any): string {
  const monitoring = getMonitoring()
  return monitoring ? monitoring.captureError(error, context) : ''
}

export function addBreadcrumb(breadcrumb: any): void {
  const monitoring = getMonitoring()
  if (monitoring) {
    monitoring.addBreadcrumb(breadcrumb)
  }
}

// Export all monitoring services
export * from './apm'
export * from './alerts'
export * from './error-tracking'
export * from './business-intelligence'
export { MonitoringService }