/**
 * Signal Tracker Service (formerly Portfolio Tracker)
 * Tracks the performance of AI-generated wealth opportunities (Signals).
 * Connects to real market data to verify if predictions are winning or losing.
 */

import { getRealMarketDataService, type RealTimeQuote } from './real-market-data';

// Conditionally import Robinhood only on server side
let getRobinhoodService: any;
if (typeof window === 'undefined') {
  try {
    const rhModule = require('./robinhood-service');
    getRobinhoodService = rhModule.getRobinhoodService;
  } catch (error) {
    console.log('Robinhood module not available (client-side)');
  }
}

export interface Position {
  symbol: string;
  name: string;
  shares: number; // Used as 'Contract Size' or 'Units'
  costBasis: number; // Used as 'Entry Price' or 'Odds'
  purchaseDate: string; // 'Signal Date'
  sector?: string; // 'Signal Type' (e.g., Long, Short, Bet)
}

export interface PortfolioHolding extends Position {
  currentPrice: number;
  currentValue: number;
  costValue: number;
  gainLoss: number;
  gainLossPercent: number;
  dayChange: number;
  dayChangePercent: number;
  allocation: number; // Confidence Score
}

export interface PortfolioSummary {
  totalValue: number; // Total 'Tracked Opportunity' Value
  totalCost: number; // Total Capital Deployed/Risked
  totalGainLoss: number;
  totalGainLossPercent: number;
  dayChange: number;
  dayChangePercent: number;
  holdings: PortfolioHolding[]; // Active Signals
  diversificationScore: number; // Win Rate or Confidence
  topGainer: PortfolioHolding | null;
  topLoser: PortfolioHolding | null;
}

class PortfolioTracker {
  private positions: Position[] = [];

  constructor() {
    // Initialize with manual positions from localStorage or demo positions
    this.initializePositions();
  }

  /**
   * Initialize signals from localStorage (Execution Log) or demo data
   */
  private initializePositions() {
    // Try to load from localStorage first (Log Execution page)
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('execution_log'); // CHANGED: Now reading from execution_log
      if (saved) {
        try {
          const manual = JSON.parse(saved);
          this.positions = manual.map((p: any) => ({
            symbol: p.asset,
            name: p.type === 'BET' ? 'Sports/Event Wager' : `${p.type} Position`,
            shares: p.capital / p.entryPrice, // Derive 'units' from capital
            costBasis: p.entryPrice,
            purchaseDate: p.date,
            sector: p.type, // Store the type (LONG/SHORT/BET) here
          }));
          console.log(`Loaded ${this.positions.length} signals from execution log`);
          return;
        } catch (error) {
          console.error('Error loading execution log:', error);
        }
      }
    }

