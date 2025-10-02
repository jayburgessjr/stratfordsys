'use client';

import { useRealMarketData } from '@/lib/hooks/use-real-market-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { formatCurrency, formatPercentage } from '@/lib/utils';

export function RealMarketDataWidget() {
  const { quotes, isLoading, error, refresh } = useRealMarketData({
    symbols: ['SPY', 'QQQ', 'AAPL', 'MSFT'],
    refreshInterval: 60000, // Refresh every 60 seconds
    enabled: true,
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Real Market Data</CardTitle>
            <CardDescription>
              Live prices powered by Alpha Vantage API
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">
            {error}
          </div>
        )}

        {isLoading && Object.keys(quotes).length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading market data...
          </div>
        ) : (
          <div className="space-y-3">
            {Object.entries(quotes).map(([symbol, quote]) => (
              <div
                key={symbol}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div>
                  <div className="font-semibold">{quote.symbol}</div>
                  <div className="text-sm text-muted-foreground">
                    {formatCurrency(quote.price)}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`flex items-center gap-1 ${quote.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {quote.change >= 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    <span className="font-medium">
                      {formatPercentage(quote.changePercent)}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {quote.change >= 0 ? '+' : ''}{formatCurrency(quote.change)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
