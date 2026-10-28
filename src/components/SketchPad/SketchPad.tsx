import "./SketchPad.css"
import { useEffect, useRef, useState, type PointerEvent } from "react";
import type { WidgetProps } from "../../widgets/registry";

const WIDTH = 260;
const HEIGHT = 180;
const INKS = ["#1f1f1f", "#e63946", "#2a9d8f", "#457b9d", "#f4a261", "#9b5de5"];
const SIZES = [2, 5, 10];
const ERASER = "#ffffff";

function SketchPad({ instanceId }: WidgetProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [ink, setInk] = useState(INKS[0]);
  const [size, setSize] = useState(SIZES[1]);
  const storageKey = `sketch:${instanceId}`;

  // Restore the saved drawing once on mount.
  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!;
    ctx.fillStyle = ERASER;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    try {
      const saved = localStorage.getItem(storageKey);
      if (!saved) return;
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0);
      img.src = JSON.parse(saved);
    } catch {
      // Corrupt or blocked storage — start blank.
    }
  }, [storageKey]);

  function save() {
    try {
      // JSON-encoded to match useLocalStorage's format for the same key prefix.
      localStorage.setItem(storageKey, JSON.stringify(canvasRef.current!.toDataURL()));
    } catch {
      // Storage full; the drawing still lives on screen.
    }
  }

  function point(event: PointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    // Scale for when CSS stretches the canvas away from its pixel size.
    return {
      x: ((event.clientX - rect.left) / rect.width) * WIDTH,
      y: ((event.clientY - rect.top) / rect.height) * HEIGHT,
    };
  }

  function draw(event: PointerEvent<HTMLCanvasElement>) {
    if (!last.current) return;
    const ctx = event.currentTarget.getContext("2d")!;
    const p = point(event);
    ctx.strokeStyle = ink;
    ctx.lineWidth = ink === ERASER ? size * 3 : size;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
  }

  function clear() {
    const ctx = canvasRef.current!.getContext("2d")!;
    ctx.fillStyle = ERASER;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    localStorage.removeItem(storageKey);
  }

  return (
    <div className="sketchPad">
      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        className="sketchCanvas"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          last.current = point(e);
          draw(e); // a single click leaves a dot
        }}
        onPointerMove={draw}
        onPointerUp={() => { last.current = null; save(); }}
        onPointerCancel={() => { last.current = null; }}
      />
      <div className="sketchTools">
        {INKS.map((color) => (
          <button
            key={color}
            className={`sketchInk${ink === color ? " active" : ""}`}
            style={{ backgroundColor: color }}
            onClick={() => setInk(color)}
            aria-label={`Ink ${color}`}
          />
        ))}
        <button className={`sketchBtn${ink === ERASER ? " active" : ""}`} onClick={() => setInk(ERASER)}>Eraser</button>
      </div>
      <div className="sketchTools">
        {SIZES.map((s) => (
          <button key={s} className={`sketchBtn${size === s ? " active" : ""}`} onClick={() => setSize(s)} aria-label={`Brush ${s}px`}>
            <span className="sketchSize" style={{ width: s + 2, height: s + 2 }} />
          </button>
        ))}
        <button className="sketchBtn sketchClear" onClick={clear}>Clear</button>
      </div>
    </div>
  );
}

export default SketchPad;
