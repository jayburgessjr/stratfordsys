/**
 * Error Tracking and Monitoring System
 * Advanced error capture, analysis, and reporting for production environments
 */

import { getAPM } from './apm'

// Error Classification
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical'
export type ErrorCategory =
  | 'trading_error'
  | 'data_error'
  | 'system_error'
  | 'user_error'
  | 'api_error'
  | 'database_error'
  | 'network_error'
  | 'validation_error'
  | 'authentication_error'
  | 'authorization_error'

// Error Context
export interface ErrorContext {
  userId?: string
  sessionId?: string
  requestId?: string
  userAgent?: string
  url?: string
  timestamp: Date
  environment: 'development' | 'staging' | 'production'
  buildVersion?: string
  feature?: string
  component?: string
  action?: string
  metadata?: Record<string, any>
}

// Structured Error
export interface StructuredError {
  id: string
  type: string
  message: string
  stack?: string
  severity: ErrorSeverity
  category: ErrorCategory
  context: ErrorContext
  fingerprint: string
  tags: string[]
  occurrenceCount: number
  firstSeen: Date
  lastSeen: Date
  resolved: boolean
  resolvedBy?: string
  resolvedAt?: Date
  assignedTo?: string
  breadcrumbs?: Breadcrumb[]
  affectedUsers?: string[]
  relatedErrors?: string[]
}

// Breadcrumb for error context
export interface Breadcrumb {
  timestamp: Date
  category: 'navigation' | 'user_action' | 'api_call' | 'state_change' | 'log'
  message: string
  level: 'info' | 'warning' | 'error'
  data?: Record<string, any>
}

// Error Filter
export interface ErrorFilter {
  severity?: ErrorSeverity[]
  category?: ErrorCategory[]
  timeRange?: [Date, Date]
  resolved?: boolean
  tags?: string[]
  component?: string
  userId?: string
}

// Error Statistics
export interface ErrorStats {
  totalErrors: number
  newErrors: number
  resolvedErrors: number
  errorsByCategory: Record<ErrorCategory, number>
  errorsBySeverity: Record<ErrorSeverity, number>
  topErrors: StructuredError[]
  errorTrends: ErrorTrendData[]
  affectedUsers: number
  errorRate: number
}

export interface ErrorTrendData {
  timestamp: Date
  count: number
  category: ErrorCategory
  severity: ErrorSeverity
}

class ErrorTrackingService {
  private errors: Map<string, StructuredError> = new Map()
  private breadcrumbs: Breadcrumb[] = []
  private maxBreadcrumbs = 100
  private errorQueue: StructuredError[] = []
  private batchSize = 10
  private flushInterval = 5000 // 5 seconds

  constructor() {
    this.setupErrorCapture()
    this.startBatchProcessing()
  }

  /**
   * Setup Global Error Capture
   */
  private setupErrorCapture(): void {
    if (typeof window !== 'undefined') {
      // Browser environment
      this.setupBrowserErrorCapture()
    } else {
      // Node.js environment
      this.setupNodeErrorCapture()
    }
  }

  /**
   * Browser Error Capture
   */
  private setupBrowserErrorCapture(): void {
    // Capture JavaScript errors
    window.addEventListener('error', (event) => {
      this.captureError(event.error || new Error(event.message), {
        component: 'global',
        action: 'script_error',
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        }
      })
    })

