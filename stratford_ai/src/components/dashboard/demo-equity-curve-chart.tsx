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

type ChartView = 'equity' | 'drawdown' | 'returns';

// Generate demo data
const generateDemoData = () => {
  const data: Array<{
    date: string;
    equity: number;
    drawdown: number;
    dailyReturn: number;
    benchmark: number;
  }> = [];
  let equity = 100000;
  let peak = 100000;

  for (let i = 0; i < 365; i++) {
    const date = new Date(2023, 0, i + 1);
    const dailyReturn = (Math.random() - 0.48) * 0.02; // Slightly positive bias
    equity *= (1 + dailyReturn);

    if (equity > peak) peak = equity;
    const drawdown = (peak - equity) / peak;

    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      equity: Math.round(equity),
      drawdown: -drawdown,
      dailyReturn: dailyReturn,
      benchmark: 100000 * (1 + 0.08 * (i / 365))
    });
  }

  return data;
};

const demoData = generateDemoData();

export function DemoEquityCurveChart() {
  const [view, setView] = useState<ChartView>('equity');

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
            <LineChart data={demoData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
              <Tooltip />

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
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Chart summary stats */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="font-medium text-muted-foreground">Start Value</div>
            <div className="text-lg font-bold">$100,000</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-muted-foreground">End Value</div>
            <div className="text-lg font-bold">
              ${Math.round(demoData[demoData.length - 1]?.equity ?? 100000).toLocaleString()}
            </div>
          </div>
          <div className="text-center">
            <div className="font-medium text-muted-foreground">Total Return</div>
            <div className="text-lg font-bold text-green-600">
              {(((demoData[demoData.length - 1]?.equity ?? 100000) - 100000) / 100000 * 100).toFixed(2)}%
            </div>
          </div>
          <div className="text-center">
            <div className="font-medium text-muted-foreground">Duration</div>
            <div className="text-lg font-bold">365 days</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}