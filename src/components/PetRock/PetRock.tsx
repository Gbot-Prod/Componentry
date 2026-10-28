import "./PetRock.css"
import { useState } from "react";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { useNow } from "../../hooks/useNow";
import type { WidgetProps } from "../../widgets/registry";

type Rock = { name: string; lastPet: number; lastFed: number; hat: number; pets: number };

const HATS = ["", "🎩", "👑", "🧢", "🎓", "🌸"];
// Happiness drains over a few hours of neglect. It's a rock; it's resilient.
const DECAY_MS = 3 * 3_600_000;
const QUIPS = [
  "…", "*rock noises*", "I've been here for 4 billion years.", "You're doing great.", "Erosion is a journey.",
  "I'm not stuck, I'm committed.", "Could be worse. Could be sand.", "Thanks. I needed that.",
];

const fresh = (): Rock => ({ name: "Rocky", lastPet: Date.now(), lastFed: Date.now(), hat: 0, pets: 0 });

function PetRock({ instanceId }: WidgetProps) {
  const [rock, setRock] = useLocalStorage<Rock>(`petrock:${instanceId}`, fresh);
  const [quip, setQuip] = useState<string | null>(null);
  const [bounce, setBounce] = useState(0);
  const now = useNow(30_000);

  const level = (since: number) => Math.max(0, 1 - (now - since) / DECAY_MS);
  const love = level(rock.lastPet);
  const snacks = level(rock.lastFed);
  const mood = (love + snacks) / 2;
  const face = mood > 0.7 ? "◕‿◕" : mood > 0.4 ? "•_•" : mood > 0.15 ? "•︵•" : "ಥ_ಥ";

  function interact(kind: "pet" | "feed") {
    setRock((r) => ({
      ...r,
      ...(kind === "pet" ? { lastPet: Date.now(), pets: r.pets + 1 } : { lastFed: Date.now() }),
    }));
    setQuip(kind === "feed" ? "Mmm, minerals." : QUIPS[Math.floor(Math.random() * QUIPS.length)]);
    setBounce((b) => b + 1);
  }

  return (
    <div className="petRock">
      {quip && <div key={bounce} className="prBubble">{quip}</div>}
      <button key={`rock-${bounce}`} className="prRock" onClick={() => interact("pet")} aria-label={`Pet ${rock.name}`}>
        {HATS[rock.hat] && <span className="prHat">{HATS[rock.hat]}</span>}
        <span className="prFace">{face}</span>
      </button>
      <input
        className="prName"
        value={rock.name}
        onChange={(e) => setRock((r) => ({ ...r, name: e.target.value }))}
        aria-label="Rock name"
      />
      <div className="prBars">
        <label>Love <meter min={0} max={1} low={0.3} high={0.7} optimum={1} value={love} /></label>
        <label>Snacks <meter min={0} max={1} low={0.3} high={0.7} optimum={1} value={snacks} /></label>
      </div>
      <div className="prActions">
        <button onClick={() => interact("pet")}>Pet</button>
        <button onClick={() => interact("feed")}>Feed pebble</button>
        <button onClick={() => setRock((r) => ({ ...r, hat: (r.hat + 1) % HATS.length }))}>Hat</button>
      </div>
      <div className="prPets">Petted {rock.pets} times</div>
    </div>
  );
}

export default PetRock;
