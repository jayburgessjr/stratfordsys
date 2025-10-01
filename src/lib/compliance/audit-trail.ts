/**
 * Comprehensive Audit Trail System
 * Financial compliance and regulatory audit logging
 */

import { prisma } from '../database/prisma'
import { redisService } from '../database/redis'
import { captureError } from '../monitoring/error-tracking'

export interface AuditEvent {
  id: string
  userId: string
  sessionId: string
  eventType: AuditEventType
  entityType: string
  entityId: string
  action: AuditAction
  details: AuditDetails
  metadata: AuditMetadata
  timestamp: Date
  ipAddress: string
  userAgent: string
  risk: RiskLevel
  compliance: ComplianceInfo
}

export enum AuditEventType {
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  TRADING = 'TRADING',
  PORTFOLIO = 'PORTFOLIO',
  ACCOUNT = 'ACCOUNT',
  SYSTEM = 'SYSTEM',
  COMPLIANCE = 'COMPLIANCE',
  DATA_ACCESS = 'DATA_ACCESS',
  CONFIGURATION = 'CONFIGURATION',
  SECURITY = 'SECURITY',
}

export enum AuditAction {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  EXECUTE = 'EXECUTE',
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  CANCEL = 'CANCEL',
  TRANSFER = 'TRANSFER',
  EXPORT = 'EXPORT',
  IMPORT = 'IMPORT',
}

export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface AuditDetails {
  description: string
  oldValues?: Record<string, any>
  newValues?: Record<string, any>
  amount?: number
  currency?: string
  symbol?: string
  quantity?: number
  price?: number
  orderType?: string
  reason?: string
  approvedBy?: string
  rejectedReason?: string
}

export interface AuditMetadata {
  source: string
  version: string
  correlationId: string
  parentEventId?: string
  duration?: number
  success: boolean
  errorCode?: string
  errorMessage?: string
  geolocation?: {
    country: string
    region: string
    city: string
  }
  deviceInfo?: {
    type: 'web' | 'mobile' | 'api'
    os: string
    browser: string
  }
}

export interface ComplianceInfo {
  regulatoryFramework: string[]
  retentionPeriod: number
  classification: 'public' | 'internal' | 'confidential' | 'restricted'
  dataResidency: string
  encryptionRequired: boolean
  personalData: boolean
  financialData: boolean
}

export interface AuditQuery {
  userId?: string
  eventType?: AuditEventType
  action?: AuditAction
  entityType?: string
  entityId?: string
  risk?: RiskLevel
  startDate?: Date
  endDate?: Date
  ipAddress?: string
  compliance?: {
    framework?: string
    classification?: string
  }
  limit?: number
  offset?: number
  sortBy?: 'timestamp' | 'risk' | 'eventType'
  sortOrder?: 'asc' | 'desc'
}

class AuditTrailService {
  private batchQueue: AuditEvent[] = []
  private batchSize = 100
  private flushInterval = 5000 // 5 seconds
  private compressionEnabled = true

  constructor() {
    this.startBatchProcessing()
  }

  /**
   * Record audit event
   */
  async recordEvent(event: Omit<AuditEvent, 'id' | 'timestamp'>): Promise<string> {
    try {
      const auditEvent: AuditEvent = {
        ...event,
        id: this.generateEventId(),
        timestamp: new Date(),
      }

      // Validate required compliance fields
      this.validateComplianceRequirements(auditEvent)

      // Add to batch queue for performance
      this.batchQueue.push(auditEvent)

      // Immediate processing for critical events
      if (auditEvent.risk === RiskLevel.CRITICAL) {
        await this.flushCriticalEvent(auditEvent)
      }

      // Real-time alerting for suspicious activities
      if (this.isSuspiciousActivity(auditEvent)) {
        await this.triggerSecurityAlert(auditEvent)
      }

      return auditEvent.id
    } catch (error) {
      captureError(error as Error, {
        component: 'AuditTrailService',
        action: 'recordEvent',
        metadata: { eventType: event.eventType, userId: event.userId },
      })
      throw error
    }
  }

