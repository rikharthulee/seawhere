import Sights from "@/components/Sights";
import { fetchAllPOIs } from "@/lib/supabaseRest";

export default async function SightsPage() {
  let items = [];
  try {
    items = await fetchAllPOIs();
  } catch {}

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <Sights items={items} />
    </main>
  );
}

export const revalidate = 300;

