import Tours from "@/components/Tours";
import { getPublishedTours } from "@/lib/data/tours";

export default async function ToursPage() {
  let items = [];
  try {
    items = await getPublishedTours();
  } catch {}
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <Tours items={items} />
    </main>
  );
}
export const revalidate = 300;
export const runtime = "nodejs";
