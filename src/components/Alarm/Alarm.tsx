import "./Alarm.css"
import { useEffect, useRef, useState, type FormEvent } from "react";
import { BellRing, Plus, Trash2 } from "lucide-react";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { useNow } from "../../hooks/useNow";
import { playClickSound, startRinging, stopRinging } from "../../lib/audio";
import { notify, requestNotificationPermission } from "../../lib/notify";
import type { WidgetProps } from "../../widgets/registry";

type AlarmItem = {
  id: string;
  time: string;         // "HH:MM", 24-hour, as <input type="time"> gives it
  label: string;
  days: number[];       // repeat days, 0 = Sunday; empty means ring once
  enabled: boolean;
  armedAt: number;      // occurrences before this (creation, edit, re-enable) never ring
  lastRangAt?: number;
  snoozeUntil?: number;
};

type AlarmDraft = Pick<AlarmItem, "time" | "label" | "days">;

const MINUTE = 60 * 1000;
const SNOOZE_MS = 5 * MINUTE;
// Background tabs may only tick about once a minute, so still ring if we notice a little late —
// but not hours later when the tab is reopened.
const LATE_GRACE_MS = 5 * MINUTE;

const DAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** The alarm's time `dayOffset` days from the day of `base`. */
function occurrenceOn(time: string, base: number, dayOffset: number) {
  const [hours, minutes] = time.split(":").map(Number);
  const date = new Date(base);
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

const ringsOn = (alarm: AlarmItem, date: Date) => alarm.days.length === 0 || alarm.days.includes(date.getDay());

/** The closest scheduled time on or before (`direction` -1) or after (+1) `now`. */
function findOccurrence(alarm: AlarmItem, now: number, direction: 1 | -1) {
  for (let i = 0; i <= 7; i++) {
    const date = occurrenceOn(alarm.time, now, i * direction);
    const onRightSide = direction === 1 ? date.getTime() > now : date.getTime() <= now;
    if (onRightSide && ringsOn(alarm, date)) return date.getTime();
  }
  return null;
}

/** When this alarm will next go off, counting a pending snooze. */
function nextRing(alarm: AlarmItem, now: number) {
  if (alarm.snoozeUntil && alarm.snoozeUntil > now) return alarm.snoozeUntil;
  return alarm.enabled ? findOccurrence(alarm, now, 1) : null;
}

function isDue(alarm: AlarmItem, now: number) {
  const justPassed = (t: number) => t <= now && now - t < LATE_GRACE_MS;
  if (alarm.snoozeUntil && justPassed(alarm.snoozeUntil)) return true;
  if (!alarm.enabled) return false;
  const last = findOccurrence(alarm, now, -1);
  return last !== null && justPassed(last) && last > alarm.armedAt && last > (alarm.lastRangAt ?? 0);
}

const formatClock = (time: string) =>
  occurrenceOn(time, Date.now(), 0).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

function formatIn(ms: number) {
  const totalMinutes = Math.ceil(ms / MINUTE);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function repeatLabel(days: number[]) {
  const sorted = [...days].sort();
  const key = sorted.join("");
  if (key === "") return "Once";
  if (key === "0123456") return "Every day";
  if (key === "12345") return "Weekdays";
  if (key === "06") return "Weekends";
  return sorted.map((day) => DAY_NAMES[day]).join(", ");
}

function AlarmForm({ initial, onSave, onCancel }: {
  initial: AlarmDraft;
  onSave: (draft: AlarmDraft) => void;
  onCancel: () => void;
}) {
  const [time, setTime] = useState(initial.time);
  const [label, setLabel] = useState(initial.label);
  const [days, setDays] = useState(initial.days);

  const toggleDay = (day: number) =>
    setDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!time) return;
    playClickSound();
    onSave({ time, label: label.trim(), days });
  }

  return (
    <form className="alarmForm" onSubmit={handleSubmit}>
      <div className="alarmFormRow">
        <input
          className="alarmFormTime"
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          required
          aria-label="Alarm time"
        />
        <input
          className="alarmFormLabel"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Label (optional)"
          maxLength={40}
          aria-label="Alarm label"
        />
      </div>
      <div className="alarmDays" role="group" aria-label="Repeat on">
        {DAY_LETTERS.map((letter, day) => (
          <button
            key={day}
            type="button"
            className={days.includes(day) ? "active" : undefined}
            aria-pressed={days.includes(day)}
            aria-label={DAY_NAMES[day]}
            onClick={() => toggleDay(day)}
          >
            {letter}
          </button>
        ))}
      </div>
      <div className="alarmFormActions">
        <span className="alarmFormHint">{repeatLabel(days)}</span>
        <button type="button" onClick={() => {
          playClickSound();
          onCancel();
        }}>
          Cancel
        </button>
        <button type="submit" className="primary">Save</button>
      </div>
    </form>
  );
}

