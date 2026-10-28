import "./LavaLamp.css"
import { useState, type CSSProperties } from "react";

const THEMES = [
  { name: "Classic", liquid: "#3a0b4d", blob: "#ff5e3a" },
  { name: "Ocean", liquid: "#032b44", blob: "#2ee6d6" },
  { name: "Lime", liquid: "#13260d", blob: "#b6ff3b" },
  { name: "Bubblegum", liquid: "#2d0b2a", blob: "#ff7ad9" },
];

// Fixed blob layout so the lamp looks the same on every render (no Math.random here).
const BLOBS = [
  { size: 46, left: 18, duration: 14, delay: 0 },
  { size: 34, left: 52, duration: 18, delay: -6 },
  { size: 58, left: 30, duration: 22, delay: -12 },
  { size: 28, left: 62, duration: 12, delay: -3 },
  { size: 40, left: 8, duration: 20, delay: -15 },
];

function LavaLamp() {
  const [themeIndex, setThemeIndex] = useState(0);
  const theme = THEMES[themeIndex];

  return (
    <div className="lavaLamp">
      <button
        className="llLamp"
        onClick={() => setThemeIndex((i) => (i + 1) % THEMES.length)}
        style={{ "--ll-liquid": theme.liquid, "--ll-blob": theme.blob } as CSSProperties}
        aria-label={`Lava lamp (${theme.name}). Click to change color.`}
      >
        <span className="llCap" />
        <span className="llGlass">
          {/* The blur + contrast filter on the glass makes nearby blobs melt together. */}
          {BLOBS.map((b, i) => (
            <span
              key={i}
              className="llBlob"
              style={{
                width: b.size,
                height: b.size,
                left: `${b.left}%`,
                animationDuration: `${b.duration}s`,
                animationDelay: `${b.delay}s`,
              }}
            />
          ))}
          <span className="llPool" />
        </span>
        <span className="llBase" />
      </button>
      <span className="llHint">{theme.name} · click to change</span>
    </div>
  );
}

export default LavaLamp;
