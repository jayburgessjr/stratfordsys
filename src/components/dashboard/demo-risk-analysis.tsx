'use client';

import { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, TrendingDown, BarChart3, AlertTriangle } from 'lucide-react';

type RiskView = 'drawdown' | 'volatility' | 'distribution';

// Generate demo drawdown data
const generateDrawdownData = () => {
  const data: Array<{
    date: string;
    'Drawdown %': number;
    'Equity Value': number;
    'Peak Value': number;
  }> = [];
  let peak = 100000;
  let equity = 100000;

  for (let i = 0; i < 365; i++) {
    const date = new Date(2023, 0, i + 1);
    const dailyReturn = (Math.random() - 0.48) * 0.02;
    equity *= (1 + dailyReturn);

    if (equity > peak) peak = equity;
    const drawdown = (peak - equity) / peak;

    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      'Drawdown %': drawdown,
      'Equity Value': equity,
      'Peak Value': peak
    });
  }

  return data;
};

// Generate demo volatility data
const generateVolatilityData = () => {
  const data: Array<{
    date: string;
    'Rolling Volatility': number;
    'Daily Return': number;
  }> = [];
  for (let i = 30; i < 365; i++) {
    const date = new Date(2023, 0, i + 1);
    const volatility = 0.12 + Math.sin(i / 30) * 0.05 + (Math.random() - 0.5) * 0.03;
    const dailyReturn = (Math.random() - 0.5) * 0.04;

    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      'Rolling Volatility': Math.max(0.05, volatility),
      'Daily Return': dailyReturn
    });
  }

  return data;
};

// Generate return distribution data
const generateDistributionData = () => {
  const bins: Array<{
    bin: string;
    count: number;
    binValue: number;
  }> = [];
  const returns = Array.from({ length: 1000 }, () => (Math.random() - 0.48) * 0.04);

  for (let i = -4; i <= 4; i += 0.5) {
    const binStart = i / 100;
    const binEnd = (i + 0.5) / 100;
    const count = returns.filter(ret => ret >= binStart && ret < binEnd).length;

    bins.push({
      bin: `${(i + 0.25).toFixed(1)}%`,
      count,
      binValue: (i + 0.25) / 100
    });
  }

  return bins;
};

const demoDrawdownData = generateDrawdownData();
const demoVolatilityData = generateVolatilityData();
const demoDistributionData = generateDistributionData();

export function DemoRiskAnalysis() {
  const [view, setView] = useState<RiskView>('drawdown');

  const renderChart = () => {
    switch (view) {
      case 'drawdown':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={demoDrawdownData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} interval="preserveStartEnd" />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `${(value * 100).toFixed(1)}%`}
              />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="Drawdown %"
                stroke="#dc2626"
                fill="#dc2626"
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'volatility':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={demoVolatilityData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} interval="preserveStartEnd" />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `${(value * 100).toFixed(1)}%`}
              />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="Rolling Volatility"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'distribution':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={demoDistributionData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey="bin"
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar
                dataKey="count"
                name="Frequency"
                fill="#22c55e"
              />
            </BarChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  const getViewTitle = () => {
    switch (view) {
      case 'drawdown': return 'Drawdown Analysis';
      case 'volatility': return 'Volatility Tracking';
      case 'distribution': return 'Return Distribution';
      default: return 'Risk Analysis';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {getViewTitle()}
          </CardTitle>
          <div className="flex gap-1">
            <Button
              variant={view === 'drawdown' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('drawdown')}
            >
              <TrendingDown className="h-3 w-3" />
            </Button>
            <Button
              variant={view === 'volatility' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('volatility')}
            >
              <BarChart3 className="h-3 w-3" />
            </Button>
            <Button
              variant={view === 'distribution' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('distribution')}
            >
              <AlertTriangle className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          {renderChart()}
        </div>

        {/* Risk Summary */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="font-medium text-muted-foreground">Max Drawdown</div>
            <div className="text-lg font-bold text-red-600">8.7%</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-muted-foreground">VaR (95%)</div>
            <div className="text-lg font-bold">3.2%</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-muted-foreground">Sortino Ratio</div>
            <div className="text-lg font-bold text-green-600">1.65</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-muted-foreground">Volatility</div>
            <div className="text-lg font-bold">15.3%</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}