import "./ReactionTest.css"
import { useEffect, useRef, useState } from "react";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import type { WidgetProps } from "../../widgets/registry";

type Stage = "idle" | "waiting" | "go" | "result" | "tooSoon";

const MIN_WAIT_MS = 1500;
const MAX_WAIT_MS = 4500;

function ReactionTest({ instanceId }: WidgetProps) {
  const [stage, setStage] = useState<Stage>("idle");
  const [lastMs, setLastMs] = useState(0);
  const [bestMs, setBestMs] = useLocalStorage<number | null>(`reaction:${instanceId}`, null);
  const goTime = useRef(0);
  const timeout = useRef(0);

  useEffect(() => () => clearTimeout(timeout.current), []);

  // pointerdown rather than click: click fires on release and adds ~100ms.
  function handlePress() {
    if (stage === "waiting") {
      clearTimeout(timeout.current);
      setStage("tooSoon");
    } else if (stage === "go") {
      const ms = Math.round(performance.now() - goTime.current);
      setLastMs(ms);
      setBestMs((best) => (best === null ? ms : Math.min(best, ms)));
      setStage("result");
    } else {
      setStage("waiting");
      const wait = MIN_WAIT_MS + Math.random() * (MAX_WAIT_MS - MIN_WAIT_MS);
      timeout.current = window.setTimeout(() => {
        goTime.current = performance.now();
        setStage("go");
      }, wait);
    }
  }

  const message: Record<Stage, string> = {
    idle: "Click to start",
    waiting: "Wait for green…",
    go: "CLICK!",
    result: `${lastMs} ms — click to go again`,
    tooSoon: "Too soon! Click to retry",
  };

  return (
    <div className="reactionTest">
      <button className={`reactionPad ${stage}`} onPointerDown={handlePress}>
        {message[stage]}
      </button>
      <div className="reactionBest">Best: {bestMs === null ? "—" : `${bestMs} ms`}</div>
    </div>
  );
}

export default ReactionTest;
