import { useState } from 'react';
import { TrendPoint } from '../utils/playerStats';

const WIDTH = 600;
const HEIGHT = 260;
const PAD = { left: 48, right: 14, top: 14, bottom: 28 };

// A round step (1, 2, 5 x 10^k) giving roughly `target` ticks across the range
function niceStep(range: number, target: number): number {
  const rough = range / target;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rough)));
  const fraction = rough / magnitude;
  const nice = fraction < 1.5 ? 1 : fraction < 3 ? 2 : fraction < 7 ? 5 : 10;
  return nice * magnitude;
}

function formatScore(score: number): string {
  return `${score > 0 ? '+' : ''}${score}`;
}

// Cumulative score line; the x axis is the game number, not the date
function TrendChart({ points }: { points: TrendPoint[] }) {
  const [hover, setHover] = useState<number | null>(null);

  const totals = [0, ...points.map(p => p.total)];
  const rawMin = Math.min(...totals);
  const rawMax = Math.max(...totals);
  const step = niceStep(Math.max(rawMax - rawMin, 1), 4);
  const yMin = Math.floor(rawMin / step) * step;
  const yMax = Math.ceil(rawMax / step) * step;

  const n = points.length;
  const x = (index: number) =>
    n === 1 ? (PAD.left + WIDTH - PAD.right) / 2 : PAD.left + ((index - 1) / (n - 1)) * (WIDTH - PAD.left - PAD.right);
  const y = (value: number) =>
    PAD.top + (1 - (value - yMin) / (yMax - yMin || 1)) * (HEIGHT - PAD.top - PAD.bottom);

  const yTicks: number[] = [];
  for (let v = yMin; v <= yMax + step / 2; v += step) yTicks.push(v);

  const xStep = Math.max(1, Math.round(n / 6));
  const xTicks = points.filter(p => p.index === 1 || p.index === n || p.index % xStep === 0);

  const line = points.map(p => `${x(p.index)},${y(p.total)}`).join(' ');
  const selected = points[(hover ?? n) - 1];

  function handleMove(event: React.PointerEvent<SVGSVGElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const px = ((event.clientX - rect.left) / rect.width) * WIDTH;
    const ratio = (px - PAD.left) / (WIDTH - PAD.left - PAD.right);
    const index = Math.round(ratio * (n - 1)) + 1;
    setHover(Math.min(n, Math.max(1, index)));
  }

  return (
    <div className="trend-chart">
      <div className="trend-readout">
        第 {selected.index} 場 · {selected.date}
        {selected.venue && ` · ${selected.venue}`} · 本場{' '}
        <span className={selected.score >= 0 ? 'positive' : 'negative'}>{formatScore(selected.score)}</span> · 累積{' '}
        <span className={selected.total >= 0 ? 'positive' : 'negative'}>{formatScore(selected.total)}</span>
      </div>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label="累積分數走勢圖"
        onPointerMove={handleMove}
        onPointerLeave={() => setHover(null)}
      >
        {yTicks.map(v => (
          <g key={v}>
            <line x1={PAD.left} x2={WIDTH - PAD.right} y1={y(v)} y2={y(v)} className={v === 0 ? 'trend-zero' : 'trend-grid'} />
            <text x={PAD.left - 8} y={y(v) + 4} textAnchor="end" className="trend-label">
              {v}
            </text>
          </g>
        ))}
        {xTicks.map(p => (
          <text key={p.index} x={x(p.index)} y={HEIGHT - 8} textAnchor="middle" className="trend-label">
            {p.index}
          </text>
        ))}
        <polyline points={line} className="trend-line" />
        {n <= 40 && points.map(p => <circle key={p.index} cx={x(p.index)} cy={y(p.total)} r={2.5} className="trend-dot" />)}
        <line x1={x(selected.index)} x2={x(selected.index)} y1={PAD.top} y2={HEIGHT - PAD.bottom} className="trend-cursor" />
        <circle cx={x(selected.index)} cy={y(selected.total)} r={5} className="trend-point" />
      </svg>
    </div>
  );
}

export default TrendChart;
