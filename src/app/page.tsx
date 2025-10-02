'use client';

import { Suspense } from 'react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { MarketOverview } from '@/components/dashboard/market-overview';
import { PortfolioQuickStats } from '@/components/dashboard/portfolio-quick-stats';
import { DemoPerformanceOverview } from '@/components/dashboard/demo-performance-overview';
import { DemoEquityCurveChart } from '@/components/dashboard/demo-equity-curve-chart';
import { LiveSportsLotteryNews } from '@/components/dashboard/live-sports-lottery-news';
import { AITradingSignals } from '@/components/dashboard/ai-trading-signals';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function Dashboard() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Stratford AI - Multi-Domain Wealth Engine
          </h1>
          <p className="text-muted-foreground">
            Comprehensive wealth generation across stocks, crypto, lottery, gambling, and arbitrage opportunities
          </p>
        </div>

        {/* Portfolio Stats - Row 1: 4 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Suspense fallback={<LoadingSpinner />}>
            <PortfolioQuickStats />
          </Suspense>
        </div>

        {/* Portfolio Stats - Row 2: 4 Columns */}
        <Suspense fallback={<LoadingSpinner />}>
          <DemoPerformanceOverview />
        </Suspense>

        {/* Portfolio Analytics: Equity Curve, Live News, AI Signals */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Suspense fallback={<LoadingSpinner />}>
            <DemoEquityCurveChart />
          </Suspense>

          <Suspense fallback={<LoadingSpinner />}>
            <LiveSportsLotteryNews />
          </Suspense>

          <Suspense fallback={<LoadingSpinner />}>
            <AITradingSignals />
          </Suspense>
        </div>

        {/* Real-time Market Overview */}
        <Suspense fallback={<LoadingSpinner />}>
          <MarketOverview />
        </Suspense>
      </div>
    </DashboardLayout>
  );
}