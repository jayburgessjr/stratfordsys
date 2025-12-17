'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { AIPortfolioAdvisor } from '@/components/ai/ai-portfolio-advisor';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Database, TrendingUp, TrendingDown, DollarSign, RefreshCw, Activity, PieChart, ArrowUpRight, ArrowDownRight, LayoutDashboard, Settings } from 'lucide-react';
import { getPortfolioTracker, type PortfolioSummary } from '@/lib/services/portfolio-tracker';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

export default function PortfolioPage() {
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPortfolio();
  }, []);

  const loadPortfolio = async () => {
    setLoading(true);
    try {
      const tracker = getPortfolioTracker();
      const summary = await tracker.getPortfolioSummary();
      setPortfolio(summary);
    } catch (error) {
      console.error('Error loading portfolio:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !portfolio) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="flex flex-col items-center gap-4">
            <div className="relative h-16 w-16">
              <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-pulse" />
              <div className="absolute inset-0 rounded-full border-t-4 border-primary animate-spin" />
            </div>
            <p className="text-muted-foreground animate-pulse">Syncing assets...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 h-full flex flex-col gap-4">

        {/* Header - Fixed Height */}
        <div className="flex flex-none justify-between items-center px-1">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Portfolio Matrix
            </h1>
          </div>
          <div className="flex gap-3">
            <Link href="/portfolio/manage">
              <Button variant="outline" size="sm" className="gap-2 bg-black/40 border-white/10 hover:bg-white/5 h-8">
                <Settings className="h-3.5 w-3.5" />
                Manage
              </Button>
            </Link>
            <Button onClick={loadPortfolio} variant="cosmic" size="sm" className="gap-2 shadow-cyan-500/20 h-8">
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Sync Data
            </Button>
          </div>
        </div>

        {/* AI Advisor - Fixed Height or Compact */}
        <div className="relative flex-none">
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary/20 via-purple-500/20 to-blue-500/20 blur-xl opacity-50" />
          <AIPortfolioAdvisor />
        </div>

        {/* Key Metrics - Fixed Height */}
        <div className="flex-none grid grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-emerald-500/50 bg-black/40 border-white/5">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-1">
                <CardTitle className="text-xs font-medium text-zinc-400">Total Value</CardTitle>
                <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
              </div>
              <div className="text-xl font-bold text-white">${portfolio.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <p className={`text-[10px] mt-1 flex items-center gap-1 ${portfolio.totalGainLoss >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {portfolio.totalGainLoss >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                ${Math.abs(portfolio.totalGainLoss).toLocaleString(undefined, { minimumFractionDigits: 2 })} ({Math.abs(portfolio.totalGainLossPercent).toFixed(2)}%)
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500/50 bg-black/40 border-white/5">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-1">
                <CardTitle className="text-xs font-medium text-zinc-400">Holdings</CardTitle>
                <Database className="h-3.5 w-3.5 text-blue-400" />
              </div>
              <div className="text-xl font-bold text-white">{portfolio.holdings.length}</div>
              <p className="text-[10px] text-muted-foreground mt-1">Active Positions</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500/50 bg-black/40 border-white/5">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-1">
                <CardTitle className="text-xs font-medium text-zinc-400">24h Change</CardTitle>
                {portfolio.dayChange >= 0 ? (
                  <TrendingUp className="h-3.5 w-3.5 text-purple-400" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5 text-rose-400" />
                )}
              </div>
              <div className="text-xl font-bold text-white">
                {portfolio.dayChange >= 0 ? '+' : '-'}${Math.abs(portfolio.dayChange).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <p className={`text-[10px] mt-1 ${portfolio.dayChangePercent >= 0 ? 'text-purple-400' : 'text-rose-400'}`}>
                {portfolio.dayChangePercent >= 0 ? '+' : ''}{portfolio.dayChangePercent.toFixed(2)}% today
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-amber-500/50 bg-black/40 border-white/5">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-1">
                <CardTitle className="text-xs font-medium text-zinc-400">Diversification</CardTitle>
                <PieChart className="h-3.5 w-3.5 text-amber-400" />
              </div>
              <div className="text-xl font-bold text-white">{portfolio.diversificationScore}/100</div>
              <p className="text-[10px] text-muted-foreground mt-1">
                {portfolio.diversificationScore >= 80 ? 'Excellent Balance' : portfolio.diversificationScore >= 60 ? 'Good Balance' : 'Concentrated Risk'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area - Fills remaining height */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">

          {/* Main Holdings List - Scrollable */}
          <Card className="lg:col-span-2 h-full flex flex-col bg-black/20 border-white/5">
            <CardHeader className="py-3 px-4 flex-none border-b border-white/5">
              <CardTitle className="flex items-center gap-2 text-sm">
                <LayoutDashboard className="h-4 w-4 text-primary" />
                Holdings Allocation
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-white/10">
              <div className="space-y-3">
                {portfolio.holdings.map((holding) => (
                  <div key={holding.symbol} className="group p-3 rounded-xl border border-white/5 bg-black/20 hover:bg-white/5 hover:border-white/10 transition-all duration-300">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-white/10 to-transparent flex items-center justify-center font-bold text-sm">
                          {holding.symbol[0]}
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm">{holding.symbol}</div>
                          <div className="text-[10px] text-muted-foreground">{holding.shares} shares @ ${holding.currentPrice.toFixed(2)}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-white text-sm">${holding.currentValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                        <div className={`text-[10px] font-medium flex items-center justify-end gap-1 ${holding.gainLoss >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {holding.gainLoss >= 0 ? <ArrowUpRight className="h-2.5 w-2.5" /> : <ArrowDownRight className="h-2.5 w-2.5" />}
                          {Math.abs(holding.gainLossPercent).toFixed(2)}%
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>Portfolio Weight</span>
                        <span>{holding.allocation.toFixed(1)}%</span>
                      </div>
                      <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary/80 rounded-full transition-all duration-500"
                          style={{ width: `${holding.allocation}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Right Column: Analytics - Scrollable */}
          <div className="h-full min-h-0 flex flex-col gap-4 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 pr-2">

            <Card className="flex-none bg-black/20 border-white/5">
              <CardHeader className="py-3 px-4 border-b border-white/5">
                <CardTitle className="text-sm">Top Movers</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {portfolio.topGainer && (
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <div className="text-[10px] uppercase tracking-wider text-emerald-400 mb-1 font-semibold">Top Gainer</div>
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-bold text-white text-sm">{portfolio.topGainer.symbol}</div>
                        <div className="text-[10px] text-emerald-400/80">{portfolio.topGainer.name}</div>
                      </div>
                      <Badge className="bg-emerald-500 text-black hover:bg-emerald-400 h-5 text-[10px]">
                        +{portfolio.topGainer.gainLossPercent.toFixed(2)}%
                      </Badge>
                    </div>
                  </div>
                )}
                {portfolio.topLoser && portfolio.topLoser !== portfolio.topGainer && (
                  <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20">
                    <div className="text-[10px] uppercase tracking-wider text-rose-400 mb-1 font-semibold">Top Loser</div>
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-bold text-white text-sm">{portfolio.topLoser.symbol}</div>
                        <div className="text-[10px] text-rose-400/80">{portfolio.topLoser.name}</div>
                      </div>
                      <Badge variant="destructive" className="h-5 text-[10px]">
                        {portfolio.topLoser.gainLossPercent.toFixed(2)}%
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="flex-none bg-black/20 border-white/5">
              <CardHeader className="py-3 px-4 border-b border-white/5">
                <CardTitle className="text-sm">Sector Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {Array.from(new Set(portfolio.holdings.map(h => h.sector).filter(Boolean))).map(sector => {
                  const sectorHoldings = portfolio.holdings.filter(h => h.sector === sector);
                  const sectorAllocation = sectorHoldings.reduce((sum, h) => sum + h.allocation, 0);
                  return (
                    <div key={sector}>
                      <div className="flex justify-between text-[10px] mb-1">
                        <span className="text-zinc-300">{sector}</span>
                        <span className="font-mono text-muted-foreground">{sectorAllocation.toFixed(1)}%</span>
                      </div>
                      <Progress value={sectorAllocation} className="h-1" />
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="flex-none bg-black/20 border-white/5">
              <CardHeader className="py-3 px-4 border-b border-white/5">
                <CardTitle className="text-sm">Historical Returns</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  {[
                    { label: '1 Month', value: '+12.4%', color: 'text-emerald-400' },
                    { label: '3 Months', value: '+28.7%', color: 'text-emerald-400' },
                    { label: 'YTD', value: '+45.2%', color: 'text-emerald-400' },
                    { label: '1 Year', value: '+82.1%', color: 'text-emerald-400' },
                  ].map((period, i) => (
                    <div key={i} className="flex justify-between items-center pb-2 border-b border-white/5 last:border-0 last:pb-0">
                      <span className="text-xs text-muted-foreground">{period.label}</span>
                      <span className={`font-mono font-bold text-xs ${period.color}`}>{period.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}