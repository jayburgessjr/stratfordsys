/**
 * Sports Data Service
 * Fetches live scores, schedules, and game data from ESPN API
 */

export interface Game {
  id: string;
  sport: string;
  league: string;
  date: string;
  status: 'scheduled' | 'live' | 'final';
  homeTeam: {
    name: string;
    abbreviation: string;
    score?: number;
    logo?: string;
    record?: string;
  };
  awayTeam: {
    name: string;
    abbreviation: string;
    score?: number;
    logo?: string;
    record?: string;
  };
  venue?: string;
  broadcast?: string;
  odds?: {
    spread?: string;
    overUnder?: string;
    moneyline?: {
      home: string;
      away: string;
    };
  };
}

export interface SportsOdds {
  gameId: string;
  bookmaker: string;
  spread: {
    home: number;
    away: number;
    odds: number;
  };
  totals: {
    over: number;
    under: number;
    points: number;
  };
  moneyline: {
    home: number;
    away: number;
  };
}

class SportsDataService {
  private baseUrl = 'https://site.api.espn.com/apis/site/v2/sports';

  /**
   * Fetch NFL games
   */
  async getNFLGames(): Promise<Game[]> {
    try {
      const response = await fetch(`${this.baseUrl}/football/nfl/scoreboard`);
      const data = await response.json();
      return this.parseESPNGames(data, 'NFL', 'football');
    } catch (error) {
      console.error('Error fetching NFL games:', error);
      return [];
    }
  }

  /**
   * Fetch NBA games
   */
  async getNBAGames(): Promise<Game[]> {
    try {
      const response = await fetch(`${this.baseUrl}/basketball/nba/scoreboard`);
      const data = await response.json();
      return this.parseESPNGames(data, 'NBA', 'basketball');
    } catch (error) {
      console.error('Error fetching NBA games:', error);
      return [];
    }
  }

  /**
   * Fetch MLB games
   */
  async getMLBGames(): Promise<Game[]> {
    try {
      const response = await fetch(`${this.baseUrl}/baseball/mlb/scoreboard`);
      const data = await response.json();
      return this.parseESPNGames(data, 'MLB', 'baseball');
    } catch (error) {
      console.error('Error fetching MLB games:', error);
      return [];
    }
  }

  /**
   * Fetch NHL games
   */
  async getNHLGames(): Promise<Game[]> {
    try {
      const response = await fetch(`${this.baseUrl}/hockey/nhl/scoreboard`);
      const data = await response.json();
      return this.parseESPNGames(data, 'NHL', 'hockey');
    } catch (error) {
      console.error('Error fetching NHL games:', error);
      return [];
    }
  }

  /**
   * Get all sports games
   */
  async getAllGames(): Promise<Game[]> {
    const [nfl, nba, mlb, nhl] = await Promise.all([
      this.getNFLGames(),
      this.getNBAGames(),
      this.getMLBGames(),
      this.getNHLGames(),
    ]);
    return [...nfl, ...nba, ...mlb, ...nhl];
  }

  /**
   * Parse ESPN API response
   */
  private parseESPNGames(data: any, league: string, sport: string): Game[] {
    if (!data.events || data.events.length === 0) {
      return [];
    }

    return data.events.map((event: any) => {
      const competition = event.competitions?.[0];
      const homeTeam = competition?.competitors?.find((c: any) => c.homeAway === 'home');
      const awayTeam = competition?.competitors?.find((c: any) => c.homeAway === 'away');

      // Determine game status
      let status: 'scheduled' | 'live' | 'final' = 'scheduled';
      if (event.status?.type?.completed) {
        status = 'final';
      } else if (event.status?.type?.state === 'in') {
        status = 'live';
      }

      // Parse odds if available
      let odds;
      if (competition?.odds?.[0]) {
        const oddsData = competition.odds[0];
        odds = {
          spread: oddsData.details || undefined,
          overUnder: oddsData.overUnder ? `O/U ${oddsData.overUnder}` : undefined,
          moneyline: {
            home: oddsData.homeTeamOdds?.moneyLine || 'N/A',
            away: oddsData.awayTeamOdds?.moneyLine || 'N/A',
          },
        };
      }

      return {
        id: event.id,
        sport,
        league,
        date: event.date,
        status,
        homeTeam: {
          name: homeTeam?.team?.displayName || 'TBD',
          abbreviation: homeTeam?.team?.abbreviation || 'TBD',
          score: homeTeam?.score ? parseInt(homeTeam.score) : undefined,
          logo: homeTeam?.team?.logo,
          record: homeTeam?.records?.[0]?.summary,
        },
        awayTeam: {
          name: awayTeam?.team?.displayName || 'TBD',
          abbreviation: awayTeam?.team?.abbreviation || 'TBD',
          score: awayTeam?.score ? parseInt(awayTeam.score) : undefined,
          logo: awayTeam?.team?.logo,
          record: awayTeam?.records?.[0]?.summary,
        },
        venue: competition?.venue?.fullName,
        broadcast: competition?.broadcasts?.[0]?.names?.[0],
        odds,
      };
    });
  }

  /**
   * Get games by date
   */
  async getGamesByDate(date: Date, leagues?: string[]): Promise<Game[]> {
    const allGames = await this.getAllGames();
    const targetDate = date.toISOString().split('T')[0];

    return allGames.filter(game => {
      const gameDate = new Date(game.date).toISOString().split('T')[0];
      const matchesDate = gameDate === targetDate;
      const matchesLeague = !leagues || leagues.includes(game.league);
      return matchesDate && matchesLeague;
    });
  }

  /**
   * Get live games
   */
  async getLiveGames(): Promise<Game[]> {
    const allGames = await this.getAllGames();
    return allGames.filter(game => game.status === 'live');
  }

  /**
   * Get completed games (previous day)
   */
  async getCompletedGames(date?: Date): Promise<Game[]> {
    const targetDate = date || new Date(Date.now() - 24 * 60 * 60 * 1000); // Yesterday
    const games = await this.getGamesByDate(targetDate);
    return games.filter(game => game.status === 'final');
  }

  /**
   * Get upcoming games (next day)
   */
  async getUpcomingGames(date?: Date): Promise<Game[]> {
    const targetDate = date || new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow
    const games = await this.getGamesByDate(targetDate);
    return games.filter(game => game.status === 'scheduled');
  }
}

// Singleton instance
let sportsDataService: SportsDataService | null = null;

export function getSportsDataService(): SportsDataService {
  if (!sportsDataService) {
    sportsDataService = new SportsDataService();
  }
  return sportsDataService;
}
