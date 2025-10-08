'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency, formatPercentage, cn } from '@/lib/utils';
import {
  RefreshCw,
  TrendingUp,
  Bitcoin,
  Trophy,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  AlertTriangle,
  Newspaper,
  History,
  ListChecks,
} from 'lucide-react';

const categoryIconMap: Record<string, React.ComponentType<any>> = {
  Stocks: TrendingUp,
  Crypto: Bitcoin,
  Sports: Trophy,
  Lottery: Sparkles,
};

const riskOptions = [
  { value: 'LOW', label: 'Low', description: 'Capital preservation, tight stops' },
  { value: 'MEDIUM', label: 'Medium', description: 'Balanced risk / reward' },
  { value: 'HIGH', label: 'High', description: 'Maximise upside, accept drawdowns' },
] as const;

const personaOptions = [
  {
    value: 'conservative',
    label: 'Conservative',
    badge: 'Safe',
    helper: 'Income focus, hedged exposure, low volatility baskets.',
  },
  {
    value: 'balanced',
    label: 'Balanced',
    badge: 'Core',
    helper: 'Blend of growth equities, crypto momentum, disciplined wagers.',
  },
  {
    value: 'aggressive',
    label: 'Aggressive',
    badge: 'Alpha',
    helper: 'Leverage asymmetric upside, tolerate swings, chase edges.',
  },
] as const;

const bankrollPresets = [40, 75, 150, 250, 500] as const;

