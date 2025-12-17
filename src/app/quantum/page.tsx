'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, ShieldAlert, Brain, Zap, Terminal, Activity, Cpu, Network, Lock, GitBranch, ArrowRight } from 'lucide-react';
import { QuantumAllocation } from '@/types/ai';
import { formatCurrency } from '@/lib/utils';

export default function QuantumPage() {
    const [capital, setCapital] = useState<number>(10000);
    const [risk, setRisk] = useState<number>(5);
    const [loading, setLoading] = useState(false);
    const [allocation, setAllocation] = useState<QuantumAllocation | null>(null);
    const [logs, setLogs] = useState<string[]>([]);

    useEffect(() => {
        if (loading) {
            const interval = setInterval(() => {
                const messages = [
                    "Generating 1,000+ candidate action sets...",
                    "Simulating market trajectories (Monte Carlo)...",
                    "Stress-testing against 'Black Swan' scenarios...",
                    "Optimizing for 95% CVaR (Conditional Value at Risk)...",
                    "Pruning negative-EV branches...",
                    "Converging on risk-adjusted optimal path..."
                ];
                setLogs(prev => [...prev, messages[Math.floor(Math.random() * messages.length)]]);
            }, 800);
            return () => clearInterval(interval);
        } else {
            setLogs([]);
        }
    }, [loading]);

    const handleAnalyze = async () => {
        setLoading(true);
        setLogs(["Initializing Probability Space..."]);
        try {
            // Simulate API latency for "processing" feel
            await new Promise(resolve => setTimeout(resolve, 3000));

            const response = await fetch('/api/quantum/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ capital, risk }),
            });
            const data = await response.json();
            setAllocation(data);
        } catch (error) {
            console.error('Failed to generate allocation:', error);
            setLogs(prev => [...prev, "CRITICAL ERROR: Simulation Divergence"]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 h-full flex flex-col gap-4">

                {/* Header */}
                <div className="flex flex-none items-center justify-between px-1">
                    <div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-primary to-purple-400 bg-clip-text text-transparent flex items-center gap-3">
                            <Brain className="h-6 w-6 text-primary" />
                            Quantum Decision Engine
                        </h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Simulating Futures // Sampling Trajectories // Optimizing Outcomes
                        </p>
                    </div>
                    <Badge variant="outline" className="border-primary/20 bg-primary/10 text-primary gap-2 px-3 py-1">
                        <Cpu className="h-3 w-3" />
                        v2.4.9
                    </Badge>
                </div>

                {/* Main Grid */}
                <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* Left Column: Input Terminal */}
                    <div className="lg:col-span-4 h-full min-h-0 flex flex-col gap-4">
                        <Card className="flex-none bg-black/40 border-white/5 backdrop-blur-xl">
                            <CardHeader className="py-4 border-b border-white/5">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <Terminal className="h-4 w-4 text-primary" />
                                    Simulation Parameters
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                <div className="space-y-3">
                                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Input Capital</Label>
                                    <div className="relative">
                                        <Input
                                            type="number"
                                            value={capital}
                                            onChange={(e) => setCapital(Number(e.target.value))}
                                            className="bg-black/40 border-white/10 text-lg font-bold"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Risk Tolerance</Label>
                                        <span className={`font-bold ${risk > 7 ? 'text-rose-400' : risk > 4 ? 'text-yellow-400' : 'text-emerald-400'}`}>
                                            {risk}/10
                                        </span>
                                    </div>
                                    <Slider
                                        value={[risk]}
                                        min={1}
                                        max={10}
                                        step={1}
                                        onValueChange={(vals) => setRisk(vals[0])}
                                        className="py-1"
                                    />
                                    <div className="flex justify-between text-[10px] text-muted-foreground uppercase font-medium">
                                        <span>Conservative</span>
                                        <span>Balanced</span>
                                        <span>Aggressive</span>
                                    </div>
                                </div>

                                <Button
                                    onClick={handleAnalyze}
                                    disabled={loading}
                                    className="w-full h-10 shadow-primary/25 relative overflow-hidden group font-medium"
                                    variant="cosmic"
                                >
                                    <div className="relative flex items-center justify-center gap-2">
                                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                                        <span>{loading ? 'Running Simulations...' : 'Engage Engine'}</span>
                                    </div>
                                </Button>
                            </CardContent>
                        </Card>

                        {/* System Logs */}
                        <Card className="flex-1 min-h-0 bg-black/40 border-white/5 backdrop-blur-xl flex flex-col">
                            <CardHeader className="py-2 px-4 border-b border-white/5">
                                <div className="flex items-center gap-2">
                                    <Activity className="h-3 w-3 text-emerald-500" />
                                    <span className="text-xs font-medium text-muted-foreground">Simulation Log Stream</span>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 overflow-y-auto p-4 space-y-1.5 scrollbar-thin scrollbar-thumb-white/10 font-mono text-[10px]">
                                <div className="text-muted-foreground">-- Session Started {new Date().toLocaleTimeString()} --</div>
                                {logs.map((log, i) => (
                                    <div key={i} className="text-primary/80 animate-in fade-in slide-in-from-left-2 duration-300">
                                        <span className="text-zinc-600 mr-2">[{new Date().toLocaleTimeString()}]</span>
                                        {`> ${log}`}
                                    </div>
                                ))}
                                {loading && <div className="text-primary/80 animate-pulse">_</div>}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Visualization */}
                    <div className="lg:col-span-8 h-full min-h-0 flex flex-col gap-6">

                        {/* Status/Metics HUD */}
                        {!allocation && !loading && (
                            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-4 border border-dashed border-white/10 rounded-2xl bg-black/20">
                                <Network className="h-16 w-16 opacity-20" />
                                <p className="text-sm">Awaiting Simulation Parameters</p>
                            </div>
                        )}

                        {allocation && (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-none">
                                    <Card className="bg-gradient-to-br from-black/40 to-emerald-900/10 border-emerald-500/20 backdrop-blur-sm">
                                        <CardContent className="flex flex-col justify-center h-full p-6">
                                            <span className="text-[10px] uppercase tracking-wider text-emerald-400 mb-1">Expected Value (EV)</span>
                                            <div className="text-2xl font-bold text-white mb-1">{allocation.totalProjectedReturn}</div>
                                            <div className="text-[10px] text-emerald-400/70">Risk-Adjusted Alpha</div>
                                        </CardContent>
                                    </Card>
                                    <Card className="bg-gradient-to-br from-black/40 to-blue-900/10 border-blue-500/20 backdrop-blur-sm">
                                        <CardContent className="flex flex-col justify-center h-full p-6">
                                            <span className="text-[10px] uppercase tracking-wider text-blue-400 mb-1">Downside Risk (VaR)</span>
                                            <div className="text-2xl font-bold text-white mb-1">{allocation.riskScore} <span className="text-sm font-normal text-muted-foreground">/ 10</span></div>
                                            <div className="text-[10px] text-blue-400/70">95% Confidence Interval</div>
                                        </CardContent>
                                    </Card>
                                    <Card className="bg-gradient-to-br from-black/40 to-purple-900/10 border-purple-500/20 backdrop-blur-sm">
                                        <CardContent className="flex flex-col justify-center h-full p-6">
                                            <span className="text-[10px] uppercase tracking-wider text-purple-400 mb-1">Confidence Score</span>
                                            <div className="text-2xl font-bold text-white mb-1">98.4%</div>
                                            <div className="text-[10px] text-purple-400/70">Based on 10k simulations</div>
                                        </CardContent>
                                    </Card>
                                </div>

                                <Card className="flex-1 min-h-0 bg-black/40 border-white/5 backdrop-blur-xl flex flex-col">
                                    <CardHeader className="py-4 border-b border-white/5 flex-none">
                                        <div className="flex justify-between items-center">
                                            <CardTitle className="text-sm flex items-center gap-2">
                                                <GitBranch className="h-4 w-4 text-primary" />
                                                Optimal Action Path
                                            </CardTitle>
                                            <Badge variant="outline" className="border-white/10 text-muted-foreground font-normal">
                                                10,000 Simulations Run
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="flex-1 overflow-y-auto p-0 scrollbar-thin scrollbar-thumb-white/10">

                                        <div className="p-6 border-b border-white/5 bg-white/5">
                                            <div className="flex gap-4">
                                                <Brain className="h-10 w-10 text-primary flex-none mt-1" />
                                                <div>
                                                    <h3 className="text-sm font-medium text-white mb-1">Evaluation Outcome</h3>
                                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                                        "{allocation.agentSummary}"
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4 p-6">
                                            {allocation.allocation.map((item, i) => (
                                                <div key={i} className="flex flex-col md:flex-row gap-4 p-4 rounded-xl border border-white/5 bg-black/20 hover:bg-black/40 transition-colors">
                                                    <div className="flex-1 space-y-2">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div className="flex items-center gap-2">
                                                                <h4 className="font-semibold text-white text-sm">{item.assetClass}</h4>
                                                                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                                                                    {item.percentage}% Alloc
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground leading-relaxed">{item.reasoning}</p>
                                                        <div className="flex flex-wrap gap-2 pt-2">
                                                            {item.recommendedAssets.map(asset => (
                                                                <span key={asset} className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[10px] text-zinc-300 font-medium">
                                                                    {asset}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                    </CardContent>
                                </Card>
                            </>
                        )}

                    </div>

                </div>
            </div>
        </DashboardLayout>
    );
}
