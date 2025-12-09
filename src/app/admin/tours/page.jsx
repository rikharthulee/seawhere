import ToursManager from "@/components/admin/ToursManager";

export default function AdminToursPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl md:text-4xl font-medium">Manage Tours</h1>
      <section className="mt-6">
        <ToursManager />
      </section>
    </main>
  );
}

export const revalidate = 0;
export const runtime = 'nodejs';
