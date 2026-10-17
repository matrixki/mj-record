import { GameSession } from '../types/PlayerRecord';

// The sheet only stores dates like "1/5", so the year is fixed per sheet
const SHEET_YEAR = 2026;

// Display order: Monday first, Sunday last (Date.getDay(): 0 = Sunday)
export const WEEKDAYS = [
  { day: 1, label: '週一' },
  { day: 2, label: '週二' },
  { day: 3, label: '週三' },
  { day: 4, label: '週四' },
  { day: 5, label: '週五' },
  { day: 6, label: '週六' },
  { day: 0, label: '週日' }
];

export interface WeekdayBest {
  label: string;
  // null when nobody has played on this weekday yet
  player: string | null;
  totalScore: number;
  games: number;
}

export function weekdayOf(date: string): number | null {
  const [month, day] = date.split('/').map(Number);
  if (!month || !day) return null;
  return new Date(SHEET_YEAR, month - 1, day).getDay();
}

// Days since January 1 of the sheet's year (0 = Jan 1), or null for an unparseable date
export function dayOfYear(date: string): number | null {
  const [month, day] = date.split('/').map(Number);
  if (!month || !day) return null;
  return Math.round((Date.UTC(SHEET_YEAR, month - 1, day) - Date.UTC(SHEET_YEAR, 0, 1)) / 86400000);
}

// Days from Jan 1 up to today, clamped to the sheet's year (e.g. after the year ends, the full year)
export function daysIntoYear(now: Date = new Date()): number {
  if (now.getFullYear() > SHEET_YEAR) return dayOfYear('12/31') ?? 364;
  if (now.getFullYear() < SHEET_YEAR) return 0;
  return dayOfYear(`${now.getMonth() + 1}/${now.getDate()}`) ?? 0;
}

// For each weekday, the player with the highest total score on that weekday
export function computeBestByWeekday(sessions: GameSession[]): WeekdayBest[] {
  const totals: Record<number, Record<string, { score: number; games: number }>> = {};

  for (const session of sessions) {
    const day = weekdayOf(session.date);
    if (day === null) continue;
    if (!totals[day]) totals[day] = {};

    for (const { name, score } of session.results) {
      if (!totals[day][name]) totals[day][name] = { score: 0, games: 0 };
      totals[day][name].score += score;
      totals[day][name].games += 1;
    }
  }

  return WEEKDAYS.map(({ day, label }) => {
    let best: WeekdayBest = { label, player: null, totalScore: 0, games: 0 };
    for (const [name, { score, games }] of Object.entries(totals[day] ?? {})) {
      if (best.player === null || score > best.totalScore) {
        best = { label, player: name, totalScore: score, games };
      }
    }
    return best;
  });
}
