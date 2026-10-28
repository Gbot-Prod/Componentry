import "./MemoryMatch.css"
import { useState } from "react";

const EMOJI = ["🐶", "🐱", "🦊", "🐸", "🐙", "🦄", "🍕", "🌵"];
const MISMATCH_MS = 800;

type Card = { id: number; face: string; matched: boolean };

function shuffledDeck(): Card[] {
  const faces = [...EMOJI, ...EMOJI];
  // Fisher–Yates; sort(() => Math.random() - 0.5) is biased.
  for (let i = faces.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [faces[i], faces[j]] = [faces[j], faces[i]];
  }
  return faces.map((face, id) => ({ id, face, matched: false }));
}

function MemoryMatch() {
  const [cards, setCards] = useState(shuffledDeck);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);

  const isWon = cards.every((c) => c.matched);
  // Two unmatched cards face up means we're waiting to flip them back.
  const isLocked = flipped.length === 2;

  function flip(id: number) {
    if (isLocked || flipped.includes(id) || cards[id].matched) return;
    const next = [...flipped, id];
    setFlipped(next);
    if (next.length < 2) return;

    setMoves((m) => m + 1);
    const [a, b] = next;
    if (cards[a].face === cards[b].face) {
      setCards((cs) => cs.map((c) => (c.id === a || c.id === b ? { ...c, matched: true } : c)));
      setFlipped([]);
    } else {
      setTimeout(() => setFlipped([]), MISMATCH_MS);
    }
  }

  function restart() {
    setCards(shuffledDeck());
    setFlipped([]);
    setMoves(0);
  }

  return (
    <div className="memory">
      <div className="memoryGrid">
        {cards.map((card) => {
          const isUp = card.matched || flipped.includes(card.id);
          return (
            <button
              key={card.id}
              className={`memoryCard${isUp ? " up" : ""}${card.matched ? " matched" : ""}`}
              onClick={() => flip(card.id)}
              aria-label={isUp ? card.face : "Hidden card"}
            >
              <span className="memoryInner">
                <span className="memoryBack">?</span>
                <span className="memoryFront">{card.face}</span>
              </span>
            </button>
          );
        })}
      </div>
      <div className="memoryFooter">
        <span>{isWon ? `Cleared in ${moves} moves!` : `Moves: ${moves}`}</span>
        <button onClick={restart}>{isWon ? "Play again" : "Restart"}</button>
      </div>
    </div>
  );
}

export default MemoryMatch;