type StrategySegment = {
  category: string;
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

type SportsEdge = {
  event: string;
  league: string;
  confidence: number;
  line: string;
  kickoff: string;
  notes?: string[];
};

type StrategySources = {
  markets?: { provider: string; symbols: string[]; lastUpdated: string } | null;
  news?: { provider: string; topics: string[]; lastUpdated: string } | null;
  sports?: { provider: string; leagues: string[]; lastUpdated: string } | null;
  ai?: { provider: string; persona: string; riskLevel: string } | null;
} | null;

type StrategyResponse = {
  strategy: StrategyPlan;
  news: NewsArticle[];
  sports: SportsEdge[];
  generatedAt: string;
  sources: StrategySources;
  error?: string;
};

type FormState = {
  budget: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  persona: 'conservative' | 'balanced' | 'aggressive';
};

const DEFAULT_FORM: FormState = {
  budget: 40,
  riskLevel: 'MEDIUM',
  persona: 'balanced',
};

export default function StrategyPage() {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [data, setData] = useState<StrategyResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const fetchStrategy = useCallback(async (payload: FormState) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/strategy/daily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to generate strategy');
      }

      const json = (await response.json()) as StrategyResponse;
      setData(json);
    } catch (err) {
      console.error('[Strategy Page] fetch error:', err);
      setError(err instanceof Error ? err.message : 'Unexpected error while generating strategy');
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  }, []);

  useEffect(() => {
    fetchStrategy(DEFAULT_FORM);
  }, [fetchStrategy]);

  const strategy = data?.strategy;

  const totalProjected = useMemo(() => {
    if (!strategy) return 0;
    return strategy.segments.reduce((sum, segment) => sum + (segment.expectedReturn || 0), 0);
  }, [strategy]);

  const roi = strategy ? (strategy.expectedReturn / strategy.budget) * 100 : 0;

  const highlights = useMemo(() => {
    if (!strategy) return [] as Array<{
      category: string;
      title: string;
      action: string;
      rationale: string;
      stake: number;
      projectedReturn: number;
      confidence: number;
    }>;

    return strategy.segments
      .map((segment) => {
        const primary = segment.recommendations[0];
        if (!primary) return null;
        return {
          category: segment.category,
          title: primary.title,
          action: primary.action,
          rationale: primary.rationale,
          stake: primary.stake,
          projectedReturn: primary.projectedReturn,
          confidence: primary.confidence,
        };
      })
      .filter(Boolean) as Array<{
        category: string;
        title: string;
        action: string;
        rationale: string;
        stake: number;
        projectedReturn: number;
        confidence: number;
      }>;
  }, [strategy]);

  const handleBudgetChange = (value: number) => {
    const clamped = Number.isFinite(value) ? Math.min(1000, Math.max(10, value)) : DEFAULT_FORM.budget;
    setForm((prev) => ({ ...prev, budget: clamped }));
  };

  const handleGenerate = () => {
    fetchStrategy(form);
  };

  const renderSources = () => {
    if (!data?.sources) return null;
    const { markets, news, sports, ai } = data.sources;
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <History className="h-4 w-4 text-primary" />
            Data Provenance
          </CardTitle>
          <CardDescription>Live feeds powering today&rsquo;s allocation.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-xs text-muted-foreground md:grid-cols-2">
          {markets && (
            <div className="rounded-lg border p-3">
              <div className="font-medium text-foreground">Markets</div>
              <div>Provider: {markets.provider}</div>
              <div>Symbols: {markets.symbols.join(', ')}</div>
              <div>Updated: {new Date(markets.lastUpdated).toLocaleTimeString()}</div>
            </div>
          )}
          {news && (
            <div className="rounded-lg border p-3">
              <div className="font-medium text-foreground">News</div>
              <div>Provider: {news.provider}</div>
              <div>Topics: {news.topics.join(', ')}</div>
              <div>Updated: {new Date(news.lastUpdated).toLocaleTimeString()}</div>
            </div>
          )}
          {sports && (
            <div className="rounded-lg border p-3">
              <div className="font-medium text-foreground">Sports</div>
              <div>Provider: {sports.provider}</div>
              <div>Leagues: {sports.leagues.join(', ')}</div>
              <div>Updated: {new Date(sports.lastUpdated).toLocaleTimeString()}</div>
            </div>
          )}
          {ai && (
            <div className="rounded-lg border p-3">
              <div className="font-medium text-foreground">AI Engine</div>
              <div>Model: {ai.provider}</div>
              <div>Persona: {ai.persona}</div>
              <div>Risk Level: {ai.riskLevel}</div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <header className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight">Daily Alpha Strategy</h1>
          <p className="text-muted-foreground max-w-3xl">
            Real-time multi-market blueprint synthesising equities, crypto, sports, and lottery signals. Adjust the bankroll
            and risk appetite to receive a tailored, compliance-aware playbook for today.
          </p>
        </header>

        <section className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <Card className="h-full">
            <CardHeader className="space-y-4">
              <CardTitle>Strategy Controls</CardTitle>
              <CardDescription>Set bankroll, risk posture, and persona before generating.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs uppercase text-muted-foreground">Bankroll</Label>
                  <div className="flex items-center justify-between text-sm font-medium">
                    <span>Capital deployed</span>
                    <span>{formatCurrency(form.budget)}</span>
                  </div>
                  <Slider
                    value={[form.budget]}
                    min={10}
                    max={1000}
                    step={5}
                    onValueChange={(value) => handleBudgetChange(value[0])}
                  />
                  <div className="flex flex-wrap gap-2 pt-2">
                    {bankrollPresets.map((preset) => (
                      <Button
                        key={preset}
                        variant="outline"
                        size="sm"
                        className={cn(
                          'text-xs transition',
                          form.budget === preset && 'bg-primary/10 text-primary border-primary/30 hover:bg-primary/20'
                        )}
                        onClick={() => handleBudgetChange(preset)}
                      >
                        {formatCurrency(preset)}
                      </Button>
                    ))}
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={10}
                        max={1000}
                        value={form.budget}
                        onChange={(event) => handleBudgetChange(Number(event.target.value))}
                        className="h-9 w-28"
                      />
                      <span className="text-[11px] text-muted-foreground">Min 10 · Max 1000</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Allocate only discretionary funds. The engine targets roughly 75% ROI of the bankroll across all
                    verticals.
                  </p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label className="text-xs uppercase text-muted-foreground">Risk tolerance</Label>
                  <div className="grid gap-2">
                    {riskOptions.map((option) => (
                      <Button
                        key={option.value}
                        variant="outline"
                        className={cn(
                          'flex items-center justify-between gap-4 px-3 py-3 transition',
                          form.riskLevel === option.value
                            ? 'bg-primary/10 text-primary border-primary/30 hover:bg-primary/20'
                            : 'hover:bg-muted'
                        )}
                        onClick={() => setForm((prev) => ({ ...prev, riskLevel: option.value }))}
                      >
                        <div className="flex flex-col items-start gap-1">
                          <span className="text-sm font-semibold">{option.label}</span>
                          <span className="text-[11px] text-muted-foreground">{option.description}</span>
                        </div>
                        <Badge
                          variant="secondary"
                          className={cn(
                            'text-[10px] uppercase tracking-wide',
                            form.riskLevel === option.value && 'bg-primary/15 text-primary'
                          )}
                        >
                          {form.riskLevel === option.value ? 'Selected' : 'Choose'}
                        </Badge>
                      </Button>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label className="text-xs uppercase text-muted-foreground">Persona lens</Label>
                  <div className="space-y-2">
                    {personaOptions.map((option) => (
                      <Button
                        key={option.value}
                        variant="outline"
                        className={cn(
                          'w-full flex items-start gap-3 text-left transition',
                          form.persona === option.value
                            ? 'bg-primary/10 text-primary border-primary/30 hover:bg-primary/20'
                            : 'hover:bg-muted'
                        )}
                        onClick={() => setForm((prev) => ({ ...prev, persona: option.value }))}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold">{option.label}</span>
                            <Badge
                              variant="secondary"
                              className={cn(
                                'text-[10px] uppercase tracking-wide',
                                form.persona === option.value && 'bg-primary/15 text-primary'
                              )}
                            >
                              {option.badge}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-snug mt-1">{option.helper}</p>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>

                <Separator />

                <Button onClick={handleGenerate} className="w-full" disabled={loading}>
                  <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  {loading ? 'Generating' : 'Generate Strategy'}
                </Button>

                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-[11px] text-yellow-900">
                  <div className="flex items-center gap-2 font-semibold">
                    <AlertTriangle className="h-3 w-3" />
                    Educational Use Only
                  </div>
                  <p className="mt-1">
                    Not financial or gambling advice. Verify data with your broker or sportsbook. Wager responsibly and
                    follow local regulations.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            {error && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="flex items-start gap-3 py-4 text-sm text-red-700">
                  <AlertCircle className="h-4 w-4 mt-0.5" />
                  <span>{error}. Showing the most recent available playbook.</span>
                </CardContent>
              </Card>
            )}

            {loading && isInitialLoad && <StrategySkeleton />}

            {!loading && strategy && (
              <>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <SummaryCard
                    title="Bankroll"
                    value={formatCurrency(strategy.budget)}
                    subtitle="Capital deployed across today&rsquo;s allocations"
                  />
                  <SummaryCard
                    title="Projected Return"
                    value={formatCurrency(strategy.expectedReturn)}
                    subtitle={`Invest ${formatCurrency(strategy.budget)} to target approximately ${formatCurrency(
                      strategy.expectedReturn
                    )}`}
                    accent="text-green-600"
                  />
                <SummaryCard
                  title="ROI"
                  value={formatPercentage(roi)}
                  subtitle="Expected aggregate return relative to bankroll"
                />
                <RiskCard riskLevel={strategy.riskLevel} summary={strategy.summary} generatedAt={data?.generatedAt} />
              </div>

                {highlights.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ListChecks className="h-4 w-4 text-primary" />
                        Today&rsquo;s Picks
                      </CardTitle>
                      <CardDescription>
                        Headline actions per market: what to trade, where to wager, and which numbers to play.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-3 md:grid-cols-2">
                      {highlights.map((item) => (
                        <div key={`${item.category}-${item.title}`} className="rounded-lg border p-3 bg-muted/40">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold">{item.category}</span>
                            <Badge variant="secondary">{item.confidence}%</Badge>
                          </div>
                          <p className="text-sm mt-1 font-medium">{item.title}</p>
                          <p className="text-xs text-muted-foreground leading-snug mt-1">{item.rationale}</p>
                          <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground mt-3">
                            <span>
                              Stake<br />
                              <strong>{formatCurrency(item.stake)}</strong>
                            </span>
                            <span>
                              Target<br />
                              <strong>{formatCurrency(item.projectedReturn)}</strong>
                            </span>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle>Bankroll Governance</CardTitle>
                    <CardDescription>{strategy.bankrollTips}</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-3 md:grid-cols-2">
                    {strategy.keyInsights.map((insight, idx) => (
                      <div key={idx} className="flex items-start gap-3 rounded-lg border p-3 bg-muted/40">
                        <ShieldCheck className="mt-1 h-4 w-4 text-primary" />
                        <p className="text-sm text-muted-foreground">{insight}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {renderSources()}

                <div className="grid gap-6 lg:grid-cols-2">
                  {strategy.segments.map((segment) => (
                    <SegmentCard
                      key={segment.category}
                      segment={segment}
                      totalBudget={strategy.budget}
                      totalProjected={totalProjected}
                    />
                  ))}
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-primary" />
                        Sports Betting Edges
                      </CardTitle>
                      <CardDescription>Highest conviction matchups filtered by the predictor.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {data?.sports.length ? (
                        data.sports.map((edge, idx) => (
                          <div key={idx} className="rounded-lg border p-3">
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-semibold">{edge.event}</div>
                              <Badge>{edge.confidence}% edge</Badge>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {edge.league} · {edge.line}
                            </div>
                            <div className="text-[11px] text-muted-foreground mt-2 flex flex-wrap gap-2">
                              <span>Kickoff: {new Date(edge.kickoff).toLocaleString()}</span>
                              {edge.notes?.slice(0, 2).map((note, noteIdx) => (
                                <Badge key={noteIdx} variant="secondary" className="text-[10px]">
                                  {note}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No confident edges available at this moment.</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Newspaper className="h-4 w-4 text-primary" />
                        Market Movers & Sentiment
                      </CardTitle>
                      <CardDescription>Headlines influencing today&rsquo;s allocation bias.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {data?.news.length ? (
                        data.news.slice(0, 5).map((article, idx) => (
                          <a
                            key={idx}
                            href={article.url}
                            target="_blank"
                            rel="noreferrer"
                            className="block rounded-lg border p-3 transition hover:bg-muted"
                          >
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-semibold leading-snug">{article.title}</div>
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
                            <div className="text-[11px] text-muted-foreground mt-1">
                              {article.source ?? 'Global Desk'} · {article.timeAgo ?? 'Just now'}
                            </div>
                          </a>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Awaiting live headlines. Verify API keys or try refreshing shortly.
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
            )}

            {loading && !isInitialLoad && <StrategySkeleton />} 
          </div>
        </section>

        <Card className="border border-muted bg-muted/30">
          <CardContent className="py-4 text-[11px] text-muted-foreground leading-relaxed">
            Stratford AI provides educational insights only. Past performance does not guarantee future results. Always
            verify odds, spreads, and prices with your broker or sportsbook before placing trades or wagers. If gambling
            is a concern, contact the National Council on Problem Gambling helpline at 1-800-522-4700.
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

type SummaryCardProps = {
  title: string;
  value: string;
  subtitle: string;
  accent?: string;
};

function SummaryCard({ title, value, subtitle, accent }: SummaryCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-3xl font-semibold ${accent ?? ''}`}>{value}</div>
        <p className="text-xs text-muted-foreground mt-1" dangerouslySetInnerHTML={{ __html: subtitle }} />
      </CardContent>
    </Card>
  );
}

type RiskCardProps = {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  summary: string;
  generatedAt?: string;
};

function RiskCard({ riskLevel, summary, generatedAt }: RiskCardProps) {
  const badgeVariant = riskLevel === 'LOW' ? 'secondary' : riskLevel === 'MEDIUM' ? 'default' : 'destructive';
  return (
    <Card>
      <CardHeader className="pb-2 flex items-center justify-between">
        <div>
          <CardTitle className="text-sm font-medium text-muted-foreground">Risk Posture</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">{summary}</p>
        </div>
        <Badge variant={badgeVariant}>{riskLevel}</Badge>
      </CardHeader>
      <CardContent>
        <p className="text-[11px] text-muted-foreground">
          {generatedAt ? `Generated ${new Date(generatedAt).toLocaleTimeString()}` : 'Awaiting generation'}
        </p>
      </CardContent>
    </Card>
  );
}

type SegmentCardProps = {
  segment: StrategySegment;
  totalBudget: number;
  totalProjected: number;
};

function SegmentCard({ segment, totalBudget, totalProjected }: SegmentCardProps) {
  const Icon = categoryIconMap[segment.category] ?? Sparkles;
  const allocationPct = totalBudget > 0 ? (segment.allocation / totalBudget) * 100 : 0;
  const contributionPct = totalProjected > 0 ? (segment.expectedReturn / totalProjected) * 100 : 0;

  return (
    <Card className="flex flex-col">
      <CardHeader className="space-y-4">
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
          <Badge>{allocationPct.toFixed(0)}% bankroll</Badge>
        </div>
        <div className="space-y-2">
          <div className="text-[11px] text-muted-foreground">Bankroll Allocation</div>
          <Progress value={allocationPct} />
          <div className="text-[11px] text-muted-foreground">Return Contribution</div>
          <Progress value={contributionPct} className="bg-primary/10" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3 flex-1">
        {segment.recommendations.map((rec, idx) => (
          <div key={idx} className="rounded-xl border p-4 bg-muted/50 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold leading-tight">{rec.title}</div>
                <div className="text-[11px] text-muted-foreground uppercase tracking-wide">{rec.action}</div>
              </div>
              <Badge variant="secondary">{rec.confidence}%</Badge>
            </div>
            <p className="text-sm text-muted-foreground leading-snug">{rec.rationale}</p>
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
                {formatPercentage(
                  rec.stake > 0 ? ((rec.projectedReturn - rec.stake) / rec.stake) * 100 : 0
                )}
              </div>
            </div>
          </div>
        ))}
        {segment.recommendations.length === 0 && (
          <p className="text-sm text-muted-foreground">Awaiting high-confidence signals for this segment.</p>
        )}
      </CardContent>
    </Card>
  );
}

function StrategySkeleton() {
  return (
    <div className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <Card key={idx}>
            <CardContent className="animate-pulse space-y-3 py-6">
              <div className="h-3 w-24 rounded bg-muted" />
              <div className="h-6 w-32 rounded bg-muted" />
              <div className="h-2 w-full rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="flex items-center justify-center py-12 text-muted-foreground animate-pulse">
          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          Generating cross-market signals...
        </CardContent>
      </Card>
    </div>
  );
}
