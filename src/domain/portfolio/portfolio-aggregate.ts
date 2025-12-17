/**
 * Portfolio Aggregate Root - Domain-Driven Design
 * Core business logic for portfolio management
 */

import { AggregateRoot, DomainEvent } from '../core/base-entity'
import { Money, Symbol, Quantity, Price, Percentage, RiskLevel, DateRange, ValueObject, Currency } from '../core/value-objects'

export { Money, Symbol, Quantity, Price, Percentage, RiskLevel, DateRange, Currency }

export class Portfolio extends AggregateRoot<string> {
  private _name: string
  private _userId: string
  private _positions: Map<string, Position>
  private _cash: Money
  private _riskLevel: RiskLevel
  private _isActive: boolean
  private _strategy?: TradingStrategy

  constructor(
    id: string,
    name: string,
    userId: string,
    initialCash: Money,
    riskLevel: RiskLevel,
    createdAt?: Date
  ) {
    super(id, createdAt)
    this._name = name
    this._userId = userId
    this._positions = new Map()
    this._cash = initialCash
    this._riskLevel = riskLevel
    this._isActive = true

    this.addDomainEvent(new PortfolioCreatedEvent(id, userId, initialCash, new Date()))
  }

  // Getters
  get name(): string { return this._name }
  get userId(): string { return this._userId }
  get cash(): Money { return this._cash }
  get riskLevel(): RiskLevel { return this._riskLevel }
  get isActive(): boolean { return this._isActive }
  get strategy(): TradingStrategy | undefined { return this._strategy }
  get positions(): ReadonlyMap<string, Position> { return this._positions }

  // Business Logic Methods
  public addCash(amount: Money): void {
    this.assertPortfolioIsActive()
    this.assertSameCurrency(amount)

    this._cash = this._cash.add(amount)
    this.touch()

    this.addDomainEvent(new CashDepositedEvent(this.id, amount, new Date()))
  }

  public withdrawCash(amount: Money): void {
    this.assertPortfolioIsActive()
    this.assertSameCurrency(amount)
    this.assertSufficientCash(amount)

    this._cash = this._cash.subtract(amount)
    this.touch()

    this.addDomainEvent(new CashWithdrawnEvent(this.id, amount, new Date()))
  }

  public buyStock(symbol: Symbol, quantity: Quantity, price: Price): void {
    this.assertPortfolioIsActive()

    const totalCost = price.toMoney(quantity.value)
    this.assertSufficientCash(totalCost)
    this.assertRiskCompliance(symbol, quantity, price)

    // Update cash
    this._cash = this._cash.subtract(totalCost)

    // Update or create position
    const existingPosition = this._positions.get(symbol.value)
    if (existingPosition) {
      const newPosition = existingPosition.increaseQuantity(quantity, price)
      this._positions.set(symbol.value, newPosition)
    } else {
      const newPosition = new Position(symbol, quantity, price)
      this._positions.set(symbol.value, newPosition)
    }

    this.touch()
    this.addDomainEvent(new StockPurchasedEvent(this.id, symbol, quantity, price, new Date()))
  }

  public sellStock(symbol: Symbol, quantity: Quantity, price: Price): void {
    this.assertPortfolioIsActive()

    const position = this._positions.get(symbol.value)
    if (!position) {
      throw new Error(`No position found for symbol ${symbol.value}`)
    }

    if (position.quantity.value < quantity.value) {
      throw new Error(`Insufficient shares to sell. Available: ${position.quantity.value}, Requested: ${quantity.value}`)
    }

    const totalProceeds = price.toMoney(quantity.value)

    // Update cash
    this._cash = this._cash.add(totalProceeds)

    // Update position
    if (position.quantity.value === quantity.value) {
      // Selling entire position
      this._positions.delete(symbol.value)
    } else {
      // Partial sale
      const newPosition = position.decreaseQuantity(quantity, price)
      this._positions.set(symbol.value, newPosition)
    }

    this.touch()
    this.addDomainEvent(new StockSoldEvent(this.id, symbol, quantity, price, new Date()))
  }

  public calculateTotalValue(currentPrices: Map<string, Price>): Money {
    let totalValue = this._cash

    for (const [symbol, position] of this._positions) {
      const currentPrice = currentPrices.get(symbol)
      if (currentPrice) {
        const positionValue = currentPrice.toMoney(position.quantity.value)
        totalValue = totalValue.add(positionValue)
      }
    }

    return totalValue
  }

