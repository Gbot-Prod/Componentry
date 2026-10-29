import "./Stopwatch.css"
import { useState, useEffect } from "react";
import { formatStopwatch } from "../../lib/timeFormatUtils";
import { playClickSound } from "../../lib/audio";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import type { WidgetProps } from "../../widgets/registry";

// Wall-clock timestamps rather than a running counter, so the time is exact and survives reloads.
type StopwatchState = {
  startedAt: number | null; // Date.now() when last started; null while paused
  banked: number;           // time from earlier runs, before the latest pause
  laps: number[];           // total elapsed at each lap press
};

const initialState: StopwatchState = { startedAt: null, banked: 0, laps: [] };

function Stopwatch({ instanceId }: WidgetProps) {
  const [state, setState] = useLocalStorage<StopwatchState>(`stopwatch:${instanceId}`, initialState);
  const { startedAt, banked, laps } = state;
  const isRunning = startedAt !== null;
  const [now, setNow] = useState(() => Date.now());

  // Repaint every frame while running; the browser pauses this in background tabs for free.
  useEffect(() => {
    if (!isRunning) return;
    let frame = requestAnimationFrame(function tick() {
      setNow(Date.now());
      frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [isRunning]);

  const elapsed = banked + (isRunning ? Math.max(0, now - startedAt) : 0);

  function handleStartPause() {
    const t = Date.now();
    setNow(t);
    setState((prev) => prev.startedAt === null
      ? { ...prev, startedAt: t }
      : { ...prev, startedAt: null, banked: prev.banked + (t - prev.startedAt) });
  }

  function handleLapReset() {
    if (isRunning) {
      setState((prev) => ({ ...prev, laps: [...prev.laps, prev.banked + (Date.now() - prev.startedAt!)] }));
      return;
    }
    setState(initialState);
  }

  // Lap durations, newest first, with the lap in progress on top.
  const lapTimes = laps.map((split, i) => split - (laps[i - 1] ?? 0));
  const currentLap = elapsed - (laps[laps.length - 1] ?? 0);
  const fastest = lapTimes.length > 1 ? Math.min(...lapTimes) : null;
  const slowest = lapTimes.length > 1 ? Math.max(...lapTimes) : null;

  return (
    <div className="stopwatch">
      <div className="stopwatchDisplay" role="timer" aria-label="Elapsed time">{formatStopwatch(elapsed)}</div>
      <div className="stopwatchControls">
        <button onClick={() => {
          playClickSound();
          handleLapReset();
        }} disabled={!isRunning && elapsed === 0}>
          {isRunning ? "Lap" : "Reset"}
        </button>
        <button className={isRunning ? "stop" : "primary"} onClick={() => {
          playClickSound();
          handleStartPause();
        }}>
          {isRunning ? "Stop" : elapsed > 0 ? "Resume" : "Start"}
        </button>
      </div>

      {laps.length > 0 && (
        <ol className="stopwatchLaps" aria-label="Laps">
          <li>
            <span>Lap {laps.length + 1}</span>
            <span>{formatStopwatch(currentLap)}</span>
            <span className="stopwatchSplit">{formatStopwatch(elapsed)}</span>
          </li>
          {lapTimes.map((lapTime, i) => ({ lapTime, i })).reverse().map(({ lapTime, i }) => (
            <li
              key={i}
              className={lapTime === fastest ? "fastest" : lapTime === slowest ? "slowest" : undefined}
            >
              <span>Lap {i + 1}</span>
              <span>{formatStopwatch(lapTime)}</span>
              <span className="stopwatchSplit">{formatStopwatch(laps[i])}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export default Stopwatch;
