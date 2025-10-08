'use client';

import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { formatCurrency, formatPercentage } from '@/lib/utils';
import {
  TrendingUp,
  Bitcoin,
  Trophy,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  Newspaper,
  ShieldCheck,
} from 'lucide-react';

type StrategySegment = {
  category: string;
  allocation: number;
  expectedReturn: number;
  recommendations: {
    title: string;
    action: string;
    rationale: string;
    confidence: number;
    stake: number;
    projectedReturn: number;
  }[];
};

type StrategyPlan = {
  title: string;
  summary: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  budget: number;
  expectedReturn: number;
  keyInsights: string[];
  bankrollTips: string;
  segments: StrategySegment[];
};

type NewsArticle = {
  title: string;
  url: string;
  source?: string;
  timeAgo?: string;
  sentiment?: 'bullish' | 'bearish' | 'neutral';
};

type StrategyResponse = {
  strategy: StrategyPlan;
  news: NewsArticle[];
  sports: { event: string; line: string; confidence: number }[];
  generatedAt: string;
  error?: string;
};

const categoryIconMap: Record<string, React.ComponentType<any>> = {
  Stocks: TrendingUp,
  Crypto: Bitcoin,
  Sports: Trophy,
  Lottery: Sparkles,
};

export default function StrategyPage() {
  const [data, setData] = useState<StrategyResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStrategy = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/strategy/daily');
      if (!response.ok) {
        throw new Error('Failed to load strategy');
      }
      const json = (await response.json()) as StrategyResponse;
      setData(json);
    } catch (err) {
      console.error('Strategy page error:', err);
      setError(err instanceof Error ? err.message : 'Unexpected error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStrategy();
  }, []);

  const strategy = data?.strategy;

  const totalProjected = useMemo(() => {
    if (!strategy) return 0;
    return strategy.segments.reduce((sum, segment) => sum + (segment.expectedReturn || 0), 0);
  }, [strategy]);

  const roi = strategy ? (strategy.expectedReturn / strategy.budget) * 100 : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Daily Alpha Strategy</h1>
            <p className="text-muted-foreground max-w-2xl">
              Unified playbook across stocks, crypto, sports, and lottery opportunities. Signals factor in live market
              trends, sentiment, and AI-based risk balancing.
            </p>
          </div>
          <button
            className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-70"
            onClick={fetchStrategy}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Signals
          </button>
        </div>

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="py-4 text-red-700 text-sm">
              <strong>Heads up:</strong> {error}. Showing the most recent available playbook.
            </CardContent>
          </Card>
        )}

        {strategy ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Bankroll</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-semibold">{formatCurrency(strategy.budget)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Allocated capital for today&rsquo;s cross-market plays.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Projected Winnings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-semibold text-green-600">{formatCurrency(strategy.expectedReturn)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    If you put in {formatCurrency(strategy.budget)}, you can expect to win approximately{' '}
                    {formatCurrency(strategy.expectedReturn)}.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">ROI Multiplier</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-semibold">{formatPercentage(roi)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Target return relative to bankroll across all verticals.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Risk Posture</CardTitle>
                  <Badge variant={
                    strategy.riskLevel === 'LOW'
                      ? 'secondary'
                      : strategy.riskLevel === 'MEDIUM'
                      ? 'default'
                      : 'destructive'
                  }>
                    {strategy.riskLevel}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">{strategy.summary}</p>
                  <Separator className="my-2" />
                  <p className="text-xs text-muted-foreground">
                    {data?.generatedAt ? `Generated ${new Date(data.generatedAt).toLocaleTimeString()}` : ''}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Bankroll Governance</CardTitle>
                <CardDescription>{strategy.bankrollTips}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2">
                  {strategy.keyInsights.map((insight, idx) => (
                    <div key={idx} className="flex items-start gap-3 rounded-lg border p-3 bg-muted/40">
                      <ShieldCheck className="h-4 w-4 mt-1 text-primary" />
                      <p className="text-sm text-muted-foreground">{insight}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              {strategy.segments.map((segment) => {
                const Icon = categoryIconMap[segment.category] ?? Sparkles;
                const segmentAllocationPct = (segment.allocation / strategy.budget) * 100;
                const segmentContributionPct =
                  totalProjected > 0 ? (segment.expectedReturn / totalProjected) * 100 : 0;

                return (
                  <Card key={segment.category} className="flex flex-col">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2 text-xl">
                            <Icon className="h-5 w-5 text-primary" />
                            {segment.category}
                          </CardTitle>
                          <CardDescription>
                            Allocated {formatCurrency(segment.allocation)} · Expected {formatCurrency(segment.expectedReturn)}
                          </CardDescription>
                        </div>
                        <Badge>
                          {segmentAllocationPct.toFixed(0)}% bankroll
                        </Badge>
                      </div>
                      <div className="mt-4 space-y-2">
                        <div className="text-xs text-muted-foreground">Bankroll Allocation</div>
                        <Progress value={segmentAllocationPct} />
                        <div className="text-xs text-muted-foreground">Contribution to Winnings</div>
                        <Progress value={segmentContributionPct} className="bg-primary/10" />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4 flex-1">
                      {segment.recommendations.map((rec, idx) => (
                        <div key={idx} className="rounded-xl border p-4 bg-muted/50 space-y-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm font-semibold">{rec.title}</div>
                              <div className="text-xs text-muted-foreground uppercase tracking-wide">
                                {rec.action}
                              </div>
                            </div>
                            <Badge variant="secondary">{rec.confidence}%</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{rec.rationale}</p>
                          <div className="grid gap-2 text-xs text-muted-foreground md:grid-cols-3">
                            <div>
                              <span className="font-medium text-foreground block">Stake</span>
                              {formatCurrency(rec.stake)}
                            </div>
                            <div>
                              <span className="font-medium text-foreground block">Projected Return</span>
                              {formatCurrency(rec.projectedReturn)}
                            </div>
                            <div>
                              <span className="font-medium text-foreground block">Edge</span>
                              {formatPercentage(rec.projectedReturn && rec.stake ? ((rec.projectedReturn - rec.stake) / rec.stake) * 100 : 0)}
                            </div>
                          </div>
                        </div>
                      ))}
                      {segment.recommendations.length === 0 && (
                        <p className="text-sm text-muted-foreground">
                          Awaiting new signals for this vertical.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-primary" />
                    Sports Betting Lines
                  </CardTitle>
                  <CardDescription>AI-filtered matchups and edges for tonight.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {data?.sports.map((line, idx) => (
                    <div key={idx} className="rounded-lg border p-3">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold">{line.event}</div>
                        <Badge>{line.confidence}% edge</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{line.line}</p>
                    </div>
                  ))}
                  {!data?.sports?.length && (
                    <p className="text-sm text-muted-foreground">No live edges available.</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Newspaper className="h-4 w-4 text-primary" />
                    Market Movers & Sentiment
                  </CardTitle>
                  <CardDescription>Top stories influencing today&rsquo;s allocations.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {data?.news.slice(0, 4).map((article, idx) => (
                    <a
                      key={idx}
                      href={article.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block rounded-lg border p-3 hover:bg-muted transition"
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold">{article.title}</div>
                        {article.sentiment && (
                          <Badge
                            variant={
                              article.sentiment === 'bullish'
                                ? 'default'
                                : article.sentiment === 'bearish'
                                ? 'destructive'
                                : 'secondary'
                            }
                          >
                            {article.sentiment}
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {article.source ?? 'Global Desk'} · {article.timeAgo ?? 'Just now'}
                      </div>
                    </a>
                  ))}
                  {!data?.news?.length && (
                    <p className="text-sm text-muted-foreground">
                      Unable to load live news. Check your API credentials or retry shortly.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {data?.error && (
              <div className="flex items-start gap-3 rounded-lg border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-800">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Fallback strategy in use:</strong> {data.error}
                </div>
              </div>
            )}
          </>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <div className="flex items-center gap-3 text-sm">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Building cross-market strategy...
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
