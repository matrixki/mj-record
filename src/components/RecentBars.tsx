import { TrendPoint } from '../utils/playerStats';

const WIDTH = 600;
const HEIGHT = 200;
const MID = 98;
const MAX_BAR = 62;

function formatScore(score: number): string {
  return `${score > 0 ? '+' : ''}${score}`;
}

// One bar per recent game: up/green for a win, down/red for a loss
function RecentBars({ points }: { points: TrendPoint[] }) {
  const maxAbs = Math.max(...points.map(p => Math.abs(p.score)), 1);
  const slot = WIDTH / points.length;
  const barWidth = Math.min(slot * 0.55, 56);

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="recent-bars" role="img" aria-label="最近幾場的單場分數">
      <line x1={0} x2={WIDTH} y1={MID} y2={MID} className="trend-zero" />
      {points.map((p, i) => {
        const cx = slot * i + slot / 2;
        const h = (Math.abs(p.score) / maxAbs) * MAX_BAR;
        const win = p.score > 0;
        return (
          <g key={p.index}>
            <rect x={cx - barWidth / 2} y={win ? MID - h : MID} width={barWidth} height={h} rx={3} className={win ? 'bar-win' : 'bar-loss'} />
            <text x={cx} y={win ? MID - h - 6 : MID + h + 14} textAnchor="middle" className="bar-value">
              {formatScore(p.score)}
            </text>
            <text x={cx} y={HEIGHT - 6} textAnchor="middle" className="trend-label">
              {p.date}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default RecentBars;
