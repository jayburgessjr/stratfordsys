'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { AIPortfolioAdvisor } from '@/components/ai/ai-portfolio-advisor';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Database, TrendingUp, TrendingDown, DollarSign, RefreshCw, Activity } from 'lucide-react';
import { getPortfolioTracker, type PortfolioSummary } from '@/lib/services/portfolio-tracker';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Settings } from 'lucide-react';

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
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Activity className="h-12 w-12 animate-pulse mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Loading portfolio data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Portfolio</h1>
            <p className="text-muted-foreground">
              Real-time portfolio tracking with live market data
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/portfolio/manage">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Manage Positions
              </Button>
            </Link>
            <Button onClick={loadPortfolio} variant="outline" size="sm">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* AI Portfolio Advisor */}
        <AIPortfolioAdvisor />

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${portfolio.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <p className={`text-xs ${portfolio.totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {portfolio.totalGainLoss >= 0 ? '+' : ''}${portfolio.totalGainLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({portfolio.totalGainLossPercent >= 0 ? '+' : ''}{portfolio.totalGainLossPercent.toFixed(2)}%)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Holdings</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{portfolio.holdings.length}</div>
              <p className="text-xs text-muted-foreground">
                Active positions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Day Change</CardTitle>
              {portfolio.dayChange >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${portfolio.dayChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {portfolio.dayChange >= 0 ? '+' : ''}${portfolio.dayChange.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className={`text-xs ${portfolio.dayChangePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {portfolio.dayChangePercent >= 0 ? '+' : ''}{portfolio.dayChangePercent.toFixed(2)}% today
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Diversification</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{portfolio.diversificationScore}%</div>
              <p className="text-xs text-muted-foreground">
                {portfolio.diversificationScore >= 80 ? 'Excellent' : portfolio.diversificationScore >= 60 ? 'Good' : 'Needs improvement'}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Holdings</CardTitle>
              <CardDescription>
                Live stock positions with real-time pricing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {portfolio.holdings.map((holding) => (
                  <div key={holding.symbol} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div>
                          <div className="font-medium">{holding.symbol}</div>
                          <div className="text-sm text-muted-foreground">
                            {holding.shares} shares @ ${holding.currentPrice.toFixed(2)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">${holding.currentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        <div className={`text-sm flex items-center justify-end ${
                          holding.gainLoss >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {holding.gainLoss >= 0 ? (
                            <TrendingUp className="h-3 w-3 mr-1" />
                          ) : (
                            <TrendingDown className="h-3 w-3 mr-1" />
                          )}
                          {holding.gainLoss >= 0 ? '+' : ''}{holding.gainLossPercent.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>{holding.allocation.toFixed(1)}% of portfolio</span>
                      <span className={holding.dayChange >= 0 ? 'text-green-600' : 'text-red-600'}>
                        Today: {holding.dayChange >= 0 ? '+' : ''}${Math.abs(holding.dayChange).toFixed(2)}
                      </span>
                    </div>
                    <Progress value={holding.allocation} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Performers</CardTitle>
              <CardDescription>
                Best and worst performing holdings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {portfolio.topGainer && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-2">Top Gainer</div>
                    <div className="flex items-center justify-between p-3 border rounded-lg bg-green-50/50">
                      <div>
                        <div className="font-medium">{portfolio.topGainer.symbol}</div>
                        <div className="text-sm text-muted-foreground">{portfolio.topGainer.name}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">
                          +{portfolio.topGainer.gainLossPercent.toFixed(2)}%
                        </div>
                        <div className="text-sm text-green-600">
                          +${portfolio.topGainer.gainLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {portfolio.topLoser && portfolio.topLoser !== portfolio.topGainer && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-2">Top Loser</div>
                    <div className="flex items-center justify-between p-3 border rounded-lg bg-red-50/50">
                      <div>
                        <div className="font-medium">{portfolio.topLoser.symbol}</div>
                        <div className="text-sm text-muted-foreground">{portfolio.topLoser.name}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-red-600">
                          {portfolio.topLoser.gainLossPercent.toFixed(2)}%
                        </div>
                        <div className="text-sm text-red-600">
                          ${portfolio.topLoser.gainLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-2">Sector Allocation</div>
                  <div className="space-y-2">
                    {Array.from(new Set(portfolio.holdings.map(h => h.sector).filter(Boolean))).map(sector => {
                      const sectorHoldings = portfolio.holdings.filter(h => h.sector === sector);
                      const sectorAllocation = sectorHoldings.reduce((sum, h) => sum + h.allocation, 0);
                      return (
                        <div key={sector}>
                          <div className="flex justify-between text-xs mb-1">
                            <span>{sector}</span>
                            <span>{sectorAllocation.toFixed(1)}%</span>
                          </div>
                          <Progress value={sectorAllocation} className="h-1.5" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Performance History</CardTitle>
            <CardDescription>
              Portfolio performance over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">+12.4%</div>
                <div className="text-sm text-muted-foreground">1 Month</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">+28.7%</div>
                <div className="text-sm text-muted-foreground">3 Months</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">+45.2%</div>
                <div className="text-sm text-muted-foreground">1 Year</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}