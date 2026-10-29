import "./Timer.css"
import { useEffect, useState, type FormEvent } from "react";
import { Pencil } from "lucide-react";
import { playClickSound, startRinging, stopRinging } from "../../lib/audio";
import { notify, requestNotificationPermission } from "../../lib/notify";
import { useCountdownTimer } from "../../hooks/useCountdownTimer";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import type { WidgetProps } from "../../widgets/registry";

const MINUTE = 60 * 1000;
const PRESET_MINUTES = [1, 3, 5, 10, 15, 30];

// Blank or non-numeric fields count as zero rather than producing NaN.
const toNumber = (value: string) => Number(value) || 0;
const pad = (value: number) => String(value).padStart(2, '0');

function formatHHMMSS(ms: number) {
  // Round up so the display hits 00:00:00 exactly when the alarm fires.
  const totalSeconds = Math.ceil(ms / 1000);
  const hours = pad(Math.floor(totalSeconds / 3600));
  const minutes = pad(Math.floor((totalSeconds / 60) % 60));
  const seconds = pad(totalSeconds % 60);

  return `${hours}:${minutes}:${seconds}`;
}

function TimePicker({ initialMs, onConfirm, onCancel }: {
  initialMs: number;
  onConfirm: (ms: number) => void;
  onCancel: () => void;
}) {
  const initialSeconds = Math.round(initialMs / 1000);
  const [hour, setHour] = useState(pad(Math.floor(initialSeconds / 3600)));
  const [minute, setMinute] = useState(pad(Math.floor(initialSeconds / 60) % 60));
  const [second, setSecond] = useState(pad(initialSeconds % 60));

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    playClickSound();
    // Overflow is fine: 90 seconds just becomes 1:30.
    onConfirm((toNumber(hour) * 3600 + toNumber(minute) * 60 + toNumber(second)) * 1000);
  }

  const field = (value: string, setValue: (value: string) => void, label: string) => (
    <input
      className="timeInput"
      type="text"
      inputMode="numeric"
      maxLength={2}
      value={value}
      onChange={(e) => setValue(e.target.value.replace(/\D/g, ''))}
      onFocus={(e) => e.target.select()}
      onBlur={() => setValue(pad(toNumber(value)))}
      aria-label={label}
    />
  );

  return (
    <form className="timePicker" onSubmit={handleSubmit}>
      <div className="timePickerInputs">
        {field(hour, setHour, "Hours")}
        <span>:</span>
        {field(minute, setMinute, "Minutes")}
        <span>:</span>
        {field(second, setSecond, "Seconds")}
      </div>
      <button type="button" className="timerButton" onClick={() => {
        playClickSound();
        onCancel();
      }}>
        Cancel
      </button>
      <button type="submit" className="timerButton primary">Set</button>
    </form>
  );
}

function Timer({ instanceId }: WidgetProps) {
  // The chosen length is saved per instance; a run in progress isn't.
  const [durationMs, setDurationMs] = useLocalStorage(`timer:${instanceId}`, 5 * MINUTE);
  // Length of the current run including any +1:00s, for the progress bar.
  const [totalMs, setTotalMs] = useState(durationMs);
  const [showPicker, setShowPicker] = useState(false);
  const [finished, setFinished] = useState(false);

  const { timeMs, isRunning, start, pause, resume, setTime, addTime } = useCountdownTimer({
    initialMs: durationMs,
    onFinish: () => {
      setFinished(true);
      notify("⏱️ Time's up!", `Your ${formatHHMMSS(totalMs)} timer is done.`);
    },
  });

  const ringOwner = `timer:${instanceId}`;
  useEffect(() => {
    if (!finished) return;
    startRinging(ringOwner);
    return () => stopRinging(ringOwner);
  }, [finished, ringOwner]);

  /** Load a length without starting it. */
  const load = (ms: number) => {
    setFinished(false);
    setTotalMs(ms);
    setTime(ms);
  };

  const run = (ms: number) => {
    requestNotificationPermission();
    setFinished(false);
    setTotalMs(ms);
    start(ms);
  };

  const handleConfirm = (ms: number) => {
    setDurationMs(ms);
    load(ms);
    setShowPicker(false);
  };

  const handlePreset = (minutes: number) => {
    setDurationMs(minutes * MINUTE);
    run(minutes * MINUTE);
  };

  const handleStartStop = () => {
    if (finished) {
      load(durationMs);
      return;
    }
    if (isRunning) {
      pause();
      return;
    }
    if (timeMs <= 0) {
      run(durationMs);
      return;
    }
    requestNotificationPermission();
    resume();
  };

  const handleAddMinute = () => {
    // Once it's gone off, +1:00 works like a snooze.
    if (finished || timeMs <= 0) {
      run(MINUTE);
      return;
    }
    addTime(MINUTE);
    setTotalMs((total) => total + MINUTE);
  };

  const remaining = totalMs > 0 ? Math.min(1, timeMs / totalMs) : 0;
  const isFresh = !isRunning && !finished && timeMs === totalMs;

  return (
    <div className={`timer${finished ? " finished" : ""}`}>
      <button
        className="timerDisplay"
        role="timer"
        aria-label="Time remaining. Click to set."
        onClick={() => {
          playClickSound();
          setShowPicker((shown) => !shown);
        }}
      >
        {finished ? "Time's up!" : formatHHMMSS(timeMs)}
      </button>
      <div className="timerProgress" aria-hidden="true">
        <div style={{ width: `${remaining * 100}%` }} />
      </div>

      {showPicker ? (
        <TimePicker initialMs={durationMs} onConfirm={handleConfirm} onCancel={() => setShowPicker(false)} />
      ) : (
        <div className="timerPresets" role="group" aria-label="Quick start">
          {PRESET_MINUTES.map((minutes) => (
            <button key={minutes} className="timerButton" onClick={() => {
              playClickSound();
              handlePreset(minutes);
            }}>
              {minutes}m
            </button>
          ))}
        </div>
      )}

      <div className="timerControls">
        <button className="timerButton iconButton" aria-label="Set time" aria-expanded={showPicker} onClick={() => {
          playClickSound();
          setShowPicker((shown) => !shown);
        }}>
          <Pencil size={14} />
        </button>
        <button
          className="timerButton primary"
          disabled={!finished && !isRunning && timeMs <= 0 && durationMs <= 0}
          onClick={() => {
            playClickSound();
            handleStartStop();
          }}
        >
          {finished ? "Dismiss" : isRunning ? "Pause" : isFresh || timeMs <= 0 ? "Start" : "Resume"}
        </button>
        <button className="timerButton" disabled={isFresh} onClick={() => {
          playClickSound();
          load(durationMs);
        }}>
          Reset
        </button>
        <button className="timerButton" onClick={() => {
          playClickSound();
          handleAddMinute();
        }}>
          +1:00
        </button>
      </div>
    </div>
  );
}

export default Timer
