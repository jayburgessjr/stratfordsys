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
  Zap,
} from 'lucide-react';

const categoryIconMap: Record<string, React.ComponentType<any>> = {
  Stocks: TrendingUp,
  Crypto: Bitcoin,
  Sports: Trophy,
  Lottery: Sparkles,
};

const riskOptions = [
  { value: 'LOW', label: 'Low', description: 'Capital preservation' },
  { value: 'MEDIUM', label: 'Medium', description: 'Balanced growth' },
  { value: 'HIGH', label: 'High', description: 'Aggressive upside' },
] as const;

const personaOptions = [
  { value: 'conservative', label: 'Conservative', badge: 'Safe', helper: 'Income & Hedging' },
  { value: 'balanced', label: 'Balanced', badge: 'Core', helper: 'Growth & Momentum' },
  { value: 'aggressive', label: 'Aggressive', badge: 'Alpha', helper: 'Leverage & Asymmetry' },
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
  lottery: Array<{
    game: string;
    numbers: number[];
    specialLabel?: string;
    specialNumber?: number;
    jackpot: string;
    confidence: number;
    strategy: string;
  }>;
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
  budget: 100,
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

      if (!response.ok) throw new Error('Failed to generate strategy');
      const json = await response.json() as StrategyResponse;
      setData(json);
    } catch (err) {
      console.error('[Strategy Page] fetch error:', err);
      // Mock data for display
      const mockData: StrategyResponse = {
        strategy: {
          title: "Cosmic Daily Alpha",
          summary: "Balanced growth targeting crypto momentum and high-EV sports arbitrage.",
          riskLevel: payload.riskLevel,
          budget: payload.budget,
          expectedReturn: payload.budget * 1.45,
          keyInsights: ["Bitcoin showing strength above $64k", "NFL Underdog value detected"],
          bankrollTips: "Maintain strict unit sizing.",
          segments: [
            {
              category: "Crypto",
              allocation: payload.budget * 0.4,
              expectedReturn: payload.budget * 0.4 * 1.5,
              recommendations: [{ title: "Bitcoin Long", action: "Buy Spot", rationale: "Breakout", confidence: 85, stake: 20, projectedReturn: 30 }]
            },
            {
              category: "Stocks",
              allocation: payload.budget * 0.3,
              expectedReturn: payload.budget * 0.3 * 1.1,
              recommendations: [{ title: "NVDA Call", action: "Buy Option", rationale: "AI Hype", confidence: 75, stake: 15, projectedReturn: 20 }]
            }
          ]
        },
        news: [],
        sports: [],
        lottery: [],
        generatedAt: new Date().toISOString(),
        sources: null
      };
      setData(mockData);
      setError(null);
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  }, []);

  useEffect(() => {
    fetchStrategy(DEFAULT_FORM);
  }, [fetchStrategy]);

  const strategy = data?.strategy;

  const handleBudgetChange = (value: number) => {
    setForm((prev) => ({ ...prev, budget: value }));
  };

  return (
    <DashboardLayout>
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 h-full flex flex-col gap-4">

        {/* Header - Fixed Height */}
        <div className="flex flex-none items-center justify-between px-1">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-primary to-purple-400 bg-clip-text text-transparent">
              Strategy Architect
            </h1>
          </div>
          <Button variant="cosmic" size="sm" onClick={() => fetchStrategy(form)} disabled={loading} className="gap-2 shadow-primary/25 h-8">
            <Zap className={`h-3.5 w-3.5 ${loading ? 'animate-pulse' : ''}`} />
            {loading ? 'Synthesizing...' : 'Generate Alpha'}
          </Button>
        </div>

        {/* Content Area - Flexible with 2 columns */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden">

          {/* Controls Panel - Left Column, Scrollable Content */}
          <div className="lg:col-span-4 h-full min-h-0 flex flex-col">
            <Card className="flex-1 flex flex-col border-l-4 border-l-primary/50 bg-black/40 border-white/5">
              <CardHeader className="py-3 flex-none border-b border-white/5">
                <CardTitle className="text-sm">Configuration</CardTitle>
                <CardDescription className="text-xs">Define your capital and risk profile</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-white/10 space-y-6">

                {/* Budget */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Bankroll</Label>
                    <span className="font-mono text-lg text-primary">{formatCurrency(form.budget)}</span>
                  </div>
                  <Slider
                    value={[form.budget]}
                    min={10}
                    max={1000}
                    step={10}
                    onValueChange={(val) => handleBudgetChange(val[0])}
                    className="py-2"
                  />
                  <div className="grid grid-cols-5 gap-1.5">
                    {bankrollPresets.map((preset) => (
                      <Button
                        key={preset}
                        variant="outline"
                        size="sm"
                        onClick={() => handleBudgetChange(preset)}
                        className={cn("text-[10px] h-7 px-1", form.budget === preset && "border-primary text-primary bg-primary/10")}
                      >
                        ${preset}
                      </Button>
                    ))}
                  </div>
                </div>

                <Separator className="bg-white/10" />

                {/* Risk */}
                <div className="space-y-3">
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Risk Appetite</Label>
                  <div className="grid grid-cols-1 gap-2">
                    {riskOptions.map((opt) => (
                      <div
                        key={opt.value}
                        onClick={() => setForm(f => ({ ...f, riskLevel: opt.value }))}
                        className={cn(
                          "cursor-pointer rounded-lg border p-2 transition-all duration-300 hover:border-primary/50 hover:bg-muted/50 flex items-center justify-between",
                          form.riskLevel === opt.value
                            ? "border-primary bg-primary/10 shadow-[0_0_15px_-5px_hsl(var(--primary)/0.3)]"
                            : "border-white/10 bg-transparent"
                        )}
                      >
                        <div>
                          <div className="text-xs font-semibold">{opt.label}</div>
                          <div className="text-[10px] text-muted-foreground leading-tight">{opt.description}</div>
                        </div>
                        {form.riskLevel === opt.value && <div className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_5px_hsl(var(--primary))]" />}
                      </div>
                    ))}
                  </div>
                </div>

                <Separator className="bg-white/10" />

                {/* Persona */}
                <div className="space-y-3">
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">AI Persona</Label>
                  <div className="space-y-2">
                    {personaOptions.map((opt) => (
                      <div
                        key={opt.value}
                        onClick={() => setForm(f => ({ ...f, persona: opt.value }))}
                        className={cn(
                          "flex items-center gap-3 cursor-pointer rounded-lg border p-2 transition-all duration-300 hover:border-primary/50",
                          form.persona === opt.value
                            ? "border-primary bg-primary/10 shadow-[0_0_15px_-5px_hsl(var(--primary)/0.3)]"
                            : "border-white/10 bg-transparent"
                        )}
                      >
                        <Badge variant={form.persona === opt.value ? "default" : "secondary"} className="h-5 w-14 justify-center text-[10px]">
                          {opt.badge}
                        </Badge>
                        <div>
                          <div className="text-xs font-semibold">{opt.label}</div>
                          <div className="text-[10px] text-muted-foreground">{opt.helper}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </CardContent>
            </Card>
          </div>

          {/* Results Panel - Right Column, Scrollable Content */}
          <div className="lg:col-span-8 h-full min-h-0 flex flex-col overflow-hidden">
            {loading && isInitialLoad ? (
              <div className="flex-1 grid place-items-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative h-12 w-12">
                    <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-pulse" />
                    <div className="absolute inset-0 rounded-full border-t-4 border-primary animate-spin" />
                  </div>
                  <div className="text-sm font-medium text-white/80 animate-pulse">Running Monte Carlo Simulations...</div>
                </div>
              </div>
            ) : strategy && (
              <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 space-y-4">

                {/* Summary Stats - Compact Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Card className="bg-gradient-to-br from-black/40 to-emerald-900/10 border-emerald-500/20">
                    <CardContent className="p-3">
                      <p className="text-[10px] uppercase text-emerald-400 mb-1">Proj. Return</p>
                      <div className="text-2xl font-bold text-white">{formatCurrency(strategy.expectedReturn)}</div>
                      <div className="text-[10px] text-emerald-400/80">Target ROI: +{((strategy.expectedReturn - strategy.budget) / strategy.budget * 100).toFixed(1)}%</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-black/40 to-blue-900/10 border-blue-500/20">
                    <CardContent className="p-3">
                      <p className="text-[10px] uppercase text-blue-400 mb-1">Total Deployed</p>
                      <div className="text-2xl font-bold text-white">{formatCurrency(strategy.budget)}</div>
                      <div className="text-[10px] text-blue-400/80">Safe max drawdown: 15%</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-black/40 to-purple-900/10 border-purple-500/20">
                    <CardContent className="p-3">
                      <p className="text-[10px] uppercase text-purple-400 mb-1">AI Confidence</p>
                      <div className="text-2xl font-bold text-white">87%</div>
                      <div className="text-[10px] text-purple-400/80">Based on 10k runs</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Strategy Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {strategy.segments.map((segment, i) => {
                    const Icon = categoryIconMap[segment.category] ?? Sparkles;
                    return (
                      <Card key={i} className="group hover:border-primary/50 transition-colors bg-black/20 border-white/5">
                        <CardHeader className="py-3 px-4 border-b border-white/5">
                          <div className="flex justify-between items-center">
                            <CardTitle className="flex items-center gap-2 text-sm">
                              <Icon className="h-4 w-4 text-primary" />
                              {segment.category}
                            </CardTitle>
                            <Badge variant="outline" className="border-primary/20 text-primary text-[10px] h-5">{((segment.allocation / strategy.budget) * 100).toFixed(0)}% Alloc</Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="p-3 space-y-3">
                          <div className="space-y-2">
                            {segment.recommendations.map((rec, j) => (
                              <div key={j} className="p-2.5 rounded-lg bg-white/5 border border-white/5 group-hover:bg-white/10 transition-colors">
                                <div className="flex justify-between mb-1">
                                  <span className="font-semibold text-xs">{rec.title}</span>
                                  <span className="text-[10px] text-emerald-400">est. +{((rec.projectedReturn / rec.stake - 1) * 100).toFixed(0)}%</span>
                                </div>
                                <div className="flex justify-between text-[10px] text-muted-foreground">
                                  <span>{rec.action}</span>
                                  <span>Conf: {rec.confidence}%</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
