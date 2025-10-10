import ExperiencesManager from "@/components/admin/ExperiencesManager";

export default function AdminExperiencesPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="border-t-2 border-border pt-2">
        <h1 className="text-3xl md:text-4xl font-medium">Manage Experiences</h1>
        <div className="border-b-2 border-border mt-3" />
      </div>
      <section className="mt-6">
        <ExperiencesManager />
      </section>
    </main>
  );
}

export const revalidate = 0;
export const runtime = 'nodejs';
