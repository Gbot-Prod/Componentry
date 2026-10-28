import "./WorldClock.css"
import { useState } from "react";
import { X } from "lucide-react";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { useNow } from "../../hooks/useNow";
import type { WidgetProps } from "../../widgets/registry";

const ZONES = [
  "America/Los_Angeles", "America/Denver", "America/Chicago", "America/New_York", "America/Sao_Paulo",
  "Europe/London", "Europe/Paris", "Europe/Berlin", "Europe/Moscow", "Africa/Lagos", "Africa/Johannesburg",
  "Asia/Dubai", "Asia/Kolkata", "Asia/Singapore", "Asia/Shanghai", "Asia/Tokyo", "Australia/Sydney", "Pacific/Auckland",
];

const cityName = (zone: string) => zone.split("/").pop()!.replace(/_/g, " ");

function WorldClock({ instanceId }: WidgetProps) {
  const now = useNow();
  const [zones, setZones] = useLocalStorage<string[]>(`worldclock:${instanceId}`, ["Europe/London", "Asia/Tokyo"]);
  const [adding, setAdding] = useState("");

  const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const localDay = new Date(now).toLocaleDateString("en-CA", { timeZone: localZone });

  return (
    <div className="worldClock">
      {[localZone, ...zones].map((zone, i) => {
        const time = new Date(now).toLocaleTimeString([], { timeZone: zone, hour: "2-digit", minute: "2-digit" });
        // en-CA gives YYYY-MM-DD, so string comparison tells us yesterday/tomorrow.
        const day = new Date(now).toLocaleDateString("en-CA", { timeZone: zone });
        const dayNote = day > localDay ? "Tomorrow" : day < localDay ? "Yesterday" : "Today";
        const hour = Number(new Date(now).toLocaleString("en-US", { timeZone: zone, hour: "numeric", hour12: false }));
        const isNight = hour < 6 || hour >= 20;
        return (
          <div key={zone} className={`wcRow${isNight ? " night" : ""}`}>
            <div className="wcPlace">
              <span className="wcCity">{i === 0 ? `${cityName(zone)} (you)` : cityName(zone)}</span>
              <span className="wcDay">{dayNote}</span>
            </div>
            <span className="wcTime">{time}</span>
            {i > 0 && (
              <button onClick={() => setZones((z) => z.filter((x) => x !== zone))} aria-label={`Remove ${cityName(zone)}`}>
                <X size={12} />
              </button>
            )}
          </div>
        );
      })}
      <select
        value={adding}
        onChange={(e) => {
          if (e.target.value) setZones((z) => [...z, e.target.value]);
          setAdding("");
        }}
        aria-label="Add a city"
      >
        <option value="">+ Add city</option>
        {ZONES.filter((z) => z !== localZone && !zones.includes(z)).map((z) => (
          <option key={z} value={z}>{cityName(z)}</option>
        ))}
      </select>
    </div>
  );
}

export default WorldClock;
