import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getQuotes } from '@/lib/server/market-data';
import { getMarketNews } from '@/lib/server/news';
import { chat } from '@/lib/server/openai';
import { getSportsDataService } from '@/lib/services/sports-data';
import { getSportsPredictor } from '@/lib/services/sports-predictor';
import type { RealTimeQuote } from '@/lib/services/real-market-data';
import type { NewsArticle } from '@/types/news';

type SportsLine = {
  event: string;
  league: string;
  confidence: number;
  line: string;
  kickoff: string;
  notes?: string[];
};

const STOCK_SYMBOLS = ['SPY', 'AAPL', 'MSFT', 'NVDA'];
const CRYPTO_SYMBOLS = ['BTC', 'ETH', 'SOL'];
const SPORTS_LEAGUES = ['NFL', 'NBA', 'MLB', 'NHL'];

const sportsDataService = getSportsDataService();
const sportsPredictor = getSportsPredictor();

const CACHE_TTL = 1000 * 60 * 5; // 5 minutes

interface Cached<T> {
  data: T;
  timestamp: number;
}

let quotesCache: Cached<Record<string, RealTimeQuote>> | null = null;
let newsCache: Cached<NewsArticle[]> | null = null;
let sportsCache: Cached<SportsLine[]> | null = null;

const strategySchema = z.object({
  title: z.string(),
  summary: z.string(),
  riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  budget: z.number(),
  expectedReturn: z.number(),
  keyInsights: z.array(z.string()),
  bankrollTips: z.string(),
  segments: z.array(
    z.object({
      category: z.string(),
      allocation: z.number(),
      expectedReturn: z.number(),
      recommendations: z.array(
        z.object({
          title: z.string(),
          action: z.string(),
          rationale: z.string(),
          confidence: z.number().min(0).max(100),
          stake: z.number(),
          projectedReturn: z.number(),
        })
      ),
    })
  ),
});

const requestSchema = z.object({
  budget: z.number().min(10).max(1000).default(40),
  riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  persona: z.enum(['conservative', 'balanced', 'aggressive']).default('balanced'),
});

const personaPrompts: Record<string, string> = {
  conservative: 'Capital preservation first. Focus on low-volatility equities, hedged crypto, and limited exposure to sports or lottery plays with high confidence edges only.',
  balanced: 'Blend growth and defense. Distribute capital across equities, crypto momentum, airtight sports angles, and small lottery coverage.',
  aggressive: 'Maximize upside. Prioritise asymmetric bets, momentum trades, parlays, and higher-volatility crypto positions while acknowledging increased drawdown risk.',
};

function roundCurrency(value: number, decimals = 2) {
  return Number.isFinite(value) ? parseFloat(value.toFixed(decimals)) : 0;
}

async function getQuotesSnapshot() {
  if (quotesCache && Date.now() - quotesCache.timestamp < CACHE_TTL) {
    return quotesCache.data;
  }
  const symbols = [...STOCK_SYMBOLS, ...CRYPTO_SYMBOLS];
  const data = await getQuotes(symbols);
  quotesCache = { data, timestamp: Date.now() };
  return data;
}

async function getNewsSnapshot() {
  if (newsCache && Date.now() - newsCache.timestamp < CACHE_TTL) {
    return newsCache.data;
  }
  const topics = ['financial_markets', 'crypto', 'sports_betting'];
  const news = await getMarketNews(topics, 6);
  newsCache = { data: news, timestamp: Date.now() };
  return news;
}

async function buildSportsLines(): Promise<SportsLine[]> {
  const upcomingGames = await sportsDataService.getUpcomingGames();
  const filtered = upcomingGames
    .filter((game) => SPORTS_LEAGUES.includes(game.league))
    .slice(0, 10);

  const predictions = sportsPredictor.predictGames(filtered);
  const topBets = predictions
    .filter((prediction) => prediction.recommendation !== 'SKIP')
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 5);

  return topBets.map((prediction) => {
    const game = filtered.find((g) => g.id === prediction.gameId);
    const odds = game?.odds;
    const line = odds?.spread ?? `${prediction.predictedWinner} ${prediction.spread >= 0 ? '-' : '+'}${Math.abs(prediction.spread).toFixed(1)}`;

    return {
      event: `${prediction.awayTeam} @ ${prediction.homeTeam}`,
      league: prediction.league,
      confidence: prediction.confidence,
      line,
      kickoff: game?.date ?? new Date().toISOString(),
      notes: prediction.analysis.keyFactors.slice(0, 2),
    };
  });
}

async function getSportsSnapshot(): Promise<SportsLine[]> {
  if (sportsCache && Date.now() - sportsCache.timestamp < CACHE_TTL) {
    return sportsCache.data;
  }
  const lines = await buildSportsLines();
  sportsCache = { data: lines, timestamp: Date.now() };
  return lines;
}

