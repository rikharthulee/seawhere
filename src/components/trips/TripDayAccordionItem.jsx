"use client";

import { useEffect, useState } from "react";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { getDayItineraryItems } from "@/app/trips/actions";
import ItineraryTimeline from "@/components/day-itineraries/ItineraryTimeline";
import DayMap from "@/components/day/DayMap";

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
  const mapCandidates = flow.filter((entry) => {
    if (entry.kind !== "item" || !entry.it || entry.isNote) return false;
    if (entry.it.item_type === "meal") return false;
    return true;
  });
  const pins = mapCandidates
    .filter(
      (entry) =>
        Number.isFinite(entry.it.lat) && Number.isFinite(entry.it.lng)
    )
    .map((entry, idx) => ({
      id: entry.it.id,
      name: entry.it.displayName || entry.it.name || "Stop",
      lat: entry.it.lat,
      lng: entry.it.lng,
      order: idx + 1,
      href: entry.it.href || null,
    }));
  const missingCoordsCount = mapCandidates.length - pins.length;

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
      <AccordionContent contentClassName="overflow-visible">
        <div className="space-y-3 pb-6">
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
                <div className="mt-3">
                  <ItineraryTimeline flow={flow} optionalItems={[]} />
                </div>
              )}
              <details className="mt-4 rounded-xl border bg-card/40 p-3">
                <summary className="cursor-pointer text-sm font-semibold">
                  Map
                </summary>
                <div className="mt-3 space-y-2">
                  {pins.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No stops have coordinates yet.
                    </p>
                  ) : (
                    <DayMap pins={pins} />
                  )}
                  {missingCoordsCount > 0 ? (
                    <p className="text-xs text-muted-foreground">
                      {missingCoordsCount} stop
                      {missingCoordsCount === 1 ? "" : "s"} don’t have
                      coordinates yet.
                    </p>
                  ) : null}
                </div>
              </details>
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
