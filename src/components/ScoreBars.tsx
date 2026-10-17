import { BucketStat } from '../utils/playerStats';

// Horizontal diverging bars (score right of centre = positive, left = negative)
function ScoreBars({ rows }: { rows: BucketStat[] }) {
  const maxAbs = Math.max(...rows.map(r => Math.abs(r.score)), 1);

  return (
    <div className="score-bars">
      {rows.map(row => {
        const width = (Math.abs(row.score) / maxAbs) * 50;
        const empty = row.games === 0;
        return (
          <div key={row.label} className={`score-bar-row${empty ? ' empty' : ''}`}>
            <div className="score-bar-label">{row.label}</div>
            <div className="score-bar-track">
              {!empty && (
                <div
                  className={`score-bar-fill ${row.score >= 0 ? 'positive' : 'negative'}`}
                  style={{ width: `${width}%` }}
                />
              )}
            </div>
            <div className="score-bar-value">
              {empty ? (
                '—'
              ) : (
                <>
                  <span className={row.score >= 0 ? 'positive' : 'negative'}>
                    {row.score > 0 ? '+' : ''}
                    {row.score}
                  </span>
                  <span className="score-bar-games">{row.games} 場</span>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default ScoreBars;
