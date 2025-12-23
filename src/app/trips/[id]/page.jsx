import { notFound } from "next/navigation";
import Link from "next/link";
import { getPublicDB } from "@/lib/supabase/public";
import TripDaysAccordion from "@/components/trips/TripDaysAccordion";
import ContentViewTracker from "@/components/ContentViewTracker";

export const revalidate = 300;
export const runtime = "nodejs";

function formatDayCount(count) {
  const num = Number(count || 0);
  return `${num} day${num === 1 ? "" : "s"}`;
}

function normalizeItemLabel(item) {
  if (!item) return "";
  if (item.name) return item.name;
  if (item.title) return item.title;
  return item.item_type || "";
}

export default async function TripDetailPage(props) {
  const { id } = (await props.params) || {};
  if (!id) notFound();

  const db = getPublicDB();
  const { data: trip, error } = await db
    .from("trips")
    .select(
      "id, title, summary, status, visibility, countries ( name ), destinations ( name )"
    )
    .eq("id", id)
    .eq("visibility", "public")
    .maybeSingle();

  if (error || !trip) notFound();

  const { data: days, error: daysError } = await db
    .from("trip_days")
    .select(
      "id, day_index, destination_id, accommodation_id, day_itinerary_id, destinations!itinerary_days_destination_id_fkey ( name ), sub_destinations:destinations!itinerary_days_sub_destination_id_fkey ( name ), accommodation ( name ), day_itineraries ( id, name )"
    )
    .eq("trip_id", id)
    .order("day_index", { ascending: true });
  if (daysError) {
    throw new Error(daysError.message);
  }

  const dayRows = days || [];
  const itineraryIds = Array.from(
    new Set(dayRows.map((day) => day.day_itinerary_id).filter(Boolean))
  );
  let itineraryItemCounts = {};
  if (itineraryIds.length > 0) {
    const { data: items } = await db
      .from("day_itinerary_items")
      .select("day_itinerary_id")
      .in("day_itinerary_id", itineraryIds);
    itineraryItemCounts = (items || []).reduce((acc, row) => {
      acc[row.day_itinerary_id] = (acc[row.day_itinerary_id] || 0) + 1;
      return acc;
    }, {});
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 space-y-6">
      {trip?.id ? <ContentViewTracker type="trip" id={trip.id} /> : null}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-semibold">
            {trip.title || "Untitled trip"}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {formatDayCount(dayRows.length)}
          </p>
          {trip.summary ? (
            <p className="mt-3 text-sm text-muted-foreground">
              {trip.summary}
            </p>
          ) : null}
          <div className="mt-2 flex flex-wrap gap-2 text-sm text-muted-foreground">
            {trip.countries?.name ? <span>{trip.countries.name}</span> : null}
            {trip.destinations?.name ? (
              <span>· {trip.destinations.name}</span>
            ) : null}
            <span>· {trip.status || "draft"}</span>
          </div>
        </div>
        <Link href="/trips" className="text-sm underline">
          All trips
        </Link>
      </div>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Days</h2>
        {dayRows.length === 0 ? (
          <div className="rounded-xl border bg-muted/40 p-6 text-muted-foreground">
            No days added yet.
          </div>
        ) : (
          <TripDaysAccordion
            days={dayRows.map((day) => {
              const itinerary = day.day_itineraries;
              const itineraryCount = itinerary
                ? itineraryItemCounts[itinerary.id] || 0
                : 0;
              const destinationLabel =
                normalizeItemLabel(day.destinations) ||
                normalizeItemLabel(day.sub_destinations) ||
                "—";
              const itineraryLabel = itinerary
                ? normalizeItemLabel(itinerary)
                : "—";
              const itineraryCountLabel =
                itineraryCount > 0
                  ? `${itineraryCount} item${itineraryCount === 1 ? "" : "s"}`
                  : "0 items";
              return {
                ...day,
                destinationLabel,
                itineraryLabel,
                itineraryCount: itineraryCountLabel,
              };
            })}
          />
        )}
      </section>
    </main>
  );
}
