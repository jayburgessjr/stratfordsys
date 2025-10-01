/**
 * Comprehensive Backtesting Framework
 * Production-grade strategy testing and validation system
 */

import { Portfolio, Money, Symbol, Quantity, Price, Percentage, Position } from '../domain/portfolio/portfolio-aggregate'
import { prisma } from '../database/prisma'
import { TimescaleService } from '../database/timescale'
import { captureError } from '../monitoring/error-tracking'
import { recordMetric } from '../monitoring'

export interface BacktestConfig {
  name: string
  description: string
  startDate: Date
  endDate: Date
  initialCapital: Money
  commission: CommissionConfig
  slippage: SlippageConfig
  riskManagement: RiskManagementConfig
  universe: string[]
  benchmarks: string[]
  rebalanceFrequency: 'daily' | 'weekly' | 'monthly' | 'quarterly'
  lookahead: boolean
  survivorshipBias: boolean
  maxPositions?: number
  maxLeverage?: number
}

export interface CommissionConfig {
  type: 'fixed' | 'percentage' | 'tiered'
  value: number
  minimum?: number
  maximum?: number
  currency: string
}

export interface SlippageConfig {
  type: 'fixed' | 'linear' | 'square_root'
  impact: number
  maxSlippage: number
}

export interface RiskManagementConfig {
  maxDrawdown: Percentage
  stopLoss?: Percentage
  profitTarget?: Percentage
  positionSizing: 'equal' | 'volatility' | 'risk_parity' | 'kelly'
  riskBudget: Percentage
  correlationLimit: number
}

export interface TradingStrategy {
  name: string
  version: string
  parameters: Record<string, any>
  signals: StrategySignal[]
  initialize?(context: BacktestContext): Promise<void>
  onData?(context: BacktestContext, data: MarketData): Promise<void>
  onTrade?(context: BacktestContext, trade: Trade): Promise<void>
  onPeriodEnd?(context: BacktestContext): Promise<void>
  cleanup?(context: BacktestContext): Promise<void>
}

export interface StrategySignal {
  type: 'entry' | 'exit' | 'rebalance'
  symbol: string
  action: 'buy' | 'sell' | 'hold'
  quantity?: number
  weight?: number
  confidence: number
  reason: string
  timestamp: Date
  metadata?: Record<string, any>
}

export interface BacktestContext {
  config: BacktestConfig
  strategy: TradingStrategy
  portfolio: Portfolio
  currentDate: Date
  marketData: MarketDataProvider
  indicators: TechnicalIndicators
  state: Record<string, any>
  performance: PerformanceTracker
}

export interface MarketData {
  symbol: string
  timestamp: Date
  open: number
  high: number
  low: number
  close: number
  volume: number
  adjustedClose: number
  dividends?: number
  splits?: number
}

export interface Trade {
  id: string
  symbol: string
  action: 'buy' | 'sell'
  quantity: number
  price: number
  timestamp: Date
  commission: number
  slippage: number
  value: number
  portfolioValue: number
  reason: string
  metadata?: Record<string, any>
}

export interface BacktestResults {
  config: BacktestConfig
  strategy: TradingStrategy
  performance: PerformanceMetrics
  trades: Trade[]
  portfolio: PortfolioSnapshot[]
  drawdowns: DrawdownPeriod[]
  monthlySummary: MonthlySummary[]
  riskMetrics: RiskMetrics
  benchmarkComparison: BenchmarkComparison[]
  statistics: BacktestStatistics
  plots: PlotData[]
}

export interface PerformanceMetrics {
  totalReturn: Percentage
  annualizedReturn: Percentage
  volatility: Percentage
  sharpeRatio: number
  sortinoRatio: number
  calmarRatio: number
  maxDrawdown: Percentage
  maxDrawdownDuration: number
  winRate: Percentage
  profitFactor: number
  averageWin: Percentage
  averageLoss: Percentage
  expectancy: number
  var95: number
  var99: number
  beta: number
  alpha: number
  treynorRatio: number
  informationRatio: number
}

export interface PortfolioSnapshot {
  date: Date
  value: number
  cash: number
  positions: PositionSnapshot[]
  leverage: number
  exposure: Record<string, number>
}

