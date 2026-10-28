import "./Stopwatch.css"
import { useState, useEffect, useRef } from "react";
import { formatHHMMSSms } from "../../lib/timeFormatUtils";

function Stopwatch() {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const intervalIdRef = useRef<number | undefined>(undefined);
  const startStopwatchRef = useRef(0);

  useEffect(() => {
    if (isRunning) {
      intervalIdRef.current = setInterval(() => {
        setElapsedTime(Date.now() - startStopwatchRef.current);
      }, 10);
    }

    return () => {
      clearInterval(intervalIdRef.current);
    }

  }, [isRunning]);

  function startStopwatch() {
    setIsRunning(true);
    startStopwatchRef.current = Date.now() - elapsedTime;
    console.log("Stopwatch started");
  }

  function stopStopwatch() {
    setIsRunning(false);
  }

  function resetStopwatch() {
    setElapsedTime(0);
    setIsRunning(false);
  }


  return (
    <div className="stopwatch">
      <div className="stopwatchDisplay">{formatHHMMSSms(elapsedTime)}</div>
      <div className="stopwatchControls">
        <button className="primary" onClick={startStopwatch} disabled={isRunning}>Start</button>
        <button onClick={stopStopwatch} disabled={!isRunning}>Stop</button>
        <button onClick={resetStopwatch}>Reset</button>
      </div>
    </div>
  );
}

export default Stopwatch;