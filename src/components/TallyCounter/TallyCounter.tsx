import "./TallyCounter.css"
import { useLocalStorage } from "../../hooks/useLocalStorage";
import type { WidgetProps } from "../../widgets/registry";

type Tally = { label: string; count: number };

function TallyCounter({ instanceId }: WidgetProps) {
  const [tally, setTally] = useLocalStorage<Tally>(`tally:${instanceId}`, { label: "", count: 0 });

  const bump = (delta: number) => setTally((t) => ({ ...t, count: Math.max(0, t.count + delta) }));

  return (
    <div className="tally">
      <input
        className="tallyLabel"
        value={tally.label}
        onChange={(event) => setTally((t) => ({ ...t, label: event.target.value }))}
        placeholder="What are we counting?"
        aria-label="Counter label"
      />
      <button className="tallyCount" onClick={() => bump(1)} aria-label="Add one">
        {tally.count}
      </button>
      <div className="tallyControls">
        <button onClick={() => bump(-1)} disabled={tally.count === 0} aria-label="Subtract one">−1</button>
        <button onClick={() => setTally((t) => ({ ...t, count: 0 }))} disabled={tally.count === 0}>Reset</button>
        <button onClick={() => bump(10)}>+10</button>
      </div>
    </div>
  );
}

export default TallyCounter;
