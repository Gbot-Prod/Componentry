import "./TipSplitter.css"
import { useState } from "react";

const TIP_PRESETS = [0, 10, 15, 18, 20, 25];

const money = (n: number) => (Number.isFinite(n) ? n.toLocaleString(undefined, { style: "currency", currency: "USD" }) : "—");

function TipSplitter() {
  const [bill, setBill] = useState("");
  const [tipPercent, setTipPercent] = useState(18);
  const [people, setPeople] = useState(2);
  const [roundUp, setRoundUp] = useState(false);

  const amount = parseFloat(bill) || 0;
  const tip = (amount * tipPercent) / 100;
  let perPerson = (amount + tip) / people;
  // Rounding up per person, then backing out the actual total everyone pays.
  if (roundUp) perPerson = Math.ceil(perPerson);
  const total = perPerson * people;

  return (
    <div className="tipSplitter">
      <label className="tsField">
        Bill
        <input type="number" inputMode="decimal" min={0} value={bill} onChange={(e) => setBill(e.target.value)} placeholder="0.00" />
      </label>

      <div className="tsField">
        Tip
        <div className="tsPresets">
          {TIP_PRESETS.map((p) => (
            <button key={p} className={p === tipPercent ? "active" : ""} onClick={() => setTipPercent(p)}>{p}%</button>
          ))}
        </div>
      </div>

      <div className="tsField tsPeople">
        People
        <div>
          <button onClick={() => setPeople((p) => Math.max(1, p - 1))} disabled={people <= 1} aria-label="Fewer people">−</button>
          <strong>{people}</strong>
          <button onClick={() => setPeople((p) => p + 1)} aria-label="More people">+</button>
        </div>
      </div>

      <label className="tsRound">
        <input type="checkbox" checked={roundUp} onChange={(e) => setRoundUp(e.target.checked)} />
        Round up per person
      </label>

      <div className="tsResult">
        <div><span>Each pays</span><strong>{money(perPerson)}</strong></div>
        <div className="tsSub"><span>Tip {money(roundUp ? total - amount : tip)}</span><span>Total {money(total)}</span></div>
      </div>
    </div>
  );
}

export default TipSplitter;
