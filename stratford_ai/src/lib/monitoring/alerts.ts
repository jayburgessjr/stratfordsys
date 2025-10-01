/**
 * Real-time Alerting System for Stratford AI
 * Critical system failure detection and notification management
 */

import { redisService } from '../database/redis'

// Alert Severity Levels
export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info'

// Alert Types
export type AlertType =
  | 'system_failure'
  | 'trading_anomaly'
  | 'market_volatility'
  | 'performance_degradation'
  | 'security_threat'
  | 'data_quality'
  | 'api_rate_limit'
  | 'database_connection'
  | 'memory_threshold'
  | 'disk_space'

// Alert Configuration
export interface AlertRule {
  id: string
  name: string
  type: AlertType
  severity: AlertSeverity
  condition: AlertCondition
  threshold: AlertThreshold
  enabled: boolean
  cooldownPeriod: number // seconds
  recipients: AlertRecipient[]
  escalationRules?: EscalationRule[]
  metadata?: Record<string, any>
}

export interface AlertCondition {
  metric: string
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'contains' | 'not_contains'
  value: number | string
  timeWindow: number // seconds
  evaluationInterval: number // seconds
}

export interface AlertThreshold {
  warning: number
  critical: number
  duration: number // seconds - how long condition must persist
}

export interface AlertRecipient {
  type: 'email' | 'sms' | 'slack' | 'webhook' | 'pagerduty'
  address: string
  severity: AlertSeverity[]
}

export interface EscalationRule {
  delay: number // minutes
  recipients: AlertRecipient[]
  action?: 'auto_scale' | 'failover' | 'circuit_breaker'
}

export interface Alert {
  id: string
  ruleId: string
  type: AlertType
  severity: AlertSeverity
  title: string
  description: string
  timestamp: Date
  resolved: boolean
  resolvedAt?: Date
  acknowledgedBy?: string
  acknowledgedAt?: Date
  metadata: Record<string, any>
  metrics: AlertMetric[]
}

export interface AlertMetric {
  name: string
  value: number
  threshold: number
  timestamp: Date
}

class AlertingService {
  private alertRules: Map<string, AlertRule> = new Map()
  private activeAlerts: Map<string, Alert> = new Map()
  private alertHistory: Alert[] = []
  private evaluationTimers: Map<string, NodeJS.Timeout> = new Map()

  constructor() {
    this.initializeDefaultRules()
    this.startAlertEvaluation()
  }

