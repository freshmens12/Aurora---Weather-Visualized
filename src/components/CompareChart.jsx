import { useMemo, useRef, useState } from "react";

// Two-series daily-max temperature comparison (custom SVG).
// Palette validated for CVD + contrast on the dark surface:
// series 1 blue #3987e5, series 2 amber #c98500. Legend always present;
// line-end direct labels; shared crosshair tooltip shows both values.

const W = 860;
const H = 250;
const PAD = { top: 24, right: 96, bottom: 30, left: 44 };
const COLORS = ["var(--series-1)", "var(--series-2)"];

const DAY_FMT = new Intl.DateTimeFormat("en", { weekday: "short" });

export default function CompareChart({ days, seriesA, seriesB, nameA, nameB, fmt = (v) => `${Math.round(v)}°` }) {
  const svgRef = useRef(null);
  const [hover, setHover] = useState(null);

  const model = useMemo(() => {
    if (!days?.length) return null;
    const all = [...seriesA, ...seriesB];
    const min = Math.floor(Math.min(...all) - 1);
    const max = Math.ceil(Math.max(...all) + 1);
    const span = Math.max(max - min, 1);
    const iw = W - PAD.left - PAD.right;
    const ih = H - PAD.top - PAD.bottom;
    const x = (i) => PAD.left + (i / (days.length - 1)) * iw;
    const y = (v) => PAD.top + (1 - (v - min) / span) * ih;
    const toPts = (arr) => arr.map((v, i) => ({ x: x(i), y: y(v), v }));
    const ticks = [];
    const step = span <= 8 ? 2 : span <= 30 ? 4 : span <= 60 ? 10 : 20;
    for (let t = Math.ceil(min / step) * step; t <= max; t += step) {
      ticks.push({ value: t, y: y(t) });
    }
    return { a: toPts(seriesA), b: toPts(seriesB), ticks };
  }, [days, seriesA, seriesB]);

  if (!model) return null;
  const { a, b, ticks } = model;
  const path = (pts) => pts.map((p, i) => `${i ? "L" : "M"} ${p.x} ${p.y}`).join(" ");
  const baseline = H - PAD.bottom;

  const onMove = (e) => {
    const rect = svgRef.current.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    let idx = 0;
    for (let i = 0; i < a.length; i++) {
      if (Math.abs(a[i].x - px) < Math.abs(a[idx].x - px)) idx = i;
    }
    setHover(idx);
  };

  return (
    <div className="chart-wrap">
      <div className="legend">
        <span className="legend-item">
          <i style={{ background: COLORS[0] }} /> {nameA}
        </span>
        <span className="legend-item">
          <i style={{ background: COLORS[1] }} /> {nameB}
        </span>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="hourly-chart"
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
        role="img"
        aria-label={`Daily maximum temperature, ${nameA} versus ${nameB}`}
      >
        {ticks.map((t) => (
          <g key={t.value}>
            <line x1={PAD.left} x2={W - PAD.right} y1={t.y} y2={t.y} className="gridline" />
            <text x={PAD.left - 8} y={t.y + 4} className="axis-text" textAnchor="end">
              {fmt(t.value)}
            </text>
          </g>
        ))}
        <line x1={PAD.left} x2={W - PAD.right} y1={baseline} y2={baseline} className="axis-baseline" />

        {days.map((d, i) => (
          <text key={d} x={a[i].x} y={H - 8} className="axis-text" textAnchor="middle">
            {i === 0 ? "Today" : DAY_FMT.format(new Date(`${d}T12:00:00`))}
          </text>
        ))}

        {[a, b].map((pts, s) => (
          <g key={s}>
            <path key={`l-${s}-${days[0]}`} d={path(pts)} fill="none" stroke={COLORS[s]} strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round" className="line-draw" pathLength="1"
              style={{ animationDelay: `${s * 0.25}s` }} />
            <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r="4.5"
              fill={COLORS[s]} className="ringed" />
            <text x={pts[pts.length - 1].x + 10} y={pts[pts.length - 1].y + 4}
              className="line-end-label">
              {s === 0 ? nameA : nameB}
            </text>
          </g>
        ))}

        {hover != null && (
          <g>
            <line x1={a[hover].x} x2={a[hover].x} y1={PAD.top} y2={baseline} className="crosshair" />
            <circle cx={a[hover].x} cy={a[hover].y} r="6" fill={COLORS[0]} className="ringed" />
            <circle cx={b[hover].x} cy={b[hover].y} r="6" fill={COLORS[1]} className="ringed" />
          </g>
        )}
      </svg>

      {hover != null && (
        <div
          className="chart-tooltip"
          style={{
            left: `${(a[hover].x / W) * 100}%`,
            top: `${(Math.min(a[hover].y, b[hover].y) / H) * 100}%`,
          }}
        >
          <strong>
            {nameA}: {fmt(a[hover].v)}
          </strong>
          <strong>
            {nameB}: {fmt(b[hover].v)}
          </strong>
          <span>
            {hover === 0 ? "Today" : DAY_FMT.format(new Date(`${days[hover]}T12:00:00`))}
          </span>
        </div>
      )}
    </div>
  );
}