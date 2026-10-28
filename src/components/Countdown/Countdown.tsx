import "./Countdown.css"
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { useNow } from "../../hooks/useNow";
import type { WidgetProps } from "../../widgets/registry";

type Event = { name: string; date: string };

const UNITS = [
  { label: "days", ms: 86_400_000 },
  { label: "hrs", ms: 3_600_000 },
  { label: "min", ms: 60_000 },
  { label: "sec", ms: 1000 },
];

function Countdown({ instanceId }: WidgetProps) {
  const now = useNow();
  const [event, setEvent] = useLocalStorage<Event>(`countdown:${instanceId}`, { name: "", date: "" });

  const target = event.date ? new Date(event.date).getTime() : NaN;
  const diff = target - now;
  const isPast = diff <= 0;

  const abs = Math.abs(diff);
  // Each unit is what's left after the next-larger unit is taken out.
  const parts = UNITS.map(({ label, ms }, i) => ({
    label,
    value: Math.floor((i === 0 ? abs : abs % UNITS[i - 1].ms) / ms),
  }));

  return (
    <div className="countdown">
      <input
        className="cdName"
        value={event.name}
        onChange={(e) => setEvent((ev) => ({ ...ev, name: e.target.value }))}
        placeholder="Name the big day"
        aria-label="Event name"
      />
      <input
        className="cdDate"
        type="datetime-local"
        value={event.date}
        onChange={(e) => setEvent((ev) => ({ ...ev, date: e.target.value }))}
        aria-label="Event date"
      />
      {Number.isNaN(target) ? (
        <p className="cdHint">Pick a date to start counting.</p>
      ) : (
        <>
          <div className="cdParts">
            {parts.map(({ label, value }) => (
              <div key={label} className="cdPart">
                <span className="cdValue">{value}</span>
                <span className="cdLabel">{label}</span>
              </div>
            ))}
          </div>
          <p className="cdHint">{isPast ? `since ${event.name || "it happened"} 🎉` : `until ${event.name || "the big day"}`}</p>
        </>
      )}
    </div>
  );
}

export default Countdown;