  public calculatePerformance(initialValue: Money, currentValue: Money): PortfolioPerformance {
    const totalReturn = currentValue.subtract(initialValue)
    const returnPercentage = new Percentage(totalReturn.amount / initialValue.amount)

    return new PortfolioPerformance(
      initialValue,
      currentValue,
      totalReturn,
      returnPercentage,
      this.calculateSharpeRatio(),
      this.calculateMaxDrawdown(),
      this.calculateVolatility()
    )
  }

  public rebalance(targetAllocations: Map<string, Percentage>, currentPrices: Map<string, Price>): void {
    this.assertPortfolioIsActive()

    const totalValue = this.calculateTotalValue(currentPrices)
    const rebalanceOrders: RebalanceOrder[] = []

    // Calculate target values for each position
    for (const [symbol, targetAllocation] of targetAllocations) {
      const targetValue = totalValue.multiply(targetAllocation.value)
      const currentPrice = currentPrices.get(symbol)

      if (!currentPrice) {
        throw new Error(`No current price available for ${symbol}`)
      }

      const currentPosition = this._positions.get(symbol)
      const currentValue = currentPosition
        ? currentPrice.toMoney(currentPosition.quantity.value)
        : new Money(0, totalValue.currency)

      const difference = targetValue.subtract(currentValue)

      if (Math.abs(difference.amount) > 10) { // Only rebalance if difference > $10
        const quantityChange = new Quantity(Math.abs(difference.amount) / currentPrice.value)

        rebalanceOrders.push(new RebalanceOrder(
          new Symbol(symbol),
          difference.isPositive() ? 'BUY' : 'SELL',
          quantityChange,
          currentPrice
        ))
      }
    }

    // Execute rebalance orders
    for (const order of rebalanceOrders) {
      if (order.action === 'BUY') {
        this.buyStock(order.symbol, order.quantity, order.price)
      } else {
        this.sellStock(order.symbol, order.quantity, order.price)
      }
    }

    this.addDomainEvent(new PortfolioRebalancedEvent(this.id, rebalanceOrders, new Date()))
  }

  public setStrategy(strategy: TradingStrategy): void {
    this._strategy = strategy
    this.touch()
    this.addDomainEvent(new StrategyAssignedEvent(this.id, strategy.id, new Date()))
  }

  public deactivate(): void {
    this._isActive = false
    this.touch()
    this.addDomainEvent(new PortfolioDeactivatedEvent(this.id, new Date()))
  }

  public updateRiskLevel(newRiskLevel: RiskLevel): void {
    const oldRiskLevel = this._riskLevel
    this._riskLevel = newRiskLevel
    this.touch()
    this.addDomainEvent(new RiskLevelUpdatedEvent(this.id, oldRiskLevel, newRiskLevel, new Date()))
  }

  // Private helper methods
  private assertPortfolioIsActive(): void {
    if (!this._isActive) {
      throw new Error('Cannot perform operations on inactive portfolio')
    }
  }

  private assertSameCurrency(money: Money): void {
    if (money.currency !== this._cash.currency) {
      throw new Error(`Currency mismatch: Portfolio uses ${this._cash.currency}, provided ${money.currency}`)
    }
  }

  private assertSufficientCash(amount: Money): void {
    if (this._cash.isLessThan(amount)) {
      throw new Error(`Insufficient cash. Available: ${this._cash.toString()}, Required: ${amount.toString()}`)
    }
  }

  private assertRiskCompliance(symbol: Symbol, quantity: Quantity, price: Price): void {
    // Risk compliance checks based on portfolio risk level
    const positionValue = price.toMoney(quantity.value)
    const totalValue = this.calculateTotalValue(new Map([[symbol.value, price]]))
    const positionPercentage = new Percentage(positionValue.amount / totalValue.amount)

    // Maximum position size based on risk level
    const maxPositionSize = this.getMaxPositionSize()

    if (positionPercentage.value > maxPositionSize.value) {
      throw new Error(`Position size ${positionPercentage.toString()} exceeds maximum allowed ${maxPositionSize.toString()} for risk level ${this._riskLevel.level}`)
    }
  }