    // Capture unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError(
        new Error(event.reason || 'Unhandled Promise Rejection'),
        {
          component: 'global',
          action: 'promise_rejection',
          metadata: {
            reason: event.reason,
          }
        }
      )
    })

    // Capture fetch errors
    this.interceptFetch()

    // Capture console errors
    this.interceptConsole()

    // Capture React errors (if using React)
    this.setupReactErrorBoundary()
  }

  /**
   * Node.js Error Capture
   */
  private setupNodeErrorCapture(): void {
    // Capture uncaught exceptions
    process.on('uncaughtException', (error) => {
      this.captureError(error, {
        component: 'node',
        action: 'uncaught_exception',
        metadata: {
          pid: process.pid,
        }
      })
    })

    // Capture unhandled rejections
    process.on('unhandledRejection', (reason, promise) => {
      this.captureError(
        new Error(reason instanceof Error ? reason.message : String(reason)),
        {
          component: 'node',
          action: 'unhandled_rejection',
          metadata: {
            reason: String(reason),
            promise: String(promise),
          }
        }
      )
    })
  }

  /**
   * Capture Error with Context
   */
  captureError(
    error: Error,
    context: Partial<ErrorContext> = {},
    options: {
      severity?: ErrorSeverity
      category?: ErrorCategory
      tags?: string[]
      fingerprint?: string
    } = {}
  ): string {
    const errorId = this.generateErrorId()
    const timestamp = new Date()

    // Determine error category and severity
    const category = options.category || this.categorizeError(error)
    const severity = options.severity || this.determineSeverity(error, category)

    // Generate fingerprint for grouping similar errors
    const fingerprint = options.fingerprint || this.generateFingerprint(error)

    // Create full context
    const fullContext: ErrorContext = {
      timestamp,
      environment: (process.env['NODE_ENV'] as any) || 'development',
      buildVersion: process.env.BUILD_VERSION,
      ...this.getDefaultContext(),
      ...context,
    }

    // Check if this error already exists
    const existingError = Array.from(this.errors.values())
      .find(e => e.fingerprint === fingerprint)

    if (existingError) {
      // Update existing error
      existingError.occurrenceCount++
      existingError.lastSeen = timestamp
      existingError.context = fullContext

      // Add user to affected users if not already included
      if (fullContext.userId && !existingError.affectedUsers?.includes(fullContext.userId)) {
        existingError.affectedUsers = existingError.affectedUsers || []
        existingError.affectedUsers.push(fullContext.userId)
      }

      this.queueError(existingError)
      return existingError.id
    }

    // Create new structured error
    const structuredError: StructuredError = {
      id: errorId,
      type: error.constructor.name,
      message: error.message,
      stack: error.stack,
      severity,
      category,
      context: fullContext,
      fingerprint,
      tags: options.tags || this.generateTags(error, category),
      occurrenceCount: 1,
      firstSeen: timestamp,
      lastSeen: timestamp,
      resolved: false,
      breadcrumbs: this.getRecentBreadcrumbs(),
      affectedUsers: fullContext.userId ? [fullContext.userId] : [],
      relatedErrors: [],
    }

    // Store error
    this.errors.set(errorId, structuredError)
    this.queueError(structuredError)

    // Send to APM if available
    const apm = getAPM()
    if (apm) {
      apm.recordError(error, fullContext)
    }

    console.error(`[ErrorTracking] Captured error ${errorId}:`, error.message)
    return errorId
  }

  /**
   * Add Breadcrumb
   */
  addBreadcrumb(breadcrumb: Omit<Breadcrumb, 'timestamp'>): void {
    const fullBreadcrumb: Breadcrumb = {
      ...breadcrumb,
      timestamp: new Date(),
    }

    this.breadcrumbs.push(fullBreadcrumb)

    // Keep only recent breadcrumbs
    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs = this.breadcrumbs.slice(-this.maxBreadcrumbs)
    }
  }

  /**
   * Get Error by ID
   */
  getError(errorId: string): StructuredError | null {
    return this.errors.get(errorId) || null
  }

  /**
   * Search Errors
   */
  searchErrors(filter: ErrorFilter = {}, limit: number = 50, offset: number = 0): StructuredError[] {
    let filteredErrors = Array.from(this.errors.values())

    // Apply filters
    if (filter.severity) {
      filteredErrors = filteredErrors.filter(e => filter.severity!.includes(e.severity))
    }

    if (filter.category) {
      filteredErrors = filteredErrors.filter(e => filter.category!.includes(e.category))
    }

    if (filter.timeRange) {
      const [start, end] = filter.timeRange
      filteredErrors = filteredErrors.filter(e =>
        e.lastSeen >= start && e.lastSeen <= end
      )
    }

    if (filter.resolved !== undefined) {
      filteredErrors = filteredErrors.filter(e => e.resolved === filter.resolved)
    }

    if (filter.tags) {
      filteredErrors = filteredErrors.filter(e =>
        filter.tags!.some(tag => e.tags.includes(tag))
      )
    }

    if (filter.component) {
      filteredErrors = filteredErrors.filter(e => e.context.component === filter.component)
    }

    if (filter.userId) {
      filteredErrors = filteredErrors.filter(e =>
        e.affectedUsers?.includes(filter.userId!)
      )
    }

    // Sort by last seen (most recent first)
    filteredErrors.sort((a, b) => b.lastSeen.getTime() - a.lastSeen.getTime())

    // Apply pagination
    return filteredErrors.slice(offset, offset + limit)
  }

  /**
   * Get Error Statistics
   */
  getErrorStats(timeRange?: [Date, Date]): ErrorStats {
    let errors = Array.from(this.errors.values())

    if (timeRange) {
      const [start, end] = timeRange
      errors = errors.filter(e => e.lastSeen >= start && e.lastSeen <= end)
    }

    const totalErrors = errors.length
    const newErrors = errors.filter(e =>
      e.firstSeen >= new Date(Date.now() - 24 * 60 * 60 * 1000)
    ).length
    const resolvedErrors = errors.filter(e => e.resolved).length

    // Group by category
    const errorsByCategory = errors.reduce((acc, error) => {
      acc[error.category] = (acc[error.category] || 0) + 1
      return acc
    }, {} as Record<ErrorCategory, number>)

    // Group by severity
    const errorsBySeverity = errors.reduce((acc, error) => {
      acc[error.severity] = (acc[error.severity] || 0) + 1
      return acc
    }, {} as Record<ErrorSeverity, number>)

    // Top errors by occurrence
    const topErrors = errors
      .sort((a, b) => b.occurrenceCount - a.occurrenceCount)
      .slice(0, 10)

    // Error trends (last 7 days)
    const errorTrends = this.calculateErrorTrends(errors, 7)

    // Affected users
    const affectedUsers = new Set(
      errors.flatMap(e => e.affectedUsers || [])
    ).size

    // Error rate (errors per hour in last 24h)
    const last24h = errors.filter(e =>
      e.lastSeen >= new Date(Date.now() - 24 * 60 * 60 * 1000)
    )
    const errorRate = last24h.length / 24

    return {
      totalErrors,
      newErrors,
      resolvedErrors,
      errorsByCategory,
      errorsBySeverity,
      topErrors,
      errorTrends,
      affectedUsers,
      errorRate,
    }
  }

  /**
   * Resolve Error
   */
  resolveError(errorId: string, resolvedBy: string): void {
    const error = this.errors.get(errorId)
    if (!error) throw new Error(`Error ${errorId} not found`)

    error.resolved = true
    error.resolvedBy = resolvedBy
    error.resolvedAt = new Date()

    console.log(`[ErrorTracking] Error ${errorId} resolved by ${resolvedBy}`)
  }

  /**
   * Assign Error
   */
  assignError(errorId: string, assignedTo: string): void {
    const error = this.errors.get(errorId)
    if (!error) throw new Error(`Error ${errorId} not found`)

    error.assignedTo = assignedTo
    console.log(`[ErrorTracking] Error ${errorId} assigned to ${assignedTo}`)
  }

  /**
   * Helper Methods
   */
  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateFingerprint(error: Error): string {
    // Create a unique fingerprint for grouping similar errors
    const stackTrace = error.stack || ''
    const firstStackLine = stackTrace.split('\n')[1] || ''
    return `${error.constructor.name}:${error.message}:${firstStackLine}`.toLowerCase()
  }

  private categorizeError(error: Error): ErrorCategory {
    const message = error.message.toLowerCase()
    const stack = error.stack?.toLowerCase() || ''

    if (message.includes('trading') || message.includes('order') || message.includes('portfolio')) {
      return 'trading_error'
    }
    if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
      return 'network_error'
    }
    if (message.includes('database') || message.includes('sql') || message.includes('connection')) {
      return 'database_error'
    }
    if (message.includes('auth') || message.includes('token') || message.includes('login')) {
      return 'authentication_error'
    }
    if (message.includes('permission') || message.includes('unauthorized')) {
      return 'authorization_error'
    }
    if (message.includes('validation') || message.includes('invalid')) {
      return 'validation_error'
    }
    if (message.includes('api') || message.includes('endpoint')) {
      return 'api_error'
    }
    if (stack.includes('user') || message.includes('user')) {
      return 'user_error'
    }

    return 'system_error'
  }

  private determineSeverity(error: Error, category: ErrorCategory): ErrorSeverity {
    const message = error.message.toLowerCase()

    // Critical errors
    if (
      category === 'trading_error' ||
      category === 'database_error' ||
      message.includes('critical') ||
      message.includes('fatal')
    ) {
      return 'critical'
    }

    // High severity errors
    if (
      category === 'authentication_error' ||
      category === 'authorization_error' ||
      category === 'api_error' ||
      message.includes('security')
    ) {
      return 'high'
    }

    // Medium severity errors
    if (
      category === 'network_error' ||
      category === 'data_error' ||
      category === 'validation_error'
    ) {
      return 'medium'
    }

    // Default to low severity
    return 'low'
  }

  private generateTags(error: Error, category: ErrorCategory): string[] {
    const tags = [category]

    const message = error.message.toLowerCase()

    if (message.includes('timeout')) tags.push('timeout')
    if (message.includes('network')) tags.push('network')
    if (message.includes('database')) tags.push('database')
    if (message.includes('trading')) tags.push('trading')
    if (message.includes('api')) tags.push('api')

    return tags
  }

  private getDefaultContext(): Partial<ErrorContext> {
    if (typeof window !== 'undefined') {
      return {
        userAgent: navigator.userAgent,
        url: window.location.href,
        sessionId: this.getSessionId(),
      }
    } else {
      return {
        userAgent: 'Node.js',
        sessionId: process.pid.toString(),
      }
    }
  }

  private getSessionId(): string {
    // Generate or retrieve session ID
    return 'session_' + Math.random().toString(36).substr(2, 9)
  }

  private getRecentBreadcrumbs(): Breadcrumb[] {
    return this.breadcrumbs.slice(-20) // Last 20 breadcrumbs
  }

  private queueError(error: StructuredError): void {
    this.errorQueue.push(error)

    if (this.errorQueue.length >= this.batchSize) {
      this.flushErrors()
    }
  }

  private startBatchProcessing(): void {
    setInterval(() => {
      if (this.errorQueue.length > 0) {
        this.flushErrors()
      }
    }, this.flushInterval)
  }

  private async flushErrors(): void {
    if (this.errorQueue.length === 0) return

    const errors = [...this.errorQueue]
    this.errorQueue = []

    try {
      // Send errors to external service (Sentry, custom API, etc.)
      await this.sendErrorsToExternalService(errors)
    } catch (error) {
      console.error('[ErrorTracking] Failed to send errors to external service:', error)
      // Re-queue errors for retry
      this.errorQueue.unshift(...errors)
    }
  }

  private async sendErrorsToExternalService(errors: StructuredError[]): Promise<void> {
    // Implementation would send to Sentry, LogRocket, or custom error tracking service
    console.log(`[ErrorTracking] Sending ${errors.length} errors to external service`)
  }

  private calculateErrorTrends(errors: StructuredError[], days: number): ErrorTrendData[] {
    const trends: ErrorTrendData[] = []
    const now = new Date()

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)

      const dayErrors = errors.filter(e => e.lastSeen >= dayStart && e.lastSeen < dayEnd)

      // Group by category and severity
      const categoryGroups = dayErrors.reduce((acc, error) => {
        const key = `${error.category}:${error.severity}`
        acc[key] = (acc[key] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      Object.entries(categoryGroups).forEach(([key, count]) => {
        const [category, severity] = key.split(':')
        trends.push({
          timestamp: dayStart,
          count,
          category: category as ErrorCategory,
          severity: severity as ErrorSeverity,
        })
      })
    }

    return trends
  }

  private interceptFetch(): void {
    if (typeof window === 'undefined') return

    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args)

        if (!response.ok) {
          this.captureError(
            new Error(`HTTP ${response.status}: ${response.statusText}`),
            {
              component: 'fetch',
              action: 'http_error',
              metadata: {
                url: typeof args[0] === 'string' ? args[0] : args[0].url,
                status: response.status,
                statusText: response.statusText,
              }
            }
          )
        }

        return response
      } catch (error) {
        this.captureError(error as Error, {
          component: 'fetch',
          action: 'network_error',
          metadata: {
            url: typeof args[0] === 'string' ? args[0] : args[0].url,
          }
        })
        throw error
      }
    }
  }

  private interceptConsole(): void {
    if (typeof window === 'undefined') return

    const originalError = console.error
    console.error = (...args) => {
      // Capture console.error calls as breadcrumbs
      this.addBreadcrumb({
        category: 'log',
        message: args.join(' '),
        level: 'error',
        data: { args }
      })

      originalError.apply(console, args)
    }
  }

  private setupReactErrorBoundary(): void {
    // This would be implemented as a React Error Boundary component
    // that calls this.captureError when React errors occur
  }
}

// Singleton instance
let errorTrackingInstance: ErrorTrackingService | null = null

export function initializeErrorTracking(): ErrorTrackingService {
  if (!errorTrackingInstance) {
    errorTrackingInstance = new ErrorTrackingService()
  }
  return errorTrackingInstance
}

export function getErrorTracking(): ErrorTrackingService | null {
  return errorTrackingInstance
}

// Convenience function for capturing errors
export function captureError(
  error: Error,
  context?: Partial<ErrorContext>,
  options?: {
    severity?: ErrorSeverity
    category?: ErrorCategory
    tags?: string[]
  }
): string {
  const service = getErrorTracking()
  if (!service) {
    console.error('Error tracking not initialized')
    return ''
  }
  return service.captureError(error, context, options)
}

// Convenience function for adding breadcrumbs
export function addBreadcrumb(breadcrumb: Omit<Breadcrumb, 'timestamp'>): void {
  const service = getErrorTracking()
  if (service) {
    service.addBreadcrumb(breadcrumb)
  }
}

export { ErrorTrackingService }