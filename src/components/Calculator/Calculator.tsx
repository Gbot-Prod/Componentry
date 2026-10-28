import "./Calculator.css"
import { useState, type KeyboardEvent } from "react";

type Operator = "+" | "−" | "×" | "÷";

const KEYS = ["C", "±", "%", "÷", "7", "8", "9", "×", "4", "5", "6", "−", "1", "2", "3", "+", "0", ".", "⌫", "="];
const OPERATORS: Operator[] = ["+", "−", "×", "÷"];
// Keyboard keys mapped onto the on-screen buttons.
const KEYBOARD: Record<string, string> = { "*": "×", "/": "÷", "-": "−", Enter: "=", Backspace: "⌫", Escape: "C" };

function apply(a: number, b: number, op: Operator) {
  switch (op) {
    case "+": return a + b;
    case "−": return a - b;
    case "×": return a * b;
    case "÷": return b === 0 ? NaN : a / b;
  }
}

// Trim float noise like 0.1 + 0.2 = 0.30000000000000004.
const format = (n: number) => (Number.isFinite(n) ? String(parseFloat(n.toPrecision(12))) : "Error");

function Calculator() {
  const [display, setDisplay] = useState("0");
  const [stored, setStored] = useState<number | null>(null);
  const [pending, setPending] = useState<Operator | null>(null);
  // True right after an operator/equals, so the next digit starts a new number.
  const [freshEntry, setFreshEntry] = useState(true);

  function press(key: string) {
    if (/^[0-9]$/.test(key)) {
      setDisplay((d) => (freshEntry || d === "0" ? key : d + key));
      setFreshEntry(false);
    } else if (key === ".") {
      setDisplay((d) => (freshEntry ? "0." : d.includes(".") ? d : d + "."));
      setFreshEntry(false);
    } else if (key === "C") {
      setDisplay("0");
      setStored(null);
      setPending(null);
      setFreshEntry(true);
    } else if (key === "⌫") {
      if (!freshEntry) setDisplay((d) => (d.length > 1 ? d.slice(0, -1) : "0"));
    } else if (key === "±") {
      setDisplay((d) => format(-parseFloat(d)));
    } else if (key === "%") {
      setDisplay((d) => format(parseFloat(d) / 100));
    } else if (OPERATORS.includes(key as Operator) || key === "=") {
      const current = parseFloat(display);
      let result = current;
      // Chain: "2 + 3 ×" evaluates 2 + 3 before starting the multiply.
      if (stored !== null && pending && !freshEntry) {
        result = apply(stored, current, pending);
        setDisplay(format(result));
      }
      setStored(key === "=" ? null : result);
      setPending(key === "=" ? null : (key as Operator));
      setFreshEntry(true);
    }
  }

  // Scoped to the widget (it's focusable) so multiple calculators don't all react.
  function onKeyDown(event: KeyboardEvent) {
    const key = KEYBOARD[event.key] ?? event.key;
    if (KEYS.includes(key)) {
      event.preventDefault();
      press(key);
    }
  }

  return (
    <div className="calculator" tabIndex={0} onKeyDown={onKeyDown} aria-label="Calculator">
      <div className="calcDisplay">
        <span className="calcPending">{stored !== null && pending ? `${format(stored)} ${pending}` : ""}</span>
        <span className="calcValue">{display}</span>
      </div>
      <div className="calcKeys">
        {KEYS.map((key) => (
          <button
            key={key}
            className={`calcKey${OPERATORS.includes(key as Operator) || key === "=" ? " calcOp" : ""}${pending === key && freshEntry ? " active" : ""}`}
            onClick={() => press(key)}
          >
            {key}
          </button>
        ))}
      </div>
    </div>
  );
}

export default Calculator;
