'use server';

import OpenAI from 'openai';
import type {
  TaskCriticality,
  TradingSignal,
  StrategyRecommendation,
  MarketAnalysis,
  PortfolioAdvice,
} from '@/types/ai';

type ChatMessage = OpenAI.Chat.ChatCompletionMessageParam;

interface CacheEntry<T> {
  response: T;
  timestamp: number;
}

const CACHE_TTL = 60 * 60 * 1000; // 1 hour
const cache = new Map<string, CacheEntry<unknown>>();

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (client) {
    return client;
  }

  const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('NEXT_PUBLIC_OPENAI_API_KEY is not configured.');
  }

  client = new OpenAI({ apiKey });
  return client;
}

function selectModel(criticality: TaskCriticality, needsStrictReasoning = false): string {
  if (criticality === 'high') {
    return needsStrictReasoning ? 'gpt-4o' : 'gpt-4o-mini';
  }
  if (criticality === 'medium') {
    return 'gpt-4o-mini';
  }
  return 'gpt-3.5-turbo';
}

function getCacheKey(model: string, prompt: string): string {
  return `${model}:${prompt.trim().toLowerCase().slice(0, 200)}`;
}

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.response as T;
}

function setCached<T>(key: string, value: T) {
  cache.set(key, { response: value, timestamp: Date.now() });
  if (cache.size > 200) {
    const [oldestKey] = cache.keys();
    if (oldestKey) cache.delete(oldestKey);
  }
}

