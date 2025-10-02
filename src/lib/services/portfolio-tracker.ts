/**
 * Portfolio Tracker Service
 * Tracks stock positions with real-time prices from Alpha Vantage
 * Supports syncing with Robinhood for live trading data
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
  shares: number;
  costBasis: number; // Average purchase price per share
  purchaseDate: string;
  sector?: string;
}

export interface PortfolioHolding extends Position {
  currentPrice: number;
  currentValue: number;
  costValue: number;
  gainLoss: number;
  gainLossPercent: number;
  dayChange: number;
  dayChangePercent: number;
  allocation: number; // Will be calculated
}

export interface PortfolioSummary {
  totalValue: number;
  totalCost: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  dayChange: number;
  dayChangePercent: number;
  holdings: PortfolioHolding[];
  diversificationScore: number;
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
   * Initialize portfolio positions from localStorage or demo data
   */
  private initializePositions() {
    // Try to load from localStorage first (manual portfolio management)
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('manual_portfolio');
      if (saved) {
        try {
          const manual = JSON.parse(saved);
          this.positions = manual.map((p: any) => ({
            symbol: p.symbol,
            name: p.symbol,
            shares: p.shares,
            costBasis: p.costBasis,
            purchaseDate: p.purchaseDate,
            sector: undefined,
          }));
          console.log(`Loaded ${this.positions.length} positions from manual portfolio`);
          return;
        } catch (error) {
          console.error('Error loading manual portfolio:', error);
        }
      }
    }

    // Fall back to demo positions
    this.positions = [
      {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        shares: 50,
        costBasis: 175.50,
        purchaseDate: '2024-01-15',
        sector: 'Technology',
      },
      {
        symbol: 'MSFT',
        name: 'Microsoft Corporation',
        shares: 40,
        costBasis: 380.25,
        purchaseDate: '2024-02-20',
        sector: 'Technology',
      },
      {
        symbol: 'GOOGL',
        name: 'Alphabet Inc.',
        shares: 30,
        costBasis: 145.75,
        purchaseDate: '2024-03-10',
        sector: 'Technology',
      },
      {
        symbol: 'TSLA',
        name: 'Tesla Inc.',
        shares: 25,
        costBasis: 245.00,
        purchaseDate: '2024-01-25',
        sector: 'Automotive',
      },
      {
        symbol: 'NVDA',
        name: 'NVIDIA Corporation',
        shares: 20,
        costBasis: 520.00,
        purchaseDate: '2024-04-05',
        sector: 'Technology',
      },
      {
        symbol: 'META',
        name: 'Meta Platforms Inc.',
        shares: 15,
        costBasis: 385.00,
        purchaseDate: '2024-05-12',
        sector: 'Technology',
      },
      {
        symbol: 'BRK.B',
        name: 'Berkshire Hathaway Inc.',
        shares: 10,
        costBasis: 425.00,
        purchaseDate: '2024-06-01',
        sector: 'Financial',
      },
    ];
  }

  /**
   * Sync portfolio from Robinhood (if configured)
   * Uses API route for server-side Robinhood integration
   */
  async syncFromRobinhood(): Promise<boolean> {
    try {
      console.log('Syncing portfolio from Robinhood via API...');

      const response = await fetch('/api/portfolio/sync');
      const data = await response.json();

      if (!response.ok) {
        console.log('Robinhood sync failed:', data.error || data.message);
        return false;
      }

      if (!data.success || !data.positions) {
        console.log('No Robinhood positions returned');
        return false;
      }

      // Convert Robinhood API response to our Position format
      this.positions = data.positions.map((pos: any) => ({
        symbol: pos.symbol,
        name: pos.symbol,
        shares: pos.shares,
        costBasis: pos.costBasis,
        purchaseDate: new Date().toISOString().split('T')[0],
        sector: undefined,
      }));

      console.log(`Successfully synced ${this.positions.length} positions from Robinhood`);
      return true;
    } catch (error) {
      console.error('Failed to sync from Robinhood:', error);
      return false;
    }
  }

  /**
   * Get portfolio summary with real-time data
   * Attempts to sync from Robinhood first, falls back to manual or demo data
   */
  async getPortfolioSummary(useRobinhood: boolean = true): Promise<PortfolioSummary> {
    // Try to sync from Robinhood if enabled (now works with Vercel API routes)
    if (useRobinhood) {
      await this.syncFromRobinhood();
    }

    const marketService = getRealMarketDataService();
    const holdings: PortfolioHolding[] = [];

    // Fetch current prices for all positions
    for (const position of this.positions) {
      try {
        const quote = await marketService.getQuote(position.symbol);

        const currentValue = quote.price * position.shares;
        const costValue = position.costBasis * position.shares;
        const gainLoss = currentValue - costValue;
        const gainLossPercent = (gainLoss / costValue) * 100;

        holdings.push({
          ...position,
          currentPrice: quote.price,
          currentValue,
          costValue,
          gainLoss,
          gainLossPercent,
          dayChange: quote.change * position.shares,
          dayChangePercent: quote.changePercent,
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
    const totalValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);
    const totalCost = holdings.reduce((sum, h) => sum + h.costValue, 0);
    const totalGainLoss = totalValue - totalCost;
    const totalGainLossPercent = (totalGainLoss / totalCost) * 100;
    const dayChange = holdings.reduce((sum, h) => sum + h.dayChange, 0);
    const dayChangePercent = (dayChange / (totalValue - dayChange)) * 100;

    // Calculate allocations
    holdings.forEach(holding => {
      holding.allocation = (holding.currentValue / totalValue) * 100;
    });

    // Find top gainer and loser
    const sortedByGainLoss = [...holdings].sort((a, b) => b.gainLossPercent - a.gainLossPercent);
    const topGainer = sortedByGainLoss[0] || null;
    const topLoser = sortedByGainLoss[sortedByGainLoss.length - 1] || null;

    // Calculate diversification score (simplified)
    const diversificationScore = this.calculateDiversificationScore(holdings);

    return {
      totalValue,
      totalCost,
      totalGainLoss,
      totalGainLossPercent,
      dayChange,
      dayChangePercent,
      holdings,
      diversificationScore,
      topGainer,
      topLoser,
    };
  }

  /**
   * Calculate diversification score
   */
  private calculateDiversificationScore(holdings: PortfolioHolding[]): number {
    // Higher score means better diversification
    // Score based on:
    // 1. Number of holdings (more is better, up to a point)
    // 2. Allocation spread (more even is better)

    const numHoldings = holdings.length;
    const holdingScore = Math.min(numHoldings / 10, 1) * 40; // Max 40 points

    // Calculate allocation variance (lower variance = better diversification)
    const avgAllocation = 100 / numHoldings;
    const variance = holdings.reduce((sum, h) => {
      const diff = h.allocation - avgAllocation;
      return sum + diff * diff;
    }, 0) / numHoldings;

    // Convert variance to score (lower variance = higher score)
    const allocationScore = Math.max(0, 60 - variance); // Max 60 points

    return Math.round(holdingScore + allocationScore);
  }

  /**
   * Add a new position
   */
  addPosition(position: Position) {
    this.positions.push(position);
  }

  /**
   * Remove a position
   */
  removePosition(symbol: string) {
    this.positions = this.positions.filter(p => p.symbol !== symbol);
  }

  /**
   * Update position shares
   */
  updateShares(symbol: string, shares: number) {
    const position = this.positions.find(p => p.symbol === symbol);
    if (position) {
      position.shares = shares;
    }
  }

  /**
   * Get all positions
   */
  getPositions(): Position[] {
    return [...this.positions];
  }
}

// Singleton instance
let portfolioTracker: PortfolioTracker | null = null;

export function getPortfolioTracker(): PortfolioTracker {
  if (!portfolioTracker) {
    portfolioTracker = new PortfolioTracker();
  }
  return portfolioTracker;
}