function ensureAllocations(strategy: z.infer<typeof strategySchema>) {
  const totalAllocation = strategy.segments.reduce((sum, segment) => sum + segment.allocation, 0);
  const totalReturn = strategy.segments.reduce((sum, segment) => sum + segment.expectedReturn, 0);

  if (totalAllocation <= 0) {
    const fallback = buildFallbackStrategy(strategy.budget, strategy.expectedReturn);
    return fallback;
  }

  const allocationScale = strategy.budget / totalAllocation;
  const returnScale = totalReturn > 0 ? strategy.expectedReturn / totalReturn : 0;

  const segments = strategy.segments.map((segment) => {
    const scaledAllocation = roundCurrency(segment.allocation * allocationScale);
    const scaledReturn = returnScale ? roundCurrency(segment.expectedReturn * returnScale) : roundCurrency(segment.expectedReturn);

    const stakeTotal = segment.recommendations.reduce((sum, rec) => sum + rec.stake, 0);
    const projectedTotal = segment.recommendations.reduce((sum, rec) => sum + rec.projectedReturn, 0);

    const stakeScale = stakeTotal > 0 ? scaledAllocation / stakeTotal : 0;
    const projectedScale = projectedTotal > 0 ? scaledReturn / projectedTotal : 0;

    const recommendations = segment.recommendations.map((rec) => ({
      ...rec,
      stake: stakeScale ? roundCurrency(rec.stake * stakeScale) : roundCurrency(rec.stake),
      projectedReturn: projectedScale ? roundCurrency(rec.projectedReturn * projectedScale) : roundCurrency(rec.projectedReturn),
    }));

    return {
      ...segment,
      allocation: scaledAllocation,
      expectedReturn: scaledReturn,
      recommendations,
    };
  });

  return {
    ...strategy,
    segments,
  };
}

function buildFallbackStrategy(budget: number, expectedReturn: number) {
  const allocation = roundCurrency(budget * 0.45);
  const fallbackReturn = roundCurrency(expectedReturn * 0.35);

  return {
    title: 'Adaptive Daily Playbook',
    summary: 'Balanced diversification across core markets while monitoring volatility spikes.',
    riskLevel: 'MEDIUM' as const,
    budget,
    expectedReturn,
    keyInsights: [
      'Mega-cap tech resilience continues to anchor portfolios.',
      'Crypto remains momentum-driven; size positions responsibly.',
      'Focus betting units on quantifiable edges, avoid chasing longshots.',
    ],
    bankrollTips: "Allocate only today's cash designated for speculative strategies. Protect capital with stop losses and fixed unit sizing across sports wagers.",
    segments: [
      {
        category: 'Stocks',
        allocation,
        expectedReturn: fallbackReturn,
        recommendations: [
          {
            title: 'SPY Covered Call',
            action: 'INCOME',
            rationale: 'Harvest premium while index trades inside expected range.',
            confidence: 72,
            stake: roundCurrency(allocation * 0.55),
            projectedReturn: roundCurrency(fallbackReturn * 0.55),
          },
        ],
      },
      {
        category: 'Crypto',
        allocation: roundCurrency(budget * 0.25),
        expectedReturn: roundCurrency(expectedReturn * 0.28),
        recommendations: [
          {
            title: 'BTC Core Position',
            action: 'BUY',
            rationale: 'Institutional accumulation and ETF demand underpin support.',
            confidence: 76,
            stake: roundCurrency(budget * 0.15),
            projectedReturn: roundCurrency(expectedReturn * 0.18),
          },
        ],
      },
      {
        category: 'Sports',
        allocation: roundCurrency(budget * 0.18),
        expectedReturn: roundCurrency(expectedReturn * 0.25),
        recommendations: [
          {
            title: 'NBA Pace Over',
            action: 'BET',
            rationale: 'Pace-up matchup with favourable shooting splits.',
            confidence: 65,
            stake: roundCurrency(budget * 0.08),
            projectedReturn: roundCurrency(expectedReturn * 0.14),
          },
        ],
      },
      {
        category: 'Lottery',
        allocation: roundCurrency(budget * 0.12),
        expectedReturn: roundCurrency(expectedReturn * 0.12),
        recommendations: [
          {
            title: 'Powerball Balanced Wheel',
            action: 'BUY TICKET',
            rationale: 'Hot/cold mix with delta spacing to maximise coverage.',
            confidence: 52,
            stake: roundCurrency(budget * 0.12),
            projectedReturn: roundCurrency(expectedReturn * 0.12),
          },
        ],
      },
    ],
  } as z.infer<typeof strategySchema>;
}

