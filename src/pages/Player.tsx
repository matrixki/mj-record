import { useEffect, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useSheetData } from '../context/SheetDataContext';
import { computePlayerStats, MIN_GAMES_FOR_ANALYSIS, RECENT_GAMES } from '../utils/playerStats';
import { MIN_GAMES_TOGETHER } from '../utils/nemesis';
import { daysIntoYear } from '../utils/weekday';
import TrendChart from '../components/TrendChart';
import RecentBars from '../components/RecentBars';
import ScoreBars from '../components/ScoreBars';
import './Home.css';
import './Player.css';

function formatScore(score: number): string {
  return `${score > 0 ? '+' : ''}${score}`;
}

function Player() {
  const { name = '' } = useParams();
  const navigate = useNavigate();
  const { data, loading, error } = useSheetData();

  const stats = useMemo(
    () => (data ? computePlayerStats(name, data.sessions) : null),
    [data, name]
  );

  useEffect(() => {
    document.title = `${name} 戰績走勢`;
    return () => {
      document.title = 'MJ EVERYDAY';
    };
  }, [name]);

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading player records...</div>
      </div>
    );
  }

  if (error || !data || !stats) {
    return (
      <div className="container">
        <div className="error">{error ?? 'Failed to load player data'}</div>
      </div>
    );
  }

  const known = data.players.some(p => p.name === name);
  if (!known) {
    return (
      <div className="container">
        <div className="player-nav">
          <Link to="/" className="back-link">← 回首頁</Link>
        </div>
        <div className="error">找不到玩家「{name}」</div>
      </div>
    );
  }

  const switchOptions = data.players
    .filter(p => p.gamesCount > 0 || p.name === name)
    .sort((a, b) => b.gamesCount - a.gamesCount);
  const recentScore = stats.recent.reduce((sum, p) => sum + p.score, 0);
  const activeMonths = stats.monthly.filter(m => m.games > 0);

  return (
    <div className="container">
      <div className="player-nav">
        <Link to="/" className="back-link">← 回首頁</Link>
        <select
          className="player-select"
          value={name}
          onChange={event => navigate(`/player/${encodeURIComponent(event.target.value)}`)}
          aria-label="切換玩家"
        >
          {switchOptions.map(p => (
            <option key={p.name} value={p.name}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <h1>{name} 戰績走勢</h1>

      {stats.games === 0 ? (
        <section className="player-section">
          <p className="player-note">今年還沒有出賽紀錄。</p>
        </section>
      ) : (
        <>
          {stats.insufficient && (
            <section className="player-notice">
              ⚠️ 資料不足：今年只有 {stats.games} 場（至少 {MIN_GAMES_FOR_ANALYSIS} 場才有參考價值），
              圖表僅供參考，也不列入對手分析。
            </section>
          )}

          {/* Overview */}
          <section className="player-section">
            <h2>📋 年度總覽</h2>
            <div className="overview-grid">
              <div className="overview-card">
                <div className="overview-label">總分</div>
                <div className={`overview-value ${stats.totalScore >= 0 ? 'positive' : 'negative'}`}>
                  {formatScore(stats.totalScore)}
                </div>
              </div>
              <div className="overview-card">
                <div className="overview-label">勝 / 敗</div>
                <div className="overview-value">
                  <span className="positive">{stats.wins}</span> / <span className="negative">{stats.losses}</span>
                </div>
              </div>
              <div className="overview-card">
                <div className="overview-label">勝率</div>
                <div className="overview-value">{stats.winRate.toFixed(1)}%</div>
              </div>
              <div className="overview-card">
                <div className="overview-label">出場數</div>
                <div className="overview-value">{stats.games} 場</div>
              </div>
              <div className="overview-card">
                <div className="overview-label">平均分</div>
                <div className={`overview-value ${stats.avgScore >= 0 ? 'positive' : 'negative'}`}>
                  {formatScore(Number(stats.avgScore.toFixed(1)))}
                </div>
              </div>
              {stats.best && (
                <div className="overview-card">
                  <div className="overview-label">單場最高</div>
                  <div className="overview-value positive">{formatScore(stats.best.score)}</div>
                  <div className="overview-sub">{stats.best.date}</div>
                </div>
              )}
              {stats.worst && (
                <div className="overview-card">
                  <div className="overview-label">單場最低</div>
                  <div className="overview-value negative">{formatScore(stats.worst.score)}</div>
                  <div className="overview-sub">{stats.worst.date}</div>
                </div>
              )}
            </div>
          </section>

          {/* Cumulative trend */}
          <section className="player-section">
            <h2>
              📈 累積分數走勢
              <span className="info-icon" title="X 軸為時間（從 1 月 1 日到今天），Y 軸為累積總分。同一天多場會合併成一個點。滑過或點選圖表可查看每一天">ⓘ</span>
            </h2>
            <TrendChart points={stats.trend} endDay={daysIntoYear()} />
          </section>

          {/* Recent form */}
          <section className="player-section">
            <h2>
              🔥 近況
              <span className="info-icon" title={`最近 ${RECENT_GAMES} 場的單場分數`}>ⓘ</span>
            </h2>
            <p className="player-note">
              最近 {stats.recent.length} 場共{' '}
              <strong className={recentScore >= 0 ? 'positive' : 'negative'}>{formatScore(recentScore)}</strong>
            </p>
            <RecentBars points={stats.recent} />
          </section>

          {/* Streaks */}
          <section className="player-section">
            <h2>🔗 連勝 / 連敗</h2>
            <div className="overview-grid streak-grid">
              <div className="overview-card">
                <div className="overview-label">最長連勝</div>
                <div className="overview-value positive">{stats.longestWin} 場</div>
              </div>
              <div className="overview-card">
                <div className="overview-label">最長連敗</div>
                <div className="overview-value negative">{stats.longestLoss} 場</div>
              </div>
              <div className="overview-card">
                <div className="overview-label">目前狀態</div>
                <div className={`overview-value ${stats.current.type === 'win' ? 'positive' : 'negative'}`}>
                  {stats.current.type === 'win' ? '連勝' : '連敗'} {stats.current.length} 場
                </div>
              </div>
            </div>
          </section>

          {/* Month / weekday breakdowns */}
          <section className="player-section">
            <h2>🗓️ 每月表現</h2>
            <ScoreBars rows={activeMonths} />
          </section>

          <section className="player-section">
            <h2>📅 星期表現</h2>
            <ScoreBars rows={stats.weekday} />
          </section>

          {/* Opponents */}
          {!stats.insufficient && (
            <section className="player-section">
              <h2>
                ⚔️ 對手分析
                <span className="info-icon" title={`同場出賽至少 ${MIN_GAMES_TOGETHER} 場的對手才列入。平均分與整體平均相比，越低代表跟他同場越吃虧`}>ⓘ</span>
              </h2>
              {stats.opponents.length === 0 ? (
                <p className="player-note">還沒有跟任何人同場滿 {MIN_GAMES_TOGETHER} 場。</p>
              ) : (
                <>
                  <div className="matchup-highlights">
                    {stats.nemesis && (
                      <div className="matchup-card nemesis">
                        <div className="matchup-title">😈 剋星</div>
                        <div className="matchup-name">{stats.nemesis.name}</div>
                        <div className="matchup-detail">
                          同場均分 {formatScore(Number(stats.nemesis.avgScore.toFixed(1)))}（{stats.nemesis.games} 場）
                        </div>
                      </div>
                    )}
                    {stats.victim && (
                      <div className="matchup-card victim">
                        <div className="matchup-title">😎 苦主</div>
                        <div className="matchup-name">{stats.victim.name}</div>
                        <div className="matchup-detail">
                          同場均分 {formatScore(Number(stats.victim.avgScore.toFixed(1)))}（{stats.victim.games} 場）
                        </div>
                      </div>
                    )}
                  </div>
                  <table className="opponent-table">
                    <thead>
                      <tr>
                        <th>對手</th>
                        <th>同場</th>
                        <th>同場均分</th>
                        <th>與整體均分差</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.opponents.map(o => (
                        <tr key={o.name}>
                          <td>{o.name}</td>
                          <td>{o.games} 場</td>
                          <td className={o.avgScore >= 0 ? 'positive' : 'negative'}>{formatScore(Number(o.avgScore.toFixed(1)))}</td>
                          <td className={o.diff >= 0 ? 'positive' : 'negative'}>{formatScore(Number(o.diff.toFixed(1)))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}

export default Player;
