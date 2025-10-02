'use client';

import { Suspense } from 'react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { MarketOverview } from '@/components/dashboard/market-overview';
import { RealMarketDataWidget } from '@/components/dashboard/real-market-data-widget';
import { PortfolioQuickStats } from '@/components/dashboard/portfolio-quick-stats';
import { DemoPerformanceOverview } from '@/components/dashboard/demo-performance-overview';
import { DemoEquityCurveChart } from '@/components/dashboard/demo-equity-curve-chart';
import { DemoTradingActivity } from '@/components/dashboard/demo-trading-activity';
import { DemoRiskAnalysis } from '@/components/dashboard/demo-risk-analysis';
import { DemoStrategyConfiguration } from '@/components/dashboard/demo-strategy-configuration';
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

        {/* Two Column Layout: Market Data (Left) + Portfolio Stats (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Real Market Data (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            <Suspense fallback={<LoadingSpinner />}>
              <RealMarketDataWidget />
            </Suspense>
          </div>

          {/* Right Column - Portfolio Quick Stats (1/3 width) */}
          <div className="lg:col-span-1">
            <Suspense fallback={<LoadingSpinner />}>
              <PortfolioQuickStats />
            </Suspense>
          </div>
        </div>

        {/* Performance Overview Cards */}
        <Suspense fallback={<LoadingSpinner />}>
          <DemoPerformanceOverview />
        </Suspense>

        {/* Real-time Market Overview */}
        <Suspense fallback={<LoadingSpinner />}>
          <MarketOverview />
        </Suspense>

        {/* Main Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Equity Curve Chart */}
          <div className="lg:col-span-2">
            <Suspense fallback={<LoadingSpinner />}>
              <DemoEquityCurveChart />
            </Suspense>
          </div>

          {/* Trading Activity */}
          <Suspense fallback={<LoadingSpinner />}>
            <DemoTradingActivity />
          </Suspense>

          {/* Risk Analysis */}
          <Suspense fallback={<LoadingSpinner />}>
            <DemoRiskAnalysis />
          </Suspense>
        </div>

        {/* Strategy Configuration */}
        <Suspense fallback={<LoadingSpinner />}>
          <DemoStrategyConfiguration />
        </Suspense>
      </div>
    </DashboardLayout>
  );
}