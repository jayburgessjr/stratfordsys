'use client';

import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, DollarSign, BarChart3 } from 'lucide-react';
import { useDemoBacktest } from '@/hooks/use-demo-backtest';

type ChartView = 'equity' | 'drawdown' | 'returns';

interface EquityChartTooltipProps {
  active?: boolean;
  payload?: Array<{
    color: string;
    name: string;
    value: number;
    payload: any;
  }>;
  label?: string;
}

function EquityChartTooltip({ active, payload, label }: EquityChartTooltipProps) {
  if (active && payload && payload.length) {
    // const data = payload[0]?.payload; // Unused
    return (
      <div className="rounded-lg border bg-background p-3 shadow-md">
        <p className="font-medium">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {
              entry.name === 'Equity Value'
                ? new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
                }).format(entry.value)
                : entry.name === 'Drawdown'
                  ? new Intl.NumberFormat('en-US', {
                    style: 'percent',
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  }).format(entry.value)
                  : new Intl.NumberFormat('en-US', {
                    style: 'percent',
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  }).format(entry.value)
            }
          </p>
        ))}
      </div>
    );
  }
  return null;
}

export function EquityCurveChart() {
  const [view, setView] = useState<ChartView>('equity');
  const { backtestResult, isLoading, error } = useDemoBacktest();

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-muted rounded w-1/3"></div>
        </CardHeader>
        <CardContent>
          <div className="h-80 bg-muted rounded"></div>
        </CardContent>
      </Card>
    );
  }

  if (error || !backtestResult) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Equity Curve</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center text-muted-foreground">
            {error || 'No data available'}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prepare chart data
  const chartData = (backtestResult.equity || []).map((point: any, index: number) => {
    // Determine daily return
    // Note: backtestResult.equity is an array of objects { date: string, value: number, ... }
    const currentDate = point.date || `Day ${index + 1}`;
    const currentValue = point.value;

    // Previous value for daily return
    const prevValue = index > 0 ? backtestResult.equity[index - 1].value : currentValue;
    const dailyReturn = index > 0 ? (currentValue - prevValue) / prevValue : 0;

    // Determine drawdown
    // We can assume point.drawdown exists if calculated by engine, 
    // OR we can recalculate it here if needed. 
    // Let's recalculate properly to be safe:
    // Peak is max of all equity values up to this point
    const peak = backtestResult.equity
      .slice(0, index + 1)
      .reduce((max: number, p: any) => Math.max(max, p.value), currentValue);

    const drawdown = peak > 0 ? (peak - currentValue) / peak : 0;

    return {
      date: new Date(currentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      fullDate: currentDate,
      equity: currentValue,
      drawdown: -drawdown, // Negative for chart display
      dailyReturn: dailyReturn,
      benchmark: backtestResult.execution.initialCapital * (1 + 0.08 * (index / 252)) // 8% benchmark
    };
  });

  const getChartConfig = () => {
    switch (view) {
      case 'equity':
        return {
          title: 'Portfolio Equity Curve',
          dataKey: 'equity',
          color: '#2563eb',
          yAxisFormat: (value: number) =>
            new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              notation: 'compact',
              maximumFractionDigits: 0
            }).format(value),
          showBenchmark: true
        };
      case 'drawdown':
        return {
          title: 'Drawdown Analysis',
          dataKey: 'drawdown',
          color: '#dc2626',
          yAxisFormat: (value: number) =>
            new Intl.NumberFormat('en-US', {
              style: 'percent',
              minimumFractionDigits: 1,
              maximumFractionDigits: 1
            }).format(value),
          showBenchmark: false
        };
      case 'returns':
        return {
          title: 'Daily Returns',
          dataKey: 'dailyReturn',
          color: '#059669',
          yAxisFormat: (value: number) =>
            new Intl.NumberFormat('en-US', {
              style: 'percent',
              minimumFractionDigits: 1,
              maximumFractionDigits: 1
            }).format(value),
          showBenchmark: false
        };
      default:
        // Default fallback (should not happen with View type)
        return {
          title: 'Portfolio Equity Curve',
          dataKey: 'equity',
          color: '#2563eb',
          yAxisFormat: (value: number) => `$${value.toLocaleString()}`,
          showBenchmark: true
        };
    }
  };

  const config = getChartConfig();
  const totalPnL = backtestResult.execution.finalValue - backtestResult.execution.initialCapital;
  const totalReturn = totalPnL / backtestResult.execution.initialCapital;

  // Safe date parsing
  const startTime = new Date(backtestResult.period.start).getTime();
  const endTime = new Date(backtestResult.period.end).getTime();
  const durationDays = !isNaN(startTime) && !isNaN(endTime)
    ? Math.round((endTime - startTime) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {config.title}
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant={view === 'equity' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('equity')}
              className="flex items-center gap-1"
            >
              <DollarSign className="h-3 w-3" />
              Equity
            </Button>
            <Button
              variant={view === 'drawdown' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('drawdown')}
              className="flex items-center gap-1"
            >
              <BarChart3 className="h-3 w-3" />
              Drawdown
            </Button>
            <Button
              variant={view === 'returns' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('returns')}
              className="flex items-center gap-1"
            >
              <TrendingUp className="h-3 w-3" />
              Returns
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={config.yAxisFormat}
              />
              <Tooltip content={<EquityChartTooltip />} />

              {/* Zero reference line for drawdown and returns */}
              {(view === 'drawdown' || view === 'returns') && (
                <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="2 2" />
              )}

              {/* Benchmark line for equity view */}
              {config.showBenchmark && (
                <Line
                  type="monotone"
                  dataKey="benchmark"
                  stroke="#9ca3af"
                  strokeWidth={1}
                  strokeDasharray="5 5"
                  dot={false}
                  name="Benchmark (8%)"
                />
              )}

              {/* Main data line */}
              <Line
                type="monotone"
                dataKey={config.dataKey}
                stroke={config.color}
                strokeWidth={2}
                dot={false}
                name={
                  view === 'equity'
                    ? 'Equity Value'
                    : view === 'drawdown'
                      ? 'Drawdown'
                      : 'Daily Return'
                }
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Chart summary stats */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="font-medium text-muted-foreground">Start Value</div>
            <div className="text-lg font-bold">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 0
              }).format(backtestResult.execution.initialCapital)}
            </div>
          </div>
          <div className="text-center">
            <div className="font-medium text-muted-foreground">End Value</div>
            <div className="text-lg font-bold">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 0
              }).format(backtestResult.execution.finalValue)}
            </div>
          </div>
          <div className="text-center">
            <div className="font-medium text-muted-foreground">Total Return</div>
            <div className={`text-lg font-bold ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {new Intl.NumberFormat('en-US', {
                style: 'percent',
                minimumFractionDigits: 2
              }).format(totalReturn)}
            </div>
          </div>
          <div className="text-center">
            <div className="font-medium text-muted-foreground">Duration</div>
            <div className="text-lg font-bold">
              {durationDays} days
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}