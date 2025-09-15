import DestinationsManager from "@/components/admin/DestinationsManager";

export default function AdminDestinationsPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="border-t-2 border-border pt-2">
        <h1 className="text-3xl md:text-4xl font-medium">Manage Destinations</h1>
        <div className="border-b-2 border-border mt-3" />
      </div>
      <section className="mt-6">
        <DestinationsManager />
      </section>
    </main>
  );
}