  /**
   * Trading-specific audit logging
   */
  async recordTradingEvent(
    userId: string,
    action: AuditAction,
    details: {
      symbol: string
      quantity: number
      price: number
      orderType: string
      amount: number
      currency: string
      portfolioId: string
      orderId?: string
      executionId?: string
    },
    metadata: Partial<AuditMetadata>
  ): Promise<string> {
    return this.recordEvent({
      userId,
      sessionId: metadata.correlationId || this.generateSessionId(),
      eventType: AuditEventType.TRADING,
      entityType: 'trade',
      entityId: details.orderId || details.executionId || this.generateEntityId(),
      action,
      details: {
        description: `${action} ${details.quantity} shares of ${details.symbol} at $${details.price}`,
        symbol: details.symbol,
        quantity: details.quantity,
        price: details.price,
        amount: details.amount,
        currency: details.currency,
        orderType: details.orderType,
      },
      metadata: {
        source: 'trading-service',
        version: '3.1.0',
        correlationId: metadata.correlationId || this.generateCorrelationId(),
        success: true,
        ...metadata,
      },
      ipAddress: metadata.source === 'api' ? '0.0.0.0' : this.extractIPAddress(),
      userAgent: this.extractUserAgent(),
      risk: this.calculateTradingRisk(details),
      compliance: {
        regulatoryFramework: ['SEC', 'FINRA', 'CFTC'],
        retentionPeriod: 7 * 365 * 24 * 60 * 60 * 1000, // 7 years
        classification: 'confidential',
        dataResidency: 'US',
        encryptionRequired: true,
        personalData: true,
        financialData: true,
      },
    })
  }

  /**
   * Portfolio management audit logging
   */
  async recordPortfolioEvent(
    userId: string,
    portfolioId: string,
    action: AuditAction,
    details: {
      description: string
      oldValues?: Record<string, any>
      newValues?: Record<string, any>
      amount?: number
      currency?: string
    },
    metadata: Partial<AuditMetadata>
  ): Promise<string> {
    return this.recordEvent({
      userId,
      sessionId: metadata.correlationId || this.generateSessionId(),
      eventType: AuditEventType.PORTFOLIO,
      entityType: 'portfolio',
      entityId: portfolioId,
      action,
      details,
      metadata: {
        source: 'portfolio-service',
        version: '3.2.0',
        correlationId: metadata.correlationId || this.generateCorrelationId(),
        success: true,
        ...metadata,
      },
      ipAddress: this.extractIPAddress(),
      userAgent: this.extractUserAgent(),
      risk: RiskLevel.MEDIUM,
      compliance: {
        regulatoryFramework: ['SEC', 'FINRA'],
        retentionPeriod: 5 * 365 * 24 * 60 * 60 * 1000, // 5 years
        classification: 'confidential',
        dataResidency: 'US',
        encryptionRequired: true,
        personalData: true,
        financialData: true,
      },
    })
  }

  /**
   * Authentication audit logging
   */
  async recordAuthEvent(
    userId: string,
    action: AuditAction,
    details: {
      description: string
      success: boolean
      reason?: string
      mfaUsed?: boolean
      deviceFingerprint?: string
    },
    metadata: Partial<AuditMetadata>
  ): Promise<string> {
    return this.recordEvent({
      userId,
      sessionId: metadata.correlationId || this.generateSessionId(),
      eventType: AuditEventType.AUTHENTICATION,
      entityType: 'user',
      entityId: userId,
      action,
      details,
      metadata: {
        source: 'auth-service',
        version: '2.1.0',
        correlationId: metadata.correlationId || this.generateCorrelationId(),
        success: details.success,
        ...metadata,
      },
      ipAddress: this.extractIPAddress(),
      userAgent: this.extractUserAgent(),
      risk: this.calculateAuthRisk(details),
      compliance: {
        regulatoryFramework: ['GDPR', 'CCPA', 'SOX'],
        retentionPeriod: 3 * 365 * 24 * 60 * 60 * 1000, // 3 years
        classification: 'confidential',
        dataResidency: 'US',
        encryptionRequired: true,
        personalData: true,
        financialData: false,
      },
    })
  }

