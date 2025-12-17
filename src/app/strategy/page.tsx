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
  Zap,
  Target,
  Rocket,
  Brain,
  Layers,
  BarChart,
  Activity,
  ArrowRight
} from 'lucide-react';

const riskOptions = [
  { value: 'LOW', label: 'Conservative', description: 'Capital preservation focus', color: 'text-emerald-400', border: 'border-emerald-500/50', bg: 'bg-emerald-500/10' },
  { value: 'MEDIUM', label: 'Balanced', description: 'Growth with managed risk', color: 'text-blue-400', border: 'border-blue-500/50', bg: 'bg-blue-500/10' },
  { value: 'HIGH', label: 'Aggressive', description: 'Maximum potential upside', color: 'text-purple-400', border: 'border-purple-500/50', bg: 'bg-purple-500/10' },
] as const;

const personaOptions = [
  { value: 'guardian', label: 'The Guardian', icon: ShieldCheck, desc: 'Prioritizes safety and consistent yield.' },
  { value: 'strategist', label: 'The Strategist', icon: Brain, desc: 'Data-driven, diversified allocation.' },
  { value: 'visionary', label: 'The Visionary', icon: Rocket, desc: 'High-conviction bets on future tech.' },
] as const;

type StrategyResponse = {
  strategy: {
    title: string;
    summary: string;
    riskLevel: string;
    budget: number;
    expectedReturn: number;
    confidence: number;
    segments: Array<{
      category: string;
      allocation: number;
      recommendations: Array<{
        title: string;
        action: string;
        rationale: string;
        confidence: number;
        projectedReturn: number;
      }>
    }>
  };
};

type FormState = {
  budget: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  persona: 'guardian' | 'strategist' | 'visionary';
};

const DEFAULT_FORM: FormState = {
  budget: 1000,
  riskLevel: 'MEDIUM',
  persona: 'strategist',
};

