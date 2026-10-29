import "./PomodoroTimer.css"
import { useState } from "react";
import { Settings, SkipForward } from "lucide-react";
import { formatMMSS } from "../../lib/timeFormatUtils";
import { playClickSound, playAlarm, stopAlarm } from "../../lib/audio";
import { useCountdownTimer } from "../../hooks/useCountdownTimer";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { notify, requestNotificationPermission } from "../../lib/notify";
import type { WidgetProps } from "../../widgets/registry";

type TimerType = "pomodoro" | "shortBreak" | "longBreak";

const timerLabels: Record<TimerType, string> = {
  pomodoro: "Pomodoro",
  shortBreak: "Short Break",
  longBreak: "Long Break",
};

type PomodoroSettings = {
  minutes: Record<TimerType, number>;
  longBreakEvery: number; // pomodoros per cycle before a long break
  autoStart: boolean;     // roll straight into the next session when one ends
};

type PomodoroState = {
  settings: PomodoroSettings;
  mode: TimerType;
  completed: number; // finished pomodoros (skips don't count)
};

const defaultState: PomodoroState = {
  settings: {
    minutes: { pomodoro: 25, shortBreak: 5, longBreak: 15 },
    longBreakEvery: 4,
    autoStart: false,
  },
  mode: "pomodoro",
  completed: 0,
};

const MINUTE = 60 * 1000;

// Progress ring geometry (viewBox units).
const RING_RADIUS = 54;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const toInt = (value: string, fallback: number) => Math.round(Number(value)) || fallback;

/** Which session follows `mode`, given how many pomodoros are done after it ends. */
function nextMode(mode: TimerType, completed: number, longBreakEvery: number): TimerType {
  if (mode !== "pomodoro") return "pomodoro";
  return completed % longBreakEvery === 0 ? "longBreak" : "shortBreak";
}

function SettingsPanel({ settings, onSave, onResetCount }: {
  settings: PomodoroSettings;
  onSave: (settings: PomodoroSettings) => void;
  onResetCount: () => void;
}) {
  // Drafts are strings so fields can be cleared while typing; they're clamped on save.
  const [minutes, setMinutes] = useState(() => ({
    pomodoro: String(settings.minutes.pomodoro),
    shortBreak: String(settings.minutes.shortBreak),
    longBreak: String(settings.minutes.longBreak),
  }));
  const [longBreakEvery, setLongBreakEvery] = useState(String(settings.longBreakEvery));
  const [autoStart, setAutoStart] = useState(settings.autoStart);

  function handleSave() {
    onSave({
      minutes: {
        pomodoro: clamp(toInt(minutes.pomodoro, settings.minutes.pomodoro), 1, 180),
        shortBreak: clamp(toInt(minutes.shortBreak, settings.minutes.shortBreak), 1, 60),
        longBreak: clamp(toInt(minutes.longBreak, settings.minutes.longBreak), 1, 120),
      },
      longBreakEvery: clamp(toInt(longBreakEvery, settings.longBreakEvery), 1, 12),
      autoStart,
    });
  }

  return (
    <div className="pomodoroSettings">
      <div className="pomodoroSettingsGrid">
        {(Object.keys(timerLabels) as TimerType[]).map((timerType) => (
          <label key={timerType}>
            <span>{timerLabels[timerType]}</span>
            <input
              type="text"
              inputMode="numeric"
              value={minutes[timerType]}
              onChange={(e) => setMinutes((prev) => ({ ...prev, [timerType]: e.target.value }))}
            />
            <span className="pomodoroUnit">min</span>
          </label>
        ))}
        <label>
          <span>Long break every</span>
          <input
            type="text"
            inputMode="numeric"
            value={longBreakEvery}
            onChange={(e) => setLongBreakEvery(e.target.value)}
          />
          <span className="pomodoroUnit">rounds</span>
        </label>
      </div>

      <label className="pomodoroToggle">
        <input type="checkbox" checked={autoStart} onChange={(e) => setAutoStart(e.target.checked)} />
        Auto-start next session
      </label>

      <div className="pomodoroSettingsActions">
        <button onClick={() => {
          playClickSound();
          onResetCount();
        }}>
          Reset rounds
        </button>
        <button className="primary" onClick={() => {
          playClickSound();
          handleSave();
        }}>
          Save
        </button>
      </div>
    </div>
  );
}

