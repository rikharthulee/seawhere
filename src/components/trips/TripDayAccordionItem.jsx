"use client";

import { useEffect, useState } from "react";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { getDayItineraryItems } from "@/app/trips/actions";
import SafeImage from "@/components/SafeImage";
import { Badge } from "@/components/ui/badge";

function formatItemType(value) {
  if (!value) return "";
  const label = String(value).replace(/_/g, " ");
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function formatDuration(minutes) {
  const value = Number(minutes);
  if (!Number.isFinite(value) || value <= 0) return "";
  return `${value} min`;
}

export default function TripDayAccordionItem({
  day,
  destinationLabel,
  itineraryLabel,
  itineraryCount,
  isOpen,
}) {
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [flow, setFlow] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!isOpen || loaded || !day.day_itinerary_id) return;
      setLoading(true);
      setError("");
      try {
        const result = await getDayItineraryItems(day.day_itinerary_id);
        if (!mounted) return;
        setFlow(Array.isArray(result.flow) ? result.flow : []);
        setLoaded(true);
      } catch (err) {
        if (!mounted) return;
        setError(err?.message || "Failed to load itinerary items");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [day.day_itinerary_id, isOpen, loaded]);

  return (
    <AccordionItem value={day.id} className="rounded-lg border bg-card px-4">
      <AccordionTrigger className="no-underline hover:no-underline">
        <div className="flex w-full flex-col gap-3 text-left md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="text-base font-semibold">Day {day.day_index}</div>
            <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              {day.day_itinerary_id ? "Day itinerary" : "Open day"}
            </div>
          </div>
          <div className="grid w-full gap-2 text-sm text-muted-foreground md:grid-cols-3 md:text-right">
            <div>
              <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                Destination
              </div>
              <div className="text-foreground">{destinationLabel}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                Accommodation
              </div>
              <div className="text-foreground">
                {day.accommodation?.name || "—"}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                Day itinerary
              </div>
              <div className="text-foreground">{itineraryLabel}</div>
              {day.day_itinerary_id ? (
                <div className="text-xs text-muted-foreground">
                  {itineraryCount}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-3">
          {day.day_itinerary_id ? (
            <>
              <div>
                <div className="text-sm font-semibold">Itinerary</div>
                <div className="text-sm text-muted-foreground">
                  {day.day_itineraries?.name || "Day itinerary"}
                </div>
              </div>
              {loading ? (
                <div className="text-sm text-muted-foreground">
                  Loading items...
                </div>
              ) : error ? (
                <div className="text-sm text-red-600">{error}</div>
              ) : flow.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No items in this itinerary yet.
                </div>
              ) : (
                <div className="mt-3 space-y-3">
                  {flow.map((entry, idx) => {
                    if (entry.kind === "leg") {
                      const leg = entry.leg;
                      return (
                        <div
                          key={leg.id || `leg-${idx}`}
                          className="rounded-lg bg-muted p-3 text-sm"
                        >
                          <div className="font-medium">
                            {leg.title || leg.primary_mode || "Transport"}
                          </div>
                          {leg.summary ? (
                            <p className="mt-1">{leg.summary}</p>
                          ) : null}
                          {(leg.est_duration_min || leg.est_cost_min) ? (
                            <div className="mt-1 text-xs text-muted-foreground">
                              {leg.est_duration_min
                                ? `~${leg.est_duration_min} min`
                                : ""}
                              {leg.est_cost_min
                                ? ` · ${leg.currency || "JPY"} ${leg.est_cost_min}${
                                    leg.est_cost_max ? `-${leg.est_cost_max}` : ""
                                  }`
                                : ""}
                            </div>
                          ) : null}
                          {leg.maps_url ? (
                            <a
                              href={leg.maps_url}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-1 inline-block text-xs underline"
                            >
                              Maps link
                            </a>
                          ) : null}
                        </div>
                      );
                    }

                    const item = entry.it;
                    if (item?.isNote) {
                      return (
                        <div
                          key={item.id || `note-${idx}`}
                          className="rounded-xl border border-dashed bg-muted/50 p-4"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-1 space-y-2 min-w-0">
                              {item.displayName ? (
                                <p className="font-medium">{item.displayName}</p>
                              ) : null}
                              {item.details ? (
                                <p className="text-sm text-muted-foreground whitespace-pre-line">
                                  {item.details}
                                </p>
                              ) : (
                                <p className="text-sm text-muted-foreground italic">
                                  No details yet.
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={item.id || `${item.item_type}-${idx}`}
                        className="overflow-hidden rounded-xl border bg-card/60"
                      >
                        <div className="p-4 flex items-start gap-4">
                          {item.displayImage ? (
                            <div className="relative h-16 w-16 rounded-full overflow-hidden border flex-none">
                              <SafeImage
                                src={item.displayImage}
                                alt={item.displayName || "Itinerary item"}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="h-16 w-16 rounded-full bg-muted border flex-none" />
                          )}
                          <div className="flex-1 space-y-2 min-w-0">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="capitalize">
                                {formatItemType(item.item_type)}
                              </Badge>
                              {formatDuration(item.duration_minutes) ? (
                                <span className="text-xs text-muted-foreground">
                                  {formatDuration(item.duration_minutes)}
                                </span>
                              ) : null}
                            </div>
                            <p className="font-medium truncate">
                              {item.displayName || "Untitled stop"}
                            </p>
                            {item.displaySummary ? (
                              <p className="text-sm text-muted-foreground line-clamp-3">
                                {item.displaySummary}
                              </p>
                            ) : null}
                            {item.details ? (
                              <p className="text-sm text-muted-foreground line-clamp-3">
                                {item.details}
                              </p>
                            ) : null}
                            <div className="flex items-center gap-3 flex-wrap">
                              {item.maps_url ? (
                                <a
                                  href={item.maps_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs underline"
                                >
                                  Maps link
                                </a>
                              ) : null}
                              {item.opening_times_url ? (
                                <a
                                  href={item.opening_times_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs underline"
                                >
                                  Opening times
                                </a>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <div className="text-sm text-muted-foreground">
              No itinerary assigned for this day.
            </div>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
