# Utils Directory

This directory contains utility functions and helper modules.

## Structure

```
utils/
├── technical-indicators.ts  # Moving averages, RSI, etc.
├── performance-metrics.ts   # Sharpe ratio, win rate calculations
├── data-validation.ts       # Data cleaning and validation
├── export.ts               # CSV/JSON export utilities
└── deterministic.ts        # Seeded random number generation
```

## Utility Guidelines

1. **Pure Functions**: All utilities should be pure functions
2. **Deterministic**: Same inputs always produce same outputs
3. **Well Tested**: High test coverage for all utilities
4. **Documentation**: Clear function documentation
5. **Performance**: Optimized for financial calculations