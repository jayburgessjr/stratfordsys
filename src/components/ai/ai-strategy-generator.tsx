'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { getOpenAIService, StrategyRecommendation } from '@/lib/services/openai-service';

export function AIStrategyGenerator() {
  const [goals, setGoals] = useState('');
  const [riskTolerance, setRiskTolerance] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [capital, setCapital] = useState('10000');
  const [preferredAssets, setPreferredAssets] = useState('SPY, QQQ, AAPL');
  const [strategy, setStrategy] = useState<StrategyRecommendation | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateStrategy = async () => {
    if (!goals.trim()) {
      setError('Please describe your trading goals');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const service = getOpenAIService();
      const assets = preferredAssets.split(',').map(s => s.trim()).filter(Boolean);
      const capitalNum = parseFloat(capital) || 10000;

      const recommendation = await service.generateStrategy(
        goals,
        riskTolerance,
        capitalNum,
        assets
      );

      setStrategy(recommendation);
    } catch (err) {
      console.error('Strategy generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate strategy');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <div>
            <CardTitle>AI Strategy Generator</CardTitle>
            <CardDescription>Create custom trading strategies with AI</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Input Form */}
        {!strategy && (
          <div className="space-y-4">
            {/* Goals */}
            <div className="space-y-2">
              <Label htmlFor="goals">Your Trading Goals</Label>
              <Textarea
                id="goals"
                placeholder="e.g., Generate consistent monthly income with moderate risk, focus on tech stocks..."
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                rows={3}
                disabled={isGenerating}
              />
            </div>

            {/* Risk Tolerance */}
            <div className="space-y-2">
              <Label htmlFor="risk">Risk Tolerance</Label>
              <Select
                value={riskTolerance}
                onValueChange={(value) => setRiskTolerance(value as any)}
                disabled={isGenerating}
              >
                <SelectTrigger id="risk">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low - Conservative</SelectItem>
                  <SelectItem value="MEDIUM">Medium - Balanced</SelectItem>
                  <SelectItem value="HIGH">High - Aggressive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Capital */}
            <div className="space-y-2">
              <Label htmlFor="capital">Trading Capital ($)</Label>
              <Input
                id="capital"
                type="number"
                value={capital}
                onChange={(e) => setCapital(e.target.value)}
                disabled={isGenerating}
              />
            </div>

            {/* Preferred Assets */}
            <div className="space-y-2">
              <Label htmlFor="assets">Preferred Assets (comma-separated)</Label>
              <Input
                id="assets"
                placeholder="SPY, QQQ, AAPL, MSFT"
                value={preferredAssets}
                onChange={(e) => setPreferredAssets(e.target.value)}
                disabled={isGenerating}
              />
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            {/* Generate Button */}
            <Button
              onClick={generateStrategy}
              disabled={isGenerating || !goals.trim()}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Strategy...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Strategy
                </>
              )}
            </Button>
          </div>
        )}

        {/* Strategy Display */}
        {strategy && (
          <div className="space-y-6">
            {/* Header */}
            <div className="pb-4 border-b">
              <h3 className="text-2xl font-bold">{strategy.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">{strategy.type}</p>
            </div>

            {/* Description */}
            <div>
              <h4 className="font-semibold mb-2">Strategy Description</h4>
              <p className="text-sm text-muted-foreground">{strategy.description}</p>
            </div>

            {/* Entry Conditions */}
            <div>
              <h4 className="font-semibold mb-2">Entry Conditions</h4>
              <ul className="space-y-1">
                {strategy.entryConditions.map((condition, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    {condition}
                  </li>
                ))}
              </ul>
            </div>

            {/* Exit Conditions */}
            <div>
              <h4 className="font-semibold mb-2">Exit Conditions</h4>
              <ul className="space-y-1">
                {strategy.exitConditions.map((condition, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-red-600 mt-0.5">✗</span>
                    {condition}
                  </li>
                ))}
              </ul>
            </div>

            {/* Risk Management */}
            <div>
              <h4 className="font-semibold mb-2">Risk Management</h4>
              <ul className="space-y-1">
                {strategy.riskManagement.map((rule, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-yellow-600 mt-0.5">⚠</span>
                    {rule}
                  </li>
                ))}
              </ul>
            </div>

            {/* Expected Metrics */}
            {strategy.expectedMetrics && (
              <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                {strategy.expectedMetrics.winRate && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {strategy.expectedMetrics.winRate}%
                    </div>
                    <div className="text-xs text-muted-foreground">Win Rate</div>
                  </div>
                )}
                {strategy.expectedMetrics.riskReward && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {strategy.expectedMetrics.riskReward}:1
                    </div>
                    <div className="text-xs text-muted-foreground">Risk/Reward</div>
                  </div>
                )}
                {strategy.expectedMetrics.maxDrawdown && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {strategy.expectedMetrics.maxDrawdown}%
                    </div>
                    <div className="text-xs text-muted-foreground">Max Drawdown</div>
                  </div>
                )}
              </div>
            )}

            {/* Implementation */}
            <div>
              <h4 className="font-semibold mb-2">Implementation Guide</h4>
              <div className="text-sm text-muted-foreground whitespace-pre-wrap p-3 bg-muted rounded-md">
                {strategy.implementation}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button className="flex-1">Save Strategy</Button>
              <Button variant="outline" className="flex-1">Run Backtest</Button>
              <Button
                variant="ghost"
                onClick={() => setStrategy(null)}
              >
                Generate New
              </Button>
            </div>

            {/* Disclaimer */}
            <div className="text-xs text-muted-foreground text-center p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              ⚠️ This strategy is AI-generated and should be thoroughly tested before using with real money.
              Always backtest and paper trade first!
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
