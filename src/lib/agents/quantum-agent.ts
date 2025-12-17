
import { MarketDataService } from '@/lib/services/market-data';
import { generateQuantumAllocation } from '@/lib/server/openai';
import { QuantumAllocation } from '@/types/ai';

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

        try {
            // 2a. Try Python Quantum Engine (Quantitative)
            const response = await fetch('http://localhost:8000/optimize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    capital,
                    risk_tolerance: riskTolerance,
                    market_data: marketSnapshot.assets
                })
            });

            if (response.ok) {
                const data = await response.json();
                return data as QuantumAllocation;
            }
        } catch (e) {
            console.warn('Python Quantum Engine unavailable, falling back to OpenAI', e);
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

