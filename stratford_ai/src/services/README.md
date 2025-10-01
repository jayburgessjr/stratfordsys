# Services Directory

This directory contains all external service integrations and data processing services.

## Structure

```
services/
├── csv-parser.ts          # CSV file parsing and validation
├── alpha-vantage.ts       # Alpha Vantage API client
├── data-store.ts          # Local data storage interface
├── backtesting-engine.ts  # Core backtesting logic
└── strategy-runner.ts     # Strategy execution coordinator
```

## Service Guidelines

1. **Pure Functions**: Services should be side-effect free where possible
2. **Error Handling**: Comprehensive error handling and logging
3. **Rate Limiting**: Respect external API limits
4. **Caching**: Implement caching for expensive operations
5. **Testing**: Mock external dependencies in tests