import "./FidgetSpinner.css"
import { useEffect, useRef, useState, type PointerEvent } from "react";

// Fraction of speed kept per second; lower = more friction.
const FRICTION_PER_S = 0.55;
const MAX_SPEED = 3600; // deg/s
const READOUT_MS = 100;

function FidgetSpinner() {
  const spinnerRef = useRef<SVGSVGElement>(null);
  const angle = useRef(0);
  const speed = useRef(0); // deg/s
  const drag = useRef<{ angle: number; time: number } | null>(null);
  const frame = useRef(0);
  const lastReadout = useRef(0);
  const [rpm, setRpm] = useState(0);
  const [topRpm, setTopRpm] = useState(0);

  // Animation runs on refs and writes the transform directly, so 60fps doesn't mean 60 renders/s.
  function animate() {
    let prev = performance.now();
    cancelAnimationFrame(frame.current);
    const step = (now: number) => {
      const dt = (now - prev) / 1000;
      prev = now;
      if (!drag.current) speed.current *= FRICTION_PER_S ** dt;
      angle.current = (angle.current + speed.current * dt) % 360;
      spinnerRef.current?.setAttribute("style", `transform: rotate(${angle.current}deg)`);
      // The RPM readout only needs ~10 updates/s.
      if (now - lastReadout.current > READOUT_MS) {
        lastReadout.current = now;
        const currentRpm = Math.round(Math.abs(speed.current) / 6);
        setRpm(currentRpm);
        setTopRpm((t) => Math.max(t, currentRpm));
      }
      if (Math.abs(speed.current) > 5 || drag.current) frame.current = requestAnimationFrame(step);
      else setRpm(0);
    };
    frame.current = requestAnimationFrame(step);
  }

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  function pointerAngle(event: PointerEvent) {
    const rect = spinnerRef.current!.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    return (Math.atan2(event.clientY - cy, event.clientX - cx) * 180) / Math.PI;
  }

  function onPointerDown(event: PointerEvent) {
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { angle: pointerAngle(event), time: performance.now() };
    speed.current = 0;
    animate();
  }

  function onPointerMove(event: PointerEvent) {
    if (!drag.current) return;
    const a = pointerAngle(event);
    const now = performance.now();
    // Unwrap across the ±180° seam.
    let delta = a - drag.current.angle;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    const dt = Math.max(1, now - drag.current.time) / 1000;
    angle.current += delta;
    speed.current = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, delta / dt));
    drag.current = { angle: a, time: now };
  }

  function onPointerUp() {
    drag.current = null;
  }

  const arms = [0, 120, 240];

  return (
    <div className="fidget">
      <div className="fidgetStage" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>
        <svg ref={spinnerRef} className="fidgetSpinner" viewBox="-100 -100 200 200">
          {arms.map((deg) => (
            <g key={deg} transform={`rotate(${deg})`}>
              <rect x={-14} y={-62} width={28} height={62} fill="#ff6b6b" />
              <circle cy={-62} r={30} fill="#ff6b6b" />
              <circle cy={-62} r={17} fill="#3b3b3b" stroke="#aaa" strokeWidth={4} />
            </g>
          ))}
          <circle r={30} fill="#ff6b6b" />
          <circle r={17} fill="#d9d9d9" stroke="#888" strokeWidth={4} />
        </svg>
      </div>
      <div className="fidgetStats">
        <span>{rpm} RPM</span>
        <span>Best {topRpm}</span>
      </div>
      <p className="fidgetHint">Flick it!</p>
    </div>
  );
}

export default FidgetSpinner;