  private getMaxPositionSize(): Percentage {
    switch (this._riskLevel.level) {
      case 'VERY_LOW': return new Percentage(0.05)  // 5%
      case 'LOW': return new Percentage(0.10)       // 10%
      case 'MEDIUM': return new Percentage(0.20)    // 20%
      case 'HIGH': return new Percentage(0.35)      // 35%
      case 'VERY_HIGH': return new Percentage(0.50) // 50%
      default: return new Percentage(0.10)
    }
  }

  private calculateSharpeRatio(): number {
    // Simplified Sharpe ratio calculation
    // In real implementation, this would use historical returns and risk-free rate
    return 1.5
  }

  private calculateMaxDrawdown(): Percentage {
    // Simplified max drawdown calculation
    // In real implementation, this would analyze historical portfolio values
    return new Percentage(-0.15) // -15%
  }

  private calculateVolatility(): Percentage {
    // Simplified volatility calculation
    // In real implementation, this would use historical return standard deviation
    return new Percentage(0.18) // 18%
  }
}

// Position Value Object
export class Position extends ValueObject {
  private readonly _symbol: Symbol
  private readonly _quantity: Quantity
  private readonly _averagePrice: Price
  private readonly _totalCost: Money

  constructor(symbol: Symbol, quantity: Quantity, price: Price) {
    super()
    this._symbol = symbol
    this._quantity = quantity
    this._averagePrice = price
    this._totalCost = price.toMoney(quantity.value)
  }

  get symbol(): Symbol { return this._symbol }
  get quantity(): Quantity { return this._quantity }
  get averagePrice(): Price { return this._averagePrice }
  get totalCost(): Money { return this._totalCost }

  public increaseQuantity(additionalQuantity: Quantity, price: Price): Position {
    const newTotalQuantity = this._quantity.add(additionalQuantity)
    const additionalCost = price.toMoney(additionalQuantity.value)
    const newTotalCost = this._totalCost.add(additionalCost)
    const newAveragePrice = new Price(
      newTotalCost.amount / newTotalQuantity.value,
      price.currency
    )

    return new Position(this._symbol, newTotalQuantity, newAveragePrice)
  }

  public decreaseQuantity(quantityToSell: Quantity, price: Price): Position {
    if (quantityToSell.value >= this._quantity.value) {
      throw new Error('Cannot decrease quantity by more than current holding')
    }

    const newQuantity = this._quantity.subtract(quantityToSell)
    // Keep the same average price when selling
    return new Position(this._symbol, newQuantity, this._averagePrice)
  }

  public calculateUnrealizedPnL(currentPrice: Price): Money {
    const currentValue = currentPrice.toMoney(this._quantity.value)
    return currentValue.subtract(this._totalCost)
  }

  protected getAtomicValues(): any[] {
    return [
      this._symbol.value,
      this._quantity.value,
      this._averagePrice.value,
      this._totalCost.amount
    ]
  }
}

// Portfolio Performance Value Object
export class PortfolioPerformance extends ValueObject {
  constructor(
    private readonly _initialValue: Money,
    private readonly _currentValue: Money,
    private readonly _totalReturn: Money,
    private readonly _returnPercentage: Percentage,
    private readonly _sharpeRatio: number,
    private readonly _maxDrawdown: Percentage,
    private readonly _volatility: Percentage
  ) {
    super()
  }

  get initialValue(): Money { return this._initialValue }
  get currentValue(): Money { return this._currentValue }
  get totalReturn(): Money { return this._totalReturn }
  get returnPercentage(): Percentage { return this._returnPercentage }
  get sharpeRatio(): number { return this._sharpeRatio }
  get maxDrawdown(): Percentage { return this._maxDrawdown }
  get volatility(): Percentage { return this._volatility }

  protected getAtomicValues(): any[] {
    return [
      this._initialValue.amount,
      this._currentValue.amount,
      this._totalReturn.amount,
      this._returnPercentage.value,
      this._sharpeRatio,
      this._maxDrawdown.value,
      this._volatility.value
    ]
  }
}

// Trading Strategy Entity
export class TradingStrategy {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string,
    public readonly riskLevel: RiskLevel,
    public readonly parameters: Map<string, any>
  ) { }
}

