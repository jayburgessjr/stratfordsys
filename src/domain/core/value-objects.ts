/**
 * Domain Value Objects for Financial Trading System
 * Immutable objects that represent important domain concepts
 */

export abstract class ValueObject {
  protected abstract getAtomicValues(): any[]

  public equals(valueObject: ValueObject): boolean {
    if (!valueObject || valueObject.constructor !== this.constructor) {
      return false
    }

    const thisValues = this.getAtomicValues()
    const otherValues = valueObject.getAtomicValues()

    if (thisValues.length !== otherValues.length) {
      return false
    }

    return thisValues.every((value, index) => value === otherValues[index])
  }
}

// Money Value Object for precise financial calculations
export class Money extends ValueObject {
  private readonly _amount: number
  private readonly _currency: Currency

  constructor(amount: number, currency: Currency) {
    super()
    this.validateAmount(amount)
    this._amount = Math.round(amount * 100) / 100 // Round to 2 decimal places
    this._currency = currency
  }

  get amount(): number {
    return this._amount
  }

  get currency(): Currency {
    return this._currency
  }

  public add(money: Money): Money {
    this.assertSameCurrency(money)
    return new Money(this._amount + money._amount, this._currency)
  }

  public subtract(money: Money): Money {
    this.assertSameCurrency(money)
    return new Money(this._amount - money._amount, this._currency)
  }

  public multiply(factor: number): Money {
    return new Money(this._amount * factor, this._currency)
  }

  public divide(divisor: number): Money {
    if (divisor === 0) {
      throw new Error('Cannot divide by zero')
    }
    return new Money(this._amount / divisor, this._currency)
  }

  public isGreaterThan(money: Money): boolean {
    this.assertSameCurrency(money)
    return this._amount > money._amount
  }

  public isLessThan(money: Money): boolean {
    this.assertSameCurrency(money)
    return this._amount < money._amount
  }

  public isZero(): boolean {
    return this._amount === 0
  }

  public isPositive(): boolean {
    return this._amount > 0
  }

  public isNegative(): boolean {
    return this._amount < 0
  }

  public toString(): string {
    return `${this._currency} ${this._amount.toFixed(2)}`
  }

  protected getAtomicValues(): any[] {
    return [this._amount, this._currency]
  }

  private validateAmount(amount: number): void {
    if (!Number.isFinite(amount)) {
      throw new Error('Amount must be a finite number')
    }
  }

  private assertSameCurrency(money: Money): void {
    if (this._currency !== money._currency) {
      throw new Error(`Cannot operate on different currencies: ${this._currency} vs ${money._currency}`)
    }
  }
}

export enum Currency {
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP',
  JPY = 'JPY',
  CAD = 'CAD',
  AUD = 'AUD',
  CHF = 'CHF',
}

// Stock Symbol Value Object
export class Symbol extends ValueObject {
  private readonly _value: string

  constructor(value: string) {
    super()
    this.validate(value)
    this._value = value.toUpperCase()
  }

  get value(): string {
    return this._value
  }

  protected getAtomicValues(): any[] {
    return [this._value]
  }

  private validate(value: string): void {
    if (!value || value.trim().length === 0) {
      throw new Error('Symbol cannot be empty')
    }

    if (!/^[A-Z]{1,5}$/.test(value.toUpperCase())) {
      throw new Error('Symbol must be 1-5 uppercase letters')
    }
  }
}

// Price Value Object
export class Price extends ValueObject {
  private readonly _value: number
  private readonly _currency: Currency
  private readonly _timestamp: Date

  constructor(value: number, currency: Currency, timestamp?: Date) {
    super()
    this.validate(value)
    this._value = Math.round(value * 10000) / 10000 // 4 decimal precision for prices
    this._currency = currency
    this._timestamp = timestamp || new Date()
  }

  get value(): number {
    return this._value
  }

  get currency(): Currency {
    return this._currency
  }

  get timestamp(): Date {
    return this._timestamp
  }

  public isStale(maxAgeMs: number = 5 * 60 * 1000): boolean {
    return Date.now() - this._timestamp.getTime() > maxAgeMs
  }

  public toMoney(quantity: number): Money {
    return new Money(this._value * quantity, this._currency)
  }

  protected getAtomicValues(): any[] {
    return [this._value, this._currency, this._timestamp.getTime()]
  }

  private validate(value: number): void {
    if (!Number.isFinite(value) || value < 0) {
      throw new Error('Price must be a non-negative finite number')
    }
  }
}

// Quantity Value Object
export class Quantity extends ValueObject {
  private readonly _value: number

  constructor(value: number) {
    super()
    this.validate(value)
    this._value = value
  }

  get value(): number {
    return this._value
  }

  public add(quantity: Quantity): Quantity {
    return new Quantity(this._value + quantity._value)
  }

  public subtract(quantity: Quantity): Quantity {
    return new Quantity(this._value - quantity._value)
  }

