import ToursManager from "@/components/admin/ToursManager";

export default function AdminToursPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="border-t-2 border-black/10 pt-4">
        <h1 className="text-3xl md:text-4xl font-medium">Manage Tours</h1>
        <div className="border-b-2 border-black/10 mt-3" />
      </div>
      <section className="mt-6">
        <ToursManager />
      </section>
    </main>
  );
}

export const revalidate = 0;
export const runtime = 'nodejs';

