/**
 * OpenAI Service
 * Powers AI features: trading agents, strategy generation, market analysis
 */

import OpenAI from 'openai';

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
  sentimentScore: number; // 0-100
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

class OpenAIService {
  private client: OpenAI;
  private model: string = 'gpt-4o-mini'; // Cost-effective model

  constructor(apiKey?: string) {
    const key = apiKey || process.env.OPENAI_API_KEY;

    if (!key) {
      throw new Error('OpenAI API key not provided');
    }

    this.client = new OpenAI({
      apiKey: key,
      dangerouslyAllowBrowser: true // For client-side usage
    });
  }

  /**
   * Analyze a stock and generate trading signal
   */
  async analyzeStock(
    symbol: string,
    currentPrice: number,
    change: number,
    volume: number,
    additionalData?: any
  ): Promise<TradingSignal> {
    try {
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

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a professional stock analyst with 20 years of experience. Provide concise, actionable analysis.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3, // Lower for more consistent analysis
        response_format: { type: 'json_object' }
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      const parsed = JSON.parse(content);

      return {
        symbol,
        action: parsed.action,
        confidence: parsed.confidence,
        reasoning: parsed.reasoning,
        targetPrice: parsed.targetPrice,
        stopLoss: parsed.stopLoss,
        timeframe: parsed.timeframe
      };
    } catch (error) {
      console.error('Error analyzing stock:', error);
      throw error;
    }
  }

  /**
   * Generate a custom trading strategy
   */
  async generateStrategy(
    goals: string,
    riskTolerance: 'LOW' | 'MEDIUM' | 'HIGH',
    capital: number,
    preferredAssets: string[]
  ): Promise<StrategyRecommendation> {
    try {
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

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a quantitative trading strategist. Create practical, proven strategies with specific rules.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.5,
        response_format: { type: 'json_object' }
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      return JSON.parse(content) as StrategyRecommendation;
    } catch (error) {
      console.error('Error generating strategy:', error);
      throw error;
    }
  }

  /**
   * Analyze market sentiment from news/data
   */
  async analyzeMarketSentiment(
    marketData: string,
    newsHeadlines?: string[]
  ): Promise<MarketAnalysis> {
    try {
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

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a market analyst. Provide balanced, objective analysis of market conditions.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.4,
        response_format: { type: 'json_object' }
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      return JSON.parse(content) as MarketAnalysis;
    } catch (error) {
      console.error('Error analyzing market:', error);
      throw error;
    }
  }

  /**
   * Analyze portfolio and provide recommendations
   */
  async analyzePortfolio(
    positions: Array<{symbol: string; shares: number; avgCost: number; currentPrice: number}>,
    totalValue: number
  ): Promise<PortfolioAdvice> {
    try {
      const portfolioData = positions.map(p => ({
        symbol: p.symbol,
        shares: p.shares,
        value: p.shares * p.currentPrice,
        pnl: ((p.currentPrice - p.avgCost) / p.avgCost * 100).toFixed(2) + '%'
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

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a portfolio advisor. Provide prudent, risk-aware recommendations.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      return JSON.parse(content) as PortfolioAdvice;
    } catch (error) {
      console.error('Error analyzing portfolio:', error);
      throw error;
    }
  }

  /**
   * General AI chat for questions
   */
  async chat(userMessage: string, context?: string): Promise<string> {
    try {
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content: `You are Stratford AI, a helpful trading assistant. Provide clear, concise answers about trading, markets, and strategies. ${context || ''}`
        },
        {
          role: 'user',
          content: userMessage
        }
      ];

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages,
        temperature: 0.7,
        max_tokens: 500
      });

      return response.choices[0].message.content || 'Sorry, I could not generate a response.';
    } catch (error) {
      console.error('Error in chat:', error);
      throw error;
    }
  }

  /**
   * Explain a trade decision
   */
  async explainTrade(
    symbol: string,
    action: string,
    price: number,
    reasoning?: string
  ): Promise<string> {
    try {
      const prompt = `Explain this trade in simple terms for a beginner:

Symbol: ${symbol}
Action: ${action}
Price: $${price}
${reasoning ? `Original Reasoning: ${reasoning}` : ''}

Provide:
1. What this trade means
2. Why it might be a good/bad idea
3. What to watch for
4. Risk considerations

Keep it educational and beginner-friendly.`;

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a patient trading educator. Explain concepts clearly for beginners.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.6,
        max_tokens: 400
      });

      return response.choices[0].message.content || 'Could not generate explanation.';
    } catch (error) {
      console.error('Error explaining trade:', error);
      throw error;
    }
  }
}

// Singleton instance
let instance: OpenAIService | null = null;

export function getOpenAIService(apiKey?: string): OpenAIService {
  if (!instance) {
    instance = new OpenAIService(apiKey);
  }
  return instance;
}

export default OpenAIService;
