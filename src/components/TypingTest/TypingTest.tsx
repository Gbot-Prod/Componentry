import "./TypingTest.css"
import { useRef, useState } from "react";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import type { WidgetProps } from "../../widgets/registry";

const SENTENCES = [
  "the quick brown fox jumps over the lazy dog",
  "a toybox full of widgets makes for a happy desk",
  "practice makes progress and progress makes perfect",
  "coffee first then code then more coffee",
  "small steps every day add up to big results",
  "every bug is just a feature waiting to be understood",
];

const pick = (exclude?: string) => {
  const options = SENTENCES.filter((s) => s !== exclude);
  return options[Math.floor(Math.random() * options.length)];
};

function TypingTest({ instanceId }: WidgetProps) {
  const [target, setTarget] = useState(() => pick());
  const [typed, setTyped] = useState("");
  const [result, setResult] = useState<{ wpm: number; accuracy: number } | null>(null);
  const [best, setBest] = useLocalStorage(`typing:${instanceId}`, 0);
  const startedAt = useRef(0);
  const mistakes = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  function onChange(value: string) {
    if (result || value.length > target.length) return;
    if (!typed && value) {
      startedAt.current = performance.now();
      mistakes.current = 0;
    }
    // Count each wrong keystroke once, even if it's later fixed.
    if (value.length > typed.length && value[value.length - 1] !== target[value.length - 1]) mistakes.current++;
    setTyped(value);

    if (value === target) {
      const minutes = (performance.now() - startedAt.current) / 60000;
      // Standard WPM: 5 characters = 1 word.
      const wpm = Math.round(target.length / 5 / minutes);
      const accuracy = Math.max(0, Math.round(100 - (mistakes.current / target.length) * 100));
      setResult({ wpm, accuracy });
      setBest((b) => Math.max(b, wpm));
    }
  }

  function next() {
    setTarget(pick(target));
    setTyped("");
    setResult(null);
    inputRef.current?.focus();
  }

  return (
    <div className="typingTest" onClick={() => inputRef.current?.focus()}>
      <p className="ttTarget" aria-hidden>
        {[...target].map((char, i) => {
          const state = i >= typed.length ? (i === typed.length ? "cursor" : "") : typed[i] === char ? "right" : "wrong";
          return <span key={i} className={state}>{char}</span>;
        })}
      </p>
      <input
        ref={inputRef}
        className="ttInput"
        value={typed}
        onChange={(e) => onChange(e.target.value)}
        onPaste={(e) => e.preventDefault()}
        aria-label={`Type: ${target}`}
        autoComplete="off"
        spellCheck={false}
      />
      <div className="ttFooter">
        {result ? (
          <span><strong>{result.wpm} WPM</strong> · {result.accuracy}% accuracy</span>
        ) : (
          <span>{typed ? "Keep going…" : "Click and start typing"}</span>
        )}
        <span>Best {best}</span>
      </div>
      <button className="ttNext" onClick={next}>{result ? "Next sentence" : "Skip"}</button>
    </div>
  );
}

export default TypingTest;