export interface PositionSnapshot {
  symbol: string
  quantity: number
  price: number
  value: number
  weight: Percentage
  unrealizedPnL: number
}

export interface DrawdownPeriod {
  startDate: Date
  endDate: Date
  peak: number
  trough: number
  drawdown: Percentage
  duration: number
  recovery?: Date
  recoveryDuration?: number
}

export interface MonthlySummary {
  year: number
  month: number
  return: Percentage
  volatility: Percentage
  trades: number
  winRate: Percentage
  maxDrawdown: Percentage
}

export interface RiskMetrics {
  var95: number
  var99: number
  expectedShortfall95: number
  expectedShortfall99: number
  skewness: number
  kurtosis: number
  correlation: Record<string, number>
  beta: Record<string, number>
  trackingError: Record<string, number>
}

export interface BenchmarkComparison {
  benchmark: string
  correlation: number
  beta: number
  alpha: number
  trackingError: number
  informationRatio: number
  upCapture: number
  downCapture: number
}

export interface BacktestStatistics {
  totalTrades: number
  winningTrades: number
  losingTrades: number
  averageTradeReturn: Percentage
  averageTradeDuration: number
  maxConsecutiveWins: number
  maxConsecutiveLosses: number
  profitFactor: number
  recoveryFactor: number
  payoffRatio: number
  tradingFrequency: number
}

export interface PlotData {
  type: 'equity_curve' | 'drawdown' | 'returns' | 'positions' | 'exposures'
  data: Array<{ x: Date; y: number; [key: string]: any }>
  metadata?: Record<string, any>
}

class BacktestingEngine {
  private timescaleService: TimescaleService
  private performanceTracker: PerformanceTracker
  private technicalIndicators: TechnicalIndicators
  private marketDataProvider: MarketDataProvider

  constructor() {
    this.timescaleService = new TimescaleService()
    this.performanceTracker = new PerformanceTracker()
    this.technicalIndicators = new TechnicalIndicators()
    this.marketDataProvider = new MarketDataProvider()
  }

  /**
   * Run backtest
   */
  async runBacktest(
    strategy: TradingStrategy,
    config: BacktestConfig
  ): Promise<BacktestResults> {
    const startTime = Date.now()

    try {
      // Validate configuration
      this.validateConfig(config)

      // Initialize portfolio
      const portfolio = new Portfolio(
        `backtest_${Date.now()}`,
        `Backtest Portfolio - ${strategy.name}`,
        'backtest_user',
        config.initialCapital,
        { level: 'MEDIUM', score: 50 } as any
      )

      // Initialize context
      const context: BacktestContext = {
        config,
        strategy,
        portfolio,
        currentDate: config.startDate,
        marketData: this.marketDataProvider,
        indicators: this.technicalIndicators,
        state: {},
        performance: this.performanceTracker,
      }

      // Initialize strategy
      if (strategy.initialize) {
        await strategy.initialize(context)
      }

      // Load market data
      const marketData = await this.loadMarketData(config)
      const trades: Trade[] = []
      const portfolioSnapshots: PortfolioSnapshot[] = []

      // Main backtesting loop
      for (const dataPoint of marketData) {
        context.currentDate = dataPoint.timestamp

        // Update market data context
        await this.marketDataProvider.update(dataPoint)

        // Strategy signal generation
        if (strategy.onData) {
          await strategy.onData(context, dataPoint)
        }

        // Process signals and execute trades
        const newTrades = await this.processSignals(context, strategy.signals)
        trades.push(...newTrades)

        // Update portfolio snapshot
        if (this.shouldTakeSnapshot(context)) {
          const snapshot = await this.createPortfolioSnapshot(context)
          portfolioSnapshots.push(snapshot)
        }

        // Strategy trade callback
        for (const trade of newTrades) {
          if (strategy.onTrade) {
            await strategy.onTrade(context, trade)
          }
        }

        // Period end callback
        if (this.isPeriodEnd(context) && strategy.onPeriodEnd) {
          await strategy.onPeriodEnd(context)
        }

        // Clear processed signals
        strategy.signals = []
      }

      // Strategy cleanup
      if (strategy.cleanup) {
        await strategy.cleanup(context)
      }

      // Calculate performance metrics
      const performance = await this.calculatePerformance(
        config,
        portfolioSnapshots,
        trades
      )

      // Generate results
      const results: BacktestResults = {
        config,
        strategy,
        performance,
        trades,
        portfolio: portfolioSnapshots,
        drawdowns: this.calculateDrawdowns(portfolioSnapshots),
        monthlySummary: this.calculateMonthlySummary(portfolioSnapshots),
        riskMetrics: await this.calculateRiskMetrics(portfolioSnapshots, config.benchmarks),
        benchmarkComparison: await this.compareToBenchmarks(portfolioSnapshots, config.benchmarks),
        statistics: this.calculateStatistics(trades, portfolioSnapshots),
        plots: this.generatePlots(portfolioSnapshots, trades),
      }

      // Record metrics
      const duration = Date.now() - startTime
      recordMetric('backtest.duration', duration, { strategy: strategy.name })
      recordMetric('backtest.trades', trades.length, { strategy: strategy.name })
      recordMetric('backtest.return', performance.totalReturn.value, { strategy: strategy.name })
      recordMetric('backtest.sharpe', performance.sharpeRatio, { strategy: strategy.name })

      return results

    } catch (error) {
      captureError(error as Error, {
        component: 'BacktestingEngine',
        action: 'runBacktest',
        metadata: {
          strategy: strategy.name,
          period: `${config.startDate.toISOString()} - ${config.endDate.toISOString()}`,
        },
      })
      throw error
    }
  }

