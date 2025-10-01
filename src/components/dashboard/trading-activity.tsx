'use client';

import { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, PieChart as PieChartIcon, BarChart3, TrendingUp } from 'lucide-react';
import { useDemoBacktest } from '@/hooks/use-demo-backtest';

type TradingView = 'overview' | 'distribution' | 'performance' | 'timeline';

const COLORS = ['#22c55e', '#ef4444', '#f59e0b', '#3b82f6'];

interface TradingTooltipProps {
  active?: boolean;
  payload?: Array<{
    color: string;
    name: string;
    value: number;
    payload: any;
  }>;
  label?: string;
}

function TradingTooltip({ active, payload, label }: TradingTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-3 shadow-md">
        <p className="font-medium mb-2">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {
              entry.name.includes('$') || entry.name.includes('P&L')
                ? new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    minimumFractionDigits: 0
                  }).format(entry.value)
                : entry.name.includes('%')
                ? new Intl.NumberFormat('en-US', {
                    style: 'percent',
                    minimumFractionDigits: 1
                  }).format(entry.value / 100)
                : entry.value.toLocaleString()
            }
          </p>
        ))}
      </div>
    );
  }
  return null;
}

export function TradingActivity() {
  const [view, setView] = useState<TradingView>('overview');
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
          <CardTitle>Trading Activity</CardTitle>
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
  const trades = backtestResult.trades;
  const positions = backtestResult.positions.filter(p => p.status === 'CLOSED');

  // Prepare different chart data based on view
  const getChartData = () => {
    switch (view) {
      case 'overview':
        return [
          {
            name: 'Winning Trades',
            value: analysis.trading.winningTrades,
            percentage: (analysis.trading.winningTrades / analysis.trading.totalTrades) * 100
          },
          {
            name: 'Losing Trades',
            value: analysis.trading.losingTrades,
            percentage: (analysis.trading.losingTrades / analysis.trading.totalTrades) * 100
          }
        ];

      case 'distribution':
        // Group trades by P&L ranges
        const pnlRanges = [
          { name: 'Large Loss (<-5%)', count: 0, color: '#dc2626' },
          { name: 'Small Loss (-5% to 0%)', count: 0, color: '#f87171' },
          { name: 'Small Gain (0% to 5%)', count: 0, color: '#34d399' },
          { name: 'Large Gain (>5%)', count: 0, color: '#10b981' }
        ];

        positions.forEach(position => {
          if (position.realizedPnL && position.entryPrice && position.quantity) {
            const returnPct = position.realizedPnL / (position.entryPrice * position.quantity);
            if (returnPct < -0.05) pnlRanges[0].count++;
            else if (returnPct < 0) pnlRanges[1].count++;
            else if (returnPct < 0.05) pnlRanges[2].count++;
            else pnlRanges[3].count++;
          }
        });

        return pnlRanges;

      case 'performance':
        // Monthly performance data
        const monthlyData = positions.reduce((acc, position) => {
          if (position.entryDate && position.realizedPnL) {
            const date = new Date(position.entryDate);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

            if (!acc[monthKey]) {
              acc[monthKey] = { month: monthKey, totalPnL: 0, trades: 0 };
            }

            acc[monthKey].totalPnL += position.realizedPnL;
            acc[monthKey].trades += 1;
          }
          return acc;
        }, {} as Record<string, { month: string; totalPnL: number; trades: number }>);

        return Object.values(monthlyData).map(data => ({
          month: new Date(data.month + '-01').toLocaleDateString('en-US', {
            month: 'short',
            year: 'numeric'
          }),
          'Monthly P&L': data.totalPnL,
          'Trade Count': data.trades
        }));

      case 'timeline':
        // Scatter plot of trades over time
        return positions.map((position, index) => {
          const returnPct = position.realizedPnL && position.entryPrice && position.quantity
            ? (position.realizedPnL / (position.entryPrice * position.quantity)) * 100
            : 0;

          return {
            x: index + 1,
            y: returnPct,
            date: position.entryDate,
            pnl: position.realizedPnL || 0,
            isWin: returnPct > 0
          };
        });

      default:
        return [];
    }
  };

  const chartData = getChartData();

  const renderChart = () => {
    switch (view) {
      case 'overview':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<TradingTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'distribution':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<TradingTooltip />} />
              <Bar dataKey="count" name="Trade Count">
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );

      case 'performance':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<TradingTooltip />} />
              <Bar
                dataKey="Monthly P&L"
                fill="#3b82f6"
                name="Monthly P&L ($)"
              />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'timeline':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey="x"
                name="Trade #"
                tick={{ fontSize: 12 }}
                label={{ value: 'Trade Number', position: 'insideBottom', offset: -10 }}
              />
              <YAxis
                dataKey="y"
                name="Return %"
                tick={{ fontSize: 12 }}
                label={{ value: 'Return %', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="rounded-lg border bg-background p-3 shadow-md">
                        <p className="font-medium">Trade #{data.x}</p>
                        <p className="text-sm">Return: {data.y.toFixed(2)}%</p>
                        <p className="text-sm">P&L: ${data.pnl.toLocaleString()}</p>
                        <p className="text-sm">Date: {data.date}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Scatter
                dataKey="y"
                fill={(data: any) => data.isWin ? '#22c55e' : '#ef4444'}
              />
            </ScatterChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  const getViewTitle = () => {
    switch (view) {
      case 'overview': return 'Win/Loss Overview';
      case 'distribution': return 'P&L Distribution';
      case 'performance': return 'Monthly Performance';
      case 'timeline': return 'Trade Timeline';
      default: return 'Trading Activity';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            {getViewTitle()}
          </CardTitle>
          <div className="flex gap-1">
            <Button
              variant={view === 'overview' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('overview')}
            >
              <PieChartIcon className="h-3 w-3" />
            </Button>
            <Button
              variant={view === 'distribution' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('distribution')}
            >
              <BarChart3 className="h-3 w-3" />
            </Button>
            <Button
              variant={view === 'performance' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('performance')}
            >
              <TrendingUp className="h-3 w-3" />
            </Button>
            <Button
              variant={view === 'timeline' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('timeline')}
            >
              <Activity className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          {renderChart()}
        </div>

        {/* Summary Statistics */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="font-medium text-muted-foreground">Total Trades</div>
            <div className="text-lg font-bold">{analysis.trading.totalTrades}</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-muted-foreground">Win Rate</div>
            <div className="text-lg font-bold text-green-600">
              {new Intl.NumberFormat('en-US', {
                style: 'percent',
                minimumFractionDigits: 1
              }).format(analysis.trading.hitRate)}
            </div>
          </div>
          <div className="text-center">
            <div className="font-medium text-muted-foreground">Avg. Win</div>
            <div className="text-lg font-bold text-green-600">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 0
              }).format(analysis.trading.averageWinningTrade)}
            </div>
          </div>
          <div className="text-center">
            <div className="font-medium text-muted-foreground">Avg. Loss</div>
            <div className="text-lg font-bold text-red-600">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 0
              }).format(Math.abs(analysis.trading.averageLosingTrade))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}