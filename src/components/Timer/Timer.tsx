import "./Timer.css"
import { useState } from "react";
import { playClickSound, playAlarm, stopAlarm } from "../../lib/audio";
import { useCountdownTimer } from "../../hooks/useCountdownTimer";

// Blank or non-numeric fields count as zero rather than producing NaN.
const toNumber = (value: string) => Number(value) || 0;

function formatHHMMSS(ms: number) {
  // Round up so the display hits 00:00:00 exactly when the alarm fires.
  const totalSeconds = Math.ceil(ms / 1000);
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((totalSeconds / 60) % 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');

  return `${hours}:${minutes}:${seconds}`;
}

function TimePicker({ onConfirm }: { onConfirm: (ms: number) => void }) {
  const [hour, setHour] = useState("00");
  const [minute, setMinute] = useState("00");
  const [second, setSecond] = useState("00");

  function handleConfirm() {
    const totalTimeMs = (toNumber(hour) * 3600 + toNumber(minute) * 60 + toNumber(second)) * 1000;
    onConfirm(totalTimeMs);
  }

  return (
    <div className="timePicker">
      <div className="timePickerInputs">
        <input className="timeInput" type="text" inputMode="numeric" value={hour} onChange={(e) => setHour(e.target.value)} aria-label="Hours" />
        <span>:</span>
        <input className="timeInput" type="text" inputMode="numeric" value={minute} onChange={(e) => setMinute(e.target.value)} aria-label="Minutes" />
        <span>:</span>
        <input className="timeInput" type="text" inputMode="numeric" value={second} onChange={(e) => setSecond(e.target.value)} aria-label="Seconds" />
      </div>
      <button className="timerButton primary" onClick={() => {
        playClickSound();
        handleConfirm();
      }}>
        Confirm
      </button>
    </div>
  );
}

function Timer() {
  const [showPicker, setShowPicker] = useState(false);
  const { timeMs, isRunning, pause, resume, setTime } = useCountdownTimer({
    onFinish: () => {
      playAlarm();
    },
  });

  const handleConfirm = (ms: number) => {
    stopAlarm();
    setTime(ms);
    setShowPicker(false);
  };

  const handleStartStop = () => {
    stopAlarm();
    if (isRunning) {
      pause();
      return;
    }

    resume();
  };

  const handleReset = () => {
    stopAlarm();
    setTime(0);
  };

  return (
    <div className="timer">
      <div className="timerDisplay">{formatHHMMSS(timeMs)}</div>
      <div className="timerControls">
        <button className="timerButton" onClick={() => {
          playClickSound();
          setShowPicker((shown) => !shown);
        }}>
          Set Time
        </button>
        <button className="timerButton primary" disabled={!isRunning && timeMs <= 0} onClick={() => {
          playClickSound();
          handleStartStop();
        }}>
          {isRunning ? "Stop" : "Start"}
        </button>
        <button className="timerButton" onClick={() => {
          playClickSound();
          handleReset();
        }}>
          Reset
        </button>
      </div>
      {showPicker && <TimePicker onConfirm={handleConfirm} />}
    </div>
  );
}

export default Timer