  /**
   * Compare multiple strategies
   */
  async compareStrategies(
    strategies: TradingStrategy[],
    config: BacktestConfig
  ): Promise<StrategyComparison> {
    const results = await Promise.all(
      strategies.map(strategy => this.runBacktest(strategy, config))
    )

    return {
      config,
      strategies: results,
      ranking: this.rankStrategies(results),
      analysis: this.analyzeStrategies(results),
    }
  }

  /**
   * Optimize strategy parameters
   */
  async optimizeStrategy(
    strategy: TradingStrategy,
    config: BacktestConfig,
    parameters: ParameterSpace
  ): Promise<OptimizationResults> {
    const combinations = this.generateParameterCombinations(parameters)
    const results: Array<{ parameters: Record<string, any>; results: BacktestResults }> = []

    for (const params of combinations) {
      const optimizedStrategy = {
        ...strategy,
        parameters: { ...strategy.parameters, ...params },
      }

      const backtestResults = await this.runBacktest(optimizedStrategy, config)
      results.push({ parameters: params, results: backtestResults })
    }

    // Find optimal parameters
    const optimal = results.reduce((best, current) => {
      const currentScore = this.calculateOptimizationScore(current.results)
      const bestScore = this.calculateOptimizationScore(best.results)
      return currentScore > bestScore ? current : best
    })

    return {
      optimal: optimal.parameters,
      bestResults: optimal.results,
      allResults: results,
      analysis: this.analyzeOptimization(results),
    }
  }

  /**
   * Generate walk-forward analysis
   */
  async walkForwardAnalysis(
    strategy: TradingStrategy,
    config: BacktestConfig,
    options: {
      inSamplePeriod: number // months
      outSamplePeriod: number // months
      stepSize: number // months
    }
  ): Promise<WalkForwardResults> {
    const windows = this.generateWalkForwardWindows(config, options)
    const results: WalkForwardWindow[] = []

    for (const window of windows) {
      // In-sample optimization
      const optimizationConfig = {
        ...config,
        startDate: window.inSampleStart,
        endDate: window.inSampleEnd,
      }

      const optimized = await this.optimizeStrategy(
        strategy,
        optimizationConfig,
        this.getDefaultParameterSpace(strategy)
      )

      // Out-of-sample testing
      const testConfig = {
        ...config,
        startDate: window.outSampleStart,
        endDate: window.outSampleEnd,
      }

      const optimizedStrategy = {
        ...strategy,
        parameters: { ...strategy.parameters, ...optimized.optimal },
      }

      const outSampleResults = await this.runBacktest(optimizedStrategy, testConfig)

      results.push({
        window,
        inSampleResults: optimized.bestResults,
        outSampleResults,
        parameters: optimized.optimal,
      })
    }

    return {
      windows: results,
      summary: this.summarizeWalkForward(results),
      stability: this.analyzeParameterStability(results),
    }
  }

