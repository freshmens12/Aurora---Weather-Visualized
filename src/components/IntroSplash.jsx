import { useEffect, useState } from "react";

// One-shot fullscreen intro: "AURORA" decodes from scrambled characters,
// holds, then the overlay fades out and unmounts. Purely decorative.

const WORD = "AURORA";
const CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&";
const WHITE_COUNT = 3; // "AUR" solid white, "ORA" gradient
const TICK_MS = 40;
const TICKS_PER_LETTER = 3; // ~120ms per locked-in letter
const HOLD_MS = 650;
const FADE_MS = 500;

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

const randomChar = () => CHARSET[Math.floor(Math.random() * CHARSET.length)];

const scramble = (revealed) =>
  WORD.split("").map((ch, i) => (i < revealed ? ch : randomChar()));

export default function IntroSplash() {
  // "play" → "fade" → "done" (unmounted). Reduced motion skips straight to done.
  const [phase, setPhase] = useState(() => (prefersReducedMotion() ? "done" : "play"));
  const [letters, setLetters] = useState(() => scramble(0));

  useEffect(() => {
    if (prefersReducedMotion()) return;
    let tick = 0;
    let holdTimer;
    let fadeTimer;
    const interval = setInterval(() => {
      tick += 1;
      const revealed = Math.min(Math.floor(tick / TICKS_PER_LETTER), WORD.length);
      setLetters(scramble(revealed));
      if (revealed >= WORD.length) {
        clearInterval(interval);
        holdTimer = setTimeout(() => {
          setPhase("fade");
          fadeTimer = setTimeout(() => setPhase("done"), FADE_MS);
        }, HOLD_MS);
      }
    }, TICK_MS);
    return () => {
      clearInterval(interval);
      clearTimeout(holdTimer);
      clearTimeout(fadeTimer);
    };
  }, []);

  if (phase === "done") return null;

  const word = (extra) => (
    <div className={`intro-word${extra ? ` ${extra}` : ""}`} aria-hidden="true">
      {letters.map((ch, i) => (
        <span key={i} className={`intro-ch ${i < WHITE_COUNT ? "solid" : "grad"}`}>
          {ch}
        </span>
      ))}
    </div>
  );

  return (
    <div className={`intro-splash${phase === "fade" ? " out" : ""}`} aria-hidden="true">
      <div className="intro-stack">
        {word()}
        {word("intro-reflect")}
        <p className="intro-tag">A Weather Visualized</p>
      </div>
    </div>
  );
}
