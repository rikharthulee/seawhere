import { Bus, Car, Bike, Ship, Train, Plane, Footprints } from "lucide-react";

function formatDuration(minutes) {
  const total = Number(minutes || 0);
  if (!Number.isFinite(total) || total <= 0) return null;
  if (total < 60) return `${total} minutes`;
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  if (mins === 0) return `${hours} hours`;
  return `${hours} hours ${mins} minutes`;
}

function transportIconFor(mode) {
  const key = String(mode || "").toLowerCase().replace(/\s+/g, "_");
  if (key.includes("walk")) return Footprints;
  if (key.includes("bike")) return Bike;
  if (key.includes("boat") || key.includes("ferry")) return Ship;
  if (key.includes("train") || key.includes("rail")) return Train;
  if (key.includes("plane") || key.includes("flight")) return Plane;
  if (key.includes("car") || key.includes("taxi") || key.includes("tuk")) return Car;
  return Bus;
}

export default function TransportLegRow({ entry, isActive, onSelect }) {
  const leg = entry?.leg || {};
  const Icon = transportIconFor(leg.primary_mode || leg.title);
  const duration = formatDuration(leg.est_duration_min);

  return (
    <li className="relative flex items-center gap-5">
      <div className="flex w-8 justify-center">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <button
        type="button"
        onClick={() => onSelect?.(entry)}
        className={`w-full rounded-xl border bg-muted/40 p-4 text-left transition focus:outline-none focus:ring-2 focus:ring-ring/40 ${
          isActive ? "border-primary/60 bg-primary/5" : "hover:shadow-sm"
        }`}
      >
        <div className="space-y-1">
          <div className="text-sm font-medium text-muted-foreground">
            {leg.title || leg.primary_mode || "Transport"}
          </div>
          {duration ? (
            <p className="text-sm text-muted-foreground">{duration}</p>
          ) : null}
          {leg.summary ? (
            <p className="text-sm text-muted-foreground">{leg.summary}</p>
          ) : null}
        </div>
      </button>
    </li>
  );
}
