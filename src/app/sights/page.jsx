import Sights from "@/components/Sights";
import { fetchAllPOIs } from "@/lib/supabaseRest";

export default async function SightsPage({ searchParams }) {
  let items = [];
  try {
    items = await fetchAllPOIs();
  } catch {}
  const type = (await searchParams)?.type || "";
  const filtered = type ? items.filter((p) => String(p.type || "").toLowerCase() === String(type).toLowerCase()) : items;

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      {/* Simple type filter links */}
      <div className="mb-4 flex items-center gap-2 text-sm">
        <a href="/sights" className={`rounded px-2 py-1 border ${!type ? "bg-black text-white" : ""}`}>All</a>
        {Array.from(new Set(items.map((p) => p.type).filter(Boolean))).map((t) => (
          <a key={t} href={`/sights?type=${encodeURIComponent(t)}`} className={`rounded px-2 py-1 border ${type === t ? "bg-black text-white" : ""}`}>
            {String(t).slice(0,1).toUpperCase()+String(t).slice(1)}
          </a>
        ))}
      </div>
      <Sights items={filtered} />
    </main>
  );
}

export const revalidate = 300;
