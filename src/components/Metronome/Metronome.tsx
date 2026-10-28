import "./Metronome.css"
import { useEffect, useRef, useState } from "react";

const MIN_BPM = 30;
const MAX_BPM = 240;
const BEATS_OPTIONS = [2, 3, 4, 6];
// Schedule audio slightly ahead on the AudioContext clock; setInterval alone drifts audibly.
const LOOKAHEAD_S = 0.1;
const SCHEDULER_MS = 25;

function Metronome() {
  const [bpm, setBpm] = useState(100);
  const [beatsPerBar, setBeatsPerBar] = useState(4);
  const [isPlaying, setIsPlaying] = useState(false);
  const [beat, setBeat] = useState(-1);
  const audioRef = useRef<AudioContext | null>(null);
  const tapTimes = useRef<number[]>([]);

  useEffect(() => {
    if (!isPlaying) return;
    const ctx = (audioRef.current ??= new AudioContext());
    ctx.resume();
    let nextTime = ctx.currentTime + 0.05;
    let count = 0;
    const timeouts: number[] = [];

    const id = setInterval(() => {
      while (nextTime < ctx.currentTime + LOOKAHEAD_S) {
        const beatIndex = count % beatsPerBar;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        // Accent the first beat of the bar with a higher pitch.
        osc.frequency.value = beatIndex === 0 ? 1500 : 1000;
        gain.gain.setValueAtTime(0.3, nextTime);
        gain.gain.exponentialRampToValueAtTime(0.001, nextTime + 0.05);
        osc.connect(gain).connect(ctx.destination);
        osc.start(nextTime);
        osc.stop(nextTime + 0.05);
        // Light up the visual beat when the sound actually plays.
        const delay = (nextTime - ctx.currentTime) * 1000;
        timeouts.push(window.setTimeout(() => setBeat(beatIndex), delay));
        nextTime += 60 / bpm;
        count++;
      }
    }, SCHEDULER_MS);

    return () => {
      clearInterval(id);
      timeouts.forEach(clearTimeout);
      setBeat(-1);
    };
  }, [isPlaying, bpm, beatsPerBar]);

  useEffect(() => () => {
    audioRef.current?.close();
    audioRef.current = null;
  }, []);

  function tap() {
    const now = performance.now();
    // Forget taps older than 2s so a new tempo isn't averaged with an old one.
    const taps = [...tapTimes.current.filter((t) => now - t < 2000), now].slice(-5);
    tapTimes.current = taps;
    if (taps.length < 2) return;
    const avgGap = (taps[taps.length - 1] - taps[0]) / (taps.length - 1);
    setBpm(Math.min(MAX_BPM, Math.max(MIN_BPM, Math.round(60000 / avgGap))));
  }

  return (
    <div className="metronome">
      <div className="metroBeats">
        {Array.from({ length: beatsPerBar }, (_, i) => (
          <span key={i} className={`metroDot${beat === i ? " on" : ""}${i === 0 ? " accent" : ""}`} />
        ))}
      </div>
      <div className="metroBpm">
        <button onClick={() => setBpm((b) => Math.max(MIN_BPM, b - 1))} aria-label="Slower">−</button>
        <span><strong>{bpm}</strong> BPM</span>
        <button onClick={() => setBpm((b) => Math.min(MAX_BPM, b + 1))} aria-label="Faster">+</button>
      </div>
      <input
        type="range"
        min={MIN_BPM}
        max={MAX_BPM}
        value={bpm}
        onChange={(e) => setBpm(Number(e.target.value))}
        aria-label="Tempo"
      />
      <div className="metroControls">
        <select value={beatsPerBar} onChange={(e) => setBeatsPerBar(Number(e.target.value))} aria-label="Beats per bar">
          {BEATS_OPTIONS.map((n) => <option key={n} value={n}>{n}/4</option>)}
        </select>
        <button onClick={tap}>Tap</button>
        <button className="metroPlay" onClick={() => setIsPlaying((p) => !p)}>{isPlaying ? "Stop" : "Start"}</button>
      </div>
    </div>
  );
}

export default Metronome;
