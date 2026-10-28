import "./TextTools.css"
import { useState } from "react";

const words = (s: string) => s.match(/[A-Za-z0-9]+/g) ?? [];
const cap = (w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();

const TRANSFORMS: { label: string; fn: (s: string) => string }[] = [
  { label: "UPPER", fn: (s) => s.toUpperCase() },
  { label: "lower", fn: (s) => s.toLowerCase() },
  { label: "Title", fn: (s) => s.replace(/\S+/g, cap) },
  { label: "camelCase", fn: (s) => words(s).map((w, i) => (i ? cap(w) : w.toLowerCase())).join("") },
  { label: "snake_case", fn: (s) => words(s).map((w) => w.toLowerCase()).join("_") },
  { label: "kebab-case", fn: (s) => words(s).map((w) => w.toLowerCase()).join("-") },
  { label: "sPoNgE", fn: (s) => [...s].map((c, i) => (i % 2 ? c.toUpperCase() : c.toLowerCase())).join("") },
  { label: "Reverse", fn: (s) => [...s].reverse().join("") },
  { label: "Trim spaces", fn: (s) => s.replace(/[ \t]+/g, " ").replace(/^ +| +$/gm, "") },
];

const READING_WPM = 230;

function TextTools() {
  const [text, setText] = useState("");

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const lineCount = text ? text.split("\n").length : 0;
  const readMinutes = Math.max(1, Math.round(wordCount / READING_WPM));

  return (
    <div className="textTools">
      <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste or type text…" aria-label="Text" />
      <div className="ttStats">
        <span>{wordCount} words</span>
        <span>{text.length} chars</span>
        <span>{lineCount} lines</span>
        {wordCount > 0 && <span>~{readMinutes} min read</span>}
      </div>
      <div className="ttButtons">
        {TRANSFORMS.map(({ label, fn }) => (
          <button key={label} onClick={() => setText(fn)} disabled={!text}>{label}</button>
        ))}
        <button onClick={() => navigator.clipboard.writeText(text).catch(() => {})} disabled={!text}>Copy</button>
      </div>
    </div>
  );
}

export default TextTools;
