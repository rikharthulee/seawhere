import { notFound } from "next/navigation";
import { getDB } from "@/lib/supabase/server";
import TripForm from "@/components/admin/TripForm";
import TripDaysManager from "@/components/admin/TripDaysManager";
import {
  addTripDay,
  deleteTripDay,
  updateTrip,
  updateTripDay,
} from "@/app/admin/trips/actions";

export const dynamic = "force-dynamic";

export default async function TripEditorPage(props) {
  const { id } = (await props.params) || {};
  if (!id) notFound();

  const db = await getDB();
  const { data: trip, error } = await db
    .from("trips")
    .select(
      "id, title, slug, summary, country_id, destination_id, start_date, end_date, status, visibility, hero_image, thumbnail_image"
    )
    .eq("id", id)
    .maybeSingle();
  if (error || !trip) notFound();

  const [daysRes, countriesRes, destinationsRes, accommodationsRes, itinerariesRes] =
    await Promise.all([
      db
        .from("trip_days")
        .select(
          "id, trip_id, day_index, date, destination_id, accommodation_id, day_itinerary_id"
        )
        .eq("trip_id", id)
        .order("day_index", { ascending: true }),
      db.from("countries").select("id, name").order("name", { ascending: true }),
      db
        .from("destinations")
        .select("id, name, country_id")
        .order("name", { ascending: true }),
      db
        .from("accommodation")
        .select("id, name, destination_id, country_id")
        .order("name", { ascending: true }),
      db
        .from("day_itineraries")
        .select("id, name, destination_id, country_id")
        .order("name", { ascending: true }),
    ]);

  if (daysRes.error) throw new Error(daysRes.error.message);
  if (countriesRes.error) throw new Error(countriesRes.error.message);
  if (destinationsRes.error) throw new Error(destinationsRes.error.message);
  if (accommodationsRes.error) throw new Error(accommodationsRes.error.message);
  if (itinerariesRes.error) throw new Error(itinerariesRes.error.message);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-semibold">
          {trip.title || "Untitled Trip"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {(daysRes.data || []).length} days
        </p>
        <p className="mt-2 text-muted-foreground">
          Update trip details and plan each day.
        </p>
      </div>

      <TripForm
        mode="edit"
        trip={trip}
        countries={countriesRes.data || []}
        destinations={destinationsRes.data || []}
        onUpdate={updateTrip.bind(null, trip.id)}
      />

      <TripDaysManager
        tripId={trip.id}
        tripCountryId={trip.country_id}
        initialDays={daysRes.data || []}
        destinations={destinationsRes.data || []}
        accommodations={accommodationsRes.data || []}
        dayItineraries={itinerariesRes.data || []}
        onAddDay={addTripDay}
        onUpdateDay={updateTripDay}
        onDeleteDay={deleteTripDay}
      />
    </main>
  );
}
