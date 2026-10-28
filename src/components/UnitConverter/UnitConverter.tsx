import "./UnitConverter.css"
import { useState } from "react";
import { ArrowLeftRight } from "lucide-react";

type Unit = { name: string; toBase: (v: number) => number; fromBase: (v: number) => number };

// Linear units only need a factor relative to the category's base unit.
const linear = (name: string, factor: number): Unit => ({
  name,
  toBase: (v) => v * factor,
  fromBase: (v) => v / factor,
});

const CATEGORIES: Record<string, Unit[]> = {
  Length: [
    linear("mm", 0.001), linear("cm", 0.01), linear("m", 1), linear("km", 1000),
    linear("in", 0.0254), linear("ft", 0.3048), linear("yd", 0.9144), linear("mi", 1609.344),
  ],
  Weight: [
    linear("g", 1), linear("kg", 1000), linear("oz", 28.349523125), linear("lb", 453.59237), linear("st", 6350.29318),
  ],
  Temperature: [
    { name: "°C", toBase: (v) => v, fromBase: (v) => v },
    { name: "°F", toBase: (v) => (v - 32) * (5 / 9), fromBase: (v) => v * (9 / 5) + 32 },
    { name: "K", toBase: (v) => v - 273.15, fromBase: (v) => v + 273.15 },
  ],
  Volume: [
    linear("ml", 0.001), linear("l", 1), linear("tsp", 0.00492892), linear("tbsp", 0.0147868),
    linear("cup", 0.236588), linear("fl oz", 0.0295735), linear("gal", 3.78541),
  ],
  Speed: [linear("m/s", 1), linear("km/h", 1 / 3.6), linear("mph", 0.44704), linear("knot", 0.514444)],
  Data: [
    linear("B", 1), linear("KB", 1e3), linear("MB", 1e6), linear("GB", 1e9), linear("TB", 1e12),
    linear("KiB", 1024), linear("MiB", 1024 ** 2), linear("GiB", 1024 ** 3),
  ],
};

const format = (n: number) => (Number.isFinite(n) ? String(parseFloat(n.toPrecision(8))) : "—");

function UnitConverter() {
  const [category, setCategory] = useState("Length");
  const [from, setFrom] = useState(0);
  const [to, setTo] = useState(1);
  const [input, setInput] = useState("1");

  const units = CATEGORIES[category];
  const value = parseFloat(input);
  const result = Number.isNaN(value) ? "" : format(units[to].fromBase(units[from].toBase(value)));

  function changeCategory(next: string) {
    setCategory(next);
    setFrom(0);
    setTo(1);
  }

  return (
    <div className="unitConverter">
      <select className="unitCategory" value={category} onChange={(e) => changeCategory(e.target.value)} aria-label="Category">
        {Object.keys(CATEGORIES).map((name) => <option key={name}>{name}</option>)}
      </select>
      <div className="unitRow">
        <input type="number" value={input} onChange={(e) => setInput(e.target.value)} aria-label="Value" />
        <select value={from} onChange={(e) => setFrom(Number(e.target.value))} aria-label="From unit">
          {units.map((u, i) => <option key={u.name} value={i}>{u.name}</option>)}
        </select>
      </div>
      <button
        className="unitSwap"
        onClick={() => { setFrom(to); setTo(from); if (result) setInput(result); }}
        aria-label="Swap units"
      >
        <ArrowLeftRight size={16} />
      </button>
      <div className="unitRow">
        <output className="unitResult">{result}</output>
        <select value={to} onChange={(e) => setTo(Number(e.target.value))} aria-label="To unit">
          {units.map((u, i) => <option key={u.name} value={i}>{u.name}</option>)}
        </select>
      </div>
    </div>
  );
}

export default UnitConverter;
