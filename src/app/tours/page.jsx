import Tours from "@/components/Tours";
import { listPublishedTours } from "@/lib/data/public/tours";

export default async function ToursPage() {
  const items = await listPublishedTours();
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <Tours items={items} />
    </main>
  );
}
export const revalidate = 300;
export const runtime = "nodejs";
