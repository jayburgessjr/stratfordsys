# Models Directory

This directory contains business logic models and data structures.

## Structure

```
models/
├── historical-data.ts     # Historical market data models
├── position.ts           # Trading position tracking
├── strategy.ts           # Strategy configuration models
└── backtest-result.ts    # Backtesting result models
```

## Model Guidelines

1. **Immutable Data**: Use readonly properties where appropriate
2. **Type Safety**: Strict TypeScript interfaces
3. **Validation**: Runtime validation with Zod schemas
4. **Documentation**: Clear JSDoc comments for all models
5. **Deterministic**: Models should behave predictably