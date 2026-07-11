import { useMemo, useRef, useState } from "react";

// Single-series hourly temperature area chart (custom SVG).
// Spec: 2px line, ~10% opacity area wash, hairline gridlines, crosshair +
// tooltip on hover, marker with a surface ring, direct label on the peak only.

const W = 860;
const H = 260;
const PAD = { top: 26, right: 18, bottom: 34, left: 44 };

function formatHour(iso) {
  const h = Number(iso.slice(11, 13));
  if (h === 0) return "12 AM";
  if (h === 12) return "12 PM";
  return h < 12 ? `${h} AM` : `${h - 12} PM`;
}

// Catmull-Rom → cubic bezier for a smooth but faithful curve.
function smoothPath(pts) {
  if (pts.length < 2) return "";
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

// Metric-agnostic hourly line chart. `getValue` picks the plotted series from
// each hour; `fmt` renders values in labels, ticks, and the tooltip.
export default function HourlyChart({
  hours,
  getValue = (h) => h.temp,
  fmt = (v) => `${Math.round(v)}°`,
  showPrecip = true,
  ariaLabel = "Hourly temperature for the next 24 hours",
}) {
  const svgRef = useRef(null);
  const [hover, setHover] = useState(null);

  const model = useMemo(() => {
    if (!hours?.length) return null;
    const values = hours.map(getValue).map((v) => v ?? 0);
    const min = Math.floor(Math.min(...values) - 1);
    const max = Math.ceil(Math.max(...values) + 1);
    const span = Math.max(max - min, 1);
    const iw = W - PAD.left - PAD.right;
    const ih = H - PAD.top - PAD.bottom;
    const pts = hours.map((h, i) => ({
      x: PAD.left + (i / (hours.length - 1)) * iw,
      y: PAD.top + (1 - (values[i] - min) / span) * ih,
      ...h,
      value: values[i],
    }));
    const peak = pts.reduce((a, b) => (b.value > a.value ? b : a), pts[0]);
    const ticks = [];
    const step = span <= 6 ? 2 : span <= 14 ? 4 : span <= 40 ? 10 : 20;
    for (let t = Math.ceil(min / step) * step; t <= max; t += step) {
      ticks.push({ value: t, y: PAD.top + (1 - (t - min) / span) * ih });
    }
    return { pts, peak, ticks, line: smoothPath(pts) };
  }, [hours, getValue]);

  if (!model) return null;
  const { pts, peak, ticks, line } = model;
  const baseline = H - PAD.bottom;
  const area = `${line} L ${pts[pts.length - 1].x} ${baseline} L ${pts[0].x} ${baseline} Z`;

  const onMove = (e) => {
    const rect = svgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    let nearest = pts[0];
    for (const p of pts) if (Math.abs(p.x - x) < Math.abs(nearest.x - x)) nearest = p;
    setHover(nearest);
  };

  return (
    <div className="chart-wrap">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="hourly-chart"
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
        role="img"
        aria-label={ariaLabel}
      >
        <defs>
          <linearGradient id="tempFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--series-1)" stopOpacity="0.22" />
            <stop offset="1" stopColor="var(--series-1)" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {ticks.map((t) => (
          <g key={t.value}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={t.y}
              y2={t.y}
              className="gridline"
            />
            <text x={PAD.left - 8} y={t.y + 4} className="axis-text" textAnchor="end">
              {fmt(t.value)}
            </text>
          </g>
        ))}
        <line
          x1={PAD.left}
          x2={W - PAD.right}
          y1={baseline}
          y2={baseline}
          className="axis-baseline"
        />

        {pts.map(
          (p, i) =>
            i % 3 === 0 && (
              <text key={p.time} x={p.x} y={H - 10} className="axis-text" textAnchor="middle">
                {i === 0 ? "Now" : formatHour(p.time)}
              </text>
            )
        )}

        {/* Rain chance: faint bars rising from the baseline (max 34px at 100%) */}
        {showPrecip &&
          pts.map(
            (p, i) =>
              p.precip > 0 && (
                <rect
                  key={`pr-${p.time}`}
                  className="precip-bar"
                  x={p.x - 3.5}
                  y={baseline - (p.precip / 100) * 34}
                  width="7"
                  height={(p.precip / 100) * 34}
                  rx="2"
                  style={{ animationDelay: `${0.4 + i * 0.02}s` }}
                />
              )
          )}

        <path key={`area-${hours[0]?.time}-${ariaLabel}`} d={area} fill="url(#tempFill)" className="series-area" />
        <path key={`line-${hours[0]?.time}-${ariaLabel}`} d={line} className="series-line line-draw" pathLength="1" />

        {/* Direct label: the day's peak only */}
        <circle cx={peak.x} cy={peak.y} r="4.5" className="series-dot" />
        <text x={peak.x} y={peak.y - 12} className="peak-label" textAnchor="middle">
          {fmt(peak.value)}
        </text>

        {hover && (
          <g>
            <line
              x1={hover.x}
              x2={hover.x}
              y1={PAD.top}
              y2={baseline}
              className="crosshair"
            />
            <circle cx={hover.x} cy={hover.y} r="6" className="series-dot ringed" />
          </g>
        )}
      </svg>

      {hover && (
        <div
          className="chart-tooltip"
          style={{
            left: `${(hover.x / W) * 100}%`,
            top: `${(hover.y / H) * 100}%`,
          }}
        >
          <strong>{fmt(hover.value)}</strong>
          <span>{hover.time.slice(11) === "00:00" ? "Midnight" : formatHour(hover.time)}</span>
          <span>{hover.precip}% rain</span>
        </div>
      )}
    </div>
  );
}