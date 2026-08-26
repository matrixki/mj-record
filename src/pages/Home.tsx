import { useEffect, useState } from 'react';
import { fetchSheetData } from '../utils/fetchSheetData';
import { PlayerRecord, LatestGame } from '../types/PlayerRecord';
import './Home.css';

function Home() {
  const [players, setPlayers] = useState<PlayerRecord[]>([]);
  const [latestGame, setLatestGame] = useState<LatestGame | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await fetchSheetData();
        setPlayers(data.players);
        setLatestGame(data.latestGame);
        setLoading(false);
      } catch (err) {
        setError('Failed to load player data');
        setLoading(false);
        console.error(err);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading player records...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="error">{error}</div>
      </div>
    );
  }

  // Top 5 by total score
  const topByScore = [...players]
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, 5);

  // Top 5 by win percentage
  const topByWinRate = [...players]
    .map(player => ({
      ...player,
      winRate: player.wins + player.losses > 0
        ? (player.wins / (player.wins + player.losses)) * 100
        : 0,
      totalGames: player.wins + player.losses
    }))
    .filter(player => player.totalGames >= 5) // Only players with at least 5 games
    .sort((a, b) => b.winRate - a.winRate)
    .slice(0, 5);

  // Top 5 by games attended
  const topByGamesAttended = [...players]
    .sort((a, b) => b.gamesCount - a.gamesCount)
    .slice(0, 5);

  // Players' performance this month
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1; // 1-12

  const playersWithMonthlyForm = players
    .map(player => {
      const thisMonthGames = player.games.filter(game => {
        // Parse date like "1/5" or "12/25"
        const parts = game.date.split('/');
        if (parts.length >= 1) {
          const month = parseInt(parts[0]);
          return month === currentMonth;
        }
        return false;
      });

      const monthScore = thisMonthGames.reduce((sum, game) => sum + game.score, 0);

      return {
        ...player,
        monthScore,
        monthGames: thisMonthGames.length
      };
    })
    .filter(player => player.monthGames > 0);

  // Hottest players this month (top 3)
  const hottestPlayers = [...playersWithMonthlyForm]
    .sort((a, b) => b.monthScore - a.monthScore)
    .slice(0, 3);

  // Coldest players this month: lost the most (bottom 3)
  const coldestPlayers = [...playersWithMonthlyForm]
    .sort((a, b) => a.monthScore - b.monthScore)
    .slice(0, 3);

  // Recent form: score over each player's last 8 games (regardless of date)
  const recentFormPlayers = players
    .filter(player => player.games.length >= 8)
    .map(player => {
      const recentGames = player.games.slice(-8);
      const recentScore = recentGames.reduce((sum, game) => sum + game.score, 0);
      return { ...player, recentScore };
    })
    .sort((a, b) => b.recentScore - a.recentScore)
    .slice(0, 3);

  // Latest game session, sorted by score
  const latestGameResults = latestGame
    ? [...latestGame.results].sort((a, b) => b.score - a.score)
    : [];

  return (
    <div className="container">
      <h1>麻將戰績 2026</h1>

      {/* Description */}
      <section className="description-section">
        <p className="description-text">
          歡迎來到麻將戰績排行榜！這裡記錄著所有玩家的年度戰績，包括總分排名、勝率統計、出席記錄以及本月最火熱的選手。
          讓我們一起見證誰是真正的麻將王者！
        </p>
      </section>

      {/* Latest Game Session */}
      {latestGame && (
        <section className="latest-game-section">
          <h2>🀄 最近一場戰績 ({latestGame.date})</h2>
          <div className="latest-game-list">
            {latestGameResults.map((result, index) => (
              <div key={index} className="latest-game-card">
                <div className="latest-game-name">{result.name}</div>
                <div className={`latest-game-score ${result.score >= 0 ? 'positive' : 'negative'}`}>
                  {result.score > 0 ? '+' : ''}{result.score}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Top 5 by Total Score */}
      <section className="leaderboard-section">
        <h2>🏆 年度總分前五名</h2>
        <div className="leaderboard">
          {topByScore.map((player, index) => (
            <div key={index} className="leaderboard-card">
              <div className="rank">#{index + 1}</div>
              <div className="player-info">
                <div className="player-name">{player.name}</div>
                <div className={`score ${player.totalScore >= 0 ? 'positive' : 'negative'}`}>
                  {player.totalScore > 0 ? '+' : ''}{player.totalScore}
                </div>
              </div>
              <div className="stats">
                <span className="wins">{player.wins}勝</span>
                <span className="losses">{player.losses}敗</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Top 5 by Win Rate */}
      <section className="leaderboard-section">
        <h2>
          📊 勝率前五名
          <span className="info-icon" title="至少需出賽 5 場才列入排名">ⓘ</span>
        </h2>
        <div className="leaderboard">
          {topByWinRate.map((player, index) => (
            <div key={index} className="leaderboard-card">
              <div className="rank">#{index + 1}</div>
              <div className="player-info">
                <div className="player-name">{player.name}</div>
                <div className="win-rate">{player.winRate.toFixed(1)}%</div>
              </div>
              <div className="stats">
                <span className="wins">{player.wins}勝</span>
                <span className="losses">{player.losses}敗</span>
                <span className="games">({player.totalGames}場)</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Top 3 by Games Attended */}
      <section className="attendance-section">
        <h2>🎯 年度出席王前五名</h2>
        <div className="attendance-list">
          {topByGamesAttended.map((player, index) => (
            <div key={index} className="attendance-card">
              <div className="attendance-rank">#{index + 1}</div>
              <div className="attendance-info">
                <div className="attendance-name">{player.name}</div>
                <div className="attendance-count">{player.gamesCount} 場</div>
              </div>
              <div className="stats">
                <span className="wins">{player.wins}勝</span>
                <span className="losses">{player.losses}敗</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Hottest Players This Month (Top 3) */}
      {hottestPlayers.length > 0 && (
        <section className="hottest-section">
          <h2>🔥 本月最火熱選手 ({currentMonth}月)</h2>
          <div className="hottest-list">
            {hottestPlayers.map((player, index) => (
              <div key={index} className="hottest-card">
                <div className="hottest-rank">#{index + 1}</div>
                <div className="hottest-name">{player.name}</div>
                <div className={`hottest-score ${player.monthScore >= 0 ? 'positive' : 'negative'}`}>
                  {player.monthScore > 0 ? '+' : ''}{player.monthScore}
                </div>
                <div className="hottest-stats">
                  本月共 {player.monthGames} 場比賽
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Coldest Players This Month: Top 3 by biggest loss */}
      {coldestPlayers.length > 0 && (
        <section className="worst-form-section">
          <h2>
            ❄️ 當月手感最冷 ({currentMonth}月)
          </h2>
          <div className="worst-form-list">
            {coldestPlayers.map((player, index) => (
              <div key={index} className="worst-form-card">
                <div className="worst-form-rank">#{index + 1}</div>
                <div className="worst-form-name">{player.name}</div>
                <div className={`worst-form-score ${player.monthScore >= 0 ? 'positive' : 'negative'}`}>
                  {player.monthScore > 0 ? '+' : ''}{player.monthScore}
                </div>
                <div className="worst-form-stats">
                  本月共 {player.monthGames} 場比賽
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Best Recent Form: Top 3 by score over last 8 games */}
      {recentFormPlayers.length > 0 && (
        <section className="recent-form-section">
          <h2>
            📈 近況最好
            <span className="info-icon" title="統計每位玩家最近 8 場比賽的總分，需累積滿 8 場才列入排名">ⓘ</span>
          </h2>
          <div className="recent-form-list">
            {recentFormPlayers.map((player, index) => (
              <div key={index} className="recent-form-card">
                <div className="recent-form-rank">#{index + 1}</div>
                <div className="recent-form-name">{player.name}</div>
                <div className={`recent-form-score ${player.recentScore >= 0 ? 'positive' : 'negative'}`}>
                  {player.recentScore > 0 ? '+' : ''}{player.recentScore}
                </div>
                <div className="recent-form-stats">近 8 場比賽</div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default Home;
