import { PlayerRecord, GameSession } from '../types/PlayerRecord';

export interface NemesisRecord {
  player: string;
  nemesis: string;
  gamesTogether: number;
  avgScoreWithNemesis: number;
  avgScoreOverall: number;
  scoreDiff: number;
}

// A player needs at least this many games this year to be considered
const MIN_TOTAL_GAMES = 3;
// An opponent needs to have shared at least this many games for the
// comparison to be statistically meaningful
const MIN_GAMES_TOGETHER = 3;

function average(scores: number[]): number {
  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
}

// For each player, find the opponent whose presence correlates with the
// player's worst average score this year (their "剋星" / nemesis)
export function computeNemeses(players: PlayerRecord[], sessions: GameSession[]): NemesisRecord[] {
  const records: NemesisRecord[] = [];

  for (const player of players) {
    if (player.gamesCount < MIN_TOTAL_GAMES) continue;

    const opponentScores: Record<string, number[]> = {};
    const allScores: number[] = [];

    for (const session of sessions) {
      const mine = session.results.find(r => r.name === player.name);
      if (!mine) continue;
      allScores.push(mine.score);

      for (const other of session.results) {
        if (other.name === player.name) continue;
        if (!opponentScores[other.name]) opponentScores[other.name] = [];
        opponentScores[other.name].push(mine.score);
      }
    }

    if (allScores.length === 0) continue;
    const avgScoreOverall = average(allScores);

    let nemesis: string | null = null;
    let worstAvg = Infinity;
    let worstCount = 0;

    for (const [opponent, scores] of Object.entries(opponentScores)) {
      if (scores.length < MIN_GAMES_TOGETHER) continue;
      const avg = average(scores);
      if (avg < worstAvg) {
        worstAvg = avg;
        nemesis = opponent;
        worstCount = scores.length;
      }
    }

    // Only count it as a real nemesis if the player actually performs
    // worse than their overall average when facing this opponent
    if (nemesis && avgScoreOverall - worstAvg > 0) {
      records.push({
        player: player.name,
        nemesis,
        gamesTogether: worstCount,
        avgScoreWithNemesis: worstAvg,
        avgScoreOverall,
        scoreDiff: avgScoreOverall - worstAvg
      });
    }
  }

  return records.sort((a, b) => b.scoreDiff - a.scoreDiff);
}
