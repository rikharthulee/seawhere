import DestinationsManager from "@/components/admin/DestinationsManager";

export default function AdminDestinationsPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl md:text-4xl font-medium">Manage Destinations</h1>
      <section className="mt-6">
        <DestinationsManager />
      </section>
    </main>
  );
}
