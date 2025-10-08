import { NextResponse } from 'next/server';
import { getQuotes } from '@/lib/server/market-data';
import { getMarketNews } from '@/lib/server/news';
import { chat } from '@/lib/server/openai';
import type { NewsArticle } from '@/types/news';
import type { RealTimeQuote } from '@/lib/services/real-market-data';

const STOCK_SYMBOLS = ['AAPL', 'MSFT', 'NVDA', 'SPY'];
const CRYPTO_SYMBOLS = ['BTC', 'ETH', 'SOL'];
const SPORT_LINES = [
  { event: 'NFL: Chiefs vs Bills', line: 'Chiefs -3.5', confidence: 62 },
  { event: 'NBA: Lakers vs Warriors', line: 'Over 228.5', confidence: 58 },
  { event: 'MLB: Yankees vs Red Sox', line: 'Yankees Moneyline', confidence: 55 },
];

const BASE_BUDGET = 40;
const TARGET_WINNINGS = 30;

interface StrategyRecommendation {
  title: string;
  summary: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  budget: number;
  expectedReturn: number;
  keyInsights: string[];
  bankrollTips: string;
  segments: Array<{
    category: 'Stocks' | 'Crypto' | 'Sports' | 'Lottery' | string;
    allocation: number;
    expectedReturn: number;
    recommendations: Array<{
      title: string;
      action: string;
      rationale: string;
      confidence: number;
      stake: number;
      projectedReturn: number;
    }>;
  }>;
}

function buildFallbackStrategy(): StrategyRecommendation {
  return {
    title: 'Balanced Multi-Market Opportunity Map',
    summary:
      'Core AI signals favour a barbell approach: accumulate momentum tech, lean into BTC strength, back high-confidence playoff matchups, and cover Powerball hot streak.',
    riskLevel: 'MEDIUM',
    budget: BASE_BUDGET,
    expectedReturn: TARGET_WINNINGS,
    keyInsights: [
      'Mega-cap tech leadership plus dovish Fed tone keeps equities constructive.',
      'BTC inflows and positive on-chain momentum support upside continuation.',
      'Playoff underdogs have strong ATS trends; target disciplined exposure.',
      'Lottery wheel prioritises hot/cold balance with delta spacing.',
    ],
    bankrollTips:
      'Stake only the illustrated $40 allocation today; recycle winnings, cap downside with stop-loss triggers on equities, and never chase losses across verticals.',
    segments: [
      {
        category: 'Stocks',
        allocation: 18,
        expectedReturn: 13,
        recommendations: [
          {
            title: 'NVDA Momentum Booster',
            action: 'BUY',
            rationale: 'AI demand pipeline plus bullish earnings revisions and strong call-volume skew.',
            confidence: 78,
            stake: 10,
            projectedReturn: 8,
          },
          {
            title: 'SPY Call Debit Spread',
            action: 'BULLISH SPREAD',
            rationale: 'Seasonal strength + easing yields; defined risk via call spread.',
            confidence: 72,
            stake: 8,
            projectedReturn: 5,
          },
        ],
      },
      {
        category: 'Crypto',
        allocation: 10,
        expectedReturn: 8,
        recommendations: [
          {
            title: 'BTC Swing Position',
            action: 'BUY',
            rationale: 'ETF inflows + golden cross + on-chain accumulation.',
            confidence: 75,
            stake: 7,
            projectedReturn: 6,
          },
          {
            title: 'SOL Momentum punt',
            action: 'BUY',
            rationale: 'DeFi TVL surge + positive funding + breakout through resistance.',
            confidence: 65,
            stake: 3,
            projectedReturn: 2,
          },
        ],
      },
      {
        category: 'Sports',
        allocation: 8,
        expectedReturn: 6,
        recommendations: [
          {
            title: 'Chiefs -3.5 vs Bills',
            action: 'BET',
            rationale: 'Mahomes ATS off bye + Bills injury list; line value to -4.5.',
            confidence: 68,
            stake: 4,
            projectedReturn: 3,
          },
          {
            title: 'Lakers vs Warriors Over 228.5',
            action: 'BET',
            rationale: 'Pace-up spot + rest advantage + Over cashes 7/9 meetings.',
            confidence: 63,
            stake: 4,
            projectedReturn: 3,
          },
        ],
      },
      {
        category: 'Lottery',
        allocation: 4,
        expectedReturn: 3,
        recommendations: [
          {
            title: 'Powerball Delta Wheel',
            action: 'BUY TICKET',
            rationale: 'AI-generated mix of hot & cold numbers optimised for 120-160 sum range.',
            confidence: 52,
            stake: 4,
            projectedReturn: 3,
          },
        ],
      },
    ],
  };
}

function formatQuotesForPrompt(quotes: Record<string, RealTimeQuote>): string {
  return Object.values(quotes)
    .map((quote) => {
      const change = quote.changePercent.toFixed(2);
      const direction = quote.changePercent >= 0 ? '+' : '';
      return `${quote.symbol}: $${quote.price.toFixed(2)} (${direction}${change}%)`;
    })
    .join('\n');
}