export default function StrategyPage() {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<StrategyResponse | null>(null);

  const simulateGeneration = () => {
    setLoading(true);
    setTimeout(() => {
      setData({
        strategy: {
          title: "Quantum Growth Alpha",
          summary: "Optimized for volatility capture in crypto markets with a stable equity hedge.",
          riskLevel: form.riskLevel,
          budget: form.budget,
          expectedReturn: form.budget * (form.riskLevel === 'HIGH' ? 1.8 : form.riskLevel === 'MEDIUM' ? 1.4 : 1.15),
          confidence: form.riskLevel === 'HIGH' ? 72 : 89,
          segments: [
            {
              category: "Crypto Assets",
              allocation: form.budget * 0.45,
              recommendations: [
                { title: "SOL/USD Long", action: "Spot Buy", rationale: "Network Activity Spike", confidence: 85, projectedReturn: 24 },
                { title: "ETH Volatility", action: "Iron Condor", rationale: "Range Bound", confidence: 78, projectedReturn: 12 }
              ]
            },
            {
              category: "Equities",
              allocation: form.budget * 0.35,
              recommendations: [
                { title: "NVDA", action: "Call Option", rationale: "AI Sector Momentum", confidence: 82, projectedReturn: 35 },
                { title: "MSFT", action: "Hold", rationale: "Stable Cashflow", confidence: 92, projectedReturn: 8 }
              ]
            }
          ]
        }
      });
      setLoading(false);
    }, 2000);
  };

  useEffect(() => {
    // simulate initial load
    simulateGeneration();
  }, []);

  return (
    <DashboardLayout>
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 h-full flex flex-col gap-4">

        {/* Header */}
        <div className="flex flex-none items-center justify-between px-1">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-cyan-400 to-purple-500 bg-clip-text text-transparent">
              Strategy Architect
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Design, backtest, and deploy algorithmic trading strategies
            </p>
          </div>
          <Button
            variant="default"
            size="sm"
            onClick={simulateGeneration}
            disabled={loading}
            className="bg-primary hover:bg-primary/90 text-white shadow-[0_0_15px_-3px_#10b981] h-8 gap-2"
          >
            <Zap className={`h-3.5 w-3.5 ${loading ? 'animate-pulse' : 'fill-current'}`} />
            {loading ? 'Synthesizing...' : 'Generate Alpha'}
          </Button>
        </div>

        {/* Main Content Grid */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Left Col: Controls */}
          <Card className="lg:col-span-4 flex flex-col bg-black/40 border-white/5 backdrop-blur-xl h-full">
            <CardHeader className="py-4 border-b border-white/5">
              <CardTitle className="text-sm flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" /> Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin scrollbar-thumb-white/10">

              {/* Capital Section */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Allocation Capital</Label>
                  <span className="font-mono text-xl text-white font-bold">{formatCurrency(form.budget)}</span>
                </div>
                <Slider
                  value={[form.budget]}
                  min={100} max={10000} step={100}
                  onValueChange={([v]) => setForm(f => ({ ...f, budget: v }))}
                  className="py-2"
                />
                <div className="flex justify-between gap-2">
                  {[500, 1000, 5000].map(amt => (
                    <Button
                      key={amt}
                      variant="outline"
                      size="sm"
                      onClick={() => setForm(f => ({ ...f, budget: amt }))}
                      className={`flex-1 text-[10px] h-7 border-white/10 ${form.budget === amt ? 'bg-primary/20 border-primary text-primary' : 'bg-transparent text-muted-foreground hover:bg-white/5'}`}
                    >
                      ${amt}
                    </Button>
                  ))}
                </div>
              </div>

              <Separator className="bg-white/5" />

              {/* Risk Section */}
              <div className="space-y-4">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Risk Profile</Label>
                <div className="grid grid-cols-1 gap-3">
                  {riskOptions.map(opt => (
                    <div
                      key={opt.value}
                      onClick={() => setForm(f => ({ ...f, riskLevel: opt.value }))}
                      className={`
                                        cursor-pointer p-3 rounded-xl border transition-all duration-300 relative overflow-hidden group
                                        ${form.riskLevel === opt.value ? `${opt.border} ${opt.bg}` : 'border-white/5 bg-white/5 hover:border-white/10'}
                                    `}
                    >
                      <div className="flex justify-between items-center relative z-10">
                        <div>
                          <div className={`text-sm font-bold ${form.riskLevel === opt.value ? opt.color : 'text-zinc-400'}`}>{opt.label}</div>
                          <div className="text-[10px] text-muted-foreground">{opt.description}</div>
                        </div>
                        {form.riskLevel === opt.value && <Target className={`h-4 w-4 ${opt.color}`} />}
                      </div>
                      {form.riskLevel === opt.value && <div className={`absolute inset-0 opacity-10 ${opt.bg} blur-xl`} />}
                    </div>
                  ))}
                </div>
              </div>

              <Separator className="bg-white/5" />

              {/* Persona Section */}
              <div className="space-y-4">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">AI Agent Persona</Label>
                <div className="grid grid-cols-3 gap-2">
                  {personaOptions.map(p => {
                    const Icon = p.icon;
                    const isSelected = form.persona === p.value;
                    return (
                      <div
                        key={p.value}
                        onClick={() => setForm(f => ({ ...f, persona: p.value }))}
                        className={`
                                            cursor-pointer flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all duration-200 text-center h-24
                                            ${isSelected ? 'bg-white/10 border-white/20 shadow-lg text-white' : 'bg-transparent border-white/5 text-muted-foreground hover:bg-white/5'}
                                        `}
                      >
                        <Icon className={`h-5 w-5 ${isSelected ? 'text-primary' : 'text-zinc-500'}`} />
                        <span className="text-[10px] font-medium leading-tight">{p.label}</span>
                      </div>
                    )
                  })}
                </div>
                <p className="text-[10px] text-center text-muted-foreground italic min-h-[1.5em]">
                  "{personaOptions.find(p => p.value === form.persona)?.desc}"
                </p>
              </div>

            </CardContent>
          </Card>

          {/* Right Col: Visualization */}
          <div className="lg:col-span-8 h-full min-h-0 flex flex-col gap-6">

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4 flex-none h-32">
              <Card className="bg-gradient-to-br from-indigo-950/30 to-black border-indigo-500/20 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-40 transition-opacity"><Zap className="h-12 w-12 text-indigo-400" /></div>
                <CardContent className="flex flex-col justify-center h-full p-6">
                  <span className="text-xs font-medium text-indigo-300 uppercase tracking-wider mb-1">Expected Return</span>
                  <div className="text-3xl font-bold text-white mb-1">{data ? formatCurrency(data.strategy.expectedReturn) : '---'}</div>
                  <Badge variant="outline" className="w-fit border-indigo-500/30 text-indigo-300 bg-indigo-500/10 text-[10px]">
                    ROI: +{data ? ((data.strategy.expectedReturn - form.budget) / form.budget * 100).toFixed(1) : 0}%
                  </Badge>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-emerald-950/30 to-black border-emerald-500/20 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-40 transition-opacity"><Target className="h-12 w-12 text-emerald-400" /></div>
                <CardContent className="flex flex-col justify-center h-full p-6">
                  <span className="text-xs font-medium text-emerald-300 uppercase tracking-wider mb-1">Win Probability</span>
                  <div className="text-3xl font-bold text-white mb-1">{data?.strategy.confidence ?? 0}%</div>
                  <div className="w-full bg-emerald-950 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-400 h-full transition-all duration-1000" style={{ width: `${data?.strategy.confidence ?? 0}%` }} />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-rose-950/30 to-black border-rose-500/20 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-40 transition-opacity"><ShieldCheck className="h-12 w-12 text-rose-400" /></div>
                <CardContent className="flex flex-col justify-center h-full p-6">
                  <span className="text-xs font-medium text-rose-300 uppercase tracking-wider mb-1">Risk Factor</span>
                  <div className="text-3xl font-bold text-white mb-1">{form.riskLevel}</div>
                  <p className="text-[10px] text-rose-300/70">Max Drawdown: 12.5%</p>
                </CardContent>
              </Card>
            </div>

            {/* Strategy Details */}
            <Card className="flex-1 min-h-0 bg-black/40 border-white/5 backdrop-blur-md flex flex-col">
              <CardHeader className="py-4 border-b border-white/5 flex-none">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-sm">Strategy Breakdown</CardTitle>
                  <Badge variant="outline" className="border-white/10 text-zinc-400">Generated: {new Date().toLocaleTimeString()}</Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-0 scrollbar-thin scrollbar-thumb-white/10">
                {loading ? (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-4">
                    <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                    <span className="text-xs animate-pulse">Computing Optimal Allocation...</span>
                  </div>
                ) : data && (
                  <div className="divide-y divide-white/5">
                    {data.strategy.segments.map((seg, i) => (
                      <div key={i} className="p-4 hover:bg-white/5 transition-colors">
                        <div className="flex justify-between items-center mb-4">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${i === 0 ? 'bg-orange-500/10 text-orange-400' : 'bg-blue-500/10 text-blue-400'}`}>
                              {i === 0 ? <Bitcoin className="h-5 w-5" /> : <BarChart className="h-5 w-5" />}
                            </div>
                            <div>
                              <h3 className="text-sm font-bold text-white">{seg.category}</h3>
                              <p className="text-[10px] text-muted-foreground">Allocation: {formatCurrency(seg.allocation)} ({((seg.allocation / form.budget) * 100).toFixed(0)}%)</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-muted-foreground hover:text-white">
                            Details <ArrowRight className="h-3 w-3" />
                          </Button>
                        </div>

                        <div className="space-y-2 pl-12">
                          {seg.recommendations.map((rec, j) => (
                            <div key={j} className="flex items-center justify-between p-2 rounded border border-white/5 bg-black/20 text-xs">
                              <span className="font-semibold text-zinc-300 w-24">{rec.title}</span>
                              <Badge variant="secondary" className="bg-white/5 text-zinc-400 border-0 h-5 font-normal">{rec.action}</Badge>
                              <span className="text-zinc-500 hidden md:block">{rec.rationale}</span>
                              <div className="flex items-center gap-4">
                                <span className="text-muted-foreground">Conf: <span className={rec.confidence > 80 ? 'text-emerald-400' : 'text-yellow-400'}>{rec.confidence}%</span></span>
                                <span className="font-bold text-emerald-400">+{rec.projectedReturn}%</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
