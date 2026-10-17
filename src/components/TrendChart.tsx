import { useState } from 'react';
import { TrendPoint } from '../utils/playerStats';
import { dayOfYear } from '../utils/weekday';

const WIDTH = 600;
const HEIGHT = 260;
const PAD = { left: 48, right: 18, top: 14, bottom: 28 };

// All the games a player had on one date, collapsed into a single point
interface DayPoint {
  date: string;
  day: number; // days since Jan 1
  games: number;
  score: number; // total for the day
  total: number; // cumulative score at the end of the day
  venues: string[];
}

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

function groupByDay(points: TrendPoint[]): DayPoint[] {
  const days: DayPoint[] = [];
  for (const p of points) {
    const day = dayOfYear(p.date);
    if (day === null) continue;
    const last = days[days.length - 1];
    if (last && last.date === p.date) {
      last.games += 1;
      last.score += p.score;
      last.total = p.total;
      if (p.venue && !last.venues.includes(p.venue)) last.venues.push(p.venue);
    } else {
      days.push({ date: p.date, day, games: 1, score: p.score, total: p.total, venues: p.venue ? [p.venue] : [] });
    }
  }
  return days;
}

// Cumulative score over time: the x axis runs from Jan 1 to `endDay` (days since Jan 1, normally today)
function TrendChart({ points, endDay }: { points: TrendPoint[]; endDay: number }) {
  const [hover, setHover] = useState<number | null>(null);

  const days = groupByDay(points);
  if (days.length === 0) return null;

  const xMax = Math.max(endDay, days[days.length - 1].day, 1);

  const totals = [0, ...days.map(d => d.total)];
  const rawMin = Math.min(...totals);
  const rawMax = Math.max(...totals);
  const step = niceStep(Math.max(rawMax - rawMin, 1), 4);
  const yMin = Math.floor(rawMin / step) * step;
  const yMax = Math.ceil(rawMax / step) * step;

  const x = (day: number) => PAD.left + (day / xMax) * (WIDTH - PAD.left - PAD.right);
  const y = (value: number) =>
    PAD.top + (1 - (value - yMin) / (yMax - yMin || 1)) * (HEIGHT - PAD.top - PAD.bottom);

  const yTicks: number[] = [];
  for (let v = yMin; v <= yMax + step / 2; v += step) yTicks.push(v);

  // One tick at the start of each month that falls inside the range
  const monthTicks: { label: string; day: number }[] = [];
  for (let month = 1; month <= 12; month++) {
    const day = dayOfYear(`${month}/1`);
    if (day !== null && day <= xMax) monthTicks.push({ label: `${month}月`, day });
  }

  const line = days.map(d => `${x(d.day)},${y(d.total)}`).join(' ');
  const selected = days[hover ?? days.length - 1];

  function handleMove(event: React.PointerEvent<SVGSVGElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const px = ((event.clientX - rect.left) / rect.width) * WIDTH;
    const day = ((px - PAD.left) / (WIDTH - PAD.left - PAD.right)) * xMax;
    let nearest = 0;
    days.forEach((d, i) => {
      if (Math.abs(d.day - day) < Math.abs(days[nearest].day - day)) nearest = i;
    });
    setHover(nearest);
  }

  return (
    <div className="trend-chart">
      <div className="trend-readout">
        {selected.date}
        {selected.venues.length > 0 && ` · ${selected.venues.join('、')}`}
        {selected.games > 1 && ` · 當天 ${selected.games} 場`} · 當天{' '}
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
        {monthTicks.map(t => (
          <g key={t.label}>
            <line x1={x(t.day)} x2={x(t.day)} y1={PAD.top} y2={HEIGHT - PAD.bottom} className="trend-grid" />
            <text x={x(t.day)} y={HEIGHT - 8} textAnchor="start" className="trend-label">
              {t.label}
            </text>
          </g>
        ))}
        <polyline points={line} className="trend-line" />
        {days.length <= 60 && days.map(d => <circle key={d.date} cx={x(d.day)} cy={y(d.total)} r={2.5} className="trend-dot" />)}
        <line x1={x(selected.day)} x2={x(selected.day)} y1={PAD.top} y2={HEIGHT - PAD.bottom} className="trend-cursor" />
        <circle cx={x(selected.day)} cy={y(selected.total)} r={5} className="trend-point" />
      </svg>
    </div>
  );
}

export default TrendChart;
