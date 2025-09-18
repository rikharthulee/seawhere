import Excursions from "@/components/Excursions";
import { getPublishedExcursions } from "@/lib/data/excursions";

export const runtime = "nodejs";
export const revalidate = 300;

export default async function ExcursionsPage() {
  const items = await getPublishedExcursions();

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <Excursions items={items} />
    </main>
  );
}
