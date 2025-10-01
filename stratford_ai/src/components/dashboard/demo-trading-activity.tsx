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
  Cell
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, PieChart as PieChartIcon, BarChart3 } from 'lucide-react';

type TradingView = 'overview' | 'performance';

const COLORS = ['#22c55e', '#ef4444', '#f59e0b', '#3b82f6'];

const demoOverviewData = [
  { name: 'Winning Trades', value: 34, percentage: 64.2 },
  { name: 'Losing Trades', value: 19, percentage: 35.8 }
];

const demoPerformanceData = [
  { month: 'Jan', 'Monthly P&L': 2150, 'Trade Count': 8 },
  { month: 'Feb', 'Monthly P&L': 3200, 'Trade Count': 12 },
  { month: 'Mar', 'Monthly P&L': -890, 'Trade Count': 6 },
  { month: 'Apr', 'Monthly P&L': 4100, 'Trade Count': 15 },
  { month: 'May', 'Monthly P&L': 1850, 'Trade Count': 9 },
  { month: 'Jun', 'Monthly P&L': 2950, 'Trade Count': 11 }
];

export function DemoTradingActivity() {
  const [view, setView] = useState<TradingView>('overview');

  const renderChart = () => {
    switch (view) {
      case 'overview':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={demoOverviewData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {demoOverviewData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'performance':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={demoPerformanceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="Monthly P&L" fill="#3b82f6" name="Monthly P&L ($)" />
            </BarChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  const getViewTitle = () => {
    switch (view) {
      case 'overview': return 'Win/Loss Overview';
      case 'performance': return 'Monthly Performance';
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
              variant={view === 'performance' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('performance')}
            >
              <BarChart3 className="h-3 w-3" />
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
            <div className="text-lg font-bold">53</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-muted-foreground">Win Rate</div>
            <div className="text-lg font-bold text-green-600">64.2%</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-muted-foreground">Avg. Win</div>
            <div className="text-lg font-bold text-green-600">$1,245</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-muted-foreground">Avg. Loss</div>
            <div className="text-lg font-bold text-red-600">$582</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}