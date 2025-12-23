import { MapPin, Bus, Circle } from "lucide-react";

const SAMPLE_FLOW = [
  { kind: "leg", leg: { title: "Van", est_duration_min: 30 } },
  {
    kind: "item",
    it: {
      item_type: "sight",
      displayName: "Kuang Si Falls",
      details: "Sightseeing, Walk, Swimming",
      duration_minutes: 120,
    },
  },
  {
    kind: "item",
    it: {
      item_type: "sight",
      displayName: "Tat Kuang Si Bear Rescue Centre",
      details: "Visit",
      duration_minutes: 5,
      optional: true,
    },
  },
  {
    kind: "item",
    it: {
      item_type: "sight",
      displayName: "Pak Ou Caves",
      details: "Guided tour, Free time",
      duration_minutes: 30,
    },
  },
];

function formatDuration(minutes) {
  const total = Number(minutes || 0);
  if (!Number.isFinite(total) || total <= 0) return null;
  if (total < 60) return `${total} minutes`;
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  if (mins === 0) return `${hours} hours`;
  return `${hours} hours ${mins} minutes`;
}

function isOptionalEntry(entry) {
  const it = entry?.it || {};
  if (it.optional || it.is_optional || it.optional_stop) return true;
  const text = `${it.details || ""} ${it.displaySummary || ""}`.toLowerCase();
  return /\boptional\b/.test(text);
}

function labelFromType(type) {
  return String(type || "").replace("_", " ").trim() || "Stop";
}

export default function Timeline({
  flow = [],
  className = "",
  showSample = false,
}) {
  const entries = Array.isArray(flow) && flow.length > 0 ? flow : showSample ? SAMPLE_FLOW : [];

  if (!entries.length) {
    return <p className="text-sm text-muted-foreground">No items yet.</p>;
  }

  return (
    <div className={["relative pl-2", className].join(" ")}>
      <div className="absolute left-4 top-0 h-full w-px bg-muted" />
      <ul className="space-y-10 md:space-y-12">
        {entries.map((entry, idx) => {
          if (entry.kind === "leg") {
            const leg = entry.leg || {};
            const duration = formatDuration(leg.est_duration_min);
            return (
              <li key={`leg-${idx}`} className="relative flex gap-5">
                <div className="flex w-8 justify-center">
                  <span className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-muted">
                    <Bus className="h-4 w-4 text-muted-foreground" />
                  </span>
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    {leg.title || leg.primary_mode || "Transport"}
                  </h4>
                  {duration ? (
                    <p className="text-sm text-muted-foreground">{duration}</p>
                  ) : null}
                </div>
              </li>
            );
          }

          const it = entry.it || {};
          const isOptional = isOptionalEntry(entry);
          const duration = formatDuration(it.duration_minutes);
          return (
            <li
              key={`item-${idx}`}
              className={`relative flex gap-5 ${isOptional ? "opacity-70" : ""}`}
            >
              <div className="flex w-8 justify-center">
                <span
                  className={
                    isOptional
                      ? "mt-0.5 flex h-7 w-7 items-center justify-center rounded-full border border-muted bg-background"
                      : "flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm"
                  }
                >
                  {isOptional ? (
                    <Circle className="h-3 w-3 text-muted-foreground" />
                  ) : (
                    <MapPin className="h-4 w-4" />
                  )}
                </span>
              </div>
              <div className="min-w-0">
                <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  {labelFromType(it.item_type)}
                </div>
                <h4 className="text-base font-semibold">
                  {it.displayName || it.name || "Stop"}
                </h4>
                {it.details ? (
                  <p className="text-sm text-muted-foreground">
                    {it.details}
                    {duration ? ` · ${duration}` : ""}
                  </p>
                ) : duration ? (
                  <p className="text-sm text-muted-foreground">{duration}</p>
                ) : null}
                {isOptional ? (
                  <span className="text-xs text-muted-foreground">
                    Optional
                  </span>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
