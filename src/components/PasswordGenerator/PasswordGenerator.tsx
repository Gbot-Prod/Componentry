import "./PasswordGenerator.css"
import { useState } from "react";
import { Check, Copy, RefreshCw } from "lucide-react";

const SETS = {
  lower: "abcdefghijkmnopqrstuvwxyz",
  upper: "ABCDEFGHJKLMNPQRSTUVWXYZ",
  digits: "23456789", // no 0/1 — too easy to confuse with O/l
  symbols: "!@#$%^&*-_=+?",
} as const;

type SetName = keyof typeof SETS;

// crypto.getRandomValues, not Math.random — these are meant to be real passwords.
function randomIndex(max: number) {
  const buf = new Uint32Array(1);
  // Rejection sampling avoids modulo bias.
  const limit = Math.floor(0x100000000 / max) * max;
  do crypto.getRandomValues(buf); while (buf[0] >= limit);
  return buf[0] % max;
}

function generate(length: number, enabled: SetName[]) {
  const pool = enabled.map((name) => SETS[name]).join("");
  if (!pool) return "";
  return Array.from({ length }, () => pool[randomIndex(pool.length)]).join("");
}

function strength(length: number, setCount: number) {
  const score = length * setCount;
  if (score >= 64) return { label: "Strong", className: "strong" };
  if (score >= 36) return { label: "Okay", className: "okay" };
  return { label: "Weak", className: "weak" };
}

function PasswordGenerator() {
  const [length, setLength] = useState(16);
  const [enabled, setEnabled] = useState<SetName[]>(["lower", "upper", "digits", "symbols"]);
  const [password, setPassword] = useState(() => generate(length, enabled));
  const [copied, setCopied] = useState(false);

  // Settings changes regenerate from the handler, with the new values passed in.
  function regenerate(nextLength = length, nextEnabled = enabled) {
    setPassword(generate(nextLength, nextEnabled));
    setCopied(false);
  }

  function changeLength(next: number) {
    setLength(next);
    regenerate(next);
  }

  function toggle(name: SetName) {
    // Keep at least one set on so there's always something to generate from.
    if (enabled.includes(name) && enabled.length === 1) return;
    const next = enabled.includes(name) ? enabled.filter((n) => n !== name) : [...enabled, name];
    setEnabled(next);
    regenerate(length, next);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard blocked; the password is still selectable by hand.
    }
  }

  const { label, className } = strength(length, enabled.length);

  return (
    <div className="passwordGen">
      <div className="pwOutput">
        <code className="pwValue">{password}</code>
        <button onClick={copy} aria-label="Copy password" title="Copy">
          {copied ? <Check size={16} /> : <Copy size={16} />}
        </button>
        <button onClick={() => regenerate()} aria-label="Generate new password" title="Regenerate">
          <RefreshCw size={16} />
        </button>
      </div>
      <div className={`pwStrength ${className}`}>{label}</div>
      <label className="pwLength">
        Length: {length}
        <input type="range" min={6} max={40} value={length} onChange={(e) => changeLength(Number(e.target.value))} />
      </label>
      <div className="pwSets">
        {(Object.keys(SETS) as SetName[]).map((name) => (
          <label key={name}>
            <input type="checkbox" checked={enabled.includes(name)} onChange={() => toggle(name)} />
            {name}
          </label>
        ))}
      </div>
    </div>
  );
}

export default PasswordGenerator;
