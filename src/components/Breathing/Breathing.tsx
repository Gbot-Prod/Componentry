import "./Breathing.css"
import { useEffect, useState } from "react";

type Phase = { label: string; seconds: number; scale: number };

const PATTERNS: Record<string, Phase[]> = {
  "Box 4-4-4-4": [
    { label: "Breathe in", seconds: 4, scale: 1 },
    { label: "Hold", seconds: 4, scale: 1 },
    { label: "Breathe out", seconds: 4, scale: 0.45 },
    { label: "Hold", seconds: 4, scale: 0.45 },
  ],
  "Relax 4-7-8": [
    { label: "Breathe in", seconds: 4, scale: 1 },
    { label: "Hold", seconds: 7, scale: 1 },
    { label: "Breathe out", seconds: 8, scale: 0.45 },
  ],
  "Calm 5-5": [
    { label: "Breathe in", seconds: 5, scale: 1 },
    { label: "Breathe out", seconds: 5, scale: 0.45 },
  ],
};

function Breathing() {
  const [patternName, setPatternName] = useState(Object.keys(PATTERNS)[0]);
  const [isRunning, setIsRunning] = useState(false);
  const [{ phaseIndex, secondsLeft }, setStep] = useState({ phaseIndex: 0, secondsLeft: 0 });

  const pattern = PATTERNS[patternName];
  const phase = pattern[phaseIndex];

  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => {
      setStep(({ phaseIndex, secondsLeft }) => {
        if (secondsLeft > 1) return { phaseIndex, secondsLeft: secondsLeft - 1 };
        // Phase over: advance and load the next phase's length.
        const next = (phaseIndex + 1) % pattern.length;
        return { phaseIndex: next, secondsLeft: pattern[next].seconds };
      });
    }, 1000);
    return () => clearInterval(id);
  }, [isRunning, pattern]);

  function toggle() {
    if (!isRunning) {
      setStep({ phaseIndex: 0, secondsLeft: pattern[0].seconds });
    }
    setIsRunning(!isRunning);
  }

  return (
    <div className="breathing">
      <div className="breathStage">
        <div
          className="breathCircle"
          style={{
            transform: `scale(${isRunning ? phase.scale : 0.45})`,
            transitionDuration: `${isRunning ? phase.seconds : 0.6}s`,
          }}
        />
        <div className="breathText">
          {isRunning ? (
            <>
              <span>{phase.label}</span>
              <span className="breathCount">{secondsLeft}</span>
            </>
          ) : (
            <span>Ready</span>
          )}
        </div>
      </div>
      <select
        value={patternName}
        onChange={(e) => { setPatternName(e.target.value); setIsRunning(false); }}
        aria-label="Breathing pattern"
      >
        {Object.keys(PATTERNS).map((name) => <option key={name}>{name}</option>)}
      </select>
      <button className="breathToggle" onClick={toggle}>{isRunning ? "Stop" : "Start"}</button>
    </div>
  );
}

export default Breathing;
