import Excursions from "@/components/Excursions";
import { getPublishedExcursions } from "@/lib/data/excursions";

export default async function ExcursionsPage() {
  let items = [];
  try {
    items = await getPublishedExcursions();
  } catch {}
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <Excursions items={items} />
    </main>
  );
}
export const revalidate = 300;
export const runtime = 'nodejs';

