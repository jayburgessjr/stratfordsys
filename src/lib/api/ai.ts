/**
 * Client-side helpers for AI endpoints.
 */

import type {
  TradingSignal,
  StrategyRecommendation,
  PortfolioAdvice,
} from '@/types/ai';

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message = errorBody?.error || response.statusText || 'Request failed';
    throw new Error(message);
  }

  const data = await response.json();
  return data.result as T;
}

export async function requestTradingSignal(payload: {
  symbol: string;
  currentPrice: number;
  change: number;
  volume: number;
  additionalData?: unknown;
}): Promise<TradingSignal> {
  return postJson<TradingSignal>('/api/ai/analyze-stock', payload);
}

export async function requestStrategy(payload: {
  goals: string;
  riskTolerance: 'LOW' | 'MEDIUM' | 'HIGH';
  capital: number;
  preferredAssets: string[];
}): Promise<StrategyRecommendation> {
  return postJson<StrategyRecommendation>('/api/ai/generate-strategy', payload);
}

export async function requestPortfolioAdvice(payload: {
  positions: Array<{ symbol: string; shares: number; avgCost: number; currentPrice: number }>;
  totalValue: number;
}): Promise<PortfolioAdvice> {
  return postJson<PortfolioAdvice>('/api/ai/analyze-portfolio', payload);
}

export async function requestAIChat(payload: { message: string; context?: string }): Promise<string> {
  return postJson<string>('/api/ai/chat', payload);
}
