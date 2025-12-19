# Strategy System: Path to Production (Davey-Style Compliance)

## 1. Current State Assessment
- **UI Implementation**: High-fidelity React Prototype (Simulated).
  - Visualization: COMPLETE
  - User Controls: COMPLETE
  - Data Source: MOCKED (`runPipeline` uses `setTimeout` and `Math.random`)
  
- **Backend Capabilities**:
  - `BacktestEngine`: AVAILABLE (`src/lib/backtesting/backtest-engine.ts`)
  - `Generate Strategy API`: AVAILABLE (`src/app/api/ai/generate-strategy/route.ts`)
  - `Strategy Archetypes`: PARTIAL (Only `MovingAverageCrossover` exists)

## 2. Implementation Roadmap

### Phase 1: Logic Expansion (The "Ingredients")
Real strategies are needed to replace the mocked "Mean Reversion" and "Breakout" labels.
- [x] **Task 1.1**: Implement `MeanReversionStrategy` (Bollinger Band logic).
- [x] **Task 1.2**: Implement `BreakoutStrategy` (Donchian/ATR logic).
- [ ] **Task 1.3**: Standardize `Strategy` interface for polymorphism.

### Phase 2: The Validation Engine (The "Davey Layer")
The backend needs to run the rigorous tests implied by the UI.
- [ ] **Task 2.1**: **Backtest Runner**: Wiring `BacktestEngine` to the API.
- [ ] **Task 2.2**: **Walk-Forward Processor**: Implement logic to slice data into 12 folds and aggregate stability scores.
- [ ] **Task 2.3**: **Monte Carlo Simulator**: Implement trade resampling (5000+ runs) to generate P90 drawdowns.

### Phase 3: Orchestration & Streaming
Connecting it all.
- [ ] **Task 3.1**: Create `POST /api/strategy/validate` (Async Job creation).
- [ ] **Task 3.2**: Create `GET /api/strategy/status/:jobId` (SSE or Polling for "Stepper" updates).
- [ ] **Task 3.3**: Connect UI `runPipeline` function to these endpoints.

## 3. Decision Point
Recommended Next Step: **Phase 1 (Logic Expansion)**.
**Goal**: Ensure we have real strategies to test before building the tester.
