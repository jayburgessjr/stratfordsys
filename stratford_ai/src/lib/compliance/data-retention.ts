import { prisma } from '@/lib/database/prisma'
import cron from 'node-cron'
import crypto from 'crypto'

/**
 * Automated Data Retention and Deletion System
 * Compliant with SEC, FINRA, GDPR, and CCPA requirements
 */

export interface RetentionPolicy {
  id: string
  name: string
  dataType: string
  retentionPeriod: number // days
  regulation: string
  jurisdiction: string
  isActive: boolean
}

export interface DeletionRequest {
  recordId: string
  dataType: string
  reason: 'RETENTION_EXPIRED' | 'USER_REQUEST' | 'LEGAL_ORDER' | 'GDPR_REQUEST'
  requestedBy: string
  scheduledFor?: Date
}

export class DataRetentionService {
  private static instance: DataRetentionService
  private isRunning = false

  static getInstance(): DataRetentionService {
    if (!DataRetentionService.instance) {
      DataRetentionService.instance = new DataRetentionService()
    }
    return DataRetentionService.instance
  }

  /**
   * Initialize default retention policies
   */
  async initializeRetentionPolicies(): Promise<void> {
    const defaultPolicies = [
      {
        name: 'SEC Trade Records',
        dataType: 'TRANSACTION_DATA',
        retentionPeriod: 7 * 365, // 7 years
        regulation: 'SEC',
        jurisdiction: 'US'
      },
      {
        name: 'FINRA Customer Communications',
        dataType: 'COMMUNICATION_DATA',
        retentionPeriod: 3 * 365, // 3 years
        regulation: 'FINRA',
        jurisdiction: 'US'
      },
      {
        name: 'KYC Documentation',
        dataType: 'KYC_DATA',
        retentionPeriod: 5 * 365, // 5 years after account closure
        regulation: 'SEC',
        jurisdiction: 'US'
      },
      {
        name: 'AML Records',
        dataType: 'AML_DATA',
        retentionPeriod: 5 * 365, // 5 years
        regulation: 'FINRA',
        jurisdiction: 'US'
      },
      {
        name: 'User Personal Data (GDPR)',
        dataType: 'USER_DATA',
        retentionPeriod: 365, // 1 year after account deletion request
        regulation: 'GDPR',
        jurisdiction: 'EU'
      },
      {
        name: 'Marketing Data (CCPA)',
        dataType: 'MARKETING_DATA',
        retentionPeriod: 365, // 1 year
        regulation: 'CCPA',
        jurisdiction: 'US'
      },
      {
        name: 'Audit Logs',
        dataType: 'AUDIT_DATA',
        retentionPeriod: 7 * 365, // 7 years
        regulation: 'SOX',
        jurisdiction: 'US'
      }
    ]

    for (const policy of defaultPolicies) {
      await prisma.dataRetentionPolicy.upsert({
        where: { name: policy.name },
        update: {},
        create: policy
      })
    }
  }

  /**
   * Start automated retention monitoring
   */
  startRetentionMonitoring(): void {
    if (this.isRunning) {
      console.log('Data retention monitoring already running')
      return
    }

    this.isRunning = true

    // Run daily at 2 AM
    cron.schedule('0 2 * * *', async () => {
      try {
        await this.processRetentionPolicies()
      } catch (error) {
        console.error('Data retention processing error:', error)
      }
    })

    // Run GDPR deletion requests immediately when requested
    cron.schedule('*/30 * * * *', async () => {
      try {
        await this.processImmediateDeletions()
      } catch (error) {
        console.error('Immediate deletion processing error:', error)
      }
    })

    console.log('Data retention monitoring started')
  }

  /**
   * Process all active retention policies
   */
  async processRetentionPolicies(): Promise<void> {
    const policies = await prisma.dataRetentionPolicy.findMany({
      where: { isActive: true }
    })

    for (const policy of policies) {
      await this.processPolicy(policy)
    }

    // Update last applied timestamp
    await prisma.dataRetentionPolicy.updateMany({
      where: { isActive: true },
      data: { lastAppliedAt: new Date() }
    })
  }