function Alarm({ instanceId }: WidgetProps) {
  const now = useNow();
  // Keyed by instance so each alarm clock on the canvas keeps its own list.
  const [alarms, setAlarms] = useLocalStorage<AlarmItem[]>(`alarm:${instanceId}`, []);
  const [ringingIds, setRingingIds] = useState<string[]>([]);
  // null: form closed, "new": adding, otherwise the id being edited.
  const [editing, setEditing] = useState<string | null>(null);

  // The checker runs on its own interval, so it reads the latest list through a ref.
  const alarmsRef = useRef(alarms);
  useEffect(() => {
    alarmsRef.current = alarms;
  }, [alarms]);

  useEffect(() => {
    const id = setInterval(() => {
      const t = Date.now();
      const due = alarmsRef.current.filter((alarm) => isDue(alarm, t));
      if (due.length === 0) return;

      const dueIds = new Set(due.map((alarm) => alarm.id));
      setAlarms((prev) => prev.map((alarm) => dueIds.has(alarm.id)
        // One-off alarms switch themselves off once they've rung.
        ? { ...alarm, lastRangAt: t, snoozeUntil: undefined, enabled: alarm.days.length > 0 && alarm.enabled }
        : alarm));
      setRingingIds((prev) => [...new Set([...prev, ...dueIds])]);
      due.forEach((alarm) => notify("⏰ Alarm", alarm.label || formatClock(alarm.time)));
    }, 1000);
    return () => clearInterval(id);
  }, [setAlarms]);

  const ringOwner = `alarm:${instanceId}`;
  const isRinging = ringingIds.length > 0;
  useEffect(() => {
    if (!isRinging) return;
    startRinging(ringOwner);
    return () => stopRinging(ringOwner);
  }, [isRinging, ringOwner]);

  const updateAlarm = (id: string, changes: Partial<AlarmItem>) =>
    setAlarms((prev) => prev.map((alarm) => (alarm.id === id ? { ...alarm, ...changes } : alarm)));

  const stopRing = (id: string) => setRingingIds((prev) => prev.filter((ringing) => ringing !== id));

  function handleSave(draft: AlarmDraft) {
    requestNotificationPermission();
    const changes = { ...draft, enabled: true, armedAt: Date.now(), snoozeUntil: undefined };
    if (editing === "new") {
      setAlarms((prev) => [...prev, { id: crypto.randomUUID(), ...changes }]);
    } else if (editing) {
      updateAlarm(editing, changes);
    }
    setEditing(null);
  }

  function handleDelete(id: string) {
    setAlarms((prev) => prev.filter((alarm) => alarm.id !== id));
    stopRing(id);
    if (editing === id) setEditing(null);
  }

  const sorted = [...alarms].sort((a, b) => a.time.localeCompare(b.time));
  const upcoming = alarms
    .map((alarm) => nextRing(alarm, now))
    .filter((t): t is number => t !== null);
  const soonest = upcoming.length > 0 ? Math.min(...upcoming) : null;
  const editingAlarm = alarms.find((alarm) => alarm.id === editing);
  const ringing = alarms.filter((alarm) => ringingIds.includes(alarm.id));

  return (
    <div className="alarm">
      <div className="alarmTime">{new Date(now).toLocaleTimeString()}</div>
      <div className="alarmDate">
        {new Date(now).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
      </div>
      <div className="alarmNext">
        {soonest !== null ? `Next alarm in ${formatIn(soonest - now)}` : "No alarms set"}
      </div>

      {ringing.map((alarm) => (
        <div key={alarm.id} className="alarmRinging" role="alert">
          <BellRing className="alarmRingingIcon" size={22} />
          <div className="alarmRingingText">
            <span className="alarmRingingTime">{formatClock(alarm.time)}</span>
            {alarm.label && <span>{alarm.label}</span>}
          </div>
          <button onClick={() => {
            playClickSound();
            updateAlarm(alarm.id, { snoozeUntil: Date.now() + SNOOZE_MS });
            stopRing(alarm.id);
          }}>
            Snooze
          </button>
          <button className="primary" onClick={() => {
            playClickSound();
            stopRing(alarm.id);
          }}>
            Stop
          </button>
        </div>
      ))}

      {sorted.length > 0 && (
        <ul className="alarmList">
          {sorted.map((alarm) => {
            const next = nextRing(alarm, now);
            const snoozed = alarm.snoozeUntil && alarm.snoozeUntil > now;
            return (
              <li key={alarm.id} className={`alarmRow${alarm.enabled || snoozed ? "" : " off"}`}>
                <button
                  className="alarmRowInfo"
                  onClick={() => {
                    playClickSound();
                    setEditing(alarm.id);
                  }}
                  aria-label={`Edit alarm at ${formatClock(alarm.time)}`}
                >
                  <span className="alarmRowTime">{formatClock(alarm.time)}</span>
                  <span className="alarmRowMeta">
                    {[
                      alarm.label,
                      repeatLabel(alarm.days),
                      snoozed ? `snoozed, ${formatIn(alarm.snoozeUntil! - now)}` : next !== null && `in ${formatIn(next - now)}`,
                    ].filter(Boolean).join(" · ")}
                  </span>
                </button>
                <label className="alarmSwitch">
                  <input
                    type="checkbox"
                    checked={alarm.enabled}
                    onChange={(e) => {
                      playClickSound();
                      updateAlarm(alarm.id, { enabled: e.target.checked, armedAt: Date.now(), snoozeUntil: undefined });
                    }}
                    aria-label={`Alarm at ${formatClock(alarm.time)} ${alarm.enabled ? "on" : "off"}`}
                  />
                  <span aria-hidden="true" />
                </label>
                <button
                  className="alarmIconButton"
                  onClick={() => {
                    playClickSound();
                    handleDelete(alarm.id);
                  }}
                  aria-label={`Delete alarm at ${formatClock(alarm.time)}`}
                >
                  <Trash2 size={14} />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {editing ? (
        <AlarmForm
          key={editing}
          initial={editingAlarm ?? { time: "07:00", label: "", days: [] }}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
        />
      ) : (
        <button className="alarmAdd" onClick={() => {
          playClickSound();
          setEditing("new");
        }}>
          <Plus size={14} /> Add alarm
        </button>
      )}
    </div>
  );
}

export default Alarm
