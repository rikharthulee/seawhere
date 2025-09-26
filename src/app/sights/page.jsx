import Sights from "@/components/Sights";
import { getPublishedSights } from "@/lib/data/sights";

export default async function SightsPage() {
  let items = [];
  try {
    items = await getPublishedSights();
  } catch {}
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <Sights items={items} />
    </main>
  );
}
export const revalidate = 300;
export const runtime = "nodejs";