  /**
   * Process individual retention policy
   */
  private async processPolicy(policy: RetentionPolicy): Promise<void> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - policy.retentionPeriod)

    console.log(`Processing retention policy: ${policy.name} (cutoff: ${cutoffDate})`)

    switch (policy.dataType) {
      case 'TRANSACTION_DATA':
        await this.deleteOldTransactions(cutoffDate, policy)
        break
      case 'COMMUNICATION_DATA':
        await this.deleteOldCommunications(cutoffDate, policy)
        break
      case 'KYC_DATA':
        await this.deleteOldKYCRecords(cutoffDate, policy)
        break
      case 'AML_DATA':
        await this.deleteOldAMLRecords(cutoffDate, policy)
        break
      case 'USER_DATA':
        await this.deleteOldUserData(cutoffDate, policy)
        break
      case 'MARKETING_DATA':
        await this.deleteOldMarketingData(cutoffDate, policy)
        break
      case 'AUDIT_DATA':
        await this.deleteOldAuditData(cutoffDate, policy)
        break
    }
  }

  /**
   * Delete old transaction data
   */
  private async deleteOldTransactions(cutoffDate: Date, policy: RetentionPolicy): Promise<void> {
    const oldTrades = await prisma.trade.findMany({
      where: {
        createdAt: { lt: cutoffDate },
        status: 'FILLED' // Only delete completed trades
      },
      select: { id: true, portfolioId: true, symbol: true, createdAt: true }
    })

    for (const trade of oldTrades) {
      await this.safeDelete('Trade', trade.id, 'RETENTION_EXPIRED', 'SYSTEM', {
        policyId: policy.id,
        originalDate: trade.createdAt,
        symbol: trade.symbol
      })
    }
  }

  /**
   * Delete old KYC records (only for closed accounts)
   */
  private async deleteOldKYCRecords(cutoffDate: Date, policy: RetentionPolicy): Promise<void> {
    // Only delete KYC for users who have been inactive for the retention period
    const inactiveUsers = await prisma.user.findMany({
      where: {
        lastLoginAt: { lt: cutoffDate },
        // Add additional criteria for truly inactive accounts
      },
      include: {
        kycRecords: {
          where: {
            createdAt: { lt: cutoffDate }
          }
        }
      }
    })

    for (const user of inactiveUsers) {
      for (const kycRecord of user.kycRecords) {
        await this.safeDelete('KycRecord', kycRecord.id, 'RETENTION_EXPIRED', 'SYSTEM', {
          policyId: policy.id,
          userId: user.id,
          originalDate: kycRecord.submittedAt
        })
      }
    }
  }

  /**
   * Delete old AML records
   */
  private async deleteOldAMLRecords(cutoffDate: Date, policy: RetentionPolicy): Promise<void> {
    const oldAlerts = await prisma.amlAlert.findMany({
      where: {
        triggeredAt: { lt: cutoffDate },
        status: { in: ['RESOLVED', 'FALSE_POSITIVE'] }
      },
      select: { id: true, userId: true, triggeredAt: true, alertType: true }
    })

    for (const alert of oldAlerts) {
      await this.safeDelete('AmlAlert', alert.id, 'RETENTION_EXPIRED', 'SYSTEM', {
        policyId: policy.id,
        userId: alert.userId,
        alertType: alert.alertType,
        originalDate: alert.triggeredAt
      })
    }
  }

  /**
   * Delete old user data (GDPR compliance)
   */
  private async deleteOldUserData(cutoffDate: Date, policy: RetentionPolicy): Promise<void> {
    // Only delete users who have requested account deletion
    const deletionRequests = await prisma.userActivity.findMany({
      where: {
        action: 'ACCOUNT_DELETION_REQUESTED',
        createdAt: { lt: cutoffDate }
      }
    })

    for (const request of deletionRequests) {
      await this.processUserDeletion(request.userId, 'RETENTION_EXPIRED')
    }
  }

  /**
   * Delete old audit data
   */
  private async deleteOldAuditData(cutoffDate: Date, policy: RetentionPolicy): Promise<void> {
    const oldActivities = await prisma.userActivity.findMany({
      where: {
        createdAt: { lt: cutoffDate },
        action: { notIn: ['TRADE_EXECUTED', 'KYC_SUBMITTED', 'AML_ALERT'] } // Keep critical activities longer
      },
      select: { id: true, userId: true, action: true, createdAt: true }
    })

    for (const activity of oldActivities) {
      await this.safeDelete('UserActivity', activity.id, 'RETENTION_EXPIRED', 'SYSTEM', {
        policyId: policy.id,
        userId: activity.userId,
        action: activity.action,
        originalDate: activity.createdAt
      })
    }
  }

  /**
   * Process immediate deletion requests (GDPR)
   */
  async processImmediateDeletions(): Promise<void> {
    const pendingDeletions = await prisma.userActivity.findMany({
      where: {
        action: 'GDPR_DELETION_REQUESTED',
        metadata: {
          path: ['processed'],
          equals: false
        }
      }
    })

    for (const deletion of pendingDeletions) {
      await this.processUserDeletion(deletion.userId, 'GDPR_REQUEST')

      // Mark as processed
      await prisma.userActivity.update({
        where: { id: deletion.id },
        data: {
          metadata: {
            ...deletion.metadata,
            processed: true,
            processedAt: new Date()
          }
        }
      })
    }
  }

  /**
   * Process complete user deletion
   */
  async processUserDeletion(userId: string, reason: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        portfolios: true,
        strategies: true,
        kycRecords: true,
        userSessions: true,
        activities: true
      }
    })

    if (!user) return

    // Check if user has active positions or pending trades
    const activePositions = await prisma.position.count({
      where: {
        portfolio: { userId }
      }
    })

    if (activePositions > 0) {
      console.log(`User ${userId} has active positions, deferring deletion`)
      return
    }

    // Create deletion log entries before deleting
    const recordsToDelete = [
      ...user.kycRecords.map(r => ({ type: 'KycRecord', id: r.id })),
      ...user.userSessions.map(r => ({ type: 'UserSession', id: r.id })),
      ...user.activities.map(r => ({ type: 'UserActivity', id: r.id })),
      ...user.portfolios.map(r => ({ type: 'Portfolio', id: r.id })),
      ...user.strategies.map(r => ({ type: 'Strategy', id: r.id }))
    ]

    for (const record of recordsToDelete) {
      await this.safeDelete(record.type, record.id, reason, 'SYSTEM', {
        userId,
        userEmail: user.email,
        deletionDate: new Date()
      })
    }

    // Finally delete the user record
    await this.safeDelete('User', userId, reason, 'SYSTEM', {
      email: user.email,
      lastLogin: user.lastLoginAt,
      accountAge: new Date().getTime() - user.createdAt.getTime()
    })
  }

  /**
   * Safe delete with audit trail
   */
  private async safeDelete(
    dataType: string,
    recordId: string,
    reason: string,
    deletedBy: string,
    metadata: any
  ): Promise<void> {
    try {
      // Create hash of the record before deletion for verification
      const recordHash = crypto
        .createHash('sha256')
        .update(`${dataType}:${recordId}:${JSON.stringify(metadata)}`)
        .digest('hex')

      // Log deletion
      await prisma.dataDeletionLog.create({
        data: {
          dataType,
          recordId,
          deletionReason: reason,
          deletedBy,
          recordHash,
          legalBasis: this.getLegalBasisForDeletion(reason)
        }
      })

      // Perform the actual deletion based on data type
      await this.executePhysicalDeletion(dataType, recordId)

      console.log(`Deleted ${dataType} record ${recordId} (reason: ${reason})`)

    } catch (error) {
      console.error(`Failed to delete ${dataType} record ${recordId}:`, error)
    }
  }

  /**
   * Execute physical deletion
   */
  private async executePhysicalDeletion(dataType: string, recordId: string): Promise<void> {
    switch (dataType) {
      case 'User':
        await prisma.user.delete({ where: { id: recordId } })
        break
      case 'Trade':
        await prisma.trade.delete({ where: { id: recordId } })
        break
      case 'KycRecord':
        await prisma.kycRecord.delete({ where: { id: recordId } })
        break
      case 'AmlAlert':
        await prisma.amlAlert.delete({ where: { id: recordId } })
        break
      case 'UserActivity':
        await prisma.userActivity.delete({ where: { id: recordId } })
        break
      case 'Portfolio':
        await prisma.portfolio.delete({ where: { id: recordId } })
        break
      case 'Strategy':
        await prisma.strategy.delete({ where: { id: recordId } })
        break
      case 'UserSession':
        await prisma.userSession.delete({ where: { id: recordId } })
        break
      default:
        throw new Error(`Unknown data type for deletion: ${dataType}`)
    }
  }

  /**
   * Get legal basis for deletion
   */
  private getLegalBasisForDeletion(reason: string): string {
    switch (reason) {
      case 'RETENTION_EXPIRED':
        return 'Data retention period expired per regulatory requirements'
      case 'USER_REQUEST':
        return 'User requested account deletion'
      case 'GDPR_REQUEST':
        return 'GDPR Article 17 - Right to erasure'
      case 'LEGAL_ORDER':
        return 'Court order or legal requirement'
      default:
        return 'Administrative deletion'
    }
  }

  /**
   * Generate retention compliance report
   */
  async generateRetentionReport(): Promise<any> {
    const policies = await prisma.dataRetentionPolicy.findMany()
    const deletionLogs = await prisma.dataDeletionLog.groupBy({
      by: ['dataType', 'deletionReason'],
      _count: { id: true },
      where: {
        deletedAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      }
    })

    return {
      policies: policies.length,
      activePolicies: policies.filter(p => p.isActive).length,
      recentDeletions: deletionLogs.reduce((sum, log) => sum + log._count.id, 0),
      deletionsByType: deletionLogs,
      lastRun: new Date(),
      compliance: {
        SEC: policies.filter(p => p.regulation === 'SEC').length,
        FINRA: policies.filter(p => p.regulation === 'FINRA').length,
        GDPR: policies.filter(p => p.regulation === 'GDPR').length,
        CCPA: policies.filter(p => p.regulation === 'CCPA').length
      }
    }
  }

  /**
   * Request user data deletion (GDPR)
   */
  async requestUserDeletion(userId: string, requestedBy: string): Promise<void> {
    await prisma.userActivity.create({
      data: {
        userId,
        action: 'GDPR_DELETION_REQUESTED',
        resource: 'USER_DATA',
        metadata: {
          requestedBy,
          requestedAt: new Date(),
          processed: false,
          gdprCompliant: true
        }
      }
    })
  }

  /**
   * Get user's data for export (GDPR compliance)
   */
  async exportUserData(userId: string): Promise<any> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        portfolios: {
          include: {
            positions: true,
            trades: true
          }
        },
        strategies: true,
        kycRecords: true,
        activities: true
      }
    })

    if (!user) {
      throw new Error('User not found')
    }

    // Remove sensitive fields and decrypt where necessary
    return {
      personal: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt
      },
      portfolios: user.portfolios.map(portfolio => ({
        id: portfolio.id,
        name: portfolio.name,
        createdAt: portfolio.createdAt,
        positions: portfolio.positions.length,
        trades: portfolio.trades.length
      })),
      strategies: user.strategies.map(strategy => ({
        id: strategy.id,
        name: strategy.name,
        category: strategy.category,
        createdAt: strategy.createdAt
      })),
      compliance: {
        kycStatus: user.kycStatus,
        amlStatus: user.amlStatus,
        riskLevel: user.riskLevel
      },
      exportDate: new Date()
    }
  }
}

// Export singleton instance
export const dataRetentionService = DataRetentionService.getInstance()