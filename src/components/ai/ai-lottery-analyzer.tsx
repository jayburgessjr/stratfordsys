'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, AlertTriangle } from 'lucide-react';
import { requestAIChat } from '@/lib/api/ai';

interface LotteryAnalysis {
  hotNumbers: number[];
  coldNumbers: number[];
  patterns: string[];
  recommendation: string;
  expectedValue: string;
  warning: string;
  suggestedNumbers: number[];
}

export function AILotteryAnalyzer() {
  const [lotteryType, setLotteryType] = useState('powerball');
  const [analysis, setAnalysis] = useState<LotteryAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeLottery = async () => {
    setIsAnalyzing(true);
    setError(null);

    try {
      // Generate mock historical data for demo
      const historicalDrawings = generateMockHistory(lotteryType);

      const prompt = `Analyze this ${lotteryType} lottery data:

Historical Drawings (last 50): ${JSON.stringify(historicalDrawings)}

Provide analysis in EXACT JSON format:
{
  "hotNumbers": [array of 5 most frequent numbers],
  "coldNumbers": [array of 5 least frequent numbers],
  "patterns": ["pattern 1", "pattern 2", "pattern 3"],
  "recommendation": "Brief recommendation (2-3 sentences)",
  "expectedValue": "Calculate expected value as percentage",
  "warning": "Important responsible gambling message",
  "suggestedNumbers": [array of 5-6 numbers based on analysis]
}

Be honest about lottery being negative expected value. Emphasize responsible gambling.`;

      const response = await requestAIChat({
        message: prompt,
        context: 'You are a statistician analyzing lottery patterns. Always emphasize that lottery has negative expected value.',
      });

      // Parse the JSON response
      const parsed = JSON.parse(response);
      setAnalysis(parsed);
    } catch (err) {
      console.error('Lottery analysis error:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze lottery');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateMockHistory = (type: string): number[][] => {
    const maxNumber = type === 'powerball' ? 69 : type === 'mega' ? 70 : 49;
    const numbersPerDraw = type === 'pick6' ? 6 : 5;
    const history: number[][] = [];

    for (let i = 0; i < 50; i++) {
      const draw: number[] = [];
      while (draw.length < numbersPerDraw) {
        const num = Math.floor(Math.random() * maxNumber) + 1;
        if (!draw.includes(num)) {
          draw.push(num);
        }
      }
      history.push(draw.sort((a, b) => a - b));
    }

    return history;
  };

  const lotteryGames = [
    { value: 'powerball', label: 'Powerball', jackpot: '$150M', odds: '1 in 292M' },
    { value: 'mega', label: 'Mega Millions', jackpot: '$87M', odds: '1 in 302M' },
    { value: 'pick6', label: 'Pick 6', jackpot: '$12M', odds: '1 in 14M' },
  ];

  const selectedGame = lotteryGames.find(g => g.value === lotteryType);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-yellow-500" />
            <div>
              <CardTitle>AI Lottery Analyzer</CardTitle>
              <CardDescription>Statistical pattern analysis with AI</CardDescription>
            </div>
          </div>
          {selectedGame && (
            <Badge variant="outline">{selectedGame.jackpot}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Game Selection */}
        <div className="space-y-2">
          <Select value={lotteryType} onValueChange={setLotteryType} disabled={isAnalyzing}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {lotteryGames.map(game => (
                <SelectItem key={game.value} value={game.value}>
                  {game.label} - {game.jackpot}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedGame && (
            <div className="text-xs text-muted-foreground">
              Odds: {selectedGame.odds}
            </div>
          )}
        </div>

        {/* Analyze Button */}
        <Button
          onClick={analyzeLottery}
          disabled={isAnalyzing}
          className="w-full"
          size="lg"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing Patterns...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Analyze with AI
            </>
          )}
        </Button>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">
            <AlertTriangle className="h-4 w-4" />
            {error}
          </div>
        )}

        {/* Analysis Results */}
        {analysis && (
          <div className="space-y-4">
            {/* Warning Banner */}
            <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800 text-sm">
              <AlertTriangle className="h-4 w-4 mt-0.5" />
              <div>
                <div className="font-semibold mb-1">Important Notice</div>
                {analysis.warning}
              </div>
            </div>

            {/* Expected Value */}
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">Expected Value</div>
              <div className="text-2xl font-bold text-red-600">{analysis.expectedValue}</div>
              <div className="text-xs text-muted-foreground mt-1">
                Negative EV means you lose money on average
              </div>
            </div>

            {/* Hot & Cold Numbers */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-semibold mb-2">🔥 Hot Numbers</div>
                <div className="flex flex-wrap gap-2">
                  {analysis.hotNumbers.map(num => (
                    <div
                      key={num}
                      className="w-10 h-10 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold text-sm"
                    >
                      {num}
                    </div>
                  ))}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Most frequent in last 50 draws
                </div>
              </div>

              <div>
                <div className="text-sm font-semibold mb-2">❄️ Cold Numbers</div>
                <div className="flex flex-wrap gap-2">
                  {analysis.coldNumbers.map(num => (
                    <div
                      key={num}
                      className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm"
                    >
                      {num}
                    </div>
                  ))}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Least frequent (overdue)
                </div>
              </div>
            </div>

            {/* AI Suggested Numbers */}
            <div>
              <div className="text-sm font-semibold mb-2">🤖 AI Suggested Numbers</div>
              <div className="flex flex-wrap gap-2 mb-2">
                {analysis.suggestedNumbers.map(num => (
                  <div
                    key={num}
                    className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold"
                  >
                    {num}
                  </div>
                ))}
              </div>
              <div className="text-xs text-muted-foreground">
                Based on statistical analysis (does not guarantee win)
              </div>
            </div>

            {/* Patterns */}
            <div>
              <div className="text-sm font-semibold mb-2">📊 Patterns Detected</div>
              <ul className="space-y-1">
                {analysis.patterns.map((pattern, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-primary">•</span>
                    {pattern}
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommendation */}
            <div>
              <div className="text-sm font-semibold mb-2">💡 AI Recommendation</div>
              <p className="text-sm text-muted-foreground">{analysis.recommendation}</p>
            </div>

            {/* Disclaimer */}
            <div className="text-xs text-center text-muted-foreground p-3 bg-muted rounded-md">
              ⚠️ Lottery is entertainment. Every combination has equal probability.
              Past results don&rsquo;t predict future outcomes. Play responsibly within your budget.
            </div>
          </div>
        )}

        {/* Initial State */}
        {!analysis && !error && !isAnalyzing && (
          <div className="text-center py-8 text-muted-foreground">
            <Sparkles className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Select a lottery game and analyze patterns</p>
            <p className="text-xs mt-2">Remember: All analysis is for entertainment only</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