function formatNewsForPrompt(news: NewsArticle[]): string {
  return news
    .slice(0, 3)
    .map((article) => `- ${article.title} [${article.sentiment}]`)
    .join('\n');
}

function formatSportsLinesForPrompt(): string {
  return SPORT_LINES.map((line) => `- ${line.event}: ${line.line} (confidence ${line.confidence}%)`).join('\n');
}

function normaliseStrategy(result: any): StrategyRecommendation {
  const fallback = buildFallbackStrategy();

  if (!result || typeof result !== 'object') {
    return fallback;
  }

  const segments = Array.isArray(result.segments) ? result.segments : fallback.segments;
  const sanitisedSegments = segments.map((segment: any) => ({
    category: segment?.category ?? 'Unknown',
    allocation: Number(segment?.allocation ?? 0),
    expectedReturn: Number(segment?.expectedReturn ?? 0),
    recommendations: Array.isArray(segment?.recommendations)
      ? segment.recommendations.map((rec: any) => ({
          title: rec?.title ?? 'Opportunity',
          action: rec?.action ?? 'HOLD',
          rationale: rec?.rationale ?? 'No rationale provided.',
          confidence: Number(rec?.confidence ?? 0),
          stake: Number(rec?.stake ?? 0),
          projectedReturn: Number(rec?.projectedReturn ?? 0),
        }))
      : fallback.segments[0].recommendations,
  }));

  return {
    title: result.title ?? fallback.title,
    summary: result.summary ?? fallback.summary,
    riskLevel: (result.riskLevel ?? fallback.riskLevel) as StrategyRecommendation['riskLevel'],
    budget: Number(result.budget ?? BASE_BUDGET),
    expectedReturn: Number(result.expectedReturn ?? TARGET_WINNINGS),
    keyInsights: Array.isArray(result.keyInsights) ? result.keyInsights : fallback.keyInsights,
    bankrollTips: result.bankrollTips ?? fallback.bankrollTips,
    segments: sanitisedSegments,
  };
}

export async function GET() {
  const budget = BASE_BUDGET;

  try {
    const [quotes, news] = await Promise.all([
      getQuotes([...STOCK_SYMBOLS, ...CRYPTO_SYMBOLS]),
      getMarketNews(['financial_markets', 'crypto', 'sports_betting'], 5),
    ]);

    const prompt = `
You are Stratford AI, a multi-market strategist.

Budget available today: $${budget}
Desired winnings target: $${TARGET_WINNINGS}

Market snapshot:
${formatQuotesForPrompt(quotes)}

Sports betting lines to evaluate:
${formatSportsLinesForPrompt()}

Top news drivers:
${formatNewsForPrompt(news)}

Return JSON with the following EXACT structure:
{
  "title": string,
  "summary": string,
  "riskLevel": "LOW" | "MEDIUM" | "HIGH",
  "budget": number,
  "expectedReturn": number,
  "keyInsights": string[],
  "bankrollTips": string,
  "segments": [
    {
      "category": "Stocks" | "Crypto" | "Sports" | "Lottery",
      "allocation": number,
      "expectedReturn": number,
      "recommendations": [
        {
          "title": string,
          "action": string,
          "rationale": string,
          "confidence": number,
          "stake": number,
          "projectedReturn": number
        }
      ]
    }
  ]
}

Constraints:
- Total allocation must equal ${budget}.
- Total expectedReturn across segments should approximate ${TARGET_WINNINGS}.
- Recommendations must be concrete, time-boxed for today, and data-driven referencing the supplied context.
- Confidence is 0-100.
- Monetary fields (allocation, stake, expectedReturn, projectedReturn) must be numbers (no currency symbols).
- Provide exactly four segments: Stocks, Crypto, Sports, Lottery.
`.trim();

    let strategy = buildFallbackStrategy();

    try {
      const aiResponse = await chat({
        userMessage: prompt,
        context:
          'You are a deterministic quantitative strategist. Reply ONLY in strict JSON matching the requested schema. Do not include any surrounding text.',
      });
      const parsed = JSON.parse(aiResponse);
      strategy = normaliseStrategy(parsed);
    } catch (error) {
      console.error('Failed to parse AI strategy response:', error);
    }

    return NextResponse.json({
      strategy,
      budget,
      news: news.slice(0, 5),
      quotes,
      sports: SPORT_LINES,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Strategy API] error generating plan:', error);
    const fallback = buildFallbackStrategy();

    return NextResponse.json(
      {
        strategy: fallback,
        budget,
        news: [],
        quotes: {},
        sports: SPORT_LINES,
        generatedAt: new Date().toISOString(),
        error: 'Failed to generate live strategy. Using fallback playbook.',
      },
      { status: 200 }
    );
  }
}
