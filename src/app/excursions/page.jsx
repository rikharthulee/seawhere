import ExcursionsGallery from "@/components/ExcursionsGallery";
import { listPublishedExcursions } from "@/lib/data/public/excursions";

export const runtime = "nodejs";
export const revalidate = 300;

export default async function ExcursionsPage() {
  const rows = await listPublishedExcursions();

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <ExcursionsGallery rows={rows} />
    </main>
  );
}
