export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

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
