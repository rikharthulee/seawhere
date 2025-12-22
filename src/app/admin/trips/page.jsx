import Link from "next/link";
import { getDB } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return "—";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default async function TripsAdminPage() {
  const db = await getDB();
  const { data: trips, error } = await db
    .from("trips")
    .select(
      "id, title, country_id, status, visibility, created_at, countries ( name )"
    )
    .order("created_at", { ascending: false });
  if (error) {
    throw new Error(error.message);
  }

  const tripIds = (trips || []).map((trip) => trip.id);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-semibold">Trips</h1>
          <p className="mt-2 text-muted-foreground">
            Manage multi-day trips and assign day itineraries.
          </p>
        </div>
        <Link
          href="/admin/trips/new"
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          New Trip
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-3 border-b px-4 py-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">
            <span>Title</span>
            <span>Country</span>
            <span>Days</span>
            <span>Status</span>
            <span>Created</span>
          </div>
          <div className="divide-y">
            {(trips || []).length === 0 ? (
              <div className="px-4 py-6 text-sm text-muted-foreground">
                No trips yet. Create one to get started.
              </div>
            ) : (
              trips.map((trip) => (
                <Link
                  key={trip.id}
                  href={`/admin/trips/${trip.id}`}
                  className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-3 px-4 py-4 text-sm hover:bg-muted/30"
                >
                  <span className="font-medium text-foreground">
                    {trip.title || "Untitled trip"}
                  </span>
                  <span>{trip.countries?.name || "—"}</span>
                  <span>{dayCounts[trip.id] || 0}</span>
                  <span className="capitalize">{trip.status || "draft"}</span>
                  <span>{formatDate(trip.created_at)}</span>
                </Link>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