async function createChatCompletion<T>(
  model: string,
  messages: ChatMessage[],
  options: Partial<OpenAI.Chat.Completions.ChatCompletionCreateParams> = {}
): Promise<T> {
  const clientInstance = getClient();
  const response = await clientInstance.chat.completions.create({
    model,
    messages,
    temperature: 0.4,
    ...options,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response content received from OpenAI.');
  }

  return JSON.parse(content) as T;
}

export async function analyzeStock(params: {
  symbol: string;
  currentPrice: number;
  change: number;
  volume: number;
  additionalData?: unknown;
}): Promise<TradingSignal> {
  const { symbol, currentPrice, change, volume, additionalData } = params;

  const prompt = `You are an expert stock analyst. Analyze ${symbol}:

Current Data:
- Price: $${currentPrice}
- Change: ${change}%
- Volume: ${volume}
${additionalData ? `- Additional: ${JSON.stringify(additionalData)}` : ''}

Provide a trading recommendation in this EXACT JSON format:
{
  "action": "BUY" | "SELL" | "HOLD",
  "confidence": 0-100,
  "reasoning": "2-3 sentences explaining your analysis",
  "targetPrice": number,
  "stopLoss": number,
  "timeframe": "short-term" | "medium-term" | "long-term"
}

Be specific, data-driven, and include risk management.`;

  const model = selectModel('high', Math.abs(change) > 5);
  const cacheKey = getCacheKey(model, prompt);
  const cached = getCached<TradingSignal>(cacheKey);
  if (cached) {
    return { ...cached, symbol };
  }

  const response = await createChatCompletion<Omit<TradingSignal, 'symbol'>>(
    model,
    [
      {
        role: 'system',
        content:
          'You are a professional stock analyst with 20 years of experience. Provide concise, actionable analysis.',
      },
      { role: 'user', content: prompt },
    ],
    { response_format: { type: 'json_object' }, temperature: 0.3 }
  );

  const result: TradingSignal = { symbol, ...response };
  setCached(cacheKey, result);
  return result;
}

export async function generateStrategy(params: {
  goals: string;
  riskTolerance: 'LOW' | 'MEDIUM' | 'HIGH';
  capital: number;
  preferredAssets: string[];
}): Promise<StrategyRecommendation> {
  const { goals, riskTolerance, capital, preferredAssets } = params;

  const prompt = `Create a trading strategy:

Goals: ${goals}
Risk Tolerance: ${riskTolerance}
Capital: $${capital}
Preferred Assets: ${preferredAssets.join(', ')}

Provide a complete strategy in this EXACT JSON format:
{
  "name": "Strategy Name",
  "type": "Type (e.g., Momentum, Mean Reversion, Trend Following)",
  "description": "Brief description",
  "entryConditions": ["condition 1", "condition 2", ...],
  "exitConditions": ["condition 1", "condition 2", ...],
  "riskManagement": ["rule 1", "rule 2", ...],
  "expectedMetrics": {
    "winRate": 60,
    "riskReward": 2.0,
    "maxDrawdown": 15
  },
  "implementation": "Step-by-step implementation guide"
}`;

  const model = selectModel('high');
  const cacheKey = getCacheKey(model, prompt);
  const cached = getCached<StrategyRecommendation>(cacheKey);
  if (cached) {
    return cached;
  }

  const strategy = await createChatCompletion<StrategyRecommendation>(
    model,
    [
      {
        role: 'system',
        content:
          'You are a quantitative trading strategist. Create practical, proven strategies with specific rules.',
      },
      { role: 'user', content: prompt },
    ],
    { response_format: { type: 'json_object' }, temperature: 0.5 }
  );

  setCached(cacheKey, strategy);
  return strategy;
}

export async function analyzePortfolio(params: {
  positions: Array<{ symbol: string; shares: number; avgCost: number; currentPrice: number }>;
  totalValue: number;
}): Promise<PortfolioAdvice> {
  const { positions, totalValue } = params;

  const portfolioData = positions.map((p) => ({
    symbol: p.symbol,
    shares: p.shares,
    value: p.shares * p.currentPrice,
    pnl: `${(((p.currentPrice - p.avgCost) / p.avgCost) * 100).toFixed(2)}%`,
  }));

  const prompt = `Analyze this portfolio:

Total Value: $${totalValue}
Positions:
${JSON.stringify(portfolioData, null, 2)}

Provide advice in this EXACT JSON format:
{
  "overallHealth": "Brief assessment (1-2 sentences)",
  "riskLevel": "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH",
  "suggestions": ["suggestion 1", "suggestion 2", ...],
  "warnings": ["warning 1", "warning 2", ...],
  "rebalancingNeeded": true | false
}

Focus on: diversification, risk concentration, sector allocation, position sizing.`;

  const model = selectModel('high', true);

  return createChatCompletion<PortfolioAdvice>(
    model,
    [
      {
        role: 'system',
        content: 'You are a portfolio advisor. Provide prudent, risk-aware recommendations.',
      },
      { role: 'user', content: prompt },
    ],
    { response_format: { type: 'json_object' }, temperature: 0.3 }
  );
}

export async function analyzeMarketSentiment(params: {
  marketData: string;
  newsHeadlines?: string[];
}): Promise<MarketAnalysis> {
  const { marketData, newsHeadlines } = params;

  const prompt = `Analyze current market conditions:

Market Data: ${marketData}
${newsHeadlines ? `\nRecent News:\n${newsHeadlines.join('\n')}` : ''}

Provide analysis in this EXACT JSON format:
{
  "summary": "2-3 sentence summary",
  "sentiment": "BULLISH" | "BEARISH" | "NEUTRAL",
  "sentimentScore": 0-100,
  "keyPoints": ["point 1", "point 2", ...],
  "risks": ["risk 1", "risk 2", ...],
  "opportunities": ["opportunity 1", "opportunity 2", ...]
}`;

  const model = selectModel('medium');
  const cacheKey = getCacheKey(model, prompt);
  const cached = getCached<MarketAnalysis>(cacheKey);
  if (cached) {
    return cached;
  }

  const analysis = await createChatCompletion<MarketAnalysis>(
    model,
    [
      {
        role: 'system',
        content: 'You are a market analyst. Provide balanced, objective analysis of market conditions.',
      },
      { role: 'user', content: prompt },
    ],
    { response_format: { type: 'json_object' } }
  );

  setCached(cacheKey, analysis);
  return analysis;
}

export async function chat(params: { userMessage: string; context?: string }): Promise<string> {
  const { userMessage, context } = params;
  const model = selectModel('low');

  const clientInstance = getClient();
  const response = await clientInstance.chat.completions.create({
    model,
    messages: [
      {
        role: 'system',
        content: `You are Stratford AI, a helpful trading assistant. Provide clear, concise answers about trading, markets, and strategies. ${
          context || ''
        }`,
      },
      { role: 'user', content: userMessage },
    ],
    temperature: 0.7,
    max_tokens: 500,
  });

  return response.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
}

export async function explainTrade(params: {
  symbol: string;
  action: string;
  price: number;
  reasoning?: string;
}): Promise<string> {
  const { symbol, action, price, reasoning } = params;
  const model = selectModel('medium');

  const clientInstance = getClient();
  const response = await clientInstance.chat.completions.create({
    model,
    messages: [
      {
        role: 'system',
        content: 'You are a patient trading educator. Explain concepts clearly for beginners.',
      },
      {
        role: 'user',
        content: `Explain this trade in simple terms for a beginner:

Symbol: ${symbol}
Action: ${action}
Price: $${price}
${reasoning ? `Original Reasoning: ${reasoning}` : ''}

Provide:
1. What this trade means
2. Why it might be a good/bad idea
3. What to watch for
4. Risk considerations

Keep it educational and beginner-friendly.`,
      },
    ],
    temperature: 0.6,
    max_tokens: 400,
  });

  return response.choices[0]?.message?.content || 'Could not generate explanation.';
}
