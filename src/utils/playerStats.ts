import { GameSession } from '../types/PlayerRecord';
import { WEEKDAYS, weekdayOf } from './weekday';
import { MIN_GAMES_TOGETHER } from './nemesis';

// Below this many games the trend is too thin to read much into
export const MIN_GAMES_FOR_ANALYSIS = 5;
export const RECENT_GAMES = 8;

export interface TrendPoint {
  index: number; // 1-based game number for this player
  date: string;
  venue: string;
  score: number;
  total: number; // cumulative score up to and including this game
}

export interface BucketStat {
  label: string;
  score: number;
  games: number;
}

export interface OpponentStat {
  name: string;
  games: number;
  avgScore: number;
  // avgScore minus the player's overall average; negative = plays worse against them
  diff: number;
}

export interface CurrentStreak {
  type: 'win' | 'loss' | null;
  length: number;
}

export interface PlayerStats {
  name: string;
  games: number;
  totalScore: number;
  wins: number;
  losses: number;
  winRate: number;
  avgScore: number;
  best: TrendPoint | null;
  worst: TrendPoint | null;
  insufficient: boolean;
  trend: TrendPoint[];
  recent: TrendPoint[];
  monthly: BucketStat[];
  weekday: BucketStat[];
  venues: BucketStat[];
  opponents: OpponentStat[]; // only opponents with enough shared games, worst first
  nemesis: OpponentStat | null;
  victim: OpponentStat | null;
  longestWin: number;
  longestLoss: number;
  current: CurrentStreak;
}

function average(scores: number[]): number {
  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
}

// A win is a game with a positive score and a loss a negative one, as in the sheet
export function computePlayerStats(name: string, sessions: GameSession[]): PlayerStats {
  const trend: TrendPoint[] = [];
  const monthly: BucketStat[] = Array.from({ length: 12 }, (_, i) => ({ label: `${i + 1}月`, score: 0, games: 0 }));
  const weekday: BucketStat[] = WEEKDAYS.map(({ label }) => ({ label, score: 0, games: 0 }));
  const venueTotals = new Map<string, BucketStat>();
  const scoresWith = new Map<string, number[]>();
  let total = 0;

  for (const session of sessions) {
    const mine = session.results.find(r => r.name === name);
    if (!mine) continue;

    total += mine.score;
    trend.push({ index: trend.length + 1, date: session.date, venue: session.venue, score: mine.score, total });

    const month = Number(session.date.split('/')[0]);
    if (month >= 1 && month <= 12) {
      monthly[month - 1].score += mine.score;
      monthly[month - 1].games += 1;
    }

    const day = weekdayOf(session.date);
    const weekdayIndex = WEEKDAYS.findIndex(w => w.day === day);
    if (weekdayIndex >= 0) {
      weekday[weekdayIndex].score += mine.score;
      weekday[weekdayIndex].games += 1;
    }

    if (session.venue) {
      const venue = venueTotals.get(session.venue) ?? { label: session.venue, score: 0, games: 0 };
      venue.score += mine.score;
      venue.games += 1;
      venueTotals.set(session.venue, venue);
    }

    for (const other of session.results) {
      if (other.name === name) continue;
      const scores = scoresWith.get(other.name) ?? [];
      scores.push(mine.score);
      scoresWith.set(other.name, scores);
    }
  }

  const games = trend.length;
  const wins = trend.filter(p => p.score > 0).length;
  const losses = trend.filter(p => p.score < 0).length;
  const avgScore = games > 0 ? total / games : 0;

  const opponents: OpponentStat[] = [];
  for (const [opponent, scores] of scoresWith) {
    if (scores.length < MIN_GAMES_TOGETHER) continue;
    const avg = average(scores);
    opponents.push({ name: opponent, games: scores.length, avgScore: avg, diff: avg - avgScore });
  }
  opponents.sort((a, b) => a.diff - b.diff);

  const nemesis = opponents.length > 0 && opponents[0].diff < 0 ? opponents[0] : null;
  const last = opponents[opponents.length - 1];
  const victim = last && last.diff > 0 ? last : null;

  // Streaks over consecutive wins / losses
  let longestWin = 0;
  let longestLoss = 0;
  let run = 0;
  let runType: 'win' | 'loss' | null = null;
  for (const point of trend) {
    const type = point.score > 0 ? 'win' : 'loss';
    run = type === runType ? run + 1 : 1;
    runType = type;
    if (type === 'win') longestWin = Math.max(longestWin, run);
    else longestLoss = Math.max(longestLoss, run);
  }

  return {
    name,
    games,
    totalScore: total,
    wins,
    losses,
    winRate: wins + losses > 0 ? (wins / (wins + losses)) * 100 : 0,
    avgScore,
    best: games > 0 ? trend.reduce((a, b) => (b.score > a.score ? b : a)) : null,
    worst: games > 0 ? trend.reduce((a, b) => (b.score < a.score ? b : a)) : null,
    insufficient: games < MIN_GAMES_FOR_ANALYSIS,
    trend,
    recent: trend.slice(-RECENT_GAMES),
    monthly,
    weekday,
    venues: [...venueTotals.values()].sort((a, b) => b.games - a.games),
    opponents,
    nemesis,
    victim,
    longestWin,
    longestLoss,
    current: { type: runType, length: run }
  };
}
