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
  score: number;
}

export interface LatestGameResult {
  name: string;
  score: number;
}

export interface LatestGame {
  date: string;
  results: LatestGameResult[];
}

export interface GameSession {
  date: string;
  results: LatestGameResult[];
}

export interface SheetData {
  players: PlayerRecord[];
  dates: string[];
  latestGame: LatestGame | null;
  sessions: GameSession[];
}
