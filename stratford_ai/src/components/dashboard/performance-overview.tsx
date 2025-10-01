'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, Target, BarChart3, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDemoBacktest } from '@/hooks/use-demo-backtest';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: React.ComponentType<{ className?: string | undefined }>;
  description?: string;
}

function MetricCard({ title, value, change, trend, icon: Icon, description }: MetricCardProps) {
  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-muted-foreground'
  };

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <div className={cn('flex items-center text-xs', trendColors[trend || 'neutral'])}>
            {TrendIcon && <TrendIcon className="mr-1 h-3 w-3" />}
            {change}
          </div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function PerformanceOverview() {
  const { backtestResult, isLoading, error } = useDemoBacktest();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !backtestResult) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          {error || 'No data available'}
        </div>
      </Card>
    );
  }

  const analysis = backtestResult.performance;
  const execution = backtestResult.execution;

  // Format numbers for display
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);

  const formatPercentage = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);

  const formatNumber = (value: number, decimals: number = 2) =>
    new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);

  const totalReturn = analysis.returns.totalReturn;
  const totalReturnTrend = totalReturn > 0 ? 'up' : totalReturn < 0 ? 'down' : 'neutral';

  const sharpeRatio = analysis.ratios.sharpeRatio;
  const sharpeRatioTrend = sharpeRatio > 1 ? 'up' : sharpeRatio < 0 ? 'down' : 'neutral';

  const maxDrawdown = analysis.drawdown.maxDrawdown;
  const drawdownTrend = maxDrawdown < 0.1 ? 'up' : maxDrawdown > 0.2 ? 'down' : 'neutral';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      <MetricCard
        title="Total Return"
        value={formatPercentage(totalReturn)}
        change={`${formatCurrency(execution.finalValue - execution.initialCapital)} P&L`}
        trend={totalReturnTrend}
        icon={DollarSign}
        description="Overall portfolio performance"
      />

      <MetricCard
        title="Annualized Return"
        value={formatPercentage(analysis.returns.annualizedReturn)}
        change={formatPercentage(analysis.returns.volatility) + ' volatility'}
        trend={analysis.returns.annualizedReturn > 0.08 ? 'up' : 'down'}
        icon={TrendingUp}
        description="Yearly performance rate"
      />

      <MetricCard
        title="Sharpe Ratio"
        value={formatNumber(sharpeRatio)}
        change={formatNumber(analysis.ratios.sortinoRatio) + ' Sortino'}
        trend={sharpeRatioTrend}
        icon={Target}
        description="Risk-adjusted returns"
      />

      <MetricCard
        title="Max Drawdown"
        value={formatPercentage(maxDrawdown)}
        change={formatNumber(analysis.drawdown.maxDrawdownDuration) + ' days'}
        trend={drawdownTrend}
        icon={Shield}
        description="Largest peak-to-trough decline"
      />

      <MetricCard
        title="Win Rate"
        value={formatPercentage(analysis.trading.hitRate)}
        change={`${analysis.trading.winningTrades}/${analysis.trading.totalTrades} trades`}
        trend={analysis.trading.hitRate > 0.5 ? 'up' : 'down'}
        icon={BarChart3}
        description="Percentage of profitable trades"
      />

      <MetricCard
        title="Profit Factor"
        value={formatNumber(analysis.trading.profitFactor)}
        change={formatCurrency(analysis.trading.averageWinningTrade) + ' avg win'}
        trend={analysis.trading.profitFactor > 1.5 ? 'up' : analysis.trading.profitFactor < 1 ? 'down' : 'neutral'}
        icon={Target}
        description="Gross profit vs gross loss"
      />
    </div>
  );
}