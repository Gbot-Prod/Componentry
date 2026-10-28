import "./DateCalculator.css"
import { useState } from "react";

type Mode = "between" | "add";

const DAY_MS = 86_400_000;
const todayString = () => new Date().toLocaleDateString("en-CA");
// Parse YYYY-MM-DD as a local date at noon so DST shifts never move it a day.
const parse = (s: string) => new Date(`${s}T12:00:00`);

function DateCalculator() {
  const [mode, setMode] = useState<Mode>("between");
  const [start, setStart] = useState(todayString);
  const [end, setEnd] = useState(todayString);
  const [offset, setOffset] = useState("30");

  let output: string[] = [];
  if (mode === "between" && start && end) {
    const days = Math.round((parse(end).getTime() - parse(start).getTime()) / DAY_MS);
    const abs = Math.abs(days);
    const weekdays = countWeekdays(parse(start), parse(end));
    output = [
      `${abs} day${abs === 1 ? "" : "s"}${days < 0 ? " (in the past)" : ""}`,
      `${Math.floor(abs / 7)} weeks, ${abs % 7} days`,
      `${weekdays} weekdays`,
    ];
  } else if (mode === "add" && start) {
    const n = parseInt(offset, 10) || 0;
    const result = parse(start);
    result.setDate(result.getDate() + n);
    output = [result.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })];
  }

  return (
    <div className="dateCalc">
      <div className="dcModes" role="group">
        <button aria-pressed={mode === "between"} onClick={() => setMode("between")}>Between</button>
        <button aria-pressed={mode === "add"} onClick={() => setMode("add")}>Add / subtract</button>
      </div>
      <label>
        {mode === "between" ? "From" : "Start"}
        <input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
      </label>
      {mode === "between" ? (
        <label>
          To
          <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
        </label>
      ) : (
        <label>
          Days (negative to go back)
          <input type="number" value={offset} onChange={(e) => setOffset(e.target.value)} />
        </label>
      )}
      <div className="dcResult">
        {output.map((line, i) => <div key={i} className={i === 0 ? "dcMain" : ""}>{line}</div>)}
      </div>
    </div>
  );
}

function countWeekdays(a: Date, b: Date) {
  const [from, to] = a <= b ? [a, b] : [b, a];
  let count = 0;
  for (const d = new Date(from); d < to; d.setDate(d.getDate() + 1)) {
    if (d.getDay() !== 0 && d.getDay() !== 6) count++;
  }
  return count;
}

export default DateCalculator;
