import "./HabitTracker.css"
import { useState, type FormEvent } from "react";
import { X } from "lucide-react";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import type { WidgetProps } from "../../widgets/registry";

/** `done` holds the YYYY-MM-DD dates the habit was ticked off. */
type Habit = { id: string; name: string; done: string[] };

const DAYS_SHOWN = 7;

const dayKey = (date: Date) => date.toLocaleDateString("en-CA");

function lastDays(count: number) {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (count - 1 - i));
    return d;
  });
}

// Consecutive days ending today (or yesterday, so an unticked today doesn't zero it).
function streak(done: string[]) {
  const set = new Set(done);
  const d = new Date();
  if (!set.has(dayKey(d))) d.setDate(d.getDate() - 1);
  let count = 0;
  while (set.has(dayKey(d))) {
    count++;
    d.setDate(d.getDate() - 1);
  }
  return count;
}

function HabitTracker({ instanceId }: WidgetProps) {
  const [habits, setHabits] = useLocalStorage<Habit[]>(`habits:${instanceId}`, []);
  const [draft, setDraft] = useState("");
  const days = lastDays(DAYS_SHOWN);

  function add(event: FormEvent) {
    event.preventDefault();
    if (!draft.trim()) return;
    setHabits((h) => [...h, { id: crypto.randomUUID(), name: draft.trim(), done: [] }]);
    setDraft("");
  }

  function toggle(id: string, day: string) {
    setHabits((h) =>
      h.map((habit) =>
        habit.id !== id
          ? habit
          : { ...habit, done: habit.done.includes(day) ? habit.done.filter((d) => d !== day) : [...habit.done, day] },
      ),
    );
  }

  return (
    <div className="habits">
      <div className="habitGrid" style={{ gridTemplateColumns: `1fr repeat(${DAYS_SHOWN}, 22px) 34px` }}>
        <span />
        {days.map((d) => (
          <span key={dayKey(d)} className="habitDayLabel">{d.toLocaleDateString([], { weekday: "narrow" })}</span>
        ))}
        <span className="habitDayLabel">🔥</span>

        {habits.map((habit) => (
          <div key={habit.id} className="habitRow">
            <span className="habitName">
              <button onClick={() => setHabits((h) => h.filter((x) => x.id !== habit.id))} aria-label={`Delete ${habit.name}`}>
                <X size={10} />
              </button>
              {habit.name}
            </span>
            {days.map((d) => {
              const key = dayKey(d);
              const isDone = habit.done.includes(key);
              return (
                <button
                  key={key}
                  className={isDone ? "habitCell done" : "habitCell"}
                  onClick={() => toggle(habit.id, key)}
                  aria-label={`${habit.name} on ${d.toDateString()}`}
                  aria-pressed={isDone}
                />
              );
            })}
            <span className="habitStreak">{streak(habit.done)}</span>
          </div>
        ))}
      </div>
      <form className="habitAdd" onSubmit={add}>
        <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="New habit…" aria-label="New habit" />
      </form>
    </div>
  );
}

export default HabitTracker;
