import AccommodationsManager from "@/components/admin/AccommodationManager";

export const dynamic = "force-dynamic";

export default function AdminAccommodationPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="pt-2">
        <h1 className="text-3xl md:text-4xl font-medium">Manage Accommodation</h1>
      </div>
      <section className="mt-6">
        <AccommodationsManager />
      </section>
    </main>
  );
}
