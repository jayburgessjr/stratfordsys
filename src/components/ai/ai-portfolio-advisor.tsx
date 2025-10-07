'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Brain, AlertCircle, TrendingUp, Shield, AlertTriangle } from 'lucide-react';
import { requestPortfolioAdvice } from '@/lib/api/ai';
import type { PortfolioAdvice } from '@/types/ai';

export function AIPortfolioAdvisor() {
  const [advice, setAdvice] = useState<PortfolioAdvice | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mock portfolio data
  const mockPortfolio = [
    { symbol: 'AAPL', shares: 10, avgCost: 150, currentPrice: 175 },
    { symbol: 'TSLA', shares: 5, avgCost: 200, currentPrice: 245 },
    { symbol: 'MSFT', shares: 8, avgCost: 300, currentPrice: 368 },
    { symbol: 'NVDA', shares: 3, avgCost: 400, currentPrice: 446 },
    { symbol: 'SPY', shares: 15, avgCost: 420, currentPrice: 445 },
  ];

  const totalValue = mockPortfolio.reduce((sum, p) => sum + (p.shares * p.currentPrice), 0);

  const analyzePortfolio = async () => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const analysis = await requestPortfolioAdvice({
        positions: mockPortfolio,
        totalValue,
      });
      setAdvice(analysis);
    } catch (err) {
      console.error('Portfolio analysis error:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze portfolio');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getRiskBadgeVariant = (risk: string) => {
    switch (risk) {
      case 'LOW':
        return 'default';
      case 'MEDIUM':
        return 'secondary';
      case 'HIGH':
        return 'destructive';
      case 'VERY_HIGH':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'LOW':
        return 'text-green-600';
      case 'MEDIUM':
        return 'text-yellow-600';
      case 'HIGH':
        return 'text-orange-600';
      case 'VERY_HIGH':
        return 'text-red-600';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            <div>
              <CardTitle>AI Portfolio Advisor</CardTitle>
              <CardDescription>Get personalized portfolio recommendations</CardDescription>
            </div>
          </div>
          {advice && (
            <Badge variant={getRiskBadgeVariant(advice.riskLevel)}>
              {advice.riskLevel} RISK
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Portfolio Summary */}
        <div className="p-4 bg-muted rounded-lg space-y-2">
          <div className="text-sm text-muted-foreground">Your Portfolio</div>
          <div className="text-2xl font-bold">${totalValue.toLocaleString()}</div>
          <div className="grid grid-cols-5 gap-2 mt-2">
            {mockPortfolio.map(pos => {
              const pnl = ((pos.currentPrice - pos.avgCost) / pos.avgCost * 100).toFixed(1);
              return (
                <div key={pos.symbol} className="text-center">
                  <div className="text-xs font-medium">{pos.symbol}</div>
                  <div className={`text-xs ${parseFloat(pnl) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {pnl}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Analyze Button */}
        {!advice && (
          <Button
            onClick={analyzePortfolio}
            disabled={isAnalyzing}
            className="w-full"
            size="lg"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing Portfolio...
              </>
            ) : (
              <>
                <Brain className="mr-2 h-4 w-4" />
                Get AI Analysis
              </>
            )}
          </Button>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {/* Advice Display */}
        {advice && (
          <div className="space-y-4">
            {/* Overall Health */}
            <div>
              <div className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Overall Health
              </div>
              <p className="text-sm text-muted-foreground p-3 bg-muted rounded-md">
                {advice.overallHealth}
              </p>
            </div>

            {/* Risk Level */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">Risk Assessment</div>
                  <div className={`text-2xl font-bold ${getRiskColor(advice.riskLevel)}`}>
                    {advice.riskLevel}
                  </div>
                </div>
                {advice.riskLevel === 'HIGH' || advice.riskLevel === 'VERY_HIGH' ? (
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                ) : advice.riskLevel === 'MEDIUM' ? (
                  <AlertCircle className="h-8 w-8 text-yellow-500" />
                ) : (
                  <Shield className="h-8 w-8 text-green-500" />
                )}
              </div>
            </div>

            {/* Suggestions */}
            {advice.suggestions.length > 0 && (
              <div>
                <div className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  Recommendations
                </div>
                <ul className="space-y-2">
                  {advice.suggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground p-2 bg-green-50 rounded-md">
                      <span className="text-green-600 mt-0.5">✓</span>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Warnings */}
            {advice.warnings.length > 0 && (
              <div>
                <div className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  Warnings
                </div>
                <ul className="space-y-2">
                  {advice.warnings.map((warning, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground p-2 bg-red-50 rounded-md">
                      <span className="text-red-600 mt-0.5">⚠</span>
                      {warning}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Rebalancing */}
            {advice.rebalancingNeeded && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="flex items-start gap-2 text-sm text-yellow-800">
                  <AlertCircle className="h-4 w-4 mt-0.5" />
                  <div>
                    <div className="font-semibold">Rebalancing Recommended</div>
                    <div className="text-xs mt-1">
                      Your portfolio allocation has drifted from optimal targets.
                      Consider rebalancing to maintain your risk profile.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button className="flex-1" variant="outline">
                View Detailed Report
              </Button>
              <Button className="flex-1" variant="outline">
                Start Rebalancing
              </Button>
              <Button
                variant="ghost"
                onClick={() => setAdvice(null)}
              >
                Analyze Again
              </Button>
            </div>

            {/* Disclaimer */}
            <div className="text-xs text-center text-muted-foreground p-3 bg-muted rounded-md">
              ⚠️ AI analysis is for informational purposes only and should not be considered
              as financial advice. Consult with a qualified financial advisor before making
              investment decisions.
            </div>
          </div>
        )}

        {/* Initial State */}
        {!advice && !error && !isAnalyzing && (
          <div className="text-center py-8 text-muted-foreground">
            <Brain className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Get AI-powered insights about your portfolio</p>
            <p className="text-xs mt-2">
              Diversification • Risk Assessment • Rebalancing Suggestions
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
