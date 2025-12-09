import ExperiencesManager from "@/components/admin/ExperiencesManager";

export default function AdminExperiencesPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl md:text-4xl font-medium">Manage Experiences</h1>
      <section className="mt-6">
        <ExperiencesManager />
      </section>
    </main>
  );
}

export const revalidate = 0;
export const runtime = 'nodejs';