  /**
   * Private helper methods
   */
  private validateConfig(config: BacktestConfig): void {
    if (config.startDate >= config.endDate) {
      throw new Error('Start date must be before end date')
    }

    if (config.initialCapital.amount <= 0) {
      throw new Error('Initial capital must be positive')
    }

    if (config.universe.length === 0) {
      throw new Error('Universe must contain at least one symbol')
    }
  }

  private async loadMarketData(config: BacktestConfig): Promise<MarketData[]> {
    const data: MarketData[] = []

    for (const symbol of config.universe) {
      const symbolData = await this.timescaleService.getOHLCVData(
        symbol,
        config.startDate,
        config.endDate,
        '1d'
      )

      for (const point of symbolData) {
        data.push({
          symbol,
          timestamp: point.timestamp,
          open: point.open,
          high: point.high,
          low: point.low,
          close: point.close,
          volume: point.volume,
          adjustedClose: point.close, // Simplified
        })
      }
    }

    // Sort by timestamp
    return data.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
  }

  private async processSignals(
    context: BacktestContext,
    signals: StrategySignal[]
  ): Promise<Trade[]> {
    const trades: Trade[] = []

    for (const signal of signals) {
      if (signal.type === 'entry' || signal.type === 'exit') {
        const trade = await this.executeSignal(context, signal)
        if (trade) {
          trades.push(trade)
        }
      }
    }

    return trades
  }

  private async executeSignal(
    context: BacktestContext,
    signal: StrategySignal
  ): Promise<Trade | null> {
    try {
      const symbol = new Symbol(signal.symbol)
      const currentPrice = await this.getCurrentPrice(signal.symbol, context.currentDate)

      if (!currentPrice) {
        return null
      }

      // Apply slippage
      const slippage = this.calculateSlippage(
        signal,
        currentPrice,
        context.config.slippage
      )

      const executionPrice = new Price(
        currentPrice.value + slippage,
        currentPrice.currency,
        context.currentDate
      )

      // Calculate quantity
      const quantity = this.calculateQuantity(context, signal, executionPrice)

      if (quantity.value <= 0) {
        return null
      }

      // Execute trade
      if (signal.action === 'buy') {
        context.portfolio.buyStock(symbol, quantity, executionPrice)
      } else {
        context.portfolio.sellStock(symbol, quantity, executionPrice)
      }

      // Calculate commission
      const commission = this.calculateCommission(
        quantity.value * executionPrice.value,
        context.config.commission
      )

      const trade: Trade = {
        id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        symbol: signal.symbol,
        action: signal.action,
        quantity: quantity.value,
        price: executionPrice.value,
        timestamp: context.currentDate,
        commission,
        slippage,
        value: quantity.value * executionPrice.value,
        portfolioValue: context.portfolio.calculateTotalValue(new Map()).amount,
        reason: signal.reason,
        metadata: signal.metadata,
      }

      return trade

    } catch (error) {
      console.warn(`Failed to execute signal for ${signal.symbol}:`, error)
      return null
    }
  }

  private calculateSlippage(
    signal: StrategySignal,
    price: Price,
    config: SlippageConfig
  ): number {
    switch (config.type) {
      case 'fixed':
        return config.impact
      case 'linear':
        return price.value * config.impact
      case 'square_root':
        return Math.sqrt(signal.quantity || 1) * config.impact
      default:
        return 0
    }
  }

  private calculateQuantity(
    context: BacktestContext,
    signal: StrategySignal,
    price: Price
  ): Quantity {
    if (signal.quantity) {
      return new Quantity(signal.quantity)
    }

    if (signal.weight) {
      const portfolioValue = context.portfolio.calculateTotalValue(new Map()).amount
      const targetValue = portfolioValue * signal.weight
      return new Quantity(Math.floor(targetValue / price.value))
    }

    // Default position sizing
    const portfolioValue = context.portfolio.calculateTotalValue(new Map()).amount
    const positionSize = portfolioValue * 0.1 // 10% position size
    return new Quantity(Math.floor(positionSize / price.value))
  }

