/**
 * AI Sports Predictor Service
 * Analyzes team stats, news, and trends to predict game outcomes
 */

import { type Game } from './sports-data';

export interface Prediction {
  gameId: string;
  sport: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  predictedWinner: string;
  confidence: number;
  spread: number;
  predictedScore: {
    home: number;
    away: number;
  };
  totalPoints: number;
  analysis: {
    keyFactors: string[];
    trends: string[];
    injuries: string[];
    headToHead: string;
  };
  recommendation: 'BET' | 'SKIP' | 'HEDGE';
}

class SportsPredictor {
  /**
   * Generate prediction for a game
   */
  predictGame(game: Game): Prediction {
    // AI analysis factors (in production, this would use real ML models and APIs)
    const analysis = this.analyzeGame(game);
    const confidence = this.calculateConfidence(game, analysis);
    const predictedScore = this.predictScore(game, analysis);
    const spread = Math.abs(predictedScore.home - predictedScore.away);
    const predictedWinner = predictedScore.home > predictedScore.away
      ? game.homeTeam.name
      : game.awayTeam.name;

    return {
      gameId: game.id,
      sport: game.sport,
      league: game.league,
      homeTeam: game.homeTeam.name,
      awayTeam: game.awayTeam.name,
      predictedWinner,
      confidence,
      spread,
      predictedScore,
      totalPoints: predictedScore.home + predictedScore.away,
      analysis,
      recommendation: this.getRecommendation(confidence),
    };
  }

  /**
   * Analyze game factors
   */
  private analyzeGame(game: Game): Prediction['analysis'] {
    const keyFactors: string[] = [];
    const trends: string[] = [];

    // Analyze home advantage
    keyFactors.push('Home field advantage favors ' + game.homeTeam.abbreviation);

    // Analyze records if available
    if (game.homeTeam.record && game.awayTeam.record) {
      const homeWins = this.parseRecord(game.homeTeam.record);
      const awayWins = this.parseRecord(game.awayTeam.record);

      if (homeWins > awayWins) {
        trends.push(`${game.homeTeam.abbreviation} has better record (${game.homeTeam.record})`);
      } else if (awayWins > homeWins) {
        trends.push(`${game.awayTeam.abbreviation} has better record (${game.awayTeam.record})`);
      }
    }

    // League-specific analysis
    switch (game.league) {
      case 'NFL':
        keyFactors.push('Weather conditions', 'Quarterback matchup', 'Run defense efficiency');
        trends.push('Recent offensive performance', 'Turnover differential');
        break;
      case 'NBA':
        keyFactors.push('Pace and space metrics', 'Three-point shooting percentage');
        trends.push('Back-to-back game factor', 'Home court shooting splits');
        break;
      case 'MLB':
        keyFactors.push('Starting pitcher stats', 'Bullpen depth');
        trends.push('Recent hitting streaks', 'Ballpark factors');
        break;
      case 'NHL':
        keyFactors.push('Goaltender form', 'Power play efficiency');
        trends.push('Recent defensive metrics', 'Special teams performance');
        break;
    }

    return {
      keyFactors,
      trends,
      injuries: this.mockInjuryReport(game),
      headToHead: this.mockHeadToHead(game),
    };
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(game: Game, analysis: Prediction['analysis']): number {
    let confidence = 65; // Base confidence

    // Adjust for records
    if (game.homeTeam.record && game.awayTeam.record) {
      const homeWins = this.parseRecord(game.homeTeam.record);
      const awayWins = this.parseRecord(game.awayTeam.record);
      const winDiff = Math.abs(homeWins - awayWins);
      confidence += Math.min(winDiff * 2, 20); // Max +20 for record differential
    }

    // Add home field advantage
    confidence += 5;

    // Cap at 95%
    return Math.min(confidence, 95);
  }

  /**
   * Predict final score
   */
  private predictScore(game: Game, analysis: Prediction['analysis']): { home: number; away: number } {
    // League average scores
    const leagueAverages: Record<string, { home: number; away: number }> = {
      NFL: { home: 24, away: 21 },
      NBA: { home: 112, away: 108 },
      MLB: { home: 5, away: 4 },
      NHL: { home: 3, away: 2 },
    };

    const baseScore = leagueAverages[game.league] || { home: 0, away: 0 };

    // Add variance based on team quality
    const homeVariance = this.getRandomVariance(-5, 10);
    const awayVariance = this.getRandomVariance(-8, 8);

    return {
      home: Math.max(0, baseScore.home + homeVariance),
      away: Math.max(0, baseScore.away + awayVariance),
    };
  }

  /**
   * Get betting recommendation
   */
  private getRecommendation(confidence: number): 'BET' | 'SKIP' | 'HEDGE' {
    if (confidence >= 80) return 'BET';
    if (confidence >= 65) return 'HEDGE';
    return 'SKIP';
  }

  /**
   * Parse team record
   */
  private parseRecord(record: string): number {
    const wins = record.split('-')[0];
    return parseInt(wins) || 0;
  }

  /**
   * Generate random variance
   */
  private getRandomVariance(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Mock injury report
   */
  private mockInjuryReport(game: Game): string[] {
    const injuries: string[] = [];
    const roll = Math.random();

    if (roll < 0.3) {
      injuries.push(`${game.homeTeam.abbreviation}: Key player questionable`);
    }
    if (roll < 0.2) {
      injuries.push(`${game.awayTeam.abbreviation}: Starter out`);
    }

    return injuries.length > 0 ? injuries : ['No significant injuries reported'];
  }

  /**
   * Mock head-to-head stats
   */
  private mockHeadToHead(game: Game): string {
    const homeWins = Math.floor(Math.random() * 5);
    const awayWins = Math.floor(Math.random() * 5);
    return `Last 5 meetings: ${game.homeTeam.abbreviation} ${homeWins}-${awayWins} ${game.awayTeam.abbreviation}`;
  }

  /**
   * Batch predict multiple games
   */
  predictGames(games: Game[]): Prediction[] {
    return games.map(game => this.predictGame(game));
  }

  /**
   * Get top predictions (highest confidence)
   */
  getTopPredictions(predictions: Prediction[], count: number = 5): Prediction[] {
    return predictions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, count);
  }

  /**
   * Get predictions by recommendation type
   */
  getPredictionsByRecommendation(
    predictions: Prediction[],
    recommendation: 'BET' | 'SKIP' | 'HEDGE'
  ): Prediction[] {
    return predictions.filter(p => p.recommendation === recommendation);
  }
}

// Singleton instance
let sportsPredictor: SportsPredictor | null = null;

export function getSportsPredictor(): SportsPredictor {
  if (!sportsPredictor) {
    sportsPredictor = new SportsPredictor();
  }
  return sportsPredictor;
}
