import "./ColorPicker.css"
import { useState } from "react";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import type { WidgetProps } from "../../widgets/registry";

const MAX_SWATCHES = 8;

function hexToRgb(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255] as const;
}

function rgbToHsl(r: number, g: number, b: number) {
  [r, g, b] = [r / 255, g / 255, b / 255];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, Math.round(l * 100)] as const;
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [Math.round(h * 60), Math.round(s * 100), Math.round(l * 100)] as const;
}

// Pick black or white text by perceived luminance.
const textOn = ([r, g, b]: readonly number[]) => (r * 0.299 + g * 0.587 + b * 0.114 > 150 ? "#111" : "#fff");

function ColorPicker({ instanceId }: WidgetProps) {
  const [color, setColor] = useState("#5865f2");
  const [swatches, setSwatches] = useLocalStorage<string[]>(`colors:${instanceId}`, []);
  const [copied, setCopied] = useState<string | null>(null);

  const rgb = hexToRgb(color);
  const [h, s, l] = rgbToHsl(...rgb);
  const formats = [color.toUpperCase(), `rgb(${rgb.join(", ")})`, `hsl(${h}, ${s}%, ${l}%)`];

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(text);
      setTimeout(() => setCopied(null), 1200);
    } catch {
      // Clipboard blocked; nothing else to do.
    }
  }

  function save() {
    setSwatches((current) => [color, ...current.filter((c) => c !== color)].slice(0, MAX_SWATCHES));
  }

  return (
    <div className="colorPicker">
      <label className="colorPreview" style={{ backgroundColor: color, color: textOn(rgb) }}>
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} aria-label="Pick a color" />
        Click to pick
      </label>
      <div className="colorFormats">
        {formats.map((text) => (
          <button key={text} onClick={() => copy(text)} title="Copy">
            {copied === text ? "Copied!" : text}
          </button>
        ))}
      </div>
      <div className="colorSwatches">
        <button className="swatchSave" onClick={save} aria-label="Save color" title="Save color">+</button>
        {swatches.map((swatch) => (
          <button
            key={swatch}
            className="swatch"
            style={{ backgroundColor: swatch }}
            onClick={() => setColor(swatch)}
            onContextMenu={(e) => { e.preventDefault(); setSwatches((c) => c.filter((x) => x !== swatch)); }}
            aria-label={`Use ${swatch}`}
            title={`${swatch} (right-click to remove)`}
          />
        ))}
      </div>
    </div>
  );
}

export default ColorPicker;
