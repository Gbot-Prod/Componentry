import "./CoinFlip.css"
import { useState } from "react";

type Side = "heads" | "tails";

const FLIP_MS = 900;

function CoinFlip() {
  // Rotation accumulates so every flip spins forward instead of snapping back.
  const [rotation, setRotation] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const [history, setHistory] = useState<Side[]>([]);

  const heads = history.filter((side) => side === "heads").length;
  const result = history[history.length - 1];

  function flip() {
    if (isFlipping) return;
    const side: Side = Math.random() < 0.5 ? "heads" : "tails";
    setIsFlipping(true);
    setRotation((r) => {
      // Spin at least 5 turns, landing on 0° for heads and 180° for tails.
      const base = Math.ceil(r / 360) * 360 + 360 * 5;
      return side === "heads" ? base : base + 180;
    });
    setTimeout(() => {
      setHistory((h) => [...h, side]);
      setIsFlipping(false);
    }, FLIP_MS);
  }

  return (
    <div className="coinFlip">
      <button className="coinStage" onClick={flip} aria-label="Flip the coin">
        <div className="coin" style={{ transform: `rotateY(${rotation}deg)`, transitionDuration: `${FLIP_MS}ms` }}>
          <div className="coinFace coinHeads">H</div>
          <div className="coinFace coinTails">T</div>
        </div>
      </button>
      <div className="coinResult">{isFlipping ? "…" : result ? result.toUpperCase() : "Click to flip"}</div>
      {history.length > 0 && (
        <div className="coinStats">
          <span>Heads {heads}</span>
          <span>Tails {history.length - heads}</span>
          <button onClick={() => setHistory([])}>Reset</button>
        </div>
      )}
    </div>
  );
}

export default CoinFlip;
