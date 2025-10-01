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
    const data = payload[0]?.payload;

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
  const chartData = backtestResult.equityCurve.map((value: number, index: number) => {
    const date = backtestResult.equity[index]?.date || `Day ${index + 1}`;
    const dailyReturn = index > 0
      ? (value - backtestResult.equityCurve[index - 1]) / backtestResult.equityCurve[index - 1]
      : 0;

    // Calculate running drawdown
    const peak = backtestResult.equityCurve.slice(0, index + 1).reduce((max: number, val: number) => Math.max(max, val), value);
    const drawdown = peak > 0 ? (peak - value) / peak : 0;

    return {
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      fullDate: date,
      equity: value,
      drawdown: -drawdown, // Negative for chart display
      dailyReturn: dailyReturn,
      benchmark: backtestResult.initialCapital * (1 + 0.08 * (index / 252)) // 8% benchmark
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
              }).format(backtestResult.initialCapital)}
            </div>
          </div>
          <div className="text-center">
            <div className="font-medium text-muted-foreground">End Value</div>
            <div className="text-lg font-bold">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 0
              }).format(backtestResult.finalValue)}
            </div>
          </div>
          <div className="text-center">
            <div className="font-medium text-muted-foreground">Total Return</div>
            <div className={`text-lg font-bold ${backtestResult.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {new Intl.NumberFormat('en-US', {
                style: 'percent',
                minimumFractionDigits: 2
              }).format(backtestResult.totalPnL / backtestResult.initialCapital)}
            </div>
          </div>
          <div className="text-center">
            <div className="font-medium text-muted-foreground">Duration</div>
            <div className="text-lg font-bold">
              {Math.round((new Date(backtestResult.endDate).getTime() - new Date(backtestResult.startDate).getTime()) / (1000 * 60 * 60 * 24))} days
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}