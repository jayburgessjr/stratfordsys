'use client';

import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Database, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

export default function PortfolioPage() {
  const holdings = [
    { symbol: 'AAPL', name: 'Apple Inc.', shares: 150, value: 28350, change: 2.3, allocation: 35.4 },
    { symbol: 'TSLA', name: 'Tesla Inc.', shares: 75, value: 18750, change: -1.2, allocation: 23.4 },
    { symbol: 'MSFT', name: 'Microsoft Corp.', shares: 100, value: 15800, change: 1.8, allocation: 19.7 },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', shares: 45, value: 12600, change: 0.9, allocation: 15.7 },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', shares: 30, value: 4800, change: -0.5, allocation: 5.8 },
  ];

  const totalValue = holdings.reduce((sum, holding) => sum + holding.value, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Portfolio</h1>
            <p className="text-muted-foreground">
              Asset management and portfolio overview
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalValue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                +5.2% from last week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Holdings</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{holdings.length}</div>
              <p className="text-xs text-muted-foreground">
                Across different sectors
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Day Change</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">+$1,248</div>
              <p className="text-xs text-muted-foreground">
                +1.6% today
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Diversification</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">85%</div>
              <p className="text-xs text-muted-foreground">
                Well diversified
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Holdings</CardTitle>
              <CardDescription>
                Current stock positions and allocations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {holdings.map((holding) => (
                  <div key={holding.symbol} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div>
                          <div className="font-medium">{holding.symbol}</div>
                          <div className="text-sm text-muted-foreground">{holding.shares} shares</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">${holding.value.toLocaleString()}</div>
                        <div className={`text-sm flex items-center ${
                          holding.change >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {holding.change >= 0 ? (
                            <TrendingUp className="h-3 w-3 mr-1" />
                          ) : (
                            <TrendingDown className="h-3 w-3 mr-1" />
                          )}
                          {Math.abs(holding.change)}%
                        </div>
                      </div>
                    </div>
                    <Progress value={holding.allocation} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Asset Allocation</CardTitle>
              <CardDescription>
                Portfolio distribution by sector and asset type
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Technology</span>
                    <span className="text-sm">58%</span>
                  </div>
                  <Progress value={58} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Consumer Discretionary</span>
                    <span className="text-sm">29%</span>
                  </div>
                  <Progress value={29} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Communication</span>
                    <span className="text-sm">13%</span>
                  </div>
                  <Progress value={13} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Performance History</CardTitle>
            <CardDescription>
              Portfolio performance over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">+12.4%</div>
                <div className="text-sm text-muted-foreground">1 Month</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">+28.7%</div>
                <div className="text-sm text-muted-foreground">3 Months</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">+45.2%</div>
                <div className="text-sm text-muted-foreground">1 Year</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}