function PomodoroTimer({ instanceId }: WidgetProps) {
  // Keyed by instance so each pomodoro on the canvas keeps its own settings and rounds.
  const [state, setState] = useLocalStorage<PomodoroState>(`pomodoro:${instanceId}`, defaultState);
  const [showSettings, setShowSettings] = useState(false);
  const { settings, mode, completed } = state;

  const durationOf = (timerType: TimerType, from = settings) => from.minutes[timerType] * MINUTE;

  const { timeMs, isRunning, start, pause, resume, setTime } = useCountdownTimer({
    initialMs: durationOf(mode),
    onFinish: () => {
      playAlarm();
      const doneCount = mode === "pomodoro" ? completed + 1 : completed;
      const upNext = nextMode(mode, doneCount, settings.longBreakEvery);
      notify(
        mode === "pomodoro" ? "Pomodoro done!" : "Break's over!",
        `Up next: ${timerLabels[upNext]}`,
      );
      goTo(upNext, doneCount, settings.autoStart);
    },
  });

  function goTo(timerType: TimerType, doneCount = completed, autoStart = false) {
    setState((prev) => ({ ...prev, mode: timerType, completed: doneCount }));
    if (autoStart) {
      start(durationOf(timerType));
    } else {
      setTime(durationOf(timerType));
    }
  }

  const handleTimerChange = (timerType: TimerType) => {
    stopAlarm();
    goTo(timerType);
  };

  const handleStartPause = () => {
    stopAlarm();
    if (isRunning) {
      pause();
      return;
    }

    requestNotificationPermission();

    if (timeMs <= 0) {
      start(durationOf(mode));
      return;
    }

    resume();
  };

  const handleReset = () => {
    stopAlarm();
    setTime(durationOf(mode));
  };

  // Skipping a pomodoro doesn't earn a round, so it never unlocks a long break.
  const skipTarget: TimerType = mode === "pomodoro" ? "shortBreak" : "pomodoro";

  const handleSkip = () => {
    stopAlarm();
    goTo(skipTarget, completed, isRunning);
  };

  const handleSaveSettings = (newSettings: PomodoroSettings) => {
    setState((prev) => ({ ...prev, settings: newSettings }));
    // A running session keeps its length; an idle one picks up the new duration.
    if (!isRunning) setTime(durationOf(mode, newSettings));
    setShowSettings(false);
  };

  // Round up so the display hits 00:00 exactly when the alarm fires.
  const displayMs = Math.ceil(timeMs / 1000) * 1000;
  const progress = clamp(1 - timeMs / durationOf(mode), 0, 1);
  const filledDots = mode === "longBreak" && completed > 0 && completed % settings.longBreakEvery === 0
    ? settings.longBreakEvery
    : completed % settings.longBreakEvery;

  return (
    <div className={`pomodoro ${mode}`}>
      <div className="pomodoroModes" role="group" aria-label="Session type">
        {(Object.keys(timerLabels) as TimerType[]).map((timerType) => (
          <button
            key={timerType}
            className={timerType === mode ? "active" : undefined}
            aria-pressed={timerType === mode}
            onClick={() => {
              playClickSound();
              handleTimerChange(timerType);
            }}
          >
            {timerLabels[timerType]}
          </button>
        ))}
      </div>

      <div className="pomodoroRing">
        <svg viewBox="0 0 120 120" aria-hidden="true">
          <circle className="pomodoroRingTrack" cx="60" cy="60" r={RING_RADIUS} />
          <circle
            className="pomodoroRingProgress"
            cx="60"
            cy="60"
            r={RING_RADIUS}
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={RING_CIRCUMFERENCE * (1 - progress)}
          />
        </svg>
        <div className="pomodoroRingCenter">
          <div className="pomodoroDisplay" role="timer" aria-label={`${timerLabels[mode]} time remaining`}>
            {formatMMSS(displayMs)}
          </div>
          <div className="pomodoroRounds" title={`${completed} pomodoro${completed === 1 ? "" : "s"} completed`}>
            {Array.from({ length: settings.longBreakEvery }, (_, i) => (
              <span key={i} className={i < filledDots ? "filled" : undefined} />
            ))}
          </div>
          <div className="pomodoroCount">#{completed + (mode === "pomodoro" ? 1 : 0)}</div>
        </div>
      </div>

      <div className="pomodoroControls">
        <button className="iconButton" aria-label="Settings" aria-expanded={showSettings} onClick={() => {
          playClickSound();
          setShowSettings((shown) => !shown);
        }}>
          <Settings size={16} />
        </button>

        <button className="primary" onClick={() => {
          playClickSound();
          handleStartPause();
        }}>
          {isRunning ? "Pause" : "Start"}
        </button>

        <button onClick={() => {
          playClickSound();
          handleReset();
        }}>Reset</button>

        <button className="iconButton" aria-label={`Skip to ${timerLabels[skipTarget]}`} onClick={() => {
          playClickSound();
          handleSkip();
        }}>
          <SkipForward size={16} />
        </button>
      </div>

      {showSettings && (
        <SettingsPanel
          settings={settings}
          onSave={handleSaveSettings}
          onResetCount={() => setState((prev) => ({ ...prev, completed: 0 }))}
        />
      )}
    </div>
  );
}

export default PomodoroTimer;
