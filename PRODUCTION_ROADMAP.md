# Production Readiness Roadmap

To transition Stratford AI from a high-fidelity frontend prototype to a functional, production-grade trading platform, the following architectural components and integrations are required.

## 1. Backend & Infrastructure

### **Database ((PostgreSQL)**
*   **Requirement**: Persistent storage for user profiles, portfolio history, saved strategies, and transaction logs.
*   **Recommendation**: **Supabase** or **Neon** (Serverless Postgres).
*   **Schema Needs**:
    *   `users`: Auth profiles, risk settings.
    *   `portfolios`: Holdings, historical equity snapshots.
    *   `strategies`: Saved parameters for the Strategy Builder.
    *   `orders`: Execution history and status.

### **Authentication**
*   **Requirement**: Secure user signup, login, and session management.
*   **Recommendation**: **Clerk** or **NextAuth.js**.
*   **Action**: Replace current hardcoded user state with real auth hooks (e.g., `useUser()`).

### **API Layer (BFF - Backend for Frontend)**
*   **Requirement**: Securely handle API keys for data providers and brokerage connections. NEVER expose API keys in the client code.
*   **Recommendation**: **Next.js API Routes** (`src/app/api/...`) or a dedicated **Python/FastAPI** microservice (especially for the AI/Quant logic).

## 2. Data Integrations (The "Real Data")

### **Market Data Feeds**
*   **Requirement**: Real-time prices for Stocks, Crypto, and potentially options.
*   **Providers**:
    *   **Polygon.io**: Excellent websocket support for stocks/crypto/options.
    *   **Alpaca Market Data**: Good if using Alpaca for brokerage.
    *   **CoinGecko API**: Great for broad crypto metadata.
*   **Implementation**:
    *   **Snapshots**: Fetch initial data via REST API on page load.
    *   **Streaming**: Connect to a WebSocket in a global context (e.g., `WebSocketProvider`) to power the Live Ticker and active trade price updates.

### **News & Sentiment**
*   **Requirement**: Real-time news and sentiment scores.
*   **Providers**:
    *   **Tiingo** or **NewsAPI**: General finance news.
    *   **Alpha Vantage**: News sentiment endpoints.
*   **Action**: Hook up `src/app/news/page.tsx` to fetch from these endpoints.

## 3. Execution & Brokerage

### **Trade Execution**
*   **Requirement**: Ability to actually place buy/sell orders.
*   **Recommendation**: **Alpaca Trading API**.
    *   Offers a paper trading environment (sandbox) which is perfect for "Phase 1" production.
    *   OAuth integration allows users to connect their own brokerage accounts.
*   **Action**: Replace the mock `Submit Order` button with an API call to `POST /v2/orders`.

## 4. Quantitative Engine (The "Brain")

### **Strategy Builder Logic**
*   **Current State**: The `StrategyPage` generates mock "segments" locally.
*   **Production State**:
    *   Needs a dedicated service (likely Python) to run Monte Carlo simulations and optimization algorithms.
    *   **Libraries**: `pandas`, `numpy`, `PyPortfolioOpt`.
    *   **Flow**: Frontend fills form -> POST to Python API -> API returns optimized JSON -> Frontend renders graphs.

## 5. Deployment & Operations

### **Hosting**
*   **Frontend/API**: **Vercel** (Zero-config for Next.js).
*   **Database**: **Supabase**.
*   **Microservices (if using Python)**: **Railway** or **AWS Lambda**.

### **Monitoring**
*   **Error Tracking**: **Sentry** (to catch client-side crashes).
*   **Analytics**: **PostHog** (for user behavior).

## Recommended Phase 1 Plan (MVP)

1.  **Mock -> Sandbox**: Connect the implementation to **Alpaca Paper Trading**. It simulates "real" orders without real money.
2.  **Live Market Data**: Subscribe to a free/starter plan (e.g., Alpaca or Tiingo) to popuplate the Dashboard ticker and charts.
3.  **Persistence**: Set up Supabase to save user strategies so they don't vanish on refresh.
