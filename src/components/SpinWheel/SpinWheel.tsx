import "./SpinWheel.css"
import { useState } from "react";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import type { WidgetProps } from "../../widgets/registry";

const COLORS = ["#f94144", "#f3722c", "#f9c74f", "#90be6d", "#43aa8b", "#577590", "#9b5de5", "#f15bb5"];
const SPIN_MS = 3500;
const RADIUS = 90;

function SpinWheel({ instanceId }: WidgetProps) {
  const [optionsText, setOptionsText] = useLocalStorage(`wheel:${instanceId}`, "Pizza\nTacos\nSushi\nBurgers");
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);

  const options = optionsText.split("\n").map((o) => o.trim()).filter(Boolean);
  const slice = 360 / Math.max(options.length, 1);

  function spin() {
    if (isSpinning || options.length < 2) return;
    const pick = Math.floor(Math.random() * options.length);
    // The pointer is at the top (0°). Land the middle of slice `pick` under it, after 5+ full turns.
    const landing = 360 - (pick * slice + slice / 2);
    const jitter = (Math.random() - 0.5) * slice * 0.7;
    const base = Math.ceil(rotation / 360) * 360 + 360 * 5;
    setRotation(base + landing + jitter);
    setIsSpinning(true);
    setWinner(null);
    setTimeout(() => {
      setWinner(options[pick]);
      setIsSpinning(false);
    }, SPIN_MS);
  }

  // Wedge path for slice i, angles measured clockwise from 12 o'clock.
  function wedge(i: number) {
    const toXY = (deg: number) => {
      const rad = ((deg - 90) * Math.PI) / 180;
      return `${RADIUS + RADIUS * Math.cos(rad)} ${RADIUS + RADIUS * Math.sin(rad)}`;
    };
    const large = slice > 180 ? 1 : 0;
    return `M ${RADIUS} ${RADIUS} L ${toXY(i * slice)} A ${RADIUS} ${RADIUS} 0 ${large} 1 ${toXY((i + 1) * slice)} Z`;
  }

  return (
    <div className="spinWheel">
      <div className="wheelStage">
        <div className="wheelPointer" />
        <svg
          className="wheel"
          viewBox={`0 0 ${RADIUS * 2} ${RADIUS * 2}`}
          style={{ transform: `rotate(${rotation}deg)`, transitionDuration: `${SPIN_MS}ms` }}
          onClick={spin}
        >
          {options.length === 1 ? (
            <circle cx={RADIUS} cy={RADIUS} r={RADIUS} fill={COLORS[0]} />
          ) : (
            options.map((option, i) => (
              <g key={i}>
                <path d={wedge(i)} fill={COLORS[i % COLORS.length]} />
                <text
                  x={RADIUS}
                  y={18}
                  transform={`rotate(${i * slice + slice / 2} ${RADIUS} ${RADIUS})`}
                  className="wheelLabel"
                >
                  {option.length > 12 ? option.slice(0, 11) + "…" : option}
                </text>
              </g>
            ))
          )}
        </svg>
      </div>
      <div className="wheelResult">{winner ?? (isSpinning ? "Spinning…" : "Click the wheel")}</div>
      <textarea
        value={optionsText}
        onChange={(e) => setOptionsText(e.target.value)}
        disabled={isSpinning}
        aria-label="Wheel options, one per line"
      />
    </div>
  );
}

export default SpinWheel;
