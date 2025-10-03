export const runtime = "nodejs";
export const revalidate = 300;

import Sights from "@/components/Sights";
import { listPublishedSights } from "@/lib/data/public/sights";

export default async function SightsPage() {
  const items = await listPublishedSights();
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <Sights items={items} />
    </main>
  );
}
