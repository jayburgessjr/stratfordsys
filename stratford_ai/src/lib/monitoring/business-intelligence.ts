/**
 * Business Intelligence Dashboard System
 * Advanced analytics and reporting for Stratford AI Wealth Engine
 */

import { redisService } from '../database/redis'
import { prisma } from '../database/prisma'
import { mongoService } from '../database/mongodb'

// Dashboard Configuration
export interface DashboardConfig {
  id: string
  name: string
  description: string
  category: DashboardCategory
  widgets: Widget[]
  refreshInterval: number // milliseconds
  permissions: DashboardPermission[]
  filters: DashboardFilter[]
  layout: DashboardLayout
}

export type DashboardCategory =
  | 'trading_performance'
  | 'risk_management'
  | 'market_analysis'
  | 'system_health'
  | 'user_behavior'
  | 'financial_overview'
  | 'compliance'

export interface Widget {
  id: string
  type: WidgetType
  title: string
  dataSource: DataSource
  configuration: WidgetConfig
  position: WidgetPosition
  size: WidgetSize
  refreshInterval?: number
}

export type WidgetType =
  | 'line_chart'
  | 'bar_chart'
  | 'pie_chart'
  | 'gauge'
  | 'metric_card'
  | 'data_table'
  | 'heatmap'
  | 'candlestick'
  | 'treemap'
  | 'scatter_plot'

export interface DataSource {
  type: 'sql' | 'mongodb' | 'redis' | 'api' | 'calculated'
  query: string
  parameters?: Record<string, any>
  cacheTTL?: number
}

export interface WidgetConfig {
  xAxis?: string
  yAxis?: string[]
  groupBy?: string
  aggregation?: 'sum' | 'avg' | 'count' | 'max' | 'min'
  colors?: string[]
  format?: 'currency' | 'percentage' | 'number' | 'date'
  thresholds?: Threshold[]
}

export interface Threshold {
  value: number
  color: string
  label: string
}

export interface WidgetPosition {
  x: number
  y: number
}

export interface WidgetSize {
  width: number
  height: number
}

export interface DashboardPermission {
  userId?: string
  role?: string
  permissions: ('view' | 'edit' | 'admin')[]
}

export interface DashboardFilter {
  id: string
  type: 'date_range' | 'select' | 'multi_select' | 'text'
  label: string
  defaultValue?: any
  options?: { value: any; label: string }[]
}

export interface DashboardLayout {
  columns: number
  rows: number
  gap: number
}

// Analytics Data Types
export interface TradingAnalytics {
  portfolioPerformance: PortfolioPerformanceData[]
  riskMetrics: RiskMetricsData[]
  tradingVolume: TradingVolumeData[]
  strategyComparison: StrategyComparisonData[]
  marketExposure: MarketExposureData[]
}

export interface PortfolioPerformanceData {
  portfolioId: string
  portfolioName: string
  totalValue: number
  dailyReturn: number
  weeklyReturn: number
  monthlyReturn: number
  yearToDateReturn: number
  sharpeRatio: number
  maxDrawdown: number
  volatility: number
  benchmark: string
  benchmarkReturn: number
  alpha: number
  beta: number
  timestamp: Date
}

export interface RiskMetricsData {
  portfolioId: string
  var95: number
  var99: number
  expectedShortfall: number
  leverage: number
  concentration: number
  correlationRisk: number
  liquidityRisk: number
  timestamp: Date
}

export interface TradingVolumeData {
  date: Date
  symbol: string
  volume: number
  value: number
  trades: number
  avgTradeSize: number
  marketShare: number
}

export interface StrategyComparisonData {
  strategyId: string
  strategyName: string
  totalReturn: number
  sharpeRatio: number
  maxDrawdown: number
  winRate: number
  avgWinSize: number
  avgLossSize: number
  profitFactor: number
  trades: number
}

export interface MarketExposureData {
  sector: string
  allocation: number
  value: number
  dayChange: number
  performance: number
}

class BusinessIntelligenceService {
  private dashboards: Map<string, DashboardConfig> = new Map()
  private widgetCache: Map<string, any> = new Map()
  private analyticsCache: Map<string, any> = new Map()

  constructor() {
    this.initializeDefaultDashboards()
  }

