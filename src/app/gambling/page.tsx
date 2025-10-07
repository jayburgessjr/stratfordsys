'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Dice1, TrendingUp, Target, Zap, DollarSign, Trophy, Activity, Calendar } from 'lucide-react';
import { getSportsDataService, type Game } from '@/lib/services/sports-data';
import { getSportsPredictor, type Prediction } from '@/lib/services/sports-predictor';

export default function GamblingPage() {
  const [_selectedStrategy, setSelectedStrategy] = useState<string>('');
  const [liveGames, setLiveGames] = useState<Game[]>([]);
  const [todayGames, setTodayGames] = useState<Game[]>([]);
  const [tomorrowGames, setTomorrowGames] = useState<Game[]>([]);
  const [yesterdayGames, setYesterdayGames] = useState<Game[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);

  // Load sports data
  useEffect(() => {
    const loadSportsData = async () => {
      setLoading(true);
      try {
        const sportsService = getSportsDataService();
        const predictor = getSportsPredictor();

        // Fetch all game data
        const [live, today, tomorrow, yesterday] = await Promise.all([
          sportsService.getLiveGames(),
          sportsService.getGamesByDate(new Date()),
          sportsService.getUpcomingGames(),
          sportsService.getCompletedGames(),
        ]);

        setLiveGames(live);
        setTodayGames(today);
        setTomorrowGames(tomorrow);
        setYesterdayGames(yesterday);

        // Generate predictions for tomorrow's games
        const tomorrowPredictions = predictor.predictGames(tomorrow);
        setPredictions(tomorrowPredictions);
      } catch (error) {
        console.error('Error loading sports data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSportsData();
  }, []);

  const casinoStrategies = [
    {
      game: 'Blackjack',
      strategy: 'Card Counting + Basic Strategy',
      edge: '+1.5%',
      bankroll: '$5,000',
      confidence: 94,
      roi: '12-18% monthly',
      description: 'Mathematical advantage through probability tracking'
    },
    {
      game: 'Poker',
      strategy: 'GTO + Exploitative Play',
      edge: '+15.3%',
      bankroll: '$10,000',
      confidence: 87,
      roi: '25-40% monthly',
      description: 'Game theory optimal with player exploitation'
    },
    {
      game: 'Roulette',
      strategy: 'Biased Wheel Detection',
      edge: '+8.2%',
      bankroll: '$3,000',
      confidence: 71,
      roi: '8-15% monthly',
      description: 'Statistical analysis of wheel imperfections'
    },
    {
      game: 'Baccarat',
      strategy: 'Pattern Recognition',
      edge: '+2.1%',
      bankroll: '$7,500',
      confidence: 68,
      roi: '5-12% monthly',
      description: 'Streaks and pattern analysis with card tracking'
    }
  ];

  const sportsBooks = [
    {
      sport: 'NBA',
      edge: '+7.3%',
      model: 'Advanced Analytics + Injury Impact',
      winRate: '58.4%',
      units: '+47.2',
      confidence: 91,
      nextPicks: ['Lakers -3.5', 'Warriors O 225.5', 'Celtics ML']
    },
    {
      sport: 'NFL',
      edge: '+12.7%',
      model: 'Weather + Line Movement + Public Sentiment',
      winRate: '61.8%',
      units: '+89.3',
      confidence: 88,
      nextPicks: ['Chiefs -7', 'Bills/Dolphins U 48', 'Cowboys +3.5']
    },
    {
      sport: 'MLB',
      edge: '+5.9%',
      model: 'Pitcher Analytics + Ballpark Factors',
      winRate: '55.7%',
      units: '+32.1',
      confidence: 76,
      nextPicks: ['Yankees -1.5', 'Dodgers O 8.5', 'Astros ML']
    },
    {
      sport: 'Soccer',
      edge: '+9.4%',
      model: 'Expected Goals + Form Analysis',
      winRate: '59.2%',
      units: '+56.8',
      confidence: 83,
      nextPicks: ['Man City -1.5', 'Liverpool/Arsenal O 2.5', 'Barcelona ML']
    }
  ];

  const arbitrageOpportunities = [
    {
      match: 'Lakers vs Warriors',
      book1: 'DraftKings Lakers -3 (-110)',
      book2: 'FanDuel Warriors +3.5 (-105)',
      profit: '2.3%',
      investment: '$2,000',
      guaranteed: '$46'
    },
    {
      match: 'Cowboys vs Giants',
      book1: 'BetMGM Cowboys -7 (+100)',
      book2: 'Caesars Giants +7.5 (-108)',
      profit: '1.8%',
      investment: '$5,000',
      guaranteed: '$90'
    },
    {
      match: 'Yankees vs Red Sox',
      book1: 'PointsBet O 9.5 (-115)',
      book2: 'Barstool U 10 (+110)',
      profit: '3.1%',
      investment: '$1,500',
      guaranteed: '$47'
    }
  ];

  const liveOpportunities = [
    {
      type: 'In-Game Momentum',
      game: 'Heat vs Nets',
      opportunity: 'Heat down 12, historically strong 3rd quarter',
      edge: '+23.7%',
      bet: 'Heat +8.5 (Live)',
      confidence: 82
    },
    {
      type: 'Line Movement',
      game: 'Packers vs Bears',
      opportunity: 'Sharp money on Packers, line moved 2.5 points',
      edge: '+15.2%',
      bet: 'Packers -3.5',
      confidence: 89
    },
    {
      type: 'Weather Impact',
      game: 'Bills vs Dolphins',
      opportunity: '25mph winds, total overvalued',
      edge: '+18.9%',
      bet: 'Under 42.5',
      confidence: 94
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gambling & Sports Analytics</h1>
            <p className="text-muted-foreground">
              Mathematical edge detection and strategic betting systems
            </p>
          </div>
          <Badge variant="outline" className="text-green-600 border-green-600">
            +$47,293 YTD
          </Badge>
        </div>

        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Edge</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">+8.7%</div>
              <p className="text-xs text-muted-foreground">
                Across all strategies
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">61.3%</div>
              <p className="text-xs text-muted-foreground">
                Last 30 days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Bets</CardTitle>
              <Dice1 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">23</div>
              <p className="text-xs text-muted-foreground">
                $12,750 at risk
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ROI</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">+23.4%</div>
              <p className="text-xs text-muted-foreground">
                This quarter
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="live-sports" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="live-sports">Live Sports & AI</TabsTrigger>
            <TabsTrigger value="casino">Casino Games</TabsTrigger>
            <TabsTrigger value="sports">Sports Betting</TabsTrigger>
            <TabsTrigger value="arbitrage">Arbitrage</TabsTrigger>
            <TabsTrigger value="live">Live Opportunities</TabsTrigger>
          </TabsList>

          <TabsContent value="live-sports" className="space-y-6">
            {loading ? (
              <Card>
                <CardContent className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <Activity className="h-12 w-12 animate-pulse mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">Loading live sports data...</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Live Games */}
                {liveGames.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Activity className="mr-2 h-5 w-5 text-red-500 animate-pulse" />
                        Live Games
                      </CardTitle>
                      <CardDescription>Games in progress now</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {liveGames.map((game) => (
                          <div key={game.id} className="border rounded-lg p-4 bg-red-50/50">
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant="destructive" className="animate-pulse">LIVE</Badge>
                              <span className="text-xs text-muted-foreground">{game.league}</span>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="font-medium">{game.awayTeam.name}</span>
                                <span className="text-2xl font-bold">{game.awayTeam.score}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="font-medium">{game.homeTeam.name}</span>
                                <span className="text-2xl font-bold">{game.homeTeam.score}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Today's Games */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Calendar className="mr-2 h-5 w-5 text-blue-500" />
                      Today&rsquo;s Games
                    </CardTitle>
                    <CardDescription>All games scheduled for today</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {todayGames.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No games scheduled for today</p>
                    ) : (
                      <div className="space-y-3">
                        {todayGames.map((game) => (
                          <div key={game.id} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <Badge>{game.league}</Badge>
                              <span className="text-xs text-muted-foreground">
                                {game.status === 'final' ? 'Final' : new Date(game.date).toLocaleTimeString()}
                              </span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 items-center">
                              <span className="font-medium">{game.awayTeam.abbreviation}</span>
                              <span className="text-center text-xs text-muted-foreground">@</span>
                              <span className="font-medium text-right">{game.homeTeam.abbreviation}</span>
                            </div>
                            {game.odds && (
                              <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
                                {game.odds.spread && <span className="mr-3">Spread: {game.odds.spread}</span>}
                                {game.odds.overUnder && <span>O/U: {game.odds.overUnder}</span>}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* AI Predictions for Tomorrow */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Target className="mr-2 h-5 w-5 text-purple-500" />
                      AI Predictions - Tomorrow&rsquo;s Games
                    </CardTitle>
                    <CardDescription>Machine learning predictions with confidence scores</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {predictions.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No games scheduled for tomorrow</p>
                    ) : (
                      <div className="space-y-4">
                        {predictions.slice(0, 10).map((pred) => (
                          <div key={pred.gameId} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <div className="font-medium">{pred.awayTeam} @ {pred.homeTeam}</div>
                                <Badge variant="secondary" className="mt-1">{pred.league}</Badge>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-bold text-green-600">{pred.confidence}%</div>
                                <Badge variant={pred.recommendation === 'BET' ? 'default' : pred.recommendation === 'HEDGE' ? 'secondary' : 'outline'}>
                                  {pred.recommendation}
                                </Badge>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                              <div>
                                <span className="text-muted-foreground">Predicted Winner:</span>
                                <div className="font-medium">{pred.predictedWinner}</div>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Predicted Score:</span>
                                <div className="font-medium">{pred.predictedScore.away} - {pred.predictedScore.home}</div>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Spread:</span>
                                <div className="font-medium">{pred.spread.toFixed(1)}</div>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Total:</span>
                                <div className="font-medium">O/U {pred.totalPoints.toFixed(1)}</div>
                              </div>
                            </div>
                            <div className="text-xs space-y-1 p-2 bg-muted/50 rounded">
                              <div><span className="font-semibold">Analysis:</span> {pred.analysis.keyFactors.slice(0, 2).join(', ')}</div>
                              <div><span className="font-semibold">H2H:</span> {pred.analysis.headToHead}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Yesterday&rsquo;s Scores */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Trophy className="mr-2 h-5 w-5 text-yellow-500" />
                      Yesterday&rsquo;s Results
                    </CardTitle>
                    <CardDescription>Final scores from previous day</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {yesterdayGames.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No completed games from yesterday</p>
                    ) : (
                      <div className="space-y-3">
                        {yesterdayGames.map((game) => (
                          <div key={game.id} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant="outline">{game.league}</Badge>
                              <span className="text-xs font-medium text-green-600">FINAL</span>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="font-medium">{game.awayTeam.name}</span>
                                <span className="text-xl font-bold">{game.awayTeam.score}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="font-medium">{game.homeTeam.name}</span>
                                <span className="text-xl font-bold">{game.homeTeam.score}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="casino" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {casinoStrategies.map((strategy, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {strategy.game}
                      <Badge variant={strategy.confidence > 85 ? "default" : "secondary"}>
                        {strategy.confidence}% Confidence
                      </Badge>
                    </CardTitle>
                    <CardDescription>{strategy.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-green-600">Edge:</span>
                        <div>{strategy.edge}</div>
                      </div>
                      <div>
                        <span className="font-medium text-blue-600">ROI:</span>
                        <div>{strategy.roi}</div>
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">Bankroll:</span>
                        <div>{strategy.bankroll}</div>
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">Strategy:</span>
                        <div className="text-xs">{strategy.strategy}</div>
                      </div>
                    </div>
                    <Progress value={strategy.confidence} className="h-2" />
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setSelectedStrategy(strategy.game)}
                    >
                      <Zap className="mr-2 h-4 w-4" />
                      Activate Strategy
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="sports" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {sportsBooks.map((sport, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {sport.sport}
                      <Badge variant="default">{sport.winRate} Win Rate</Badge>
                    </CardTitle>
                    <CardDescription>{sport.model}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-green-600">Edge:</span>
                        <div>{sport.edge}</div>
                      </div>
                      <div>
                        <span className="font-medium text-blue-600">Units:</span>
                        <div>{sport.units}</div>
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">Confidence:</span>
                        <div>{sport.confidence}%</div>
                      </div>
                    </div>
                    <div>
                      <span className="font-medium text-sm">Next Picks:</span>
                      <div className="mt-2 space-y-1">
                        {sport.nextPicks.map((pick, i) => (
                          <div key={i} className="text-sm bg-muted p-2 rounded">
                            {pick}
                          </div>
                        ))}
                      </div>
                    </div>
                    <Button variant="outline" className="w-full">
                      <Trophy className="mr-2 h-4 w-4" />
                      View Full Analysis
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="arbitrage" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Risk-Free Arbitrage Opportunities</CardTitle>
                <CardDescription>
                  Guaranteed profit through bookmaker price discrepancies
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {arbitrageOpportunities.map((arb, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{arb.match}</h4>
                        <Badge variant="default" className="text-green-600 bg-green-100">
                          {arb.profit} Profit
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Book 1:</span>
                          <div>{arb.book1}</div>
                        </div>
                        <div>
                          <span className="font-medium">Book 2:</span>
                          <div>{arb.book2}</div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <div className="text-sm">
                          <span className="font-medium">Investment:</span> {arb.investment}
                          <span className="text-green-600 ml-4 font-medium">
                            Guaranteed: {arb.guaranteed}
                          </span>
                        </div>
                        <Button size="sm">
                          Execute Arbitrage
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="live" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Live Betting Opportunities</CardTitle>
                <CardDescription>
                  Real-time edge detection and momentum-based betting
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {liveOpportunities.map((opp, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-medium">{opp.game}</h4>
                          <Badge variant="secondary" className="text-xs mt-1">
                            {opp.type}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">{opp.edge}</div>
                          <div className="text-xs text-muted-foreground">{opp.confidence}% confidence</div>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{opp.opportunity}</p>
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-sm">{opp.bet}</div>
                        <Button size="sm" variant="default">
                          <Zap className="mr-2 h-4 w-4" />
                          Place Bet
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