    // Fall back to demo SIGNALS (not portfolio holdings)
    this.positions = [
      {
        symbol: 'NVDA',
        name: 'AI Momentum Breakout',
        shares: 10, // Simulated units
        costBasis: 480.00, // Signal Entry
        purchaseDate: '2024-06-15',
        sector: 'LONG',
      },
      {
        symbol: 'TSLA',
        name: 'Overvaluation Mean Reversion',
        shares: 15,
        costBasis: 260.00,
        purchaseDate: '2024-06-18',
        sector: 'SHORT',
      },
      {
        symbol: 'AMD',
        name: 'Semi-Conductor Swing',
        shares: 20,
        costBasis: 115.50,
        purchaseDate: '2024-06-20',
        sector: 'LONG',
      },
      {
        symbol: 'GME',
        name: 'Volatility Arb',
        shares: 100,
        costBasis: 22.50,
        purchaseDate: '2024-06-21',
        sector: 'LONG',
      },
      {
        symbol: 'COIN',
        name: 'Crypto Correlation',
        shares: 15,
        costBasis: 145.00,
        purchaseDate: '2024-06-19',
        sector: 'SHORT',
      },
    ];
  }

  // ... (E*Trade/Robinhood sync methods removed or deprecated for now as they are for asset mgmt)
  async syncFromETrade(): Promise<boolean> { return false; }
  async syncFromRobinhood(): Promise<boolean> { return false; }

  /**
   * Get signal performance summary with real-time data
   */
  async getPortfolioSummary(useBroker: boolean = false, preferETrade: boolean = true): Promise<PortfolioSummary> {
    const marketService = getRealMarketDataService();
    const holdings: PortfolioHolding[] = [];

    // Fetch current prices for all signals to check performance
    for (const position of this.positions) {
      try {
        // Skip betting/custom assets for now in real market data check
        if (position.sector === 'BET') {
             // Mock update for bets (random outcomes for demo)
            const isWin = Math.random() > 0.5;
            const currentPrice = isWin ? position.costBasis * 2 : 0; // Simple win/loss logic
            holdings.push({
                ...position,
                currentPrice: currentPrice,
                currentValue: currentPrice * position.shares,
                costValue: position.costBasis * position.shares,
                gainLoss: (currentPrice - position.costBasis) * position.shares,
                gainLossPercent: isWin ? 100 : -100,
                dayChange: 0,
                dayChangePercent: 0,
                allocation: 0
            });
            continue;
        }

        const quote = await marketService.getQuote(position.symbol);
        let currentPrice = quote.price;

        // If SHORT signal, inverse the PnL logic visually
        // (For simplicity in this tracker, we'll keep standard math but label it appropriately in UI)
        
        const costValue = position.costBasis * position.shares;
        const currentValue = currentPrice * position.shares;
        
        // For Short positions: Profit if Price < Cost
        let gainLoss = currentValue - costValue;
        if (position.sector === 'SHORT') {
            gainLoss = costValue - currentValue; // Invert PnL
        }

        const gainLossPercent = (gainLoss / costValue) * 100;

        holdings.push({
          ...position,
          currentPrice,
          currentValue, // For shorts this technically represents liability, but we treat as "Exposure"
          costValue,
          gainLoss,
          gainLossPercent,
          dayChange: quote.change * position.shares * (position.sector === 'SHORT' ? -1 : 1),
          dayChangePercent: quote.changePercent * (position.sector === 'SHORT' ? -1 : 1),
          allocation: 0, // Will be calculated below
        });
      } catch (error) {
        console.error(`Error fetching quote for ${position.symbol}:`, error);
        // Use cost basis as fallback
        const costValue = position.costBasis * position.shares;
        holdings.push({
          ...position,
          currentPrice: position.costBasis,
          currentValue: costValue,
          costValue,
          gainLoss: 0,
          gainLossPercent: 0,
          dayChange: 0,
          dayChangePercent: 0,
          allocation: 0,
        });
      }
    }

    // Calculate totals
    const totalValue = holdings.reduce((sum, h) => sum + h.currentValue, 0); // Total Exposure
    const totalCost = holdings.reduce((sum, h) => sum + h.costValue, 0); // Total Capital Deployed
    const totalGainLoss = holdings.reduce((sum, h) => sum + h.gainLoss, 0); // Actual PnL
    const totalGainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;
    const dayChange = holdings.reduce((sum, h) => sum + h.dayChange, 0);
    const dayChangePercent = (totalValue - dayChange) !== 0 ? (dayChange / (totalValue - dayChange)) * 100 : 0;

    // Calculate "Confidence" (mapped to allocation for UI compatibility)
    // In a real system, this would come from the AI model. For now, we normalize exposure.
    holdings.forEach(holding => {
      holding.allocation = (holding.currentValue / totalValue) * 100;
    });

    // Find top performer and worst miss
    const sortedByGainLoss = [...holdings].sort((a, b) => b.gainLossPercent - a.gainLossPercent);
    const topGainer = sortedByGainLoss[0] || null;
    const topLoser = sortedByGainLoss[sortedByGainLoss.length - 1] || null;

    // Calculate "Win Rate" (formerly Diversification Score)
    const winningTrades = holdings.filter(h => h.gainLoss > 0).length;
    const winRate = holdings.length > 0 ? Math.round((winningTrades / holdings.length) * 100) : 0;

    return {
      totalValue,
      totalCost,
      totalGainLoss,
      totalGainLossPercent,
      dayChange,
      dayChangePercent,
      holdings,
      diversificationScore: winRate, // Mapped to Win Rate
      topGainer,
      topLoser,
    };
  }

  // Helper calculation methods can remain...
  private calculateDiversificationScore(holdings: PortfolioHolding[]): number { return 0; }

  addPosition(position: Position) { this.positions.push(position); }
  removePosition(symbol: string) { this.positions = this.positions.filter(p => p.symbol !== symbol); }
  getPositions(): Position[] { return [...this.positions]; }
}

// Singleton instance
let portfolioTracker: PortfolioTracker | null = null;

export function getPortfolioTracker(): PortfolioTracker {
  if (!portfolioTracker) {
    portfolioTracker = new PortfolioTracker();
  }
  return portfolioTracker;
}
