export interface PlayerRecord {
  name: string;
  gamesCount: number;
  totalScore: number;
  wins: number;
  losses: number;
  games: GameScore[];
}

export interface GameScore {
  date: string;
  venue: string;
  score: number;
}

export interface LatestGameResult {
  name: string;
  score: number;
}

export interface LatestGame {
  date: string;
  venue: string;
  results: LatestGameResult[];
}

export interface GameSession {
  date: string;
  venue: string; // empty when the sheet has no venue for that game
  results: LatestGameResult[];
}

export interface SheetData {
  players: PlayerRecord[];
  dates: string[];
  latestGame: LatestGame | null;
  sessions: GameSession[];
}
