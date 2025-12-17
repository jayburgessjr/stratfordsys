
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, ShoppingBag, Target, ArrowRight } from 'lucide-react';
import { acquisitionEngine, type AcquisitionOpportunity } from '@/lib/services/acquisition-engine';
import { bettingEngine, type BettingSignal } from '@/lib/services/betting-engine';

export function OpportunityFeed() {
  const [acquisitions, setAcquisitions] = useState<AcquisitionOpportunity[]>([]);
  const [bets, setBets] = useState<BettingSignal[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchOpportunities = async () => {
    setLoading(true);
    try {
      const [newDeals, newBets] = await Promise.all([
        acquisitionEngine.scanForDeals(),
        bettingEngine.scanForValue()
      ]);
      setAcquisitions(newDeals);
      setBets(newBets);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunities();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      
      {/* Business Acquisitions */}
      <Card className="bg-black/40 border-white/10">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-blue-400" />
              Acquisition Targets
            </CardTitle>
            <CardDescription>Undervalued businesses for sale</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={fetchOpportunities} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {acquisitions.map(deal => (
            <div key={deal.id} className="p-4 rounded-lg bg-blue-900/10 border border-blue-500/20 hover:bg-blue-900/20 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-sm text-white">{deal.name}</h3>
                  <div className="text-xs text-muted-foreground">{deal.source} • {deal.sector}</div>
                </div>
                <Badge variant="outline" className="text-blue-400 border-blue-500/50">
                  {deal.roi}% ROI
                </Badge>
              </div>
              <p className="text-xs text-zinc-400 mb-3 line-clamp-2">{deal.reason}</p>
              <div className="flex justify-between items-center text-xs">
                <div className="font-mono text-white font-semibold">
                  ${deal.price.toLocaleString()} <span className="text-muted-foreground font-normal">Ask</span>
                </div>
                <div className="font-mono text-green-400">
                  Est: ${deal.estimatedValue.toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Betting Signals */}
      <Card className="bg-black/40 border-white/10">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-400" />
              High-EV Wagers
            </CardTitle>
            <CardDescription>Statistical arbitrage in sports & lottery</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={fetchOpportunities} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {bets.map(bet => (
            <div key={bet.id} className="p-4 rounded-lg bg-purple-900/10 border border-purple-500/20 hover:bg-purple-900/20 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-sm text-white">{bet.event}</h3>
                  <div className="text-xs text-muted-foreground">{bet.league} • {bet.startTime}</div>
                </div>
                <Badge variant="outline" className="text-purple-400 border-purple-500/50">
                  +{bet.ev}% EV
                </Badge>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <Badge className="bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 border-none">
                  {bet.wager}
                </Badge>
                <span className="text-xs font-mono text-zinc-400">@{bet.odds.toFixed(2)}</span>
              </div>
              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden flex">
                <div className="bg-zinc-600 h-full" style={{ width: `${bet.impliedProb}%` }} title="Implied Probability" />
                <div className="bg-green-500 h-full" style={{ width: `${bet.modelProb - bet.impliedProb}%` }} title="Model Edge" />
              </div>
              <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
                <span>Implied: {bet.impliedProb.toFixed(1)}%</span>
                <span className="text-green-400">Model: {bet.modelProb.toFixed(1)}%</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

    </div>
  );
}
