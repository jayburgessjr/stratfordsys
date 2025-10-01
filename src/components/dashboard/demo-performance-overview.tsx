'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, Target, BarChart3, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

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

export function DemoPerformanceOverview() {
  // Demo data
  const demoMetrics = [
    {
      title: "Total Return",
      value: "12.45%",
      change: "$12,450 P&L",
      trend: "up" as const,
      icon: DollarSign,
      description: "Overall portfolio performance"
    },
    {
      title: "Annualized Return",
      value: "18.2%",
      change: "15.3% volatility",
      trend: "up" as const,
      icon: TrendingUp,
      description: "Yearly performance rate"
    },
    {
      title: "Sharpe Ratio",
      value: "1.42",
      change: "1.65 Sortino",
      trend: "up" as const,
      icon: Target,
      description: "Risk-adjusted returns"
    },
    {
      title: "Max Drawdown",
      value: "8.7%",
      change: "23 days",
      trend: "up" as const,
      icon: Shield,
      description: "Largest peak-to-trough decline"
    },
    {
      title: "Win Rate",
      value: "64.2%",
      change: "34/53 trades",
      trend: "up" as const,
      icon: BarChart3,
      description: "Percentage of profitable trades"
    },
    {
      title: "Profit Factor",
      value: "2.15",
      change: "$1,245 avg win",
      trend: "up" as const,
      icon: Target,
      description: "Gross profit vs gross loss"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {demoMetrics.map((metric, index) => (
        <MetricCard
          key={index}
          title={metric.title}
          value={metric.value}
          change={metric.change}
          trend={metric.trend}
          icon={metric.icon}
          description={metric.description}
        />
      ))}
    </div>
  );
}