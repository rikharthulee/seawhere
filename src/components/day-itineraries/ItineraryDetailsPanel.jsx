import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

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

function formatDistance(meters) {
  const value = Number(meters || 0);
  if (!Number.isFinite(value) || value <= 0) return null;
  if (value >= 1000) return `${(value / 1000).toFixed(1)} km`;
  return `${Math.round(value)} m`;
}

export default function ItineraryDetailsPanel({ entry }) {
  if (!entry) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-4 text-sm text-muted-foreground">
          Select a stop to see more details.
        </CardContent>
      </Card>
    );
  }

  if (entry.kind === "leg") {
    const leg = entry.leg || {};
    const duration = formatDuration(leg.est_duration_min);
    const distance = formatDistance(leg.est_distance_m);
    return (
      <Card>
        <CardContent className="p-5 space-y-3">
          <h3 className="text-lg font-semibold">
            {leg.title || leg.primary_mode || "Transport"}
          </h3>
          {leg.summary ? (
            <p className="text-sm text-muted-foreground">{leg.summary}</p>
          ) : null}
          <div className="text-sm text-muted-foreground space-y-1">
            {duration ? <div>Duration: {duration}</div> : null}
            {distance ? <div>Distance: {distance}</div> : null}
          </div>
          {leg.notes ? (
            <p className="text-sm text-muted-foreground">{leg.notes}</p>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  const it = entry.it || {};
  const duration = formatDuration(it.duration_minutes);
  const itemType = String(it.item_type || "").toLowerCase();
  const hasCoords =
    Number.isFinite(it.lat) && Number.isFinite(it.lng);

  if (itemType === "meal") {
    return (
      <Card>
        <CardContent className="p-5 space-y-3">
          <h3 className="text-lg font-semibold">
            {formatMealType(it.meal_type)}
          </h3>
          {duration ? (
            <p className="text-sm text-muted-foreground">{duration}</p>
          ) : null}
          {it.details ? (
            <p className="text-sm text-muted-foreground">{it.details}</p>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  if (itemType === "note") {
    return (
      <Card>
        <CardContent className="p-5 space-y-3">
          <h3 className="text-lg font-semibold">{it.displayName || "Note"}</h3>
          {it.details ? (
            <p className="text-sm text-muted-foreground whitespace-pre-line">
              {it.details}
            </p>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">{it.displayName || "Stop"}</h3>
          {duration ? (
            <p className="text-sm text-muted-foreground">{duration}</p>
          ) : null}
        </div>
        {it.displaySummary ? (
          <p className="text-sm text-muted-foreground">{it.displaySummary}</p>
        ) : null}
        {it.descriptionText && it.descriptionText !== it.displaySummary ? (
          <p className="text-sm text-muted-foreground">{it.descriptionText}</p>
        ) : null}
        {Array.isArray(it.tags) && it.tags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {it.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="capitalize">
                {tag}
              </Badge>
            ))}
          </div>
        ) : null}
        {hasCoords ? (
          <div className="space-y-2">
            <div className="overflow-hidden rounded-lg border">
              <iframe
                title={`Map of ${it.displayName || "stop"}`}
                src={`https://www.google.com/maps?q=${it.lat},${it.lng}&z=14&output=embed`}
                loading="lazy"
                className="h-40 w-full border-0"
              />
            </div>
            <a
              href={`https://www.google.com/maps?q=${it.lat},${it.lng}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs underline"
            >
              Open in Google Maps
            </a>
          </div>
        ) : null}
        {it.href ? (
          <Link href={it.href} className="inline-flex text-sm underline">
            View sight
          </Link>
        ) : null}
      </CardContent>
    </Card>
  );
}
