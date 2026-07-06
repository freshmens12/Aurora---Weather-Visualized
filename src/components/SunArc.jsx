// Sunrise → sunset arc showing the sun's current position across the day.
// All timestamps are Open-Meteo local ISO strings (no offset); parsing them
// the same way keeps the ratios correct regardless of the viewer's timezone.

const W = 320;
const CX = 160;
const CY = 116;
const RX = 138;
const RY = 84;

function ms(iso) {
  return new Date(iso).getTime();
}

function fmt(iso) {
  return new Date(iso).toLocaleTimeString("en", {
    hour: "numeric",
    minute: "2-digit",
  });
}

// Point on the arc for progress p (0 = sunrise/left, 1 = sunset/right).
function pointAt(p) {
  const angle = Math.PI * (1 - p); // π (left) → 0 (right)
  return {
    x: CX + RX * Math.cos(angle),
    y: CY - RY * Math.sin(angle),
  };
}

export default function SunArc({ sunrise, sunset, now }) {
  const rise = ms(sunrise);
  const set = ms(sunset);
  const cur = ms(now);
  const span = Math.max(set - rise, 1);
  const progress = Math.min(Math.max((cur - rise) / span, 0), 1);
  const isDay = cur >= rise && cur <= set;

  const start = pointAt(0);
  const end = pointAt(1);
  const sun = pointAt(progress);
  // Build the arc by sampling pointAt so the track exactly matches the sun's
  // path (avoids SVG arc sweep-flag ambiguity).
  const arcPath = Array.from({ length: 41 }, (_, i) => {
    const p = pointAt(i / 40);
    return `${i ? "L" : "M"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
  }).join(" ");

  // Length of the traveled portion for the dash reveal.
  return (
    <div className="sun-arc">
      <svg viewBox={`0 0 ${W} 150`} role="img" aria-label="Sun path from sunrise to sunset">
        <defs>
          <linearGradient id="sunArcTrack" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="var(--brand-3)" />
            <stop offset="0.5" stopColor="var(--brand-2)" />
            <stop offset="1" stopColor="var(--brand)" />
          </linearGradient>
          <radialGradient id="sunArcGlow">
            <stop offset="0" stopColor="var(--warn)" stopOpacity="0.5" />
            <stop offset="1" stopColor="var(--warn)" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* horizon */}
        <line x1="8" x2={W - 8} y1={CY} y2={CY} className="sun-arc-horizon" />
        {/* full track (faint) */}
        <path d={arcPath} className="sun-arc-track" />
        {/* traveled portion */}
        <path
          d={arcPath}
          className="sun-arc-progress"
          pathLength="1"
          style={{ strokeDasharray: `${progress} 1` }}
        />

        {/* endpoints */}
        <circle cx={start.x} cy={start.y} r="3.5" className="sun-arc-end" />
        <circle cx={end.x} cy={end.y} r="3.5" className="sun-arc-end" />

        {/* the sun */}
        {isDay && <circle cx={sun.x} cy={sun.y} r="22" fill="url(#sunArcGlow)" />}
        <circle
          cx={sun.x}
          cy={sun.y}
          r="7"
          className={`sun-arc-sun${isDay ? "" : " night"}`}
        />
      </svg>
      <div className="sun-arc-labels">
        <span>
          <em>Sunrise</em>
          {fmt(sunrise)}
        </span>
        <span className="right">
          <em>Sunset</em>
          {fmt(sunset)}
        </span>
      </div>
    </div>
  );
}