  /**
   * Initialize Default Alert Rules
   */
  private initializeDefaultRules(): void {
    const defaultRules: AlertRule[] = [
      // System Health Alerts
      {
        id: 'system_high_memory',
        name: 'High Memory Usage',
        type: 'performance_degradation',
        severity: 'high',
        condition: {
          metric: 'server.memory.heap_used',
          operator: 'gt',
          value: 0.85, // 85% memory usage
          timeWindow: 300, // 5 minutes
          evaluationInterval: 60, // 1 minute
        },
        threshold: {
          warning: 0.75,
          critical: 0.90,
          duration: 180, // 3 minutes
        },
        enabled: true,
        cooldownPeriod: 600, // 10 minutes
        recipients: [
          {
            type: 'email',
            address: 'devops@stratford-ai.com',
            severity: ['critical', 'high'],
          },
          {
            type: 'slack',
            address: '#alerts-system',
            severity: ['critical', 'high', 'medium'],
          }
        ],
        escalationRules: [
          {
            delay: 5, // 5 minutes
            recipients: [
              {
                type: 'pagerduty',
                address: 'production-on-call',
                severity: ['critical'],
              }
            ],
            action: 'auto_scale'
          }
        ]
      },

      // Trading Performance Alerts
      {
        id: 'trading_high_latency',
        name: 'High Trading Execution Latency',
        type: 'trading_anomaly',
        severity: 'critical',
        condition: {
          metric: 'trading.execution.latency',
          operator: 'gt',
          value: 100, // 100ms
          timeWindow: 60, // 1 minute
          evaluationInterval: 10, // 10 seconds
        },
        threshold: {
          warning: 50,
          critical: 100,
          duration: 30, // 30 seconds
        },
        enabled: true,
        cooldownPeriod: 300,
        recipients: [
          {
            type: 'email',
            address: 'trading-team@stratford-ai.com',
            severity: ['critical', 'high'],
          },
          {
            type: 'slack',
            address: '#alerts-trading',
            severity: ['critical', 'high', 'medium'],
          }
        ]
      },

      // Market Data Alerts
      {
        id: 'market_data_stale',
        name: 'Stale Market Data',
        type: 'data_quality',
        severity: 'high',
        condition: {
          metric: 'market_data.last_update_age',
          operator: 'gt',
          value: 300, // 5 minutes
          timeWindow: 60,
          evaluationInterval: 30,
        },
        threshold: {
          warning: 120, // 2 minutes
          critical: 300, // 5 minutes
          duration: 60,
        },
        enabled: true,
        cooldownPeriod: 180,
        recipients: [
          {
            type: 'email',
            address: 'data-team@stratford-ai.com',
            severity: ['critical', 'high'],
          }
        ]
      },

      // API Rate Limiting
      {
        id: 'api_rate_limit_exceeded',
        name: 'API Rate Limit Exceeded',
        type: 'api_rate_limit',
        severity: 'medium',
        condition: {
          metric: 'api.rate_limit.exceeded',
          operator: 'gt',
          value: 10, // 10 rate limit violations
          timeWindow: 300,
          evaluationInterval: 60,
        },
        threshold: {
          warning: 5,
          critical: 20,
          duration: 120,
        },
        enabled: true,
        cooldownPeriod: 600,
        recipients: [
          {
            type: 'slack',
            address: '#alerts-api',
            severity: ['high', 'medium'],
          }
        ]
      },

      // Security Alerts
      {
        id: 'suspicious_login_activity',
        name: 'Suspicious Login Activity',
        type: 'security_threat',
        severity: 'critical',
        condition: {
          metric: 'security.failed_login_attempts',
          operator: 'gt',
          value: 5, // 5 failed attempts
          timeWindow: 300,
          evaluationInterval: 60,
        },
        threshold: {
          warning: 3,
          critical: 5,
          duration: 60,
        },
        enabled: true,
        cooldownPeriod: 900,
        recipients: [
          {
            type: 'email',
            address: 'security@stratford-ai.com',
            severity: ['critical', 'high'],
          },
          {
            type: 'slack',
            address: '#alerts-security',
            severity: ['critical', 'high'],
          }
        ]
      }
    ]

    defaultRules.forEach(rule => {
      this.alertRules.set(rule.id, rule)
    })
  }

  /**
   * Add Custom Alert Rule
   */
  addAlertRule(rule: AlertRule): void {
    this.alertRules.set(rule.id, rule)

    if (rule.enabled) {
      this.startRuleEvaluation(rule)
    }
  }

  /**
   * Update Alert Rule
   */
  updateAlertRule(ruleId: string, updates: Partial<AlertRule>): void {
    const rule = this.alertRules.get(ruleId)
    if (!rule) throw new Error(`Alert rule ${ruleId} not found`)

    const updatedRule = { ...rule, ...updates }
    this.alertRules.set(ruleId, updatedRule)

    // Restart evaluation with new parameters
    this.stopRuleEvaluation(ruleId)
    if (updatedRule.enabled) {
      this.startRuleEvaluation(updatedRule)
    }
  }

  /**
   * Start Alert Evaluation
   */
  private startAlertEvaluation(): void {
    // Start evaluation for all enabled rules
    this.alertRules.forEach(rule => {
      if (rule.enabled) {
        this.startRuleEvaluation(rule)
      }
    })
  }

  /**
   * Start Rule Evaluation Timer
   */
  private startRuleEvaluation(rule: AlertRule): void {
    const timer = setInterval(async () => {
      await this.evaluateRule(rule)
    }, rule.condition.evaluationInterval * 1000)

    this.evaluationTimers.set(rule.id, timer)
  }

  /**
   * Stop Rule Evaluation Timer
   */
  private stopRuleEvaluation(ruleId: string): void {
    const timer = this.evaluationTimers.get(ruleId)
    if (timer) {
      clearInterval(timer)
      this.evaluationTimers.delete(ruleId)
    }
  }

  /**
   * Evaluate Alert Rule
   */
  private async evaluateRule(rule: AlertRule): Promise<void> {
    try {
      // Get metric values for the time window
      const metricValues = await this.getMetricValues(
        rule.condition.metric,
        rule.condition.timeWindow
      )

      if (metricValues.length === 0) return

      // Check if condition is met
      const conditionMet = this.evaluateCondition(rule.condition, metricValues)

      if (conditionMet) {
        await this.handleAlertCondition(rule, metricValues)
      } else {
        await this.checkAutoResolve(rule)
      }
    } catch (error) {
      console.error(`[Alerts] Error evaluating rule ${rule.id}:`, error)
    }
  }

