import ExcursionsGallery from "@/components/ExcursionsGallery";
import { getExcursionsList } from "@/lib/data/excursionsList";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ExcursionsLibraryPage() {
  const rows = await getExcursionsList(200); // already filters status='published'
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12">
      <ExcursionsGallery rows={rows} />
    </main>
  );
}