  /**
   * Initialize Default BI Dashboards
   */
  private initializeDefaultDashboards(): void {
    const dashboards: DashboardConfig[] = [
      // Trading Performance Dashboard
      {
        id: 'trading_performance',
        name: 'Trading Performance Overview',
        description: 'Comprehensive view of trading performance across all portfolios',
        category: 'trading_performance',
        refreshInterval: 30000, // 30 seconds
        layout: { columns: 12, rows: 8, gap: 16 },
        permissions: [
          { role: 'trader', permissions: ['view'] },
          { role: 'portfolio_manager', permissions: ['view', 'edit'] },
          { role: 'admin', permissions: ['view', 'edit', 'admin'] }
        ],
        filters: [
          {
            id: 'date_range',
            type: 'date_range',
            label: 'Date Range',
            defaultValue: { start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), end: new Date() }
          },
          {
            id: 'portfolio',
            type: 'multi_select',
            label: 'Portfolios',
            options: [] // Would be populated dynamically
          }
        ],
        widgets: [
          {
            id: 'total_pnl',
            type: 'metric_card',
            title: 'Total P&L',
            position: { x: 0, y: 0 },
            size: { width: 3, height: 2 },
            dataSource: {
              type: 'sql',
              query: `
                SELECT SUM(total_return * initial_capital) as total_pnl
                FROM portfolio_performance
                WHERE DATE(created_at) >= $1 AND DATE(created_at) <= $2
              `,
              cacheTTL: 300
            },
            configuration: {
              format: 'currency',
              thresholds: [
                { value: 0, color: '#10B981', label: 'Positive' },
                { value: -1000, color: '#EF4444', label: 'Negative' }
              ]
            }
          },
          {
            id: 'sharpe_ratio',
            type: 'gauge',
            title: 'Average Sharpe Ratio',
            position: { x: 3, y: 0 },
            size: { width: 3, height: 2 },
            dataSource: {
              type: 'sql',
              query: `
                SELECT AVG(sharpe_ratio) as avg_sharpe
                FROM portfolio_performance
                WHERE DATE(created_at) >= $1 AND DATE(created_at) <= $2
              `,
              cacheTTL: 300
            },
            configuration: {
              format: 'number',
              thresholds: [
                { value: 2.0, color: '#10B981', label: 'Excellent' },
                { value: 1.0, color: '#F59E0B', label: 'Good' },
                { value: 0.5, color: '#EF4444', label: 'Poor' }
              ]
            }
          },
          {
            id: 'portfolio_performance_chart',
            type: 'line_chart',
            title: 'Portfolio Performance Over Time',
            position: { x: 6, y: 0 },
            size: { width: 6, height: 4 },
            dataSource: {
              type: 'sql',
              query: `
                SELECT
                  DATE(created_at) as date,
                  portfolio_name,
                  total_return
                FROM portfolio_performance
                WHERE DATE(created_at) >= $1 AND DATE(created_at) <= $2
                ORDER BY date, portfolio_name
              `,
              cacheTTL: 180
            },
            configuration: {
              xAxis: 'date',
              yAxis: ['total_return'],
              groupBy: 'portfolio_name',
              format: 'percentage'
            }
          },
          {
            id: 'top_performers',
            type: 'data_table',
            title: 'Top Performing Strategies',
            position: { x: 0, y: 2 },
            size: { width: 6, height: 3 },
            dataSource: {
              type: 'sql',
              query: `
                SELECT
                  strategy_name,
                  total_return,
                  sharpe_ratio,
                  max_drawdown,
                  trade_count
                FROM strategy_performance
                WHERE DATE(updated_at) >= $1
                ORDER BY total_return DESC
                LIMIT 10
              `,
              cacheTTL: 600
            },
            configuration: {
              format: 'percentage'
            }
          },
          {
            id: 'risk_heatmap',
            type: 'heatmap',
            title: 'Portfolio Risk Heatmap',
            position: { x: 0, y: 5 },
            size: { width: 12, height: 3 },
            dataSource: {
              type: 'sql',
              query: `
                SELECT
                  portfolio_name,
                  'VaR_95' as metric,
                  var_95 as value
                FROM risk_metrics
                WHERE DATE(calculated_at) >= $1
                UNION ALL
                SELECT
                  portfolio_name,
                  'Max_Drawdown' as metric,
                  max_drawdown as value
                FROM portfolio_performance
                WHERE DATE(created_at) >= $1
              `,
              cacheTTL: 300
            },
            configuration: {
              xAxis: 'portfolio_name',
              yAxis: ['metric'],
              colors: ['#EF4444', '#F59E0B', '#10B981']
            }
          }
        ]
      },

      // Risk Management Dashboard
      {
        id: 'risk_management',
        name: 'Risk Management Console',
        description: 'Real-time risk monitoring and control',
        category: 'risk_management',
        refreshInterval: 15000, // 15 seconds
        layout: { columns: 12, rows: 6, gap: 16 },
        permissions: [
          { role: 'risk_manager', permissions: ['view', 'edit'] },
          { role: 'compliance', permissions: ['view'] },
          { role: 'admin', permissions: ['view', 'edit', 'admin'] }
        ],
        filters: [
          {
            id: 'risk_type',
            type: 'select',
            label: 'Risk Type',
            options: [
              { value: 'market', label: 'Market Risk' },
              { value: 'credit', label: 'Credit Risk' },
              { value: 'liquidity', label: 'Liquidity Risk' },
              { value: 'operational', label: 'Operational Risk' }
            ]
          }
        ],
        widgets: [
          {
            id: 'var_gauge',
            type: 'gauge',
            title: 'Value at Risk (95%)',
            position: { x: 0, y: 0 },
            size: { width: 4, height: 2 },
            dataSource: {
              type: 'calculated',
              query: 'calculate_portfolio_var',
              parameters: { confidence: 0.95 },
              cacheTTL: 60
            },
            configuration: {
              format: 'currency',
              thresholds: [
                { value: 50000, color: '#EF4444', label: 'High Risk' },
                { value: 25000, color: '#F59E0B', label: 'Medium Risk' },
                { value: 10000, color: '#10B981', label: 'Low Risk' }
              ]
            }
          },
          {
            id: 'leverage_distribution',
            type: 'pie_chart',
            title: 'Leverage Distribution',
            position: { x: 4, y: 0 },
            size: { width: 4, height: 2 },
            dataSource: {
              type: 'sql',
              query: `
                SELECT
                  CASE
                    WHEN leverage < 1.5 THEN 'Low (< 1.5x)'
                    WHEN leverage < 3.0 THEN 'Medium (1.5-3x)'
                    ELSE 'High (> 3x)'
                  END as leverage_bucket,
                  COUNT(*) as portfolio_count
                FROM portfolio_metrics
                WHERE DATE(updated_at) = CURRENT_DATE
                GROUP BY leverage_bucket
              `,
              cacheTTL: 300
            },
            configuration: {
              colors: ['#10B981', '#F59E0B', '#EF4444']
            }
          }
        ]
      },

      // System Health Dashboard
      {
        id: 'system_health',
        name: 'System Health Monitor',
        description: 'Real-time system performance and health metrics',
        category: 'system_health',
        refreshInterval: 10000, // 10 seconds
        layout: { columns: 12, rows: 6, gap: 16 },
        permissions: [
          { role: 'devops', permissions: ['view', 'edit'] },
          { role: 'admin', permissions: ['view', 'edit', 'admin'] }
        ],
        filters: [],
        widgets: [
          {
            id: 'api_response_time',
            type: 'line_chart',
            title: 'API Response Time',
            position: { x: 0, y: 0 },
            size: { width: 6, height: 3 },
            dataSource: {
              type: 'redis',
              query: 'api_metrics:response_time:*',
              cacheTTL: 30
            },
            configuration: {
              xAxis: 'timestamp',
              yAxis: ['response_time'],
              format: 'number',
              thresholds: [
                { value: 1000, color: '#EF4444', label: 'Slow' },
                { value: 500, color: '#F59E0B', label: 'Acceptable' }
              ]
            }
          },
          {
            id: 'error_rate',
            type: 'metric_card',
            title: 'Error Rate',
            position: { x: 6, y: 0 },
            size: { width: 3, height: 2 },
            dataSource: {
              type: 'redis',
              query: 'system_metrics:error_rate',
              cacheTTL: 60
            },
            configuration: {
              format: 'percentage',
              thresholds: [
                { value: 5, color: '#EF4444', label: 'Critical' },
                { value: 1, color: '#F59E0B', label: 'Warning' }
              ]
            }
          }
        ]
      }
    ]

