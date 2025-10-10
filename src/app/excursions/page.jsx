import ExcursionsGallery from "@/components/ExcursionsGallery";
import { listPublishedExcursions } from "@/lib/data/public/excursions";

export const runtime = "nodejs";
export const revalidate = 300;

export default async function ExcursionsPage() {
  const rows = await listPublishedExcursions();
  const quickIndex = Array.isArray(rows)
    ? [...rows]
        .filter((row) => row?.slug)
        .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
    : [];

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <section className="mb-8">
        <h1 className="text-3xl font-semibold">Excursions</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Slug index for quick navigation (SSR, no client hydration).
        </p>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {quickIndex.map((ex) => (
            <li key={ex.id} className="text-sm">
              <a
                href={`/excursions/${encodeURIComponent(ex.slug)}`}
                className="flex items-center justify-between rounded-md border px-3 py-2 transition hover:border-primary hover:text-primary"
              >
                <span className="truncate">{ex.name || ex.slug}</span>
                <span className="ml-2 text-xs text-muted-foreground">
                  /{ex.slug}
                </span>
              </a>
            </li>
          ))}
          {quickIndex.length === 0 ? (
            <li className="text-sm text-muted-foreground">
              No excursions published yet.
            </li>
          ) : null}
        </ul>
      </section>
      <ExcursionsGallery rows={rows} />
    </main>
  );
}
