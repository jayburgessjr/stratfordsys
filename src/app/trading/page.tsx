'use client';

import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, DollarSign, Activity, AlertTriangle } from 'lucide-react';

export default function TradingPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Live Trading</h1>
            <p className="text-muted-foreground">
              Real-time trading operations and market execution
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Trades</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">
                +1 from last hour
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">P&L Today</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">+$2,341</div>
              <p className="text-xs text-muted-foreground">
                +12.5% from yesterday
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">78.4%</div>
              <p className="text-xs text-muted-foreground">
                +2.1% from last week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Risk Level</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">Medium</div>
              <p className="text-xs text-muted-foreground">
                Within acceptable limits
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Trading Status</CardTitle>
              <CardDescription>
                Current trading operations and strategy execution
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Auto Trading</span>
                  <span className="text-sm text-green-600 font-semibold">ACTIVE</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Strategy</span>
                  <span className="text-sm">Moving Average Crossover</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Max Position Size</span>
                  <span className="text-sm">$10,000</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Stop Loss</span>
                  <span className="text-sm">2%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Trades</CardTitle>
              <CardDescription>
                Latest trading activity and executions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2">
                  <div>
                    <div className="text-sm font-medium">AAPL</div>
                    <div className="text-xs text-muted-foreground">Buy • 10 shares</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-green-600">+$142.50</div>
                    <div className="text-xs text-muted-foreground">2 min ago</div>
                  </div>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div>
                    <div className="text-sm font-medium">TSLA</div>
                    <div className="text-xs text-muted-foreground">Sell • 5 shares</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-green-600">+$89.32</div>
                    <div className="text-xs text-muted-foreground">15 min ago</div>
                  </div>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div>
                    <div className="text-sm font-medium">MSFT</div>
                    <div className="text-xs text-muted-foreground">Buy • 8 shares</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-red-600">-$23.15</div>
                    <div className="text-xs text-muted-foreground">1 hour ago</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}