# Product Requirements Document (PRD) – Stratford AI Core Engine

## Feature Title
Stratford AI Core Engine (MVP)

## Purpose
Enable solo operators to run deterministic AI-driven backtests and visualize performance, ensuring reproducibility of strategies.

## Scope
### In-Scope
- Data ingestion: CSV + Alpha Vantage API
- Strategy runner: Moving Average Crossover
- Backtesting framework with seeded randomness
- Dashboard: strategy params + charts + stats
- Metrics: PnL, Sharpe ratio, win rate

### Out-of-Scope
- Live trading integrations
- Portfolio optimization
- Mobile app

## User Story
As a **solo operator**,
I want to backtest AI-driven strategies deterministically,
So that I can validate profitable methods without capital risk.

## Acceptance Criteria
- [ ] Data ingestion supports CSV + Alpha Vantage API
- [ ] Strategy runner executes MA crossover deterministically
- [ ] Backtest outputs include PnL, Sharpe, win rate
- [ ] Dashboard displays config + results in charts/tables
- [ ] Results are reproducible with identical inputs + seed

## Resources
- `01_research.md`
- `02_architecture.md`
- `07_deterministic_build_agent.md`