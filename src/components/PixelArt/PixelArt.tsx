import "./PixelArt.css"
import { useRef, useState } from "react";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import type { WidgetProps } from "../../widgets/registry";

const SIZE = 16;
const PALETTE = [
  "#000000", "#ffffff", "#9d9d9d", "#be2633", "#e06f8b", "#a46422", "#eb8931", "#f7e26b",
  "#a3ce27", "#44891a", "#2f484e", "#1b2632", "#005784", "#31a2f2", "#b2dcef", "#493c2b",
];
const EMPTY = "";

const blank = () => Array<string>(SIZE * SIZE).fill(EMPTY);

function PixelArt({ instanceId }: WidgetProps) {
  const [pixels, setPixels] = useLocalStorage<string[]>(`pixels:${instanceId}`, blank);
  const [color, setColor] = useState(PALETTE[3]);
  const [tool, setTool] = useState<"pen" | "eraser" | "fill">("pen");
  const painting = useRef(false);

  function paint(i: number) {
    const value = tool === "eraser" ? EMPTY : color;
    if (tool === "fill") {
      setPixels((ps) => floodFill(ps, i, color));
      return;
    }
    setPixels((ps) => (ps[i] === value ? ps : ps.map((p, j) => (j === i ? value : p))));
  }

  function exportPng() {
    const scale = 16;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = SIZE * scale;
    const ctx = canvas.getContext("2d")!;
    pixels.forEach((p, i) => {
      if (!p) return;
      ctx.fillStyle = p;
      ctx.fillRect((i % SIZE) * scale, Math.floor(i / SIZE) * scale, scale, scale);
    });
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = "pixel-art.png";
    a.click();
  }

  return (
    <div className="pixelArt" onPointerUp={() => (painting.current = false)} onPointerLeave={() => (painting.current = false)}>
      <div className="paGrid" style={{ gridTemplateColumns: `repeat(${SIZE}, 1fr)` }}>
        {pixels.map((p, i) => (
          <div
            key={i}
            className="paPixel"
            style={p ? { backgroundColor: p } : undefined}
            onPointerDown={(e) => {
              e.preventDefault();
              painting.current = true;
              paint(i);
            }}
            onPointerEnter={() => painting.current && tool !== "fill" && paint(i)}
          />
        ))}
      </div>
      <div className="paPalette">
        {PALETTE.map((c) => (
          <button
            key={c}
            className={c === color && tool !== "eraser" ? "active" : ""}
            style={{ backgroundColor: c }}
            onClick={() => { setColor(c); if (tool === "eraser") setTool("pen"); }}
            aria-label={`Color ${c}`}
          />
        ))}
      </div>
      <div className="paTools">
        {(["pen", "fill", "eraser"] as const).map((t) => (
          <button key={t} aria-pressed={tool === t} onClick={() => setTool(t)}>{t}</button>
        ))}
        <button onClick={exportPng}>PNG</button>
        <button onClick={() => setPixels(blank())}>Clear</button>
      </div>
    </div>
  );
}

function floodFill(pixels: string[], start: number, color: string) {
  const target = pixels[start];
  if (target === color) return pixels;
  const next = [...pixels];
  const stack = [start];
  while (stack.length) {
    const i = stack.pop()!;
    if (next[i] !== target) continue;
    next[i] = color;
    const x = i % SIZE;
    if (x > 0) stack.push(i - 1);
    if (x < SIZE - 1) stack.push(i + 1);
    if (i >= SIZE) stack.push(i - SIZE);
    if (i < SIZE * (SIZE - 1)) stack.push(i + SIZE);
  }
  return next;
}

export default PixelArt;
