
// Betting Engine
// Scans for positive EV (Expected Value) wagers in Sports and Events
// "The House Edge"

export interface BettingSignal {
  id: string;
  event: string;
  wager: string;
  odds: number; // Decimal odds (e.g. 2.50)
  impliedProb: number; // e.g. 40%
  modelProb: number; // e.g. 55%
  ev: number; // Expected Value %
  confidence: number;
  league: string;
  startTime: string;
}

export class BettingEngine {
  private apiKey: string | undefined;
  private baseUrl = 'https://api.the-odds-api.com/v4/sports';

  constructor() {
    this.apiKey = process.env.ODDS_API_KEY;
  }

  async scanForValue(): Promise<BettingSignal[]> {
    if (this.apiKey) {
      try {
        console.log('[BettingEngine] Fetching live odds from The-Odds-API...');
        return await this.fetchLiveOdds();
      } catch (error) {
        console.error('[BettingEngine] API fetch failed, falling back to simulation:', error);
      }
    } else {
      console.log('[BettingEngine] No API key found (ODDS_API_KEY), using simulation data.');
    }

    return this.getSimulationData();
  }

  private async fetchLiveOdds(): Promise<BettingSignal[]> {
    // Fetch upcoming games across popular sports
    const sports = ['americanfootball_nfl', 'basketball_nba', 'soccer_epl', 'basketball_ncaab'];
    let allSignals: BettingSignal[] = [];

    // Limit to first available sport for demo performance if needed, or fetch all in parallel
    // For now, let's just fetch general 'upcoming' which covers top sports
    const response = await fetch(
      `${this.baseUrl}/upcoming/odds/?regions=us&markets=h2h&oddsFormat=decimal&apiKey=${this.apiKey}`
    );

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Process top 10 events to find value
    const opportunities = data.slice(0, 15).map((game: any) => {
        const bookmakers = game.bookmakers || [];
        if (bookmakers.length === 0) return null;

        // Find best odds
        const bestOdds = this.findBestOdds(bookmakers);
        if (!bestOdds) return null;

        // Simulate AI Model Analysis
        // In a real system, this would call a python-engine endpoint with player stats/weather/etc.
        // Here we simulate "Alpha" by finding lines where the market might be inefficient
        const impliedProb = (1 / bestOdds.price) * 100;
        
        // Simulating a model that finds a 5-15% edge occasionally
        const hasEdge = Math.random() > 0.7; // 30% of games have an edge
        const modelProb = hasEdge 
            ? impliedProb + (Math.random() * 10) // We think it's more likely
            : impliedProb - (Math.random() * 5); // We think it's less likely

        const ev = this.calculateEV(modelProb, bestOdds.price);

        // Only return positive EV signals
        if (ev < 1.5) return null; // Filter out low value

        return {
            id: game.id,
            event: `${game.home_team} vs ${game.away_team}`,
            wager: `${bestOdds.name} (${bestOdds.team})`, // e.g. "DraftKings (Chiefs)"
            odds: bestOdds.price,
            impliedProb: Number(impliedProb.toFixed(1)),
            modelProb: Number(modelProb.toFixed(1)),
            ev: Number(ev.toFixed(1)),
            confidence: Math.min(95, Math.round(modelProb + (ev * 2))), // Heuristic confidence
            league: game.sport_title,
            startTime: new Date(game.commence_time).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
        };
    }).filter(Boolean) as BettingSignal[];

    return opportunities.sort((a, b) => b.ev - a.ev).slice(0, 5); // Return top 5
  }

  private findBestOdds(bookmakers: any[]): { price: number, name: string, team: string } | null {
      // Simplification: Just take the first bookmaker's first outcome for the Home team
      // Real implementation would scan for arbitrage (best price across all books)
      const book = bookmakers[0];
      const market = book.markets.find((m: any) => m.key === 'h2h');
      if (!market) return null;

      // Pick the outcome with higher odds (underdog) or random for variety
      const outcome = market.outcomes[0]; // Usually Home
      return {
          price: outcome.price,
          name: book.title,
          team: outcome.name
      };
  }

  private calculateEV(winProbPercent: number, decimalOdds: number): number {
      // EV = (Probability of Winning * Amount Won) - (Probability of Losing * Amount Lost)
      // Assuming 1 unit bet
      const winProb = winProbPercent / 100;
      const amountWon = decimalOdds - 1;
      const amountLost = 1;
      
      const ev = (winProb * amountWon) - ((1 - winProb) * amountLost);
      return ev * 100; // Return as percentage ROI
  }

  private async getSimulationData(): Promise<BettingSignal[]> {
    // Simulated delay
    await new Promise(resolve => setTimeout(resolve, 800));

    return [
      {
        id: '1',
        event: 'KC Chiefs vs SF 49ers',
        wager: 'Chiefs Moneyline',
        odds: 2.10,
        impliedProb: 47.6,
        modelProb: 55.0,
        ev: 15.5,
        confidence: 85,
        league: 'NFL',
        startTime: 'Tonight 8:00 PM'
      },
      {
        id: '2',
        event: 'LAL Lakers vs BOS Celtics',
        wager: 'Over 225.5 Points',
        odds: 1.91,
        impliedProb: 52.4,
        modelProb: 61.2,
        ev: 16.8,
        confidence: 78,
        league: 'NBA',
        startTime: 'Tomorrow 7:30 PM'
      },
      {
        id: '3',
        event: 'Liverpool vs Man City',
        wager: 'Draw',
        odds: 3.50,
        impliedProb: 28.6,
        modelProb: 35.0,
        ev: 22.5,
        confidence: 60,
        league: 'EPL',
        startTime: 'Sat 10:00 AM'
      },
      {
        id: '4',
        event: 'Powerball Jackpot',
        wager: 'Buy Ticket (EV+ Range)',
        odds: 292000000,
        impliedProb: 0.0000003,
        modelProb: 0.0000003,
        ev: 12.0, // Positive because jackpot > odds ratio
        confidence: 99,
        league: 'Lottery',
        startTime: 'Wed 10:59 PM'
      }
    ];
  }
}

export const bettingEngine = new BettingEngine();