    dashboards.forEach(dashboard => {
      this.dashboards.set(dashboard.id, dashboard)
    })
  }

  /**
   * Get Dashboard Configuration
   */
  getDashboard(dashboardId: string): DashboardConfig | null {
    return this.dashboards.get(dashboardId) || null
  }

  /**
   * Get All Dashboards
   */
  getAllDashboards(category?: DashboardCategory): DashboardConfig[] {
    const dashboards = Array.from(this.dashboards.values())
    return category
      ? dashboards.filter(d => d.category === category)
      : dashboards
  }

  /**
   * Get Widget Data
   */
  async getWidgetData(
    widgetId: string,
    filters: Record<string, any> = {},
    useCache: boolean = true
  ): Promise<any> {
    const cacheKey = `widget:${widgetId}:${JSON.stringify(filters)}`

    if (useCache) {
      const cached = this.widgetCache.get(cacheKey)
      if (cached && cached.timestamp > Date.now() - (cached.ttl * 1000)) {
        return cached.data
      }
    }

    // Find widget configuration
    let widget: Widget | null = null
    for (const dashboard of this.dashboards.values()) {
      const foundWidget = dashboard.widgets.find(w => w.id === widgetId)
      if (foundWidget) {
        widget = foundWidget
        break
      }
    }

    if (!widget) {
      throw new Error(`Widget ${widgetId} not found`)
    }

    // Execute data source query
    const data = await this.executeDataSource(widget.dataSource, filters)

    // Cache the result
    this.widgetCache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      ttl: widget.dataSource.cacheTTL || 300
    })

    return data
  }

  /**
   * Execute Data Source Query
   */
  private async executeDataSource(
    dataSource: DataSource,
    filters: Record<string, any>
  ): Promise<any> {
    switch (dataSource.type) {
      case 'sql':
        return this.executeSQLQuery(dataSource.query, filters)

      case 'mongodb':
        return this.executeMongoQuery(dataSource.query, filters)

      case 'redis':
        return this.executeRedisQuery(dataSource.query, filters)

      case 'api':
        return this.executeAPIQuery(dataSource.query, filters)

      case 'calculated':
        return this.executeCalculatedQuery(dataSource.query, filters)

      default:
        throw new Error(`Unsupported data source type: ${dataSource.type}`)
    }
  }

  /**
   * Execute SQL Query
   */
  private async executeSQLQuery(query: string, filters: Record<string, any>): Promise<any> {
    const params = this.extractQueryParameters(filters)
    return await prisma.$queryRawUnsafe(query, ...params)
  }

  /**
   * Execute MongoDB Query
   */
  private async executeMongoQuery(query: string, filters: Record<string, any>): Promise<any> {
    // Parse and execute MongoDB aggregation pipeline
    const pipeline = JSON.parse(query)
    return await mongoService.aggregate('analytics', pipeline)
  }

  /**
   * Execute Redis Query
   */
  private async executeRedisQuery(pattern: string, filters: Record<string, any>): Promise<any> {
    const keys = await redisService.redis.keys(pattern)
    const data = await Promise.all(
      keys.map(async key => {
        const value = await redisService.redis.get(key)
        return { key, value: JSON.parse(value || '{}') }
      })
    )
    return data
  }

  /**
   * Execute API Query
   */
  private async executeAPIQuery(url: string, filters: Record<string, any>): Promise<any> {
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })
    return await response.json()
  }

  /**
   * Execute Calculated Query
   */
  private async executeCalculatedQuery(calculationType: string, filters: Record<string, any>): Promise<any> {
    switch (calculationType) {
      case 'calculate_portfolio_var':
        return this.calculatePortfolioVaR(filters)

      case 'calculate_sharpe_ratio':
        return this.calculateSharpeRatio(filters)

      case 'calculate_correlation_matrix':
        return this.calculateCorrelationMatrix(filters)

      default:
        throw new Error(`Unknown calculation type: ${calculationType}`)
    }
  }

  /**
   * Generate Trading Analytics Report
   */
  async generateTradingAnalytics(
    startDate: Date,
    endDate: Date,
    portfolioIds?: string[]
  ): Promise<TradingAnalytics> {
    const cacheKey = `analytics:trading:${startDate.toISOString()}:${endDate.toISOString()}:${portfolioIds?.join(',') || 'all'}`

    const cached = this.analyticsCache.get(cacheKey)
    if (cached && cached.timestamp > Date.now() - 300000) { // 5 minutes cache
      return cached.data
    }

    const [
      portfolioPerformance,
      riskMetrics,
      tradingVolume,
      strategyComparison,
      marketExposure
    ] = await Promise.all([
      this.getPortfolioPerformance(startDate, endDate, portfolioIds),
      this.getRiskMetrics(startDate, endDate, portfolioIds),
      this.getTradingVolume(startDate, endDate, portfolioIds),
      this.getStrategyComparison(startDate, endDate),
      this.getMarketExposure(portfolioIds)
    ])

    const analytics: TradingAnalytics = {
      portfolioPerformance,
      riskMetrics,
      tradingVolume,
      strategyComparison,
      marketExposure
    }

    this.analyticsCache.set(cacheKey, {
      data: analytics,
      timestamp: Date.now()
    })

    return analytics
  }

  /**
   * Export Dashboard Data
   */
  async exportDashboardData(
    dashboardId: string,
    format: 'csv' | 'xlsx' | 'pdf',
    filters: Record<string, any> = {}
  ): Promise<Buffer> {
    const dashboard = this.getDashboard(dashboardId)
    if (!dashboard) {
      throw new Error(`Dashboard ${dashboardId} not found`)
    }

    // Collect all widget data
    const widgetData = await Promise.all(
      dashboard.widgets.map(async widget => ({
        widget,
        data: await this.getWidgetData(widget.id, filters, false)
      }))
    )

    // Format data based on export format
    switch (format) {
      case 'csv':
        return this.exportToCSV(widgetData)
      case 'xlsx':
        return this.exportToExcel(widgetData)
      case 'pdf':
        return this.exportToPDF(dashboard, widgetData)
      default:
        throw new Error(`Unsupported export format: ${format}`)
    }
  }

  /**
   * Helper Methods
   */
  private extractQueryParameters(filters: Record<string, any>): any[] {
    // Extract and order parameters for SQL query
    const params: any[] = []

    if (filters.date_range) {
      params.push(filters.date_range.start)
      params.push(filters.date_range.end)
    }

    if (filters.portfolio) {
      params.push(filters.portfolio)
    }

    return params
  }

  private async calculatePortfolioVaR(params: Record<string, any>): Promise<number> {
    // Monte Carlo simulation for VaR calculation
    const confidence = params.confidence || 0.95

    // Simplified VaR calculation - in production, this would be more sophisticated
    const portfolioValue = 1000000 // Mock portfolio value
    const dailyVolatility = 0.02 // 2% daily volatility

    // Normal distribution approximation
    const zScore = confidence === 0.95 ? 1.645 : 2.326
    const var95 = portfolioValue * dailyVolatility * zScore

    return var95
  }

  private async calculateSharpeRatio(params: Record<string, any>): Promise<number> {
    // Calculate Sharpe ratio for given portfolio/strategy
    return 1.5 // Mock value
  }

  private async calculateCorrelationMatrix(params: Record<string, any>): Promise<number[][]> {
    // Calculate correlation matrix between portfolio positions
    return [[1, 0.5], [0.5, 1]] // Mock 2x2 correlation matrix
  }

  private async getPortfolioPerformance(
    startDate: Date,
    endDate: Date,
    portfolioIds?: string[]
  ): Promise<PortfolioPerformanceData[]> {
    // Fetch portfolio performance data from database
    return [] // Mock implementation
  }

  private async getRiskMetrics(
    startDate: Date,
    endDate: Date,
    portfolioIds?: string[]
  ): Promise<RiskMetricsData[]> {
    // Fetch risk metrics from database
    return [] // Mock implementation
  }

  private async getTradingVolume(
    startDate: Date,
    endDate: Date,
    portfolioIds?: string[]
  ): Promise<TradingVolumeData[]> {
    // Fetch trading volume data
    return [] // Mock implementation
  }

  private async getStrategyComparison(
    startDate: Date,
    endDate: Date
  ): Promise<StrategyComparisonData[]> {
    // Compare strategy performance
    return [] // Mock implementation
  }

  private async getMarketExposure(portfolioIds?: string[]): Promise<MarketExposureData[]> {
    // Calculate market exposure by sector
    return [] // Mock implementation
  }

  private async exportToCSV(widgetData: any[]): Promise<Buffer> {
    // Convert widget data to CSV format
    return Buffer.from('csv,data') // Mock implementation
  }

  private async exportToExcel(widgetData: any[]): Promise<Buffer> {
    // Convert widget data to Excel format
    return Buffer.from('excel,data') // Mock implementation
  }

  private async exportToPDF(dashboard: DashboardConfig, widgetData: any[]): Promise<Buffer> {
    // Generate PDF report
    return Buffer.from('pdf,data') // Mock implementation
  }
}

// Singleton instance
let biInstance: BusinessIntelligenceService | null = null

export function initializeBI(): BusinessIntelligenceService {
  if (!biInstance) {
    biInstance = new BusinessIntelligenceService()
  }
  return biInstance
}

export function getBI(): BusinessIntelligenceService | null {
  return biInstance
}

export { BusinessIntelligenceService }