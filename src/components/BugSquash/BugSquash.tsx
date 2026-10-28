import "./BugSquash.css"
import { useEffect, useRef, useState } from "react";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import type { WidgetProps } from "../../widgets/registry";

const HOLES = 9;
const ROUND_S = 30;
// Bugs show up faster and stay shorter as the round goes on.
const showMs = (secondsLeft: number) => 500 + (secondsLeft / ROUND_S) * 600;

type Hole = { kind: "bug" | "bee"; until: number } | null;

function BugSquash({ instanceId }: WidgetProps) {
  const [holes, setHoles] = useState<Hole[]>(() => Array(HOLES).fill(null));
  const [score, setScore] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [squashed, setSquashed] = useState<number | null>(null);
  const [best, setBest] = useLocalStorage(`bugs:${instanceId}`, 0);
  const isPlaying = secondsLeft > 0;
  const scoreRef = useRef(0);
  const [hasPlayed, setHasPlayed] = useState(false);

  // Round clock, plus a timer for the end of the round that records the best score.
  useEffect(() => {
    if (!isPlaying) return;
    const id = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    const end = setTimeout(() => setBest((b) => Math.max(b, scoreRef.current)), ROUND_S * 1000);
    return () => {
      clearInterval(id);
      clearTimeout(end);
    };
  }, [isPlaying, setBest]);

  // Spawner: every tick, expire old critters and maybe pop up a new one.
  useEffect(() => {
    if (!isPlaying) return;
    const id = setInterval(() => {
      const now = performance.now();
      setHoles((current) => {
        const next = current.map((h) => (h && h.until > now ? h : null));
        const empty = next.flatMap((h, i) => (h ? [] : [i]));
        if (empty.length && Math.random() < 0.6) {
          const i = empty[Math.floor(Math.random() * empty.length)];
          // Bees are a trap: hitting one costs points.
          next[i] = { kind: Math.random() < 0.18 ? "bee" : "bug", until: now + showMs(secondsLeft) };
        }
        return next;
      });
    }, 250);
    return () => clearInterval(id);
  }, [isPlaying, secondsLeft]);

  function start() {
    scoreRef.current = 0;
    setScore(0);
    setHoles(Array(HOLES).fill(null));
    setSecondsLeft(ROUND_S);
    setHasPlayed(true);
  }

  function whack(i: number) {
    const hole = holes[i];
    if (!isPlaying || !hole) return;
    const delta = hole.kind === "bug" ? 1 : -3;
    scoreRef.current = Math.max(0, scoreRef.current + delta);
    setScore(scoreRef.current);
    setHoles((hs) => hs.map((h, j) => (j === i ? null : h)));
    setSquashed(i);
    setTimeout(() => setSquashed((s) => (s === i ? null : s)), 200);
  }

  return (
    <div className="bugSquash">
      <div className="bsHeader">
        <span>Score {score}</span>
        <span>{isPlaying ? `${secondsLeft}s` : `Best ${best}`}</span>
      </div>
      <div className="bsGrid">
        {holes.map((hole, i) => (
          <button key={i} className="bsHole" onPointerDown={() => whack(i)} aria-label={hole ? hole.kind : "Empty hole"}>
            {hole && <span className={`bsCritter ${hole.kind}`}>{hole.kind === "bug" ? "🪲" : "🐝"}</span>}
            {squashed === i && <span className="bsSplat">💥</span>}
          </button>
        ))}
        {!isPlaying && (
          <button className="bsOverlay" onClick={start}>
            {hasPlayed ? `Scored ${score}. Again?` : "Squash the bugs, spare the bees!"}
          </button>
        )}
      </div>
    </div>
  );
}

export default BugSquash;
