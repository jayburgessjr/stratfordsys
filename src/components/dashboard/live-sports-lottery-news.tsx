'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Ticket, Activity, TrendingUp, TrendingDown } from 'lucide-react';
import { getSportsDataService, type Game } from '@/lib/services/sports-data';
import { getLotteryAnalyzer, type HistoricalData } from '@/lib/services/lottery-analyzer';
import { Badge } from '@/components/ui/badge';

export function LiveSportsLotteryNews() {
  const [liveGames, setLiveGames] = useState<Game[]>([]);
  const [todayGames, setTodayGames] = useState<Game[]>([]);
  const [lotteryResults, setLotteryResults] = useState<{
    powerball: HistoricalData[];
    megaMillions: HistoricalData[];
    calSuperLotto: HistoricalData[];
  }>({ powerball: [], megaMillions: [], calSuperLotto: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const sportsService = getSportsDataService();
      const lotteryAnalyzer = getLotteryAnalyzer();

      const [live, today] = await Promise.all([
        sportsService.getLiveGames(),
        sportsService.getGamesByDate(new Date()),
      ]);

      setLiveGames(live);
      setTodayGames(today);
      setLotteryResults({
        powerball: lotteryAnalyzer.getPowerballHistory(3),
        megaMillions: lotteryAnalyzer.getMegaMillionsHistory(3),
        calSuperLotto: lotteryAnalyzer.getCalPick6History(3),
      });
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Live Sports & Lottery News
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="live-sports" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="live-sports">
              <Trophy className="h-4 w-4 mr-2" />
              Live Sports
            </TabsTrigger>
            <TabsTrigger value="lottery">
              <Ticket className="h-4 w-4 mr-2" />
              Lottery Numbers
            </TabsTrigger>
          </TabsList>

          <TabsContent value="live-sports" className="space-y-4">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading live games...</div>
            ) : liveGames.length > 0 ? (
              <div className="space-y-3">
                {liveGames.slice(0, 5).map((game) => (
                  <div key={game.id} className="p-3 border rounded-lg bg-muted/30">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="destructive" className="animate-pulse">LIVE</Badge>
                          <span className="text-xs text-muted-foreground">{game.league}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{game.homeTeam.name}</span>
                            <span className="text-lg font-bold">{game.homeScore}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{game.awayTeam.name}</span>
                            <span className="text-lg font-bold">{game.awayScore}</span>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">{game.time}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : todayGames.length > 0 ? (
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground mb-2">Today&rsquo;s Games</div>
                {todayGames.slice(0, 5).map((game) => (
                  <div key={game.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">{game.status.toUpperCase()}</Badge>
                          <span className="text-xs text-muted-foreground">{game.league}</span>
                        </div>
                        <div className="text-sm">
                          <div>{game.awayTeam.name} @ {game.homeTeam.name}</div>
                          <div className="text-xs text-muted-foreground mt-1">{game.time}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">No live games at the moment</div>
            )}
          </TabsContent>

          <TabsContent value="lottery" className="space-y-4">
            {/* Powerball */}
            <div className="space-y-2">
              <div className="font-medium flex items-center gap-2">
                <Ticket className="h-4 w-4" />
                Powerball - Recent Results
              </div>
              {lotteryResults.powerball.map((result, idx) => (
                <div key={idx} className="p-3 border rounded-lg bg-red-50/50 dark:bg-red-950/20">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">{result.date}</div>
                    <div className="flex items-center gap-2">
                      {result.numbers.map((num, i) => (
                        <div key={i} className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center text-sm font-bold border-2 border-red-500">
                          {num}
                        </div>
                      ))}
                      <div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center text-sm font-bold">
                        {result.bonus}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Mega Millions */}
            <div className="space-y-2">
              <div className="font-medium flex items-center gap-2">
                <Ticket className="h-4 w-4" />
                Mega Millions - Recent Results
              </div>
              {lotteryResults.megaMillions.map((result, idx) => (
                <div key={idx} className="p-3 border rounded-lg bg-yellow-50/50 dark:bg-yellow-950/20">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">{result.date}</div>
                    <div className="flex items-center gap-2">
                      {result.numbers.map((num, i) => (
                        <div key={i} className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center text-sm font-bold border-2 border-yellow-500">
                          {num}
                        </div>
                      ))}
                      <div className="w-8 h-8 rounded-full bg-yellow-500 text-white flex items-center justify-center text-sm font-bold">
                        {result.bonus}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* CA SuperLotto Plus */}
            <div className="space-y-2">
              <div className="font-medium flex items-center gap-2">
                <Ticket className="h-4 w-4" />
                CA SuperLotto Plus - Recent Results
              </div>
              {lotteryResults.calSuperLotto.map((result, idx) => (
                <div key={idx} className="p-3 border rounded-lg bg-blue-50/50 dark:bg-blue-950/20">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">{result.date}</div>
                    <div className="flex items-center gap-2">
                      {result.numbers.map((num, i) => (
                        <div key={i} className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center text-sm font-bold border-2 border-blue-500">
                          {num}
                        </div>
                      ))}
                      <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">
                        {result.bonus}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
