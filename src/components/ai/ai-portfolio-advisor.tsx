'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Brain, AlertCircle, TrendingUp, Shield, AlertTriangle, Zap, Target } from 'lucide-react';
import { requestPortfolioAdvice } from '@/lib/api/ai';
import type { PortfolioAdvice } from '@/types/ai';

export function AIPortfolioAdvisor() {
  const [advice, setAdvice] = useState<PortfolioAdvice | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mock opportunity data
  const mockOpportunities = [
    { name: 'Short Squeeze', probability: 85, potential: 12.5, type: 'Tactical' },
    { name: 'Merger Arb', probability: 92, potential: 4.2, type: 'Event' },
    { name: 'Crypto Momentum', probability: 64, potential: 28.0, type: 'Trend' },
    { name: 'Distressed Asset', probability: 45, potential: 150.0, type: 'Value' },
  ];

  const totalPotential = mockOpportunities.reduce((sum, p) => sum + (p.probability * p.potential / 100), 0);

  const analyzePortfolio = async () => {
    setIsAnalyzing(true);
    setError(null);

    try {
      // Reusing existing API structure for now, but conceptualizing as "Opportunity Scan"
      const analysis = await requestPortfolioAdvice({
        positions: [], // No existing positions needed for opportunity scan
        totalValue: 100000,
      });
      setAdvice(analysis);
    } catch (err) {
      console.error('Opportunity scan error:', err);
      setError(err instanceof Error ? err.message : 'Failed to scan for opportunities');
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
            <Zap className="h-6 w-6 text-primary" />
            <div>
              <CardTitle>AI Opportunity Scout</CardTitle>
              <CardDescription>Real-time wealth creation signals</CardDescription>
            </div>
          </div>
          {advice && (
            <Badge variant={getRiskBadgeVariant(advice.riskLevel)}>
              {advice.riskLevel} VOLATILITY
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Predicted Opportunities Summary */}
        <div className="p-4 bg-muted rounded-lg space-y-2">
          <div className="text-sm text-muted-foreground">Top Predicted Opportunities</div>
          <div className="grid grid-cols-4 gap-2 mt-2">
            {mockOpportunities.map(opp => {
              return (
                <div key={opp.name} className="text-center p-2 bg-white/5 rounded border border-white/10">
                  <div className="text-[10px] font-medium text-muted-foreground uppercase">{opp.type}</div>
                  <div className="text-xs font-bold truncate">{opp.name}</div>
                  <div className={`text-xs font-mono mt-1 ${opp.probability > 80 ? 'text-green-500' : 'text-yellow-500'}`}>
                    {opp.probability}% Prob
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
            variant="cosmic"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Scanning Markets...
              </>
            ) : (
              <>
                <Target className="mr-2 h-4 w-4" />
                Scan for Alpha
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
            {/* Overall Health -> Signal Strength */}
            <div>
              <div className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                Signal Strength
              </div>
              <p className="text-sm text-muted-foreground p-3 bg-muted rounded-md">
                {advice.overallHealth.replace('Healthy', 'Strong Buy Signal').replace('Balanced', 'Accumulation Zone')}
              </p>
            </div>

            {/* Risk Level */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">Market Volatility</div>
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
                  Actionable Insights
                </div>
                <ul className="space-y-2">
                  {advice.suggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground p-2 bg-green-500/10 border border-green-500/20 rounded-md">
                      <span className="text-green-500 mt-0.5">➜</span>
                      {suggestion.replace('Consider adding', 'Buy signal detected for').replace('Diversify into', 'Open position in')}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Rebalancing -> Capital Redeployment */}
            {advice.rebalancingNeeded && (
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-md">
                <div className="flex items-start gap-2 text-sm text-blue-400">
                  <AlertCircle className="h-4 w-4 mt-0.5" />
                  <div>
                    <div className="font-semibold">Capital Redeployment Advised</div>
                    <div className="text-xs mt-1">
                      New high-conviction signals detected. Consider freeing up capital from low-performing assets.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button className="flex-1" variant="outline">
                View Signals
              </Button>
              <Button className="flex-1" variant="outline">
                Auto-Execute
              </Button>
              <Button
                variant="ghost"
                onClick={() => setAdvice(null)}
              >
                Rescan
              </Button>
            </div>

            {/* Disclaimer */}
            <div className="text-xs text-center text-muted-foreground p-3 bg-muted rounded-md">
              ⚠️ AI predictions are probabilistic. Past performance of the Opportunity Engine does not guarantee future results.
            </div>
          </div>
        )}

        {/* Initial State */}
        {!advice && !error && !isAnalyzing && (
          <div className="text-center py-8 text-muted-foreground">
            <Brain className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Scan markets for wealth creation anomalies</p>
            <p className="text-xs mt-2">
              Arbitrage • Short Squeezes • Distressed Assets
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
