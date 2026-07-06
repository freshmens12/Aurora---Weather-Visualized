// Ambient animated layer for the hero card, keyed to the weather "tint".
// Pure CSS-driven particles — cheap, decorative, and hidden from a11y tree.

function seeded(n, fn) {
  return Array.from({ length: n }, (_, i) => fn(i));
}

export default function HeroFx({ tint = "clear" }) {
  // Particles only for actual precipitation — calm skies stay calm.
  let particles = null;

  if (tint === "rain" || tint === "storm") {
    particles = seeded(14, (i) => (
      <span
        key={i}
        className="fx-rain"
        style={{
          left: `${(i / 14) * 100 + 3}%`,
          animationDelay: `${(i % 7) * 0.18}s`,
          animationDuration: `${0.7 + (i % 3) * 0.25}s`,
        }}
      />
    ));
  } else if (tint === "snow") {
    particles = seeded(16, (i) => (
      <span
        key={i}
        className="fx-snow"
        style={{
          left: `${(i / 16) * 100 + 2}%`,
          animationDelay: `${(i % 8) * 0.5}s`,
          animationDuration: `${4 + (i % 4)}s`,
        }}
      />
    ));
  } else {
    return null;
  }

  return (
    <div className={`hero-fx fx-${tint}`} aria-hidden="true">
      {particles}
      {tint === "storm" && <span className="fx-flash" />}
    </div>
  );
}
