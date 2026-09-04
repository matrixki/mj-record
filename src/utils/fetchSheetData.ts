import { SheetData, PlayerRecord, GameSession } from '../types/PlayerRecord';

const SHEET_ID = '1-aLG1gcyNOYVY-vBKaO1QdBae3RA43ltCnyOKLWcc2o';
const GID = '825955046'; // 2026 sheet gid

export async function fetchSheetData(): Promise<SheetData> {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`;

  try {
    const response = await fetch(url);
    const text = await response.text();

    // Parse CSV
    const lines = text.split('\n').map(line => {
      // Simple CSV parser that handles quoted values
      const values: string[] = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());
      return values;
    });

    // Row 1 (index 0): Historical high score
    // Row 2 (index 1): Historical worst score
    // Row 3 (index 2): Number of games
    // Row 4 (index 3): Total scores
    // Row 5 (index 4): Wins
    // Row 6 (index 5): Losses
    // Row 7 (index 6): Player names
    // Row 8+ (index 7+): Game data

    const playerNames = lines[6]; // Row 7 has player names
    const gamesCountRow = lines[2]; // Row 3 has number of games
    const totalScores = lines[3]; // Row 4 has total scores
    const winsRow = lines[4]; // Row 5 has wins
    const lossesRow = lines[5]; // Row 6 has losses

    const dates: string[] = [];
    const sessions: GameSession[] = [];

    // Build one session per data row (row 8 onwards / index 7+), each
    // holding every player's score for that game
    for (let rowIndex = 7; rowIndex < lines.length; rowIndex++) {
      const row = lines[rowIndex];
      if (!row || row.length === 0 || !row[1]) continue;

      const date = row[1]; // Date is in column B (index 1)
      if (!dates.includes(date)) {
        dates.push(date);
      }

      const results = [];
      for (let colIndex = 2; colIndex < playerNames.length; colIndex++) {
        const name = playerNames[colIndex];
        if (!name) continue;

        const scoreStr = row[colIndex];
        if (scoreStr) {
          const score = Number(scoreStr);
          if (!isNaN(score) && score !== 0) {
            results.push({ name, score });
          }
        }
      }

      if (results.length > 0) {
        sessions.push({ date, results });
      }
    }

    // Extract player data (skip first 2 columns: Row sum and 日期)
    const players: PlayerRecord[] = [];
    for (let colIndex = 2; colIndex < playerNames.length; colIndex++) {
      const name = playerNames[colIndex];
      if (!name) continue;

      const gamesCount = gamesCountRow[colIndex] ? Number(gamesCountRow[colIndex]) : 0;
      const totalScore = totalScores[colIndex] ? Number(totalScores[colIndex]) : 0;
      const wins = winsRow[colIndex] ? Number(winsRow[colIndex]) : 0;
      const losses = lossesRow[colIndex] ? Number(lossesRow[colIndex]) : 0;

      const games = sessions
        .map(session => ({
          date: session.date,
          result: session.results.find(r => r.name === name)
        }))
        .filter((entry): entry is { date: string; result: { name: string; score: number } } => !!entry.result)
        .map(entry => ({ date: entry.date, score: entry.result.score }));

      players.push({
        name,
        gamesCount,
        totalScore,
        wins,
        losses,
        games
      });
    }

    // The most recent game session (last data row with scores)
    const latestGame = sessions.length > 0 ? sessions[sessions.length - 1] : null;

    return { players, dates, latestGame, sessions };
  } catch (error) {
    console.error('Error fetching sheet data:', error);
    throw error;
  }
}