  /**
   * Query audit events
   */
  async queryEvents(query: AuditQuery): Promise<{
    events: AuditEvent[]
    total: number
    hasMore: boolean
  }> {
    try {
      const {
        userId,
        eventType,
        action,
        entityType,
        entityId,
        risk,
        startDate,
        endDate,
        ipAddress,
        compliance,
        limit = 100,
        offset = 0,
        sortBy = 'timestamp',
        sortOrder = 'desc',
      } = query

      const whereClause: any = {}

      if (userId) whereClause.userId = userId
      if (eventType) whereClause.eventType = eventType
      if (action) whereClause.action = action
      if (entityType) whereClause.entityType = entityType
      if (entityId) whereClause.entityId = entityId
      if (risk) whereClause.risk = risk
      if (ipAddress) whereClause.ipAddress = ipAddress

      if (startDate || endDate) {
        whereClause.timestamp = {}
        if (startDate) whereClause.timestamp.gte = startDate
        if (endDate) whereClause.timestamp.lte = endDate
      }

      const [events, total] = await Promise.all([
        prisma.auditEvent.findMany({
          where: whereClause,
          orderBy: { [sortBy]: sortOrder },
          skip: offset,
          take: limit,
        }),
        prisma.auditEvent.count({ where: whereClause }),
      ])

      return {
        events: events.map(this.deserializeEvent),
        total,
        hasMore: offset + events.length < total,
      }
    } catch (error) {
      captureError(error as Error, {
        component: 'AuditTrailService',
        action: 'queryEvents',
        metadata: { query },
      })
      throw error
    }
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(
    framework: string,
    startDate: Date,
    endDate: Date,
    format: 'json' | 'csv' | 'pdf' = 'json'
  ): Promise<any> {
    try {
      const events = await this.queryEvents({
        startDate,
        endDate,
        compliance: { framework },
        limit: 10000,
      })

      const report = {
        framework,
        period: { startDate, endDate },
        summary: {
          totalEvents: events.total,
          eventsByType: this.groupByEventType(events.events),
          eventsByRisk: this.groupByRisk(events.events),
          criticalEvents: events.events.filter(e => e.risk === RiskLevel.CRITICAL),
          suspiciousActivities: events.events.filter(e => this.isSuspiciousActivity(e)),
        },
        details: events.events,
        generatedAt: new Date(),
        generatedBy: 'audit-trail-service',
      }

      if (format === 'csv') {
        return this.formatAsCSV(report)
      } else if (format === 'pdf') {
        return this.formatAsPDF(report)
      }

      return report
    } catch (error) {
      captureError(error as Error, {
        component: 'AuditTrailService',
        action: 'generateComplianceReport',
        metadata: { framework, startDate, endDate, format },
      })
      throw error
    }
  }

  /**
   * Data retention and archival
   */
  async enforceRetentionPolicy(): Promise<void> {
    try {
      const retentionPolicies = await this.getRetentionPolicies()

      for (const policy of retentionPolicies) {
        const cutoffDate = new Date(Date.now() - policy.retentionPeriod)

        // Archive old events before deletion
        await this.archiveEvents(policy.framework, cutoffDate)

        // Delete events past retention period
        await this.deleteExpiredEvents(policy.framework, cutoffDate)
      }
    } catch (error) {
      captureError(error as Error, {
        component: 'AuditTrailService',
        action: 'enforceRetentionPolicy',
      })
      throw error
    }
  }

  /**
   * Private helper methods
   */
  private validateComplianceRequirements(event: AuditEvent): void {
    if (!event.compliance.regulatoryFramework.length) {
      throw new Error('Regulatory framework must be specified for audit events')
    }

    if (event.compliance.personalData && !event.compliance.encryptionRequired) {
      throw new Error('Encryption is required for events containing personal data')
    }

    if (event.eventType === AuditEventType.TRADING && event.compliance.retentionPeriod < 7 * 365 * 24 * 60 * 60 * 1000) {
      throw new Error('Trading events must be retained for at least 7 years')
    }
  }

  private calculateTradingRisk(details: any): RiskLevel {
    const amount = details.amount || 0

    if (amount > 1000000) return RiskLevel.CRITICAL // $1M+
    if (amount > 100000) return RiskLevel.HIGH      // $100K+
    if (amount > 10000) return RiskLevel.MEDIUM     // $10K+
    return RiskLevel.LOW
  }

  private calculateAuthRisk(details: any): RiskLevel {
    if (!details.success) return RiskLevel.HIGH
    if (!details.mfaUsed) return RiskLevel.MEDIUM
    return RiskLevel.LOW
  }

  private isSuspiciousActivity(event: AuditEvent): boolean {
    // Multiple failed login attempts
    if (event.eventType === AuditEventType.AUTHENTICATION &&
        event.action === AuditAction.LOGIN &&
        !event.metadata.success) {
      return true
    }

    // Large trading amounts outside business hours
    if (event.eventType === AuditEventType.TRADING &&
        event.risk === RiskLevel.CRITICAL &&
        this.isOutsideBusinessHours(event.timestamp)) {
      return true
    }

    // Data access from unusual locations
    if (event.eventType === AuditEventType.DATA_ACCESS &&
        event.metadata.geolocation?.country !== 'US') {
      return true
    }

    return false
  }

  private isOutsideBusinessHours(timestamp: Date): boolean {
    const hour = timestamp.getHours()
    const day = timestamp.getDay()

    // Weekend or outside 9 AM - 4 PM
    return day === 0 || day === 6 || hour < 9 || hour >= 16
  }

  private async triggerSecurityAlert(event: AuditEvent): Promise<void> {
    try {
      await fetch('/api/alerts/security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          userId: event.userId,
          eventType: event.eventType,
          risk: event.risk,
          description: event.details.description,
          timestamp: event.timestamp,
          metadata: event.metadata,
        }),
      })
    } catch (error) {
      console.error('Failed to trigger security alert:', error)
    }
  }

  private startBatchProcessing(): void {
    setInterval(async () => {
      if (this.batchQueue.length > 0) {
        await this.flushBatch()
      }
    }, this.flushInterval)
  }

  private async flushBatch(): Promise<void> {
    if (this.batchQueue.length === 0) return

    const batch = this.batchQueue.splice(0, this.batchSize)

    try {
      await prisma.auditEvent.createMany({
        data: batch.map(this.serializeEvent),
      })

      // Cache recent critical events in Redis
      const criticalEvents = batch.filter(e => e.risk === RiskLevel.CRITICAL)
      for (const event of criticalEvents) {
        await redisService.setAuditEvent(event.id, event, 24 * 60 * 60) // 24 hours
      }
    } catch (error) {
      // Re-queue failed events
      this.batchQueue.unshift(...batch)
      throw error
    }
  }

  private async flushCriticalEvent(event: AuditEvent): Promise<void> {
    try {
      await prisma.auditEvent.create({
        data: this.serializeEvent(event),
      })

      await redisService.setAuditEvent(event.id, event, 24 * 60 * 60)
    } catch (error) {
      console.error('Failed to flush critical audit event:', error)
    }
  }

  private serializeEvent(event: AuditEvent): any {
    return {
      ...event,
      details: JSON.stringify(event.details),
      metadata: JSON.stringify(event.metadata),
      compliance: JSON.stringify(event.compliance),
    }
  }

  private deserializeEvent(event: any): AuditEvent {
    return {
      ...event,
      details: JSON.parse(event.details),
      metadata: JSON.parse(event.metadata),
      compliance: JSON.parse(event.compliance),
    }
  }

  private generateEventId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateCorrelationId(): string {
    return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateEntityId(): string {
    return `entity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private extractIPAddress(): string {
    // In a real implementation, this would extract from request headers
    return '127.0.0.1'
  }

  private extractUserAgent(): string {
    // In a real implementation, this would extract from request headers
    return 'Stratford AI Client/1.0'
  }

  private groupByEventType(events: AuditEvent[]): Record<string, number> {
    return events.reduce((acc, event) => {
      acc[event.eventType] = (acc[event.eventType] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }

  private groupByRisk(events: AuditEvent[]): Record<string, number> {
    return events.reduce((acc, event) => {
      acc[event.risk] = (acc[event.risk] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }

  private async getRetentionPolicies(): Promise<Array<{
    framework: string
    retentionPeriod: number
  }>> {
    return [
      { framework: 'SEC', retentionPeriod: 7 * 365 * 24 * 60 * 60 * 1000 }, // 7 years
      { framework: 'FINRA', retentionPeriod: 7 * 365 * 24 * 60 * 60 * 1000 }, // 7 years
      { framework: 'GDPR', retentionPeriod: 3 * 365 * 24 * 60 * 60 * 1000 }, // 3 years
      { framework: 'CCPA', retentionPeriod: 2 * 365 * 24 * 60 * 60 * 1000 }, // 2 years
    ]
  }

  private async archiveEvents(framework: string, cutoffDate: Date): Promise<void> {
    // Implementation would move events to long-term storage
    console.log(`Archiving ${framework} events older than ${cutoffDate}`)
  }

  private async deleteExpiredEvents(framework: string, cutoffDate: Date): Promise<void> {
    await prisma.auditEvent.deleteMany({
      where: {
        timestamp: { lt: cutoffDate },
        compliance: {
          path: ['regulatoryFramework'],
          array_contains: framework,
        },
      },
    })
  }

  private formatAsCSV(report: any): string {
    // CSV formatting implementation
    return 'CSV format not implemented'
  }

  private formatAsPDF(report: any): Buffer {
    // PDF formatting implementation
    return Buffer.from('PDF format not implemented')
  }
}

// Singleton instance
let auditTrailInstance: AuditTrailService | null = null

export function initializeAuditTrail(): AuditTrailService {
  if (!auditTrailInstance) {
    auditTrailInstance = new AuditTrailService()
  }
  return auditTrailInstance
}

export function getAuditTrail(): AuditTrailService | null {
  return auditTrailInstance
}

// Convenience functions
export async function auditTradingEvent(
  userId: string,
  action: AuditAction,
  details: any,
  metadata?: Partial<AuditMetadata>
): Promise<string> {
  const service = getAuditTrail()
  if (!service) throw new Error('Audit trail not initialized')
  return service.recordTradingEvent(userId, action, details, metadata || {})
}

export async function auditPortfolioEvent(
  userId: string,
  portfolioId: string,
  action: AuditAction,
  details: any,
  metadata?: Partial<AuditMetadata>
): Promise<string> {
  const service = getAuditTrail()
  if (!service) throw new Error('Audit trail not initialized')
  return service.recordPortfolioEvent(userId, portfolioId, action, details, metadata || {})
}

export async function auditAuthEvent(
  userId: string,
  action: AuditAction,
  details: any,
  metadata?: Partial<AuditMetadata>
): Promise<string> {
  const service = getAuditTrail()
  if (!service) throw new Error('Audit trail not initialized')
  return service.recordAuthEvent(userId, action, details, metadata || {})
}

export { AuditTrailService }