// Aurora weather glyphs — custom hand-drawn SVG in a soft "duotone rounded"
// style. Two-tone fills with the Aurora indigo/violet palette, rounded strokes,
// and a warm sun. `variant` comes from lib/wmo.js. No external icon assets.

const INDIGO_SOFT = "#c7d2fe";
const CLOUD = "#e0e5ff";
const CLOUD_EDGE = "#b9c2f0";
const SUN = "#fbbf24";
const SUN_SOFT = "#fde68a";
const MOON = "#c4b5fd";
const RAIN = "#818cf8";
const SNOW = "#a5b4fc";
const BOLT = "#f59e0b";

// A soft rounded cloud built from a smooth base path.
function Cloud({ x = 0, y = 0, s = 1, fill = CLOUD, edge = CLOUD_EDGE }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path
        d="M20 42a10 10 0 0 1-1.6-19.9A14 14 0 0 1 45 20.5 11 11 0 0 1 50 42Z"
        fill={fill}
        stroke={edge}
        strokeWidth="1.5"
      />
    </g>
  );
}

function Sun() {
  return (
    <g>
      <circle cx="32" cy="32" r="15" fill={SUN_SOFT} className="wx-sun-core" />
      <circle cx="32" cy="32" r="10.5" fill={SUN} />
      <g className="wx-sun-rays" style={{ transformOrigin: "32px 32px" }}>
        {Array.from({ length: 8 }).map((_, i) => {
          const a = (i * Math.PI) / 4;
          return (
            <line
              key={i}
              x1={32 + Math.cos(a) * 19}
              y1={32 + Math.sin(a) * 19}
              x2={32 + Math.cos(a) * 24}
              y2={32 + Math.sin(a) * 24}
              stroke={SUN}
              strokeWidth="3.6"
              strokeLinecap="round"
            />
          );
        })}
      </g>
    </g>
  );
}

function Moon() {
  return (
    <g>
      <path d="M40 20a15 15 0 1 0 3 29.4A17 17 0 0 1 40 20Z" fill={MOON} />
      <circle cx="30" cy="24" r="1.8" fill="#ede9fe" />
      <circle cx="24" cy="33" r="1.2" fill="#ede9fe" />
    </g>
  );
}

function Drops({ n = 3, color = RAIN, y = 46 }) {
  return (
    <g>
      {Array.from({ length: n }).map((_, i) => (
        <path
          key={i}
          className="wx-drop"
          style={{ animationDelay: `${i * 0.22}s` }}
          d={`M${20 + i * 9} ${y}c-2 3-3 4.5-3 6a3 3 0 0 0 6 0c0-1.5-1-3-3-6Z`}
          fill={color}
        />
      ))}
    </g>
  );
}

const VARIANTS = {
  sun: () => <Sun />,
  partly: () => (
    <g>
      <g transform="translate(-7 -9) scale(0.7)">
        <Sun />
      </g>
      <Cloud x={8} y={12} s={0.9} />
    </g>
  ),
  cloud: () => (
    <g>
      <Cloud x={13} y={3} s={0.62} fill={INDIGO_SOFT} edge="#a5b0e8" />
      <Cloud x={1} y={9} s={0.95} />
    </g>
  ),
  fog: () => (
    <g>
      <Cloud x={2} y={-1} s={0.92} />
      {[47, 53, 59].map((yy, i) => (
        <line
          key={yy}
          x1={14 + i * 3}
          y1={yy}
          x2={50 - i * 3}
          y2={yy}
          stroke={CLOUD_EDGE}
          strokeWidth="3.4"
          strokeLinecap="round"
          opacity={0.85 - i * 0.22}
        />
      ))}
    </g>
  ),
  drizzle: () => (
    <g>
      <Cloud x={2} y={1} s={0.92} />
      <Drops n={3} color={SNOW} y={47} />
    </g>
  ),
  rain: () => (
    <g>
      <Cloud x={2} y={1} s={0.92} fill={INDIGO_SOFT} edge="#a5b0e8" />
      <Drops n={4} color={RAIN} y={46} />
    </g>
  ),
  snow: () => (
    <g>
      <Cloud x={2} y={-1} s={0.92} />
      {[20, 30, 40].map((cx, i) => (
        <circle
          key={cx}
          className="wx-flake"
          style={{ animationDelay: `${i * 0.5}s` }}
          cx={cx}
          cy={49 + (i % 2) * 5}
          r="2.6"
          fill={SNOW}
        />
      ))}
    </g>
  ),
  storm: () => (
    <g>
      <Cloud x={2} y={-1} s={0.92} fill={INDIGO_SOFT} edge="#a5b0e8" />
      <path
        d="M33 41 25 53h6l-3 9 11-13h-6l4-8Z"
        fill={BOLT}
        stroke="#d97706"
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </g>
  ),
};

export default function WeatherIcon({ variant = "cloud", night = false, size = 48, className = "", lively = false }) {
  const Draw =
    variant === "sun" && night ? Moon : VARIANTS[variant] ?? VARIANTS.cloud;
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={`weather-icon${lively ? " wx-lively" : ""} ${className}`}
      aria-hidden="true"
    >
      <Draw />
    </svg>
  );
}
