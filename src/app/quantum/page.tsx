
'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Loader2, PieChart, TrendingUp, ShieldAlert, Brain } from 'lucide-react';
import { QuantumAllocation } from '@/types/ai';

// We need a server action or API route to call the agent safely.
// For now, we'll assume a direct import or a proxy API route is available.
// Since we can't easily make server actions in this file structure without correct setup,
// we will simulate the API call to an internal route we'll create next.

export default function QuantumPage() {
    const [capital, setCapital] = useState<number>(10000);
    const [risk, setRisk] = useState<number>(5);
    const [loading, setLoading] = useState(false);
    const [allocation, setAllocation] = useState<QuantumAllocation | null>(null);

    const handleAnalyze = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/quantum/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ capital, risk }),
            });
            const data = await response.json();
            setAllocation(data);
        } catch (error) {
            console.error('Failed to generate allocation:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-8">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Quantum Wealth Agent</h2>
                    <p className="text-muted-foreground">
                        Multi-asset portfolio optimization powered by advanced AI.
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Input Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Configuration</CardTitle>
                            <CardDescription>Define your investment parameters.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label>Total Capital ($)</Label>
                                <Input
                                    type="number"
                                    value={capital}
                                    onChange={(e) => setCapital(Number(e.target.value))}
                                />
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between">
                                    <Label>Risk Tolerance (1-10)</Label>
                                    <span className="text-sm font-bold text-muted-foreground">{risk}</span>
                                </div>
                                <Slider
                                    value={[risk]}
                                    min={1}
                                    max={10}
                                    step={1}
                                    onValueChange={(vals) => setRisk(vals[0])}
                                />
                                <p className="text-xs text-muted-foreground">
                                    1 = Conservative (Bonds/Blue Chips) | 10 = Degenerate (Crypto/Options)
                                </p>
                            </div>

                            <Button
                                onClick={handleAnalyze}
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Running Monte Carlo Simulations...
                                    </>
                                ) : (
                                    <>
                                        <Brain className="mr-2 h-4 w-4" />
                                        Generate MVO Optimization
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Output Section */}
                    {allocation && (
                        <div className="space-y-6">
                            <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <TrendingUp className="text-green-400" />
                                        Projected Return: {allocation.totalProjectedReturn}
                                    </CardTitle>
                                    <CardDescription className="text-slate-300">
                                        Risk Score: {allocation.riskScore}/10
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p className="italic text-slate-200">"{allocation.agentSummary}"</p>
                                </CardContent>
                            </Card>

                            <div className="grid gap-4">
                                {allocation.allocation.map((item, i) => (
                                    <Card key={i}>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-lg flex justify-between">
                                                <span>{item.assetClass}</span>
                                                <span className="text-blue-600">{item.percentage}%</span>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm text-muted-foreground mb-2">{item.reasoning}</p>
                                            <div className="flex flex-wrap gap-2">
                                                {item.recommendedAssets.map(asset => (
                                                    <span key={asset} className="px-2 py-1 bg-secondary rounded-md text-xs font-medium">
                                                        {asset}
                                                    </span>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