  public multiply(factor: number): Quantity {
    return new Quantity(this._value * factor)
  }

  public isZero(): boolean {
    return this._value === 0
  }

  public isPositive(): boolean {
    return this._value > 0
  }

  public isNegative(): boolean {
    return this._value < 0
  }

  protected getAtomicValues(): any[] {
    return [this._value]
  }

  private validate(value: number): void {
    if (!Number.isFinite(value)) {
      throw new Error('Quantity must be a finite number')
    }
  }
}

// Percentage Value Object
export class Percentage extends ValueObject {
  private readonly _value: number // Stored as decimal (0.05 = 5%)

  constructor(value: number) {
    super()
    this.validate(value)
    this._value = value
  }

  get value(): number {
    return this._value
  }

  get asPercentage(): number {
    return this._value * 100
  }

  public static fromPercentage(percentage: number): Percentage {
    return new Percentage(percentage / 100)
  }

  public add(percentage: Percentage): Percentage {
    return new Percentage(this._value + percentage._value)
  }

  public subtract(percentage: Percentage): Percentage {
    return new Percentage(this._value - percentage._value)
  }

  public multiply(factor: number): Percentage {
    return new Percentage(this._value * factor)
  }

  public applyTo(amount: number): number {
    return amount * (1 + this._value)
  }

  public toString(): string {
    return `${this.asPercentage.toFixed(2)}%`
  }

  protected getAtomicValues(): any[] {
    return [this._value]
  }

  private validate(value: number): void {
    if (!Number.isFinite(value)) {
      throw new Error('Percentage must be a finite number')
    }
  }
}

// Date Range Value Object
export class DateRange extends ValueObject {
  private readonly _startDate: Date
  private readonly _endDate: Date

  constructor(startDate: Date, endDate: Date) {
    super()
    this.validate(startDate, endDate)
    this._startDate = new Date(startDate)
    this._endDate = new Date(endDate)
  }

  get startDate(): Date {
    return new Date(this._startDate)
  }

  get endDate(): Date {
    return new Date(this._endDate)
  }

  get durationMs(): number {
    return this._endDate.getTime() - this._startDate.getTime()
  }

  get durationDays(): number {
    return this.durationMs / (24 * 60 * 60 * 1000)
  }

  public contains(date: Date): boolean {
    return date >= this._startDate && date <= this._endDate
  }

  public overlaps(other: DateRange): boolean {
    return this._startDate <= other._endDate && this._endDate >= other._startDate
  }

  public extend(days: number): DateRange {
    const newEndDate = new Date(this._endDate)
    newEndDate.setDate(newEndDate.getDate() + days)
    return new DateRange(this._startDate, newEndDate)
  }

  protected getAtomicValues(): any[] {
    return [this._startDate.getTime(), this._endDate.getTime()]
  }

  private validate(startDate: Date, endDate: Date): void {
    if (!(startDate instanceof Date) || !(endDate instanceof Date)) {
      throw new Error('Start and end dates must be valid Date objects')
    }

    if (startDate > endDate) {
      throw new Error('Start date must be before or equal to end date')
    }
  }
}

// Risk Level Value Object
export class RiskLevel extends ValueObject {
  private readonly _level: RiskLevelType
  private readonly _score: number // 0-100

  constructor(level: RiskLevelType, score?: number) {
    super()
    this._level = level
    this._score = score ?? this.getDefaultScore(level)
    this.validate()
  }

  get level(): RiskLevelType {
    return this._level
  }

  get score(): number {
    return this._score
  }

  public isHigherThan(other: RiskLevel): boolean {
    return this._score > other._score
  }

  public isLowerThan(other: RiskLevel): boolean {
    return this._score < other._score
  }

  protected getAtomicValues(): any[] {
    return [this._level, this._score]
  }

  private getDefaultScore(level: RiskLevelType): number {
    switch (level) {
      case RiskLevelType.VERY_LOW: return 10
      case RiskLevelType.LOW: return 25
      case RiskLevelType.MEDIUM: return 50
      case RiskLevelType.HIGH: return 75
      case RiskLevelType.VERY_HIGH: return 90
    }
  }

  private validate(): void {
    if (this._score < 0 || this._score > 100) {
      throw new Error('Risk score must be between 0 and 100')
    }
  }
}

export enum RiskLevelType {
  VERY_LOW = 'VERY_LOW',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  VERY_HIGH = 'VERY_HIGH',
}

// Email Value Object
export class Email extends ValueObject {
  private readonly _value: string

  constructor(value: string) {
    super()
    this.validate(value)
    this._value = value.toLowerCase()
  }

  get value(): string {
    return this._value
  }

  get domain(): string {
    return this._value.split('@')[1]
  }

  get localPart(): string {
    return this._value.split('@')[0]
  }

  protected getAtomicValues(): any[] {
    return [this._value]
  }

  private validate(value: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value)) {
      throw new Error('Invalid email format')
    }
  }
}