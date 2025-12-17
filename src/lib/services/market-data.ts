
import { OpenAI } from 'openai';

// Types for Market Data
export interface MarketAsset {
    symbol: string;
    name: string;
    price: number;
    change24h: number; // Percentage
    type: 'STOCK' | 'CRYPTO' | 'COMMODITY' | 'PREDICTION' | 'LOTTERY';
    trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
}

export interface MarketSnapshot {
    timestamp: Date;
    assets: MarketAsset[];
}

/**
 * Service to fetch or mock market data for multi-asset analysis.
 * In a real app, this would connect to various APIs (AlphaVantage, CoinGecko, etc.)
 */
export class MarketDataService {

    /**
     * Fetches a snapshot of top assets across all classes.
     */
    async getMarketSnapshot(): Promise<MarketSnapshot> {
        // Mocking real-time data for "Quantum" analysis
        // Ideally this would be replaced by real API calls

        return {
            timestamp: new Date(),
            assets: [
                // STOCKS
                { symbol: 'SPY', name: 'S&P 500 ETF', price: 470.50, change24h: 0.45, type: 'STOCK', trend: 'BULLISH' },
                { symbol: 'QQQ', name: 'Nasdaq 100 ETF', price: 405.20, change24h: 0.82, type: 'STOCK', trend: 'BULLISH' },
                { symbol: 'NVDA', name: 'Nvidia', price: 680.15, change24h: 2.10, type: 'STOCK', trend: 'BULLISH' },
                { symbol: 'AAPL', name: 'Apple', price: 185.30, change24h: -0.20, type: 'STOCK', trend: 'NEUTRAL' },

                // CRYPTO
                { symbol: 'BTC', name: 'Bitcoin', price: 52000.00, change24h: 3.50, type: 'CRYPTO', trend: 'BULLISH' },
                { symbol: 'ETH', name: 'Ethereum', price: 2800.00, change24h: 2.15, type: 'CRYPTO', trend: 'BULLISH' },
                { symbol: 'SOL', name: 'Solana', price: 110.50, change24h: 5.40, type: 'CRYPTO', trend: 'BULLISH' },

                // COMMODITIES
                { symbol: 'GLD', name: 'Gold', price: 195.40, change24h: 0.10, type: 'COMMODITY', trend: 'NEUTRAL' },
                { symbol: 'USO', name: 'Oil Fund', price: 72.30, change24h: 1.25, type: 'COMMODITY', trend: 'BULLISH' },
                { symbol: 'SLV', name: 'Silver', price: 21.80, change24h: -0.40, type: 'COMMODITY', trend: 'BEARISH' },

                // PREDICTION MARKETS (Kalshi)
                { symbol: 'FED-CUT-JUN', name: 'Fed Cut in June', price: 0.65, change24h: 0.05, type: 'PREDICTION', trend: 'BULLISH' },
                { symbol: 'ELECTION-2024', name: 'Election 2024 GOP', price: 0.45, change24h: -0.02, type: 'PREDICTION', trend: 'NEUTRAL' },

                // LOTTERY
                { symbol: 'POWERBALL', name: 'Powerball Jackpot', price: 2.00, change24h: 0.00, type: 'LOTTERY', trend: 'NEUTRAL' },
                { symbol: 'MEGA', name: 'Mega Millions', price: 2.00, change24h: 0.00, type: 'LOTTERY', trend: 'NEUTRAL' },
            ]
        };
    }
}
