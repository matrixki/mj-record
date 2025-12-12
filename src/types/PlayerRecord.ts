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

export interface SheetData {
  players: PlayerRecord[];
  dates: string[];
}