  /**
   * Evaluate Alert Condition
   */
  private evaluateCondition(condition: AlertCondition, values: number[]): boolean {
    const latestValue = values[values.length - 1]

    switch (condition.operator) {
      case 'gt':
        return latestValue > condition.value
      case 'gte':
        return latestValue >= condition.value
      case 'lt':
        return latestValue < condition.value
      case 'lte':
        return latestValue <= condition.value
      case 'eq':
        return latestValue === condition.value
      default:
        return false
    }
  }

  /**
   * Handle Alert Condition Met
   */
  private async handleAlertCondition(rule: AlertRule, metricValues: number[]): Promise<void> {
    const alertId = `${rule.id}_${Date.now()}`

    // Check if alert already exists and is in cooldown
    const existingAlert = Array.from(this.activeAlerts.values())
      .find(alert => alert.ruleId === rule.id && !alert.resolved)

    if (existingAlert) {
      const timeSinceLastAlert = Date.now() - existingAlert.timestamp.getTime()
      if (timeSinceLastAlert < rule.cooldownPeriod * 1000) {
        return // Still in cooldown period
      }
    }

    // Create new alert
    const alert: Alert = {
      id: alertId,
      ruleId: rule.id,
      type: rule.type,
      severity: rule.severity,
      title: rule.name,
      description: this.generateAlertDescription(rule, metricValues),
      timestamp: new Date(),
      resolved: false,
      metadata: {
        ...rule.metadata,
        metricValues: metricValues.slice(-10), // Last 10 values
        threshold: rule.threshold,
      },
      metrics: [{
        name: rule.condition.metric,
        value: metricValues[metricValues.length - 1],
        threshold: typeof rule.condition.value === 'number' ? rule.condition.value : 0,
        timestamp: new Date(),
      }]
    }

    // Store alert
    this.activeAlerts.set(alertId, alert)
    this.alertHistory.push(alert)

    // Send notifications
    await this.sendAlertNotifications(alert, rule)

    // Handle escalation rules
    if (rule.escalationRules) {
      this.scheduleEscalation(alert, rule.escalationRules)
    }

    // Store in Redis for persistence
    await redisService.setAlert(alertId, alert)

    console.log(`[Alerts] Alert triggered: ${rule.name} (${rule.severity})`)
  }

  /**
   * Send Alert Notifications
   */
  private async sendAlertNotifications(alert: Alert, rule: AlertRule): Promise<void> {
    const applicableRecipients = rule.recipients.filter(recipient =>
      recipient.severity.includes(alert.severity)
    )

    for (const recipient of applicableRecipients) {
      try {
        await this.sendNotification(recipient, alert)
      } catch (error) {
        console.error(`[Alerts] Failed to send notification to ${recipient.address}:`, error)
      }
    }
  }

  /**
   * Send Individual Notification
   */
  private async sendNotification(recipient: AlertRecipient, alert: Alert): Promise<void> {
    const message = this.formatAlertMessage(alert)

    switch (recipient.type) {
      case 'email':
        await this.sendEmailNotification(recipient.address, alert, message)
        break
      case 'slack':
        await this.sendSlackNotification(recipient.address, alert, message)
        break
      case 'webhook':
        await this.sendWebhookNotification(recipient.address, alert)
        break
      case 'sms':
        await this.sendSMSNotification(recipient.address, alert, message)
        break
      case 'pagerduty':
        await this.sendPagerDutyNotification(recipient.address, alert)
        break
    }
  }

  /**
   * Acknowledge Alert
   */
  async acknowledgeAlert(alertId: string, userId: string): Promise<void> {
    const alert = this.activeAlerts.get(alertId)
    if (!alert) throw new Error(`Alert ${alertId} not found`)

    alert.acknowledgedBy = userId
    alert.acknowledgedAt = new Date()

    await redisService.setAlert(alertId, alert)
    console.log(`[Alerts] Alert ${alertId} acknowledged by ${userId}`)
  }

  /**
   * Resolve Alert
   */
  async resolveAlert(alertId: string, userId?: string): Promise<void> {
    const alert = this.activeAlerts.get(alertId)
    if (!alert) throw new Error(`Alert ${alertId} not found`)

    alert.resolved = true
    alert.resolvedAt = new Date()

    this.activeAlerts.delete(alertId)
    await redisService.setAlert(alertId, alert)

    console.log(`[Alerts] Alert ${alertId} resolved${userId ? ` by ${userId}` : ' automatically'}`)
  }