// Rebalance Order Value Object
export class RebalanceOrder extends ValueObject {
  constructor(
    public readonly symbol: Symbol,
    public readonly action: 'BUY' | 'SELL',
    public readonly quantity: Quantity,
    public readonly price: Price
  ) {
    super()
  }

  protected getAtomicValues(): any[] {
    return [this.symbol.value, this.action, this.quantity.value, this.price.value]
  }
}

// Domain Events
export class PortfolioCreatedEvent implements DomainEvent {
  constructor(
    public readonly aggregateId: string,
    public readonly userId: string,
    public readonly initialCash: Money,
    public readonly occurredOn: Date
  ) { }

  get eventType(): string { return 'PortfolioCreated' }
  get payload(): any {
    return {
      userId: this.userId,
      initialCash: this.initialCash.amount,
      currency: this.initialCash.currency
    }
  }
}

export class CashDepositedEvent implements DomainEvent {
  constructor(
    public readonly aggregateId: string,
    public readonly amount: Money,
    public readonly occurredOn: Date
  ) { }

  get eventType(): string { return 'CashDeposited' }
  get payload(): any {
    return {
      amount: this.amount.amount,
      currency: this.amount.currency
    }
  }
}

export class CashWithdrawnEvent implements DomainEvent {
  constructor(
    public readonly aggregateId: string,
    public readonly amount: Money,
    public readonly occurredOn: Date
  ) { }

  get eventType(): string { return 'CashWithdrawn' }
  get payload(): any {
    return {
      amount: this.amount.amount,
      currency: this.amount.currency
    }
  }
}

export class StockPurchasedEvent implements DomainEvent {
  constructor(
    public readonly aggregateId: string,
    public readonly symbol: Symbol,
    public readonly quantity: Quantity,
    public readonly price: Price,
    public readonly occurredOn: Date
  ) { }

  get eventType(): string { return 'StockPurchased' }
  get payload(): any {
    return {
      symbol: this.symbol.value,
      quantity: this.quantity.value,
      price: this.price.value,
      totalCost: this.price.value * this.quantity.value
    }
  }
}

export class StockSoldEvent implements DomainEvent {
  constructor(
    public readonly aggregateId: string,
    public readonly symbol: Symbol,
    public readonly quantity: Quantity,
    public readonly price: Price,
    public readonly occurredOn: Date
  ) { }

  get eventType(): string { return 'StockSold' }
  get payload(): any {
    return {
      symbol: this.symbol.value,
      quantity: this.quantity.value,
      price: this.price.value,
      totalProceeds: this.price.value * this.quantity.value
    }
  }
}

export class PortfolioRebalancedEvent implements DomainEvent {
  constructor(
    public readonly aggregateId: string,
    public readonly orders: RebalanceOrder[],
    public readonly occurredOn: Date
  ) { }

  get eventType(): string { return 'PortfolioRebalanced' }
  get payload(): any {
    return {
      orderCount: this.orders.length,
      orders: this.orders.map(order => ({
        symbol: order.symbol.value,
        action: order.action,
        quantity: order.quantity.value,
        price: order.price.value
      }))
    }
  }
}

export class StrategyAssignedEvent implements DomainEvent {
  constructor(
    public readonly aggregateId: string,
    public readonly strategyId: string,
    public readonly occurredOn: Date
  ) { }

  get eventType(): string { return 'StrategyAssigned' }
  get payload(): any {
    return { strategyId: this.strategyId }
  }
}

export class PortfolioDeactivatedEvent implements DomainEvent {
  constructor(
    public readonly aggregateId: string,
    public readonly occurredOn: Date
  ) { }

  get eventType(): string { return 'PortfolioDeactivated' }
  get payload(): any {
    return {}
  }
}

export class RiskLevelUpdatedEvent implements DomainEvent {
  constructor(
    public readonly aggregateId: string,
    public readonly oldRiskLevel: RiskLevel,
    public readonly newRiskLevel: RiskLevel,
    public readonly occurredOn: Date
  ) { }

  get eventType(): string { return 'RiskLevelUpdated' }
  get payload(): any {
    return {
      oldRiskLevel: this.oldRiskLevel.level,
      newRiskLevel: this.newRiskLevel.level
    }
  }
}