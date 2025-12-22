import { getDB } from "@/lib/supabase/server";
import TripForm from "@/components/admin/TripForm";
import { createTrip } from "@/app/admin/trips/actions";

export const dynamic = "force-dynamic";

export default async function NewTripPage() {
  const db = await getDB();
  const [countriesRes, destinationsRes] = await Promise.all([
    db.from("countries").select("id, name").order("name", { ascending: true }),
    db
      .from("destinations")
      .select("id, name, country_id")
      .order("name", { ascending: true }),
  ]);

  if (countriesRes.error) throw new Error(countriesRes.error.message);
  if (destinationsRes.error) throw new Error(destinationsRes.error.message);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 space-y-6">
      <div>
        <h1 className="text-3xl md:text-4xl font-semibold">New Trip</h1>
        <p className="mt-2 text-muted-foreground">
          Create a trip and then add day plans.
        </p>
      </div>

      <TripForm
        mode="create"
        countries={countriesRes.data || []}
        destinations={destinationsRes.data || []}
        onCreate={createTrip}
      />
    </main>
  );
}
