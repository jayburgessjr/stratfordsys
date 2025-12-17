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
  Bar,
  RadialBarChart,
  RadialBar,
  Legend,
  ReferenceLine
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, AlertTriangle, TrendingDown, BarChart3 } from 'lucide-react';
import { useDemoBacktest } from '@/hooks/use-demo-backtest';

type RiskView = 'drawdown' | 'volatility' | 'metrics' | 'distribution';

interface RiskTooltipProps {
  active?: boolean;
  payload?: Array<{
    color: string;
    name: string;
    value: number;
    payload: any;
  }>;
  label?: string;
}

function RiskTooltip({ active, payload, label }: RiskTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-3 shadow-md">
        <p className="font-medium mb-2">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {
              entry.name.includes('%') || entry.name.includes('Drawdown') || entry.name.includes('Return')
                ? new Intl.NumberFormat('en-US', {
                  style: 'percent',
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                }).format(entry.value)
                : entry.value.toFixed(3)
            }
          </p>
        ))}
      </div>
    );
  }
  return null;
}

export function RiskAnalysis() {
  const [view, setView] = useState<RiskView>('drawdown');
  const { backtestResult, isLoading, error } = useDemoBacktest();

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-muted rounded w-1/3"></div>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-muted rounded"></div>
        </CardContent>
      </Card>
    );
  }

  if (error || !backtestResult) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Risk Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            {error || 'No data available'}
          </div>
        </CardContent>
      </Card>
    );
  }

  const analysis = backtestResult.performance;

  // Prepare chart data based on view
  const getChartData = () => {
    switch (view) {
      case 'drawdown':
        // Drawdown over time
        return backtestResult.equity.map((point: any, index: number) => {
          const currentValue = point.value;
          const peak = backtestResult.equity
            .slice(0, index + 1)
            .reduce((max: number, p: any) => Math.max(max, p.value), currentValue);

          const drawdown = peak > 0 ? (peak - currentValue) / peak : 0;
          const date = point.date || `Day ${index + 1}`;

          return {
            date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            'Drawdown %': drawdown,
            'Equity Value': currentValue,
            'Peak Value': peak
          };
        });

      case 'volatility':
        // Rolling volatility calculation (simplified)
        // returns array of daily returns
        const dailyReturns = backtestResult.equity.map((point: any, index: number) => {
          if (index === 0) return 0;
          const currentVal = point.value;
          const prevVal = backtestResult.equity[index - 1].value;
          return (currentVal - prevVal) / prevVal;
        });

        const windowSize = 30; // 30-day rolling window
        return dailyReturns.map((_, index) => {
          if (index < windowSize) return null;

          const windowReturns = dailyReturns.slice(index - windowSize, index);
          const mean = windowReturns.reduce((sum, ret) => sum + ret, 0) / windowReturns.length;
          const variance = windowReturns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / windowReturns.length;
          const volatility = Math.sqrt(variance * 252); // Annualized

          const date = backtestResult.equity[index]?.date || `Day ${index + 1}`;

          return {
            date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            'Rolling Volatility': volatility,
            'Daily Return': dailyReturns[index]
          };
        }).filter(Boolean);

      case 'metrics':
        // Risk metrics comparison
        return [
          {
            metric: 'Value at Risk (95%)',
            value: analysis.risk.valueAtRisk,
            benchmark: 0.05,
            status: analysis.risk.valueAtRisk <= 0.05 ? 'good' : 'warning'
          },
          {
            metric: 'Conditional VaR',
            value: analysis.risk.conditionalVaR,
            benchmark: 0.08,
            status: analysis.risk.conditionalVaR <= 0.08 ? 'good' : 'warning'
          },
          {
            metric: 'Sortino Ratio',
            value: analysis.risk.sortinoRatio,
            benchmark: 1.0,
            status: analysis.risk.sortinoRatio >= 1.0 ? 'good' : 'warning'
          },
          {
            metric: 'Calmar Ratio',
            value: analysis.risk.calmarRatio,
            benchmark: 1.0,
            status: analysis.risk.calmarRatio >= 1.0 ? 'good' : 'warning'
          }
        ];

      case 'distribution':
        // Return distribution histogram
        const returnsForDist = backtestResult.equity.map((point: any, index: number) => {
          if (index === 0) return 0;
          const currentVal = point.value;
          const prevVal = backtestResult.equity[index - 1].value;
          return (currentVal - prevVal) / prevVal;
        }).filter(ret => ret !== 0);

        // Create histogram bins
        const minReturn = Math.min(...returnsForDist);
        const maxReturn = Math.max(...returnsForDist);
        const binCount = 20;
        // Avoid division by zero if flat
        const spread = maxReturn - minReturn;
        const binSize = spread > 0 ? spread / binCount : 0.01;

        const histogram = Array.from({ length: binCount }, (_, i) => {
          const binStart = minReturn + i * binSize;
          const binEnd = binStart + binSize;
          const binCenter = (binStart + binEnd) / 2;

          const count = returnsForDist.filter(ret => ret >= binStart && ret < binEnd).length;

          return {
            bin: `${(binCenter * 100).toFixed(1)}%`,
            count,
            binValue: binCenter
          };
        });

        return histogram;

      default:
        return [];
    }
  };

  const chartData = getChartData();

  const renderChart = () => {
    switch (view) {
      case 'drawdown':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={(value) =>
                  new Intl.NumberFormat('en-US', {
                    style: 'percent',
                    minimumFractionDigits: 1
                  }).format(value)
                }
              />
              <Tooltip content={<RiskTooltip />} />
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
            <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={(value) =>
                  new Intl.NumberFormat('en-US', {
                    style: 'percent',
                    minimumFractionDigits: 1
                  }).format(value)
                }
              />
              <Tooltip content={<RiskTooltip />} />
              <ReferenceLine y={0.2} stroke="#f59e0b" strokeDasharray="3 3" label="High Vol" />
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

      case 'metrics':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              innerRadius="30%"
              outerRadius="80%"
              data={chartData.map((item: any) => ({
                ...item,
                fill: item.status === 'good' ? '#22c55e' : '#f59e0b'
              }))}
              startAngle={90}
              endAngle={-270}
            >
              <RadialBar dataKey="value" cornerRadius={10} background />
              <Legend
                iconSize={10}
                layout="vertical"
                verticalAlign="bottom"
                align="center"
                content={({ payload }) => (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {payload?.map((entry, index) => (
                      <div key={index} className="flex items-center gap-1">
                        <div
                          className="w-2 h-2 rounded"
                          style={{ backgroundColor: entry.color }}
                        />
                        <span>{(entry.payload as any)?.metric}</span>
                      </div>
                    ))}
                  </div>
                )}
              />
            </RadialBarChart>
          </ResponsiveContainer>
        );

      case 'distribution':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey="bin"
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<RiskTooltip />} />
              <ReferenceLine x="0.0%" stroke="#6b7280" strokeDasharray="2 2" />
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
      case 'metrics': return 'Risk Metrics';
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
              variant={view === 'metrics' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('metrics')}
            >
              <Shield className="h-3 w-3" />
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
            <div className="text-lg font-bold text-red-600">
              {new Intl.NumberFormat('en-US', {
                style: 'percent',
                minimumFractionDigits: 2
              }).format(analysis.drawdown.maxDrawdown)}
            </div>
          </div>
          <div className="text-center">
            <div className="font-medium text-muted-foreground">VaR (95%)</div>
            <div className="text-lg font-bold">
              {new Intl.NumberFormat('en-US', {
                style: 'percent',
                minimumFractionDigits: 2
              }).format(analysis.risk.valueAtRisk)}
            </div>
          </div>
          <div className="text-center">
            <div className="font-medium text-muted-foreground">Sortino Ratio</div>
            <div className={`text-lg font-bold ${analysis.risk.sortinoRatio >= 1 ? 'text-green-600' : 'text-red-600'}`}>
              {analysis.risk.sortinoRatio.toFixed(2)}
            </div>
          </div>
          <div className="text-center">
            <div className="font-medium text-muted-foreground">Volatility</div>
            <div className="text-lg font-bold">
              {new Intl.NumberFormat('en-US', {
                style: 'percent',
                minimumFractionDigits: 1
              }).format(analysis.returns.volatility)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}