/**
 * Domain-Driven Design Base Entity
 * Foundation for all domain entities in Stratford AI
 */

export abstract class BaseEntity<T> {
  protected readonly _id: T
  private readonly _createdAt: Date
  private _updatedAt: Date

  constructor(id: T, createdAt?: Date) {
    this._id = id
    this._createdAt = createdAt || new Date()
    this._updatedAt = new Date()
  }

  get id(): T {
    return this._id
  }

  get createdAt(): Date {
    return this._createdAt
  }

  get updatedAt(): Date {
    return this._updatedAt
  }

  protected touch(): void {
    this._updatedAt = new Date()
  }

  public equals(entity: BaseEntity<T>): boolean {
    if (!(entity instanceof BaseEntity)) {
      return false
    }

    return this._id === entity._id
  }
}

export abstract class AggregateRoot<T> extends BaseEntity<T> {
  private _domainEvents: DomainEvent[] = []

  get domainEvents(): readonly DomainEvent[] {
    return this._domainEvents
  }

  protected addDomainEvent(domainEvent: DomainEvent): void {
    this._domainEvents.push(domainEvent)
  }

  public clearEvents(): void {
    this._domainEvents = []
  }
}

export interface DomainEvent {
  aggregateId: string
  eventType: string
  occurredOn: Date
  payload: any
}