import "./BubbleWrap.css"
import { useState } from "react";
import { playClickSound } from "../../lib/audio";

const ROWS = 6;
const COLS = 8;
const BUBBLE_COUNT = ROWS * COLS;

const freshSheet = () => Array<boolean>(BUBBLE_COUNT).fill(false);

function BubbleWrap() {
  const [popped, setPopped] = useState(freshSheet);

  const poppedCount = popped.filter(Boolean).length;
  const isSheetDone = poppedCount === BUBBLE_COUNT;

  function pop(index: number) {
    if (popped[index]) return;
    playClickSound();
    setPopped((current) => current.map((isPopped, i) => isPopped || i === index));
  }

  return (
    <div className="bubbleWrap">
      <div className="bubbleGrid" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}>
        {popped.map((isPopped, i) => (
          <button
            key={i}
            className={isPopped ? "bubble popped" : "bubble"}
            // Pointer-enter with a button held lets you drag-pop a whole row.
            onPointerDown={() => pop(i)}
            onPointerEnter={(event) => event.buttons === 1 && pop(i)}
            aria-label={isPopped ? "Popped bubble" : "Bubble"}
          />
        ))}
      </div>
      <div className="bubbleFooter">
        <span>{poppedCount}/{BUBBLE_COUNT} popped</span>
        <button className="newSheetButton" onClick={() => setPopped(freshSheet())} disabled={poppedCount === 0}>
          {isSheetDone ? "New sheet!" : "Reset"}
        </button>
      </div>
    </div>
  );
}

export default BubbleWrap;