  /**
   * Get Active Alerts
   */
  getActiveAlerts(severity?: AlertSeverity, type?: AlertType): Alert[] {
    let alerts = Array.from(this.activeAlerts.values())

    if (severity) {
      alerts = alerts.filter(alert => alert.severity === severity)
    }

    if (type) {
      alerts = alerts.filter(alert => alert.type === type)
    }

    return alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  /**
   * Get Alert History
   */
  getAlertHistory(limit: number = 100, offset: number = 0): Alert[] {
    return this.alertHistory
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(offset, offset + limit)
  }

  /**
   * Helper Methods
   */
  private async getMetricValues(metricName: string, timeWindowSeconds: number): Promise<number[]> {
    // This would integrate with your metrics storage system
    // For now, return mock data
    return [Math.random() * 100]
  }

  private async checkAutoResolve(rule: AlertRule): Promise<void> {
    // Check if any active alerts for this rule should be auto-resolved
    const activeAlert = Array.from(this.activeAlerts.values())
      .find(alert => alert.ruleId === rule.id && !alert.resolved)

    if (activeAlert) {
      // Auto-resolve if condition is no longer met for sufficient time
      await this.resolveAlert(activeAlert.id)
    }
  }

  private generateAlertDescription(rule: AlertRule, values: number[]): string {
    const latestValue = values[values.length - 1]
    return `${rule.condition.metric} is ${latestValue} (threshold: ${rule.condition.value})`
  }

  private formatAlertMessage(alert: Alert): string {
    return `🚨 ALERT: ${alert.title}\n` +
           `Severity: ${alert.severity.toUpperCase()}\n` +
           `Description: ${alert.description}\n` +
           `Time: ${alert.timestamp.toISOString()}\n` +
           `Alert ID: ${alert.id}`
  }

  private scheduleEscalation(alert: Alert, escalationRules: EscalationRule[]): void {
    escalationRules.forEach((rule, index) => {
      setTimeout(async () => {
        // Check if alert is still active
        if (this.activeAlerts.has(alert.id)) {
          await this.handleEscalation(alert, rule)
        }
      }, rule.delay * 60 * 1000) // Convert minutes to milliseconds
    })
  }

  private async handleEscalation(alert: Alert, escalationRule: EscalationRule): Promise<void> {
    // Send escalation notifications
    for (const recipient of escalationRule.recipients) {
      await this.sendNotification(recipient, alert)
    }

    // Execute escalation action
    if (escalationRule.action) {
      await this.executeEscalationAction(escalationRule.action, alert)
    }

    console.log(`[Alerts] Escalation executed for alert ${alert.id}`)
  }

  private async executeEscalationAction(action: string, alert: Alert): Promise<void> {
    switch (action) {
      case 'auto_scale':
        // Trigger auto-scaling
        console.log(`[Alerts] Auto-scaling triggered for ${alert.id}`)
        break
      case 'failover':
        // Trigger failover
        console.log(`[Alerts] Failover triggered for ${alert.id}`)
        break
      case 'circuit_breaker':
        // Open circuit breaker
        console.log(`[Alerts] Circuit breaker opened for ${alert.id}`)
        break
    }
  }

  // Notification methods (these would integrate with actual services)
  private async sendEmailNotification(email: string, alert: Alert, message: string): Promise<void> {
    console.log(`[Alerts] Email sent to ${email}: ${message}`)
  }

  private async sendSlackNotification(channel: string, alert: Alert, message: string): Promise<void> {
    console.log(`[Alerts] Slack message sent to ${channel}: ${message}`)
  }

  private async sendWebhookNotification(url: string, alert: Alert): Promise<void> {
    console.log(`[Alerts] Webhook called: ${url}`)
  }

  private async sendSMSNotification(phone: string, alert: Alert, message: string): Promise<void> {
    console.log(`[Alerts] SMS sent to ${phone}: ${message}`)
  }

  private async sendPagerDutyNotification(serviceKey: string, alert: Alert): Promise<void> {
    console.log(`[Alerts] PagerDuty incident created: ${serviceKey}`)
  }
}

// Singleton instance
let alertingInstance: AlertingService | null = null

export function initializeAlerting(): AlertingService {
  if (!alertingInstance) {
    alertingInstance = new AlertingService()
  }
  return alertingInstance
}

export function getAlerting(): AlertingService | null {
  return alertingInstance
}

export { AlertingService }