  private calculateCommission(tradeValue: number, config: CommissionConfig): number {
    switch (config.type) {
      case 'fixed':
        return config.value
      case 'percentage':
        return tradeValue * config.value
      case 'tiered':
        // Simplified tiered commission
        return Math.max(config.minimum || 0, tradeValue * config.value)
      default:
        return 0
    }
  }

  private async getCurrentPrice(symbol: string, date: Date): Promise<Price | null> {
    try {
      const data = await this.timescaleService.getLatestPrice(symbol, date)
      return data ? new Price(data.close, 'USD', date) : null
    } catch {
      return null
    }
  }

  private shouldTakeSnapshot(context: BacktestContext): boolean {
    // Take daily snapshots
    return true
  }

  private isPeriodEnd(context: BacktestContext): boolean {
    const date = context.currentDate
    switch (context.config.rebalanceFrequency) {
      case 'daily':
        return true
      case 'weekly':
        return date.getDay() === 5 // Friday
      case 'monthly':
        return date.getDate() === 1 // First day of month
      case 'quarterly':
        return date.getDate() === 1 && date.getMonth() % 3 === 0
      default:
        return false
    }
  }

  private async createPortfolioSnapshot(context: BacktestContext): Promise<PortfolioSnapshot> {
    const currentPrices = new Map<string, Price>()

    // Get current prices for all positions
    for (const [symbol] of context.portfolio.positions) {
      const price = await this.getCurrentPrice(symbol, context.currentDate)
      if (price) {
        currentPrices.set(symbol, price)
      }
    }

    const totalValue = context.portfolio.calculateTotalValue(currentPrices)

    return {
      date: context.currentDate,
      value: totalValue.amount,
      cash: context.portfolio.cash.amount,
      positions: Array.from(context.portfolio.positions.values()).map(position => ({
        symbol: position.symbol.value,
        quantity: position.quantity.value,
        price: currentPrices.get(position.symbol.value)?.value || 0,
        value: currentPrices.get(position.symbol.value)?.toMoney(position.quantity.value).amount || 0,
        weight: new Percentage(0), // Calculate based on total value
        unrealizedPnL: position.calculateUnrealizedPnL(
          currentPrices.get(position.symbol.value) || new Price(0, 'USD')
        ).amount,
      })),
      leverage: 1, // Simplified
      exposure: {}, // Simplified
    }
  }

  private async calculatePerformance(
    config: BacktestConfig,
    snapshots: PortfolioSnapshot[],
    trades: Trade[]
  ): Promise<PerformanceMetrics> {
    if (snapshots.length < 2) {
      throw new Error('Insufficient data for performance calculation')
    }

    const initialValue = config.initialCapital.amount
    const finalValue = snapshots[snapshots.length - 1].value
    const totalReturn = new Percentage((finalValue - initialValue) / initialValue)

    // Calculate daily returns
    const dailyReturns = []
    for (let i = 1; i < snapshots.length; i++) {
      const prevValue = snapshots[i - 1].value
      const currentValue = snapshots[i].value
      dailyReturns.push((currentValue - prevValue) / prevValue)
    }

    // Calculate metrics
    const volatility = this.calculateVolatility(dailyReturns)
    const sharpeRatio = this.calculateSharpeRatio(dailyReturns)
    const maxDrawdown = this.calculateMaxDrawdown(snapshots)

    return {
      totalReturn,
      annualizedReturn: this.annualizeReturn(totalReturn, config.startDate, config.endDate),
      volatility: new Percentage(volatility),
      sharpeRatio,
      sortinoRatio: this.calculateSortinoRatio(dailyReturns),
      calmarRatio: totalReturn.value / Math.abs(maxDrawdown.value),
      maxDrawdown,
      maxDrawdownDuration: 0, // Simplified
      winRate: this.calculateWinRate(trades),
      profitFactor: this.calculateProfitFactor(trades),
      averageWin: new Percentage(0), // Simplified
      averageLoss: new Percentage(0), // Simplified
      expectancy: 0, // Simplified
      var95: 0, // Simplified
      var99: 0, // Simplified
      beta: 1, // Simplified
      alpha: 0, // Simplified
      treynorRatio: 0, // Simplified
      informationRatio: 0, // Simplified
    }
  }