export async function POST(request: Request) {
  const raw = await request.json().catch(() => ({}));
  const { budget, riskLevel, persona } = requestSchema.parse(raw ?? {});

  try {
    const [quotes, news, sports] = await Promise.all([
      getQuotesSnapshot(),
      getNewsSnapshot(),
      getSportsSnapshot(),
    ]);

    const personaContext = personaPrompts[persona] ?? personaPrompts.balanced;

    const marketsSummary = formatQuoteSummary(quotes);
    const newsSummary = formatNewsSummary(news);
    const sportsSummary = formatSportsSummary(sports);

    const prompt = buildPrompt({
      budget,
      riskLevel,
      personaContext,
      marketsSummary,
      newsSummary,
      sportsSummary,
    });

    let parsedStrategy: z.infer<typeof strategySchema> | null = null;

    try {
      const aiResponse = await chat({
        userMessage: prompt,
        context: 'You are Stratford AI, a deterministic strategy engine. Respond using the requested JSON schema only.',
      });
      const json = JSON.parse(aiResponse);
      parsedStrategy = strategySchema.parse(json);
    } catch (error) {
      console.error('[Strategy API] Failed to parse AI response:', error);
    }

    const strategy = ensureAllocations(
      parsedStrategy ?? buildFallbackStrategy(budget, roundCurrency(budget * 0.75))
    );

    const sources = {
      markets: {
        provider: 'Alpha Vantage',
        symbols: [...STOCK_SYMBOLS, ...CRYPTO_SYMBOLS],
        lastUpdated: new Date().toISOString(),
      },
      news: {
        provider: 'Alpha Vantage News & Sentiment',
        topics: ['financial_markets', 'crypto', 'sports_betting'],
        lastUpdated: new Date().toISOString(),
      },
      sports: {
        provider: 'ESPN Scoreboard + Internal Predictor',
        leagues: SPORTS_LEAGUES,
        lastUpdated: new Date().toISOString(),
      },
      ai: {
        provider: 'OpenAI gpt-4o-mini',
        persona,
        riskLevel,
      },
    };

    return NextResponse.json({
      strategy,
      news: news.slice(0, 5),
      sports,
      generatedAt: new Date().toISOString(),
      sources,
    });
  } catch (error) {
    console.error('[Strategy API] unexpected error:', error);
    return NextResponse.json(
      {
        strategy: buildFallbackStrategy(budget, roundCurrency(budget * 0.75)),
        news: [],
        sports: [],
        generatedAt: new Date().toISOString(),
        sources: null,
        error: 'Live data unavailable. Showing fallback playbook.',
      },
      { status: 200 }
    );
  }
}

const JSON_SCHEMA_HINT = [
  '{',
  '  "title": string,',
  '  "summary": string,',
  '  "riskLevel": "LOW" | "MEDIUM" | "HIGH",',
  '  "budget": number,',
  '  "expectedReturn": number,',
  '  "keyInsights": string[],',
  '  "bankrollTips": string,',
  '  "segments": [',
  '    {',
  '      "category": "Stocks" | "Crypto" | "Sports" | "Lottery",',
  '      "allocation": number,',
  '      "expectedReturn": number,',
  '      "recommendations": [',
  '        {',
  '          "title": string,',
  '          "action": string,',
  '          "rationale": string,',
  '          "confidence": number,',
  '          "stake": number,',
  '          "projectedReturn": number',
  '        }',
  '      ]',
  '    }',
  '  ]',
  '}',
].join('\n');

function buildPrompt({
  budget,
  riskLevel,
  personaContext,
  marketsSummary,
  newsSummary,
  sportsSummary,
}: {
  budget: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  personaContext: string;
  marketsSummary: string;
  newsSummary: string;
  sportsSummary: string;
}) {
  return `You are Stratford AI, an elite multi-market strategist.

Bankroll available today: $${budget}
Target winnings: ${roundCurrency(budget * 0.75)}
Risk tolerance: ${riskLevel}
Persona guidance: ${personaContext}

Market snapshot:
${marketsSummary}

Sports intelligence:
${sportsSummary}

Top news drivers:
${newsSummary}

Produce JSON matching this schema:
${JSON_SCHEMA_HINT}

Rules:
- Total allocation must equal ${budget}.
- Focus on four segments: Stocks, Crypto, Sports, Lottery.
- Recommendations must be concrete actions executable today.
- Stakes within a segment must sum to the segment allocation.
- Projected returns should align with expectedReturn.
- Offer actionable insights and bankroll discipline.
- Confidence is 0-100.
`.trim();
}

function formatQuoteSummary(quotes: Record<string, RealTimeQuote>): string {
  return Object.values(quotes)
    .map((quote) => {
      const change = quote.changePercent.toFixed(2);
      const direction = quote.changePercent >= 0 ? '+' : '';
      return `${quote.symbol}: $${quote.price.toFixed(2)} (${direction}${change}% | vol ${quote.volume})`;
    })
    .join('\n');
}

function formatNewsSummary(news: NewsArticle[]): string {
  if (!news.length) {
    return 'No fresh headlines.';
  }
  return news
    .slice(0, 5)
    .map((article) => `- ${article.title} [${article.sentiment ?? 'neutral'}]`)
    .join('\n');
}

function formatSportsSummary(sports: SportsLine[]): string {
  if (!sports.length) {
    return 'No confident sports edges.';
  }
  return sports
    .map((line) => `- ${line.league}: ${line.event} | ${line.line} (confidence ${line.confidence}%)`)
    .join('\n');
}
