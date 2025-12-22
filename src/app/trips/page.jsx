import Link from "next/link";
import { getPublicDB } from "@/lib/supabase/public";
import { Card, CardContent } from "@/components/ui/card";

export const revalidate = 300;
export const runtime = "nodejs";

function formatDayCount(count) {
  const num = Number(count || 0);
  return `${num} day${num === 1 ? "" : "s"}`;
}

export default async function TripsPage() {
  const db = getPublicDB();
  const { data: trips, error } = await db
    .from("trips")
    .select(
      "id, title, summary, status, visibility, country_id, destination_id, countries ( name ), destinations ( name )"
    )
    .eq("visibility", "public")
    .order("created_at", { ascending: false });
  if (error) {
    throw new Error(error.message);
  }

  const tripRows = trips || [];
  const tripIds = tripRows.map((trip) => trip.id);
  let dayCounts = {};
  if (tripIds.length > 0) {
    const { data: tripDays } = await db
      .from("trip_days")
      .select("trip_id")
      .in("trip_id", tripIds);
    dayCounts = (tripDays || []).reduce((acc, row) => {
      acc[row.trip_id] = (acc[row.trip_id] || 0) + 1;
      return acc;
    }, {});
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 space-y-6">
      <div>
        <h1 className="text-3xl md:text-4xl font-semibold">Trips</h1>
        <p className="mt-2 text-muted-foreground">
          Curated multi-day itineraries built from Seawhere day plans.
        </p>
      </div>

      {tripRows.length === 0 ? (
        <div className="rounded-xl border bg-muted/40 p-6 text-muted-foreground">
          No public trips yet.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {tripRows.map((trip) => (
            <Card key={trip.id} className="overflow-hidden transition hover:shadow-md">
              <Link href={`/trips/${trip.id}`} className="block">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    <span>{trip.status || "draft"}</span>
                    <span>{trip.visibility}</span>
                  </div>
                  <div className="text-xl font-semibold">
                    {trip.title || "Untitled trip"}
                  </div>
                  {trip.summary ? (
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {trip.summary}
                    </p>
                  ) : null}
                  <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                    {trip.countries?.name ? (
                      <span>{trip.countries.name}</span>
                    ) : null}
                    {trip.destinations?.name ? (
                      <span>· {trip.destinations.name}</span>
                    ) : null}
                    <span>· {formatDayCount(dayCounts[trip.id] || 0)}</span>
                  </div>
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
