/**
 * Shared AI-related type definitions.
 */

export type TaskCriticality = 'high' | 'medium' | 'low';

export interface TradingSignal {
  symbol: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  reasoning: string;
  targetPrice?: number;
  stopLoss?: number;
  timeframe?: string;
}

export interface StrategyRecommendation {
  name: string;
  type: string;
  description: string;
  entryConditions: string[];
  exitConditions: string[];
  riskManagement: string[];
  expectedMetrics: {
    winRate?: number;
    riskReward?: number;
    maxDrawdown?: number;
  };
  implementation: string;
}

export interface MarketAnalysis {
  summary: string;
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  sentimentScore: number;
  keyPoints: string[];
  risks: string[];
  opportunities: string[];
}

export interface PortfolioAdvice {
  overallHealth: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  suggestions: string[];
  warnings: string[];
  rebalancingNeeded: boolean;
}

export interface QuantumAllocation {
  allocation: {
    assetClass: 'Stock' | 'Crypto' | 'Commodity' | 'MutualFund' | 'Prediction' | 'Sports' | 'Lottery' | 'Cash';
    percentage: number;
    reasoning: string;
    recommendedAssets: string[];
  }[];
  totalProjectedReturn: string;
  riskScore: number;
  agentSummary: string;
}
