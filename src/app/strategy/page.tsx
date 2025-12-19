'use client';

import { useCallback, useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { formatCurrency, cn } from '@/lib/utils';
import {
  RefreshCw,
  Trophy,
  ShieldCheck,
  Zap,
  Target,
  Brain,
  Layers,
  BarChart,
  Activity,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Play,
  FileText,
  Lock,
  GitBranch,
  Search,
  Timer
} from 'lucide-react';

// --- Types & Constants ---

type LifecycleStage = 'Draft' | 'Backtest' | 'Walk-Forward' | 'Monte Carlo' | 'Incubation' | 'Live-Ready';

type MetricRange = {
  min: number;
  max: number;
  p50: number; // Median expectation
};

type StrategyDossier = {
  id: string;
  name: string;
  archetype: string; // e.g., "Mean Reversion Breakout"
  stage: LifecycleStage;
  status: 'Pending' | 'Passed' | 'Failed' | 'Warning';

  // Design Parameters
  constraints: {
    maxDrawdown: number;
    leverageLimit: number;
    minLiquidity: string;
  };

  // Validation Metrics (Davey-style Ranges)
  metrics: {
    expectedReturn: MetricRange;
    maxDrawdown: MetricRange;
    winRate: MetricRange;
    profitFactor: MetricRange;
    regimeSensitivity: 'Trending' | 'Mean Reverting' | 'High Volatility';
    evidenceGrade: 'A' | 'B' | 'C' | 'D';
  };

  // System Rules (Output of design)
  rules: {
    entry: string;
    exit: string;
    stopLoss: string;
    description: string;
  };

  // Artifacts (Evidence of work)
  artifacts: {
    backtest: { trades: number; period: string; sharpe: number };
    walkForward: { folds: number; stabilityScore: number }; // 0-100
    monteCarlo: { simulations: number; worstCaseDrawdown: number };
    incubation: { daysRemaining: number; status: 'On Track' | 'Deviating' };
  };

  // Automated Governance
  monitoring: {
    killSwitchDD: number; // Hard stop level
    efficiencyThreshold: number; // Soft warning level
  };
};

const riskProfiles = [
  {
    value: 'LOW',
    label: 'Conservative',
    color: 'text-emerald-400',
    border: 'border-emerald-500/50',
    bg: 'bg-emerald-500/10',
    constraints: 'Max DD ≤ 15% (95% MC), Required Incubation',
    killLevel: 15
  },
  {
    value: 'MEDIUM',
    label: 'Balanced',
    color: 'text-blue-400',
    border: 'border-blue-500/50',
    bg: 'bg-blue-500/10',
    constraints: 'Max DD ≤ 25% (95% MC), Standard Sizing',
    killLevel: 25
  },
  {
    value: 'HIGH',
    label: 'Aggressive',
    color: 'text-purple-400',
    border: 'border-purple-500/50',
    bg: 'bg-purple-500/10',
    constraints: 'Max DD ≤ 40%, Optional Incubation',
    killLevel: 40
  },
] as const;

const personas = [
  { value: 'guardian', label: 'Guardian', icon: ShieldCheck, role: 'Risk Engineer', focus: 'Optimizes for tail risk & stability.' },
  { value: 'strategist', label: 'Strategist', icon: Brain, role: 'Portfolio Architect', focus: 'Optimizes for correlation & smoothness.' },
  { value: 'visionary', label: 'Visionary', icon: Zap, role: 'Edge Hunter', focus: 'Optimizes for upside variance.' },
] as const;

export default function StrategyPage() {
  const [budget, setBudget] = useState(5000);
  const [riskLevel, setRiskLevel] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [persona, setPersona] = useState<'guardian' | 'strategist' | 'visionary'>('strategist');

  const [dossier, setDossier] = useState<StrategyDossier | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeTab, setActiveTab] = useState('dossier');

  // Helper to generate a realistic looking range
  const generateRange = (base: number, vol: number): MetricRange => ({
    min: Number((base * (1 - vol)).toFixed(2)),
    p50: Number(base.toFixed(2)),
    max: Number((base * (1 + vol)).toFixed(2)),
  });

  // Simulator Engine
  const runPipeline = useCallback(() => {
    setIsSimulating(true);
    setDossier(null);

    // Initial Draft
    setTimeout(() => {
      const isAggressive = riskLevel === 'HIGH';
      const baseReturn = isAggressive ? 28 : (riskLevel === 'MEDIUM' ? 18 : 12);
      const vol = isAggressive ? 0.4 : 0.2;

      const archetype = persona === 'guardian' ? 'Mean Reversion (Bollinger)' :
        persona === 'strategist' ? 'Multi-Timeframe Trend' : 'Volatility Breakout (Impulse)';

      const newDossier: StrategyDossier = {
        id: `STRAT-${Math.floor(Math.random() * 10000)}`,
        name: `Project ${['Alpha', 'Nebula', 'Zenith', 'Flux'][Math.floor(Math.random() * 4)]} ${new Date().getFullYear()}`,
        archetype,
        stage: 'Draft',
        status: 'Pending',
        constraints: {
          maxDrawdown: riskProfiles.find(r => r.value === riskLevel)!.killLevel,
          leverageLimit: isAggressive ? 3 : 1,
          minLiquidity: '$2M Daily'
        },
        metrics: {
          expectedReturn: generateRange(baseReturn, vol),
          maxDrawdown: generateRange(baseReturn * 0.6, 0.3),
          winRate: generateRange(isAggressive ? 45 : 62, 0.1),
          profitFactor: generateRange(1.45, 0.15),
          regimeSensitivity: isAggressive ? 'High Volatility' : 'Trending',
          evidenceGrade: 'B'
        },
        rules: {
          entry: "Close > EMA(50) AND RSI(14) < 70 AND Vol > AvgVol(20)*1.5",
          exit: "Trailing Stop 2.5 ATR OR RSI(14) > 85",
          stopLoss: "Fixed 1.5% Equity Risk per Trade",
          description: "Exploits short-term momentum shifts while filtering for low-liquidity traps."
        },
        artifacts: {
          backtest: { trades: 1420, period: '2018-2024', sharpe: 1.8 },
          walkForward: { folds: 12, stabilityScore: 85 },
          monteCarlo: { simulations: 5000, worstCaseDrawdown: riskLevel === 'HIGH' ? 32 : 14 },
          incubation: { daysRemaining: 14, status: 'On Track' }
        },
        monitoring: {
          killSwitchDD: riskProfiles.find(r => r.value === riskLevel)!.killLevel,
          efficiencyThreshold: 0.8
        }
      };

      setDossier(newDossier);

      // Simulate pipeline progress
      const stages: LifecycleStage[] = ['Backtest', 'Walk-Forward', 'Monte Carlo', 'Incubation'];
      let currentStage = 0;

      const interval = setInterval(() => {
        if (currentStage >= stages.length) {
          clearInterval(interval);
          setIsSimulating(false);
          setDossier(d => d ? ({ ...d, stage: 'Live-Ready', status: 'Passed' }) : null);
          return;
        }

        setDossier(d => d ? ({ ...d, stage: stages[currentStage] }) : null);
        currentStage++;
      }, 800); // Fast forward animation

    }, 600);
  }, [riskLevel, persona]);

  // Visual Stepper Component
  const Stepper = ({ currentStage }: { currentStage: LifecycleStage }) => {
    const stages: LifecycleStage[] = ['Draft', 'Backtest', 'Walk-Forward', 'Monte Carlo', 'Incubation', 'Live-Ready'];
    const currentIndex = stages.indexOf(currentStage);

    return (
      <div className="flex items-center justify-between w-full relative">
        {/* Progress Line */}
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/10 -z-0" />
        <div
          className="absolute top-1/2 left-0 h-0.5 bg-emerald-500/50 transition-all duration-500 -z-0"
          style={{ width: `${(currentIndex / (stages.length - 1)) * 100}%` }}
        />

        {stages.map((stage, idx) => {
          const isComplete = idx <= currentIndex;
          const isActive = idx === currentIndex;
          return (
            <div key={stage} className="flex flex-col items-center gap-2 relative z-10">
              <div
                className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 bg-black",
                  isComplete ? "border-emerald-500 text-emerald-500" : "border-white/10 text-zinc-600",
                  isActive && "ring-4 ring-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                )}
              >
                {isComplete ? <CheckCircle2 className="h-4 w-4" /> : <div className="h-2 w-2 rounded-full bg-current" />}
              </div>
              <span className={cn(
                "text-[10px] uppercase font-bold tracking-wider transition-colors duration-300",
                isComplete ? "text-emerald-400" : "text-zinc-600"
              )}>
                {stage === 'Walk-Forward' ? 'Walk-Fwd' : stage}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 h-full flex flex-col gap-6">

        {/* Header */}
        <div className="flex flex-none items-center justify-between px-1">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-cyan-400 to-purple-500 bg-clip-text text-transparent">
              Strategy Architect
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Design, validate, and incubate algorithmic trading systems
            </p>
          </div>
          <div className="flex gap-3">
            {dossier && (
              <Badge variant="outline" className="h-9 px-4 border-emerald-500/30 text-emerald-400 bg-emerald-500/10 gap-2">
                <CheckCircle2 className="h-3.5 w-3.5" /> Pipeline Active
              </Badge>
            )}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Configuration Panel */}
          <Card className="lg:col-span-4 flex flex-col bg-black/40 border-white/5 backdrop-blur-xl h-full border-r-0 rounded-r-none">
            <CardHeader className="py-5 border-b border-white/5">
              <CardTitle className="text-sm flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" /> System Design
              </CardTitle>
              <CardDescription className="text-xs">Define objectives & constraints</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin scrollbar-thumb-white/10">

              <div className="space-y-4">
                <Label className="uppercase text-[10px] tracking-widest text-zinc-500">Capital Allocation</Label>
                <div className="flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/5">
                  <span className="text-2xl font-mono text-white tracking-tight">{formatCurrency(budget)}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-zinc-400 hover:text-white"><RefreshCw className="h-3 w-3" /></Button>
                </div>
                <Slider value={[budget]} min={1000} max={50000} step={1000} onValueChange={([v]) => setBudget(v)} className="py-2" />
              </div>

              <Separator className="bg-white/5" />

              <div className="space-y-4">
                <Label className="uppercase text-[10px] tracking-widest text-zinc-500">Risk Profile</Label>
                <div className="space-y-3">
                  {riskProfiles.map(p => (
                    <div
                      key={p.value}
                      onClick={() => setRiskLevel(p.value)}
                      className={cn(
                        "cursor-pointer p-3 rounded-xl border transition-all duration-300 group hover:bg-white/5",
                        riskLevel === p.value ? `${p.border} ${p.bg}` : "border-white/5"
                      )}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className={cn("text-sm font-bold", riskLevel === p.value ? p.color : "text-zinc-400")}>{p.label}</span>
                        {riskLevel === p.value && <Target className={cn("h-4 w-4", p.color)} />}
                      </div>
                      <p className="text-[10px] text-zinc-500 font-mono">{p.constraints}</p>
                    </div>
                  ))}
                </div>
              </div>

              <Separator className="bg-white/5" />

              <div className="space-y-4">
                <Label className="uppercase text-[10px] tracking-widest text-zinc-500">Optimization Goal (Persona)</Label>
                <div className="grid grid-cols-1 gap-2">
                  {personas.map(p => {
                    const Icon = p.icon;
                    const Active = persona === p.value;
                    return (
                      <button
                        key={p.value}
                        onClick={() => setPersona(p.value)}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg border text-left transition-all",
                          Active ? "bg-white/10 border-white/20 text-white" : "border-transparent hover:bg-white/5 text-zinc-500"
                        )}
                      >
                        <div className={cn("p-2 rounded-md", Active ? "bg-white/10" : "bg-white/5")}>
                          <Icon className={cn("h-4 w-4", Active ? "text-primary" : "text-zinc-600")} />
                        </div>
                        <div>
                          <div className="text-xs font-bold">{p.label}</div>
                          <div className="text-[10px] opacity-70">{p.focus}</div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              <Button
                size="lg"
                className={cn("w-full gap-2 mt-4 font-bold shadow-xl transition-all",
                  isSimulating ? "opacity-50 cursor-not-allowed" : "hover:scale-[1.02]"
                )}
                onClick={runPipeline}
                disabled={isSimulating}
              >
                {isSimulating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                {isSimulating ? "Running Validation Suite..." : "Initialize Pipeline"}
              </Button>

            </CardContent>
          </Card>

          {/* Strategy Dossier / Results Panel */}
          <div className="lg:col-span-8 flex flex-col gap-6 h-full">

            {!dossier ? (
              <div className="h-full flex flex-col items-center justify-center text-zinc-600 border border-dashed border-white/5 rounded-3xl bg-black/20">
                <Search className="h-12 w-12 mb-4 opacity-20" />
                <p className="text-sm">Configure parameters and initialize pipeline to generate a Strategy Dossier.</p>
              </div>
            ) : (
              <>
                {/* Stepper Card */}
                <Card className="bg-black/60 border-white/10 backdrop-blur-xl">
                  <CardContent className="py-8 px-10">
                    <Stepper currentStage={dossier.stage} />
                  </CardContent>
                </Card>

                {/* Main Dossier Content */}
                <Card className="flex-1 bg-black/40 border-white/5 overflow-hidden flex flex-col">

                  {/* Dossier Header */}
                  <div className="p-6 border-b border-white/5 flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-xl font-bold text-white tracking-tight">{dossier.name}</h2>
                        <Badge variant="secondary" className="bg-white/5 text-zinc-400 font-mono text-[10px] tracking-widest">{dossier.id}</Badge>
                        <Badge variant="outline" className={cn("border-0 font-bold",
                          dossier.status === 'Pending' ? "text-yellow-500 bg-yellow-500/10" :
                            dossier.status === 'Passed' ? "text-emerald-500 bg-emerald-500/10" : "text-red-500"
                        )}>{dossier.status}</Badge>
                      </div>
                      <p className="text-sm text-zinc-400 flex items-center gap-2">
                        <FileText className="h-3.5 w-3.5" /> Archetype: <span className="text-white">{dossier.archetype}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Pipeline Grade</div>
                      <div className="text-3xl font-black text-white">{dossier.metrics.evidenceGrade}</div>
                    </div>
                  </div>

                  {/* Tabs */}
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
                    <div className="px-6 border-b border-white/5">
                      <TabsList className="bg-transparent h-12 p-0 space-x-6">
                        <TabsTrigger value="dossier" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-3 text-xs text-zinc-500 data-[state=active]:text-white uppercase tracking-wider">Metrics Dossier</TabsTrigger>
                        <TabsTrigger value="rules" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-3 text-xs text-zinc-500 data-[state=active]:text-white uppercase tracking-wider">System Rules</TabsTrigger>
                        <TabsTrigger value="evidence" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-3 text-xs text-zinc-500 data-[state=active]:text-white uppercase tracking-wider">Validation Evidence</TabsTrigger>
                        <TabsTrigger value="monitoring" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-3 text-xs text-zinc-500 data-[state=active]:text-white uppercase tracking-wider">Live Monitoring</TabsTrigger>
                      </TabsList>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-white/10">
                      <TabsContent value="dossier" className="mt-0 h-full">
                        <div className="grid grid-cols-2 gap-6">
                          {/* Left: Performance Ranges */}
                          <div className="space-y-6">
                            <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2"><BarChart className="h-4 w-4" /> Performance Ranges (Monte Carlo)</h3>

                            <div className="space-y-4">
                              {[
                                { label: 'Expected Return', metric: dossier.metrics.expectedReturn, suffix: '%', color: 'bg-emerald-500' },
                                { label: 'Max Drawdown', metric: dossier.metrics.maxDrawdown, suffix: '%', color: 'bg-rose-500' },
                                { label: 'Win Rate', metric: dossier.metrics.winRate, suffix: '%', color: 'bg-blue-500' }
                              ].map((item, i) => (
                                <div key={i} className="bg-white/5 p-4 rounded-xl border border-white/5">
                                  <div className="flex justify-between text-xs mb-2">
                                    <span className="text-zinc-400">{item.label}</span>
                                    <span className="text-white font-bold">{item.metric.p50}{item.suffix}</span>
                                  </div>
                                  <div className="h-2 bg-black rounded-full overflow-hidden relative">
                                    {/* Range Bar */}
                                    <div
                                      className={cn("absolute h-full opacity-30", item.color)}
                                      style={{ left: '20%', width: '60%' }} // Mock visualization of range
                                    />
                                    {/* Median Marker */}
                                    <div
                                      className={cn("absolute h-full w-1", item.color)}
                                      style={{ left: '50%' }}
                                    />
                                  </div>
                                  <div className="flex justify-between text-[10px] text-zinc-600 mt-1 font-mono">
                                    <span>P90: {item.metric.min}{item.suffix}</span>
                                    <span>P10: {item.metric.max}{item.suffix}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Right: Qualitative */}
                          <div className="space-y-6">
                            <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2"><Activity className="h-4 w-4" /> Behavior Profile</h3>

                            <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                              <div className="text-xs text-indigo-400 mb-1">Market Regime Sensitivity</div>
                              <div className="text-lg font-bold text-white">{dossier.metrics.regimeSensitivity}</div>
                              <p className="text-[10px] text-indigo-300/60 mt-2">
                                System performs best during {dossier.metrics.regimeSensitivity.toLowerCase()} periods.
                                Performance may degrade in choppy sideways markets.
                              </p>
                            </div>

                            <div className="p-4 bg-zinc-900 border border-white/10 rounded-xl">
                              <div className="text-xs text-zinc-400 mb-1">Profit Factor Impact</div>
                              <div className="text-lg font-bold text-white">{dossier.metrics.profitFactor.min} - {dossier.metrics.profitFactor.max}</div>
                              <p className="text-[10px] text-zinc-500 mt-2">
                                High profit factor indicates robustness against slippage and commission drag.
                              </p>
                            </div>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="rules" className="mt-0 h-full space-y-6">
                        <div className="bg-black/40 border border-white/10 rounded-xl p-6 font-mono text-xs space-y-4">
                          <div className="grid grid-cols-[100px_1fr] gap-4">
                            <span className="text-emerald-500 font-bold">ENTRY</span>
                            <span className="text-zinc-300">{dossier.rules.entry}</span>
                          </div>
                          <Separator className="bg-white/5" />
                          <div className="grid grid-cols-[100px_1fr] gap-4">
                            <span className="text-rose-500 font-bold">EXIT</span>
                            <span className="text-zinc-300">{dossier.rules.exit}</span>
                          </div>
                          <Separator className="bg-white/5" />
                          <div className="grid grid-cols-[100px_1fr] gap-4">
                            <span className="text-blue-500 font-bold">RISK</span>
                            <span className="text-zinc-300">{dossier.rules.stopLoss}</span>
                          </div>
                        </div>
                        <p className="text-xs text-zinc-500 italic border-l-2 border-white/10 pl-4 py-1">
                          "{dossier.rules.description}"
                        </p>
                      </TabsContent>

                      <TabsContent value="evidence" className="mt-0 h-full space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                            <div className="flex items-center gap-2 mb-2">
                              <GitBranch className="h-4 w-4 text-emerald-400" />
                              <span className="text-xs font-bold text-white">Walk-Forward Analysis</span>
                            </div>
                            <div className="text-2xl font-bold text-white">{dossier.artifacts.walkForward.stabilityScore}/100</div>
                            <p className="text-[10px] text-zinc-500">Stability Score across {dossier.artifacts.walkForward.folds} out-of-sample folds.</p>
                          </div>
                          <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                            <div className="flex items-center gap-2 mb-2">
                              <AlertTriangle className="h-4 w-4 text-amber-400" />
                              <span className="text-xs font-bold text-white">Monte Carlo Stress</span>
                            </div>
                            <div className="text-2xl font-bold text-white">{dossier.artifacts.monteCarlo.worstCaseDrawdown}%</div>
                            <p className="text-[10px] text-zinc-500">Worst case drawdown in {dossier.artifacts.monteCarlo.simulations} simulations.</p>
                          </div>
                        </div>

                        <div className="bg-gradient-to-br from-zinc-900 to-black rounded-xl p-6 border border-white/5 flex items-center justify-center min-h-[200px]">
                          <div className="text-center space-y-2">
                            <Timer className="h-8 w-8 text-white/20 mx-auto" />
                            <h4 className="text-sm font-bold text-white">Incubation Status</h4>
                            <p className="text-xs text-zinc-500">System is currently {dossier.artifacts.incubation.daysRemaining} days away from Live Certification.</p>
                            <div className="w-48 h-1 bg-white/10 rounded-full mx-auto mt-4 overflow-hidden">
                              <div className="w-1/2 h-full bg-emerald-500" />
                            </div>
                            <p className="text-[10px] text-emerald-500 font-mono mt-1">Status: {dossier.artifacts.incubation.status}</p>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="monitoring" className="mt-0 h-full">
                        <div className="space-y-4">
                          <div className="flex items-start gap-4 p-4 border border-rose-500/20 bg-rose-500/5 rounded-xl">
                            <Lock className="h-5 w-5 text-rose-500 mt-0.5" />
                            <div>
                              <h4 className="text-sm font-bold text-rose-400">Hard Kill Switch</h4>
                              <p className="text-xs text-rose-300/70 mb-2">If strategy equity drops below this level, purely liquidate all positions and disable automation.</p>
                              <div className="text-xl font-mono font-bold text-white">{dossier.monitoring.killSwitchDD}% Drawdown</div>
                            </div>
                          </div>

                          <div className="flex items-start gap-4 p-4 border border-yellow-500/20 bg-yellow-500/5 rounded-xl">
                            <Activity className="h-5 w-5 text-yellow-500 mt-0.5" />
                            <div>
                              <h4 className="text-sm font-bold text-yellow-400">Efficiency Watchdog</h4>
                              <p className="text-xs text-yellow-300/70 mb-2">Warning triggers if realized performance deviates effectively from backtest expectancy.</p>
                              <div className="text-xl font-mono font-bold text-white">Efficiency &lt; {dossier.monitoring.efficiencyThreshold}</div>
                            </div>
                          </div>
                        </div>
                      </TabsContent>

                    </div>
                  </Tabs>

                </Card>
              </>
            )}

          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
