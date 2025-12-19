
import { MarketDataService } from '@/lib/services/market-data';
import { generateQuantumAllocation } from '@/lib/server/openai';
import { QuantumAllocation } from '@/types/ai';
import { optimizePortfolioLocally } from '@/lib/agents/quantum-optimizer';

export class QuantumAgent {
    private marketDataService: MarketDataService;

    constructor() {
        this.marketDataService = new MarketDataService();
    }

    /**
     * Main entry point for the agent.
     * Analyzes market data and returns a portfolio allocation.
     */
    async generatePortfolio(capital: number, riskTolerance: number): Promise<QuantumAllocation> {
        // 1. Gather Intelligence
        const marketSnapshot = await this.marketDataService.getMarketSnapshot();

        // 2a. Run Local Quantum Optimization Engine (TypeScript)
        try {
            const allocation = await optimizePortfolioLocally({
                capital,
                riskTolerance,
                marketData: marketSnapshot.assets.map(a => ({
                    symbol: a.symbol,
                    price: a.price,
                    change_percent: a.change24h
                }))
            });
            return allocation;
        } catch (e) {
            console.error('Optimization failed, falling back to OpenAI', e);
        }

        // 2b. Fallback to OpenAI (Qualitative)
        const allocation = await generateQuantumAllocation({
            capital,
            riskTolerance,
            currentMarketData: marketSnapshot
        });

        return allocation;
    }
}

