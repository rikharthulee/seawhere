import { MapPin, StickyNote, Utensils, Circle } from "lucide-react";

function formatDuration(minutes) {
  const total = Number(minutes || 0);
  if (!Number.isFinite(total) || total <= 0) return null;
  if (total < 60) return `${total} minutes`;
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  if (mins === 0) return `${hours} hours`;
  return `${hours} hours ${mins} minutes`;
}

function formatMealType(mealType) {
  if (!mealType) return "Meal";
  return mealType.charAt(0).toUpperCase() + mealType.slice(1);
}

function getItemIcon(itemType) {
  const type = String(itemType || "").toLowerCase();
  if (type === "note") return StickyNote;
  if (type === "meal") return Utensils;
  return MapPin;
}

export default function ItineraryRow({
  entry,
  isActive,
  onSelect,
  compact = false,
}) {
  const it = entry?.it || {};
  const isOptional = !!it.is_optional;
  const Icon = getItemIcon(it.item_type);
  const duration = formatDuration(it.duration_minutes);
  const secondary =
    it.details || it.displaySummary || it.summary || it.descriptionText || "";

  const markerClass = isOptional
    ? "border border-muted bg-background text-muted-foreground"
    : "bg-primary text-primary-foreground shadow-sm";
  const markerSize = compact ? "h-7 w-7" : "h-9 w-9";
  const iconSize = compact ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <li className="relative flex gap-5">
      <div className="flex w-8 justify-center">
        <span className={`flex items-center justify-center rounded-full ${markerClass} ${markerSize}`}>
          {isOptional ? (
            <Circle className="h-3 w-3 text-muted-foreground" />
          ) : (
            <Icon className={iconSize} />
          )}
        </span>
      </div>
      <button
        type="button"
        onClick={() => onSelect?.(entry)}
        className={`w-full rounded-xl border bg-card/70 p-4 text-left transition focus:outline-none focus:ring-2 focus:ring-ring/40 ${
          isActive ? "border-primary/60 bg-primary/5" : "hover:shadow-sm"
        } ${compact ? "p-3" : ""} ${isOptional ? "opacity-75" : ""}`}
      >
        <div className="min-w-0 space-y-1">
          <div className="text-base font-semibold">
            {it.item_type === "meal"
              ? formatMealType(it.meal_type)
              : it.displayName || it.name || "Stop"}
          </div>
          {secondary || duration ? (
            <p className="text-sm text-muted-foreground">
              {secondary}
              {secondary && duration ? " · " : ""}
              {duration || ""}
            </p>
          ) : null}
          {isOptional ? (
            <span className="text-xs text-muted-foreground">Optional</span>
          ) : null}
        </div>
      </button>
    </li>
  );
}
