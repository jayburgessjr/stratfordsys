'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Brain, TrendingUp, TrendingDown, Loader2, AlertCircle } from 'lucide-react';
import { requestTradingSignal } from '@/lib/api/ai';
import type { TradingSignal } from '@/types/ai';

export function AITradingAgent() {
  const [symbol, setSymbol] = useState('AAPL');
  const [signal, setSignal] = useState<TradingSignal | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeStock = async () => {
    if (!symbol) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      // In a real app, you'd fetch current market data here
      // For now, using sample data
      const currentPrice = Math.random() * 200 + 50;
      const change = (Math.random() - 0.5) * 10;
      const volume = Math.floor(Math.random() * 50000000) + 10000000;

      const analysis = await requestTradingSignal({
        symbol: symbol.toUpperCase(),
        currentPrice,
        change,
        volume,
      });

      setSignal(analysis);
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze stock');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'BUY':
        return 'default';
      case 'SELL':
        return 'destructive';
      case 'HOLD':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            <div>
              <CardTitle>AI Trading Agent</CardTitle>
              <CardDescription>Powered by GPT-4</CardDescription>
            </div>
          </div>
          {signal && (
            <Badge variant={getActionColor(signal.action)}>
              {signal.action}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Input */}
        <div className="flex gap-2">
          <Input
            placeholder="Enter stock symbol (e.g., AAPL)"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && analyzeStock()}
            disabled={isAnalyzing}
          />
          <Button
            onClick={analyzeStock}
            disabled={isAnalyzing || !symbol}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              'Analyze'
            )}
          </Button>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {/* Signal */}
        {signal && !error && (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{signal.symbol}</div>
                <div className={`text-sm font-medium ${getConfidenceColor(signal.confidence)}`}>
                  {signal.confidence}% Confidence
                </div>
              </div>
              {signal.action === 'BUY' && <TrendingUp className="h-8 w-8 text-green-600" />}
              {signal.action === 'SELL' && <TrendingDown className="h-8 w-8 text-red-600" />}
            </div>

            {/* Reasoning */}
            <div>
              <div className="text-sm font-medium mb-1">AI Analysis:</div>
              <div className="text-sm text-muted-foreground p-3 bg-muted rounded-md">
                {signal.reasoning}
              </div>
            </div>

            {/* Targets */}
            {(signal.targetPrice || signal.stopLoss) && (
              <div className="grid grid-cols-2 gap-4">
                {signal.targetPrice && (
                  <div>
                    <div className="text-xs text-muted-foreground">Target Price</div>
                    <div className="text-lg font-semibold text-green-600">
                      ${signal.targetPrice.toFixed(2)}
                    </div>
                  </div>
                )}
                {signal.stopLoss && (
                  <div>
                    <div className="text-xs text-muted-foreground">Stop Loss</div>
                    <div className="text-lg font-semibold text-red-600">
                      ${signal.stopLoss.toFixed(2)}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Timeframe */}
            {signal.timeframe && (
              <div className="text-xs text-muted-foreground">
                Timeframe: {signal.timeframe}
              </div>
            )}

            {/* Action Button */}
            <Button className="w-full" variant={signal.action === 'BUY' ? 'default' : 'outline'}>
              {signal.action === 'BUY' && 'Execute Buy Order'}
              {signal.action === 'SELL' && 'Execute Sell Order'}
              {signal.action === 'HOLD' && 'Add to Watchlist'}
            </Button>

            {/* Disclaimer */}
            <div className="text-xs text-muted-foreground text-center">
              ⚠️ AI analysis is not financial advice. Always do your own research.
            </div>
          </div>
        )}

        {/* Initial state */}
        {!signal && !error && !isAnalyzing && (
          <div className="text-center py-8 text-muted-foreground">
            <Brain className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Enter a stock symbol to get AI-powered analysis</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