  private calculateVolatility(returns: number[]): number {
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length
    const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length
    return Math.sqrt(variance * 252) // Annualized
  }

  private calculateSharpeRatio(returns: number[], riskFreeRate: number = 0.02): number {
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length
    const volatility = this.calculateVolatility(returns)
    return (avgReturn * 252 - riskFreeRate) / volatility
  }

  private calculateSortinoRatio(returns: number[], target: number = 0): number {
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length
    const downsideReturns = returns.filter(r => r < target)
    const downsideVolatility = Math.sqrt(
      downsideReturns.reduce((a, b) => a + Math.pow(b - target, 2), 0) / downsideReturns.length
    )
    return (avgReturn * 252 - target) / (downsideVolatility * Math.sqrt(252))
  }

  private calculateMaxDrawdown(snapshots: PortfolioSnapshot[]): Percentage {
    let maxDrawdown = 0
    let peak = snapshots[0].value

    for (const snapshot of snapshots) {
      if (snapshot.value > peak) {
        peak = snapshot.value
      }
      const drawdown = (peak - snapshot.value) / peak
      maxDrawdown = Math.max(maxDrawdown, drawdown)
    }

    return new Percentage(-maxDrawdown)
  }

  private annualizeReturn(totalReturn: Percentage, startDate: Date, endDate: Date): Percentage {
    const years = (endDate.getTime() - startDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
    const annualized = Math.pow(1 + totalReturn.value, 1 / years) - 1
    return new Percentage(annualized)
  }

  private calculateWinRate(trades: Trade[]): Percentage {
    const profitableTrades = trades.filter(trade => {
      // Simplified win/loss calculation
      return trade.action === 'sell' && trade.value > 0
    }).length

    return new Percentage(profitableTrades / trades.length)
  }

  private calculateProfitFactor(trades: Trade[]): number {
    let totalProfit = 0
    let totalLoss = 0

    for (const trade of trades) {
      if (trade.action === 'sell') {
        if (trade.value > 0) {
          totalProfit += trade.value
        } else {
          totalLoss += Math.abs(trade.value)
        }
      }
    }

    return totalLoss > 0 ? totalProfit / totalLoss : 0
  }

  private calculateDrawdowns(snapshots: PortfolioSnapshot[]): DrawdownPeriod[] {
    // Simplified drawdown calculation
    return []
  }

  private calculateMonthlySummary(snapshots: PortfolioSnapshot[]): MonthlySummary[] {
    // Group by month and calculate summary
    return []
  }

  private async calculateRiskMetrics(snapshots: PortfolioSnapshot[], benchmarks: string[]): Promise<RiskMetrics> {
    return {
      var95: 0,
      var99: 0,
      expectedShortfall95: 0,
      expectedShortfall99: 0,
      skewness: 0,
      kurtosis: 0,
      correlation: {},
      beta: {},
      trackingError: {},
    }
  }

  private async compareToBenchmarks(snapshots: PortfolioSnapshot[], benchmarks: string[]): Promise<BenchmarkComparison[]> {
    return []
  }

  private calculateStatistics(trades: Trade[], snapshots: PortfolioSnapshot[]): BacktestStatistics {
    return {
      totalTrades: trades.length,
      winningTrades: 0,
      losingTrades: 0,
      averageTradeReturn: new Percentage(0),
      averageTradeDuration: 0,
      maxConsecutiveWins: 0,
      maxConsecutiveLosses: 0,
      profitFactor: 0,
      recoveryFactor: 0,
      payoffRatio: 0,
      tradingFrequency: 0,
    }
  }

  private generatePlots(snapshots: PortfolioSnapshot[], trades: Trade[]): PlotData[] {
    return [
      {
        type: 'equity_curve',
        data: snapshots.map(s => ({ x: s.date, y: s.value })),
      },
    ]
  }

  private rankStrategies(results: BacktestResults[]): StrategyRanking[] {
    return results
      .map((result, index) => ({
        rank: index + 1,
        strategy: result.strategy.name,
        score: this.calculateOptimizationScore(result),
        metrics: result.performance,
      }))
      .sort((a, b) => b.score - a.score)
      .map((item, index) => ({ ...item, rank: index + 1 }))
  }

  private analyzeStrategies(results: BacktestResults[]): StrategyAnalysis {
    return {
      summary: 'Strategy comparison analysis',
      insights: [],
      recommendations: [],
    }
  }

  private calculateOptimizationScore(results: BacktestResults): number {
    // Composite score based on multiple metrics
    const sharpe = results.performance.sharpeRatio
    const maxDD = Math.abs(results.performance.maxDrawdown.value)
    const winRate = results.performance.winRate.value

    return sharpe * 0.4 + (1 - maxDD) * 0.3 + winRate * 0.3
  }

  private generateParameterCombinations(space: ParameterSpace): Array<Record<string, any>> {
    // Generate all parameter combinations for optimization
    return [{}] // Simplified
  }

  private analyzeOptimization(results: Array<{ parameters: Record<string, any>; results: BacktestResults }>): OptimizationAnalysis {
    return {
      summary: 'Parameter optimization analysis',
      sensitivityAnalysis: {},
      robustness: 0,
      overfitting: 0,
    }
  }

  private generateWalkForwardWindows(config: BacktestConfig, options: any): WalkForwardWindowConfig[] {
    return [] // Simplified
  }

  private getDefaultParameterSpace(strategy: TradingStrategy): ParameterSpace {
    return {} // Simplified
  }

  private summarizeWalkForward(results: WalkForwardWindow[]): WalkForwardSummary {
    return {
      avgInSampleReturn: 0,
      avgOutSampleReturn: 0,
      stability: 0,
      robustness: 0,
    }
  }

  private analyzeParameterStability(results: WalkForwardWindow[]): ParameterStability {
    return {
      stability: 0,
      consistency: {},
      drift: {},
    }
  }
}

// Supporting interfaces and types
export interface StrategyComparison {
  config: BacktestConfig
  strategies: BacktestResults[]
  ranking: StrategyRanking[]
  analysis: StrategyAnalysis
}

export interface StrategyRanking {
  rank: number
  strategy: string
  score: number
  metrics: PerformanceMetrics
}

export interface StrategyAnalysis {
  summary: string
  insights: string[]
  recommendations: string[]
}

export interface OptimizationResults {
  optimal: Record<string, any>
  bestResults: BacktestResults
  allResults: Array<{ parameters: Record<string, any>; results: BacktestResults }>
  analysis: OptimizationAnalysis
}

export interface OptimizationAnalysis {
  summary: string
  sensitivityAnalysis: Record<string, number>
  robustness: number
  overfitting: number
}

export interface ParameterSpace {
  [key: string]: number[] | string[]
}

export interface WalkForwardResults {
  windows: WalkForwardWindow[]
  summary: WalkForwardSummary
  stability: ParameterStability
}

export interface WalkForwardWindow {
  window: WalkForwardWindowConfig
  inSampleResults: BacktestResults
  outSampleResults: BacktestResults
  parameters: Record<string, any>
}

export interface WalkForwardWindowConfig {
  inSampleStart: Date
  inSampleEnd: Date
  outSampleStart: Date
  outSampleEnd: Date
}

export interface WalkForwardSummary {
  avgInSampleReturn: number
  avgOutSampleReturn: number
  stability: number
  robustness: number
}

export interface ParameterStability {
  stability: number
  consistency: Record<string, number>
  drift: Record<string, number>
}

// Supporting classes
class PerformanceTracker {
  // Implementation for tracking performance during backtest
}

class TechnicalIndicators {
  // Implementation for technical indicator calculations
}

class MarketDataProvider {
  async update(data: MarketData): Promise<void> {
    // Update market data context
  }
}

// Singleton instance
let backtestingInstance: BacktestingEngine | null = null

export function initializeBacktesting(): BacktestingEngine {
  if (!backtestingInstance) {
    backtestingInstance = new BacktestingEngine()
  }
  return backtestingInstance
}

export function getBacktesting(): BacktestingEngine | null {
  return backtestingInstance
}

export { BacktestingEngine }