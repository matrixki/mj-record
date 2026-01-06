import { SheetData, PlayerRecord } from '../types/PlayerRecord';

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

    // Row 1 (index 0): Number of games
    // Row 2 (index 1): Total scores
    // Row 3 (index 2): Wins
    // Row 4 (index 3): Losses
    // Row 5 (index 4): Player names
    // Row 6+ (index 5+): Game data

    const playerNames = lines[4]; // Row 5 has player names
    const gamesCountRow = lines[0]; // Row 1 has number of games
    const totalScores = lines[1]; // Row 2 has total scores
    const winsRow = lines[2]; // Row 3 has wins
    const lossesRow = lines[3]; // Row 4 has losses

    const players: PlayerRecord[] = [];
    const dates: string[] = [];

    // Extract player data (skip first 2 columns: Row sum and 日期)
    for (let colIndex = 2; colIndex < playerNames.length; colIndex++) {
      const name = playerNames[colIndex];
      if (!name) continue;

      const gamesCount = gamesCountRow[colIndex] ? Number(gamesCountRow[colIndex]) : 0;
      const totalScore = totalScores[colIndex] ? Number(totalScores[colIndex]) : 0;
      const wins = winsRow[colIndex] ? Number(winsRow[colIndex]) : 0;
      const losses = lossesRow[colIndex] ? Number(lossesRow[colIndex]) : 0;

      // Extract game scores from row 6 onwards (index 5+)
      const games = [];

      for (let rowIndex = 5; rowIndex < lines.length; rowIndex++) {
        const row = lines[rowIndex];
        if (row.length === 0 || !row[1]) continue;

        const date = row[1]; // Date is in column B (index 1)
        const scoreStr = row[colIndex];

        if (date && scoreStr) {
          const score = Number(scoreStr);
          if (!isNaN(score) && score !== 0) {
            games.push({ date, score });
          }

          // Collect unique dates
          if (colIndex === 2 && !dates.includes(date)) {
            dates.push(date);
          }
        }
      }

      players.push({
        name,
        gamesCount,
        totalScore,
        wins,
        losses,
        games
      });
    }

    return { players, dates };
  } catch (error) {
    console.error('Error fetching sheet data:', error);
    throw error;
  }
}
