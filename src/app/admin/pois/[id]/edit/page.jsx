"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import POIForm from "@/components/admin/POIForm";

export default function EditPOIPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;
  const [loading, setLoading] = useState(true);
  const [initial, setInitial] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/admin/pois/${id}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || `Load failed (${res.status})`);
        if (!cancelled) setInitial({ ...json.poi, opening_rules: json.rules, opening_exceptions: json.exceptions });
      } catch (e) {
        if (!cancelled) setError(e?.message || "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (id) load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="border-t-2 border-black/10 pt-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl md:text-4xl font-medium flex-1">Edit POI</h1>
        </div>
        <div className="border-b-2 border-black/10 mt-3" />
      </div>
      <div className="mt-6">
        {loading ? (
          <div>Loading…</div>
        ) : error ? (
          <div className="text-red-700">{error}</div>
        ) : (
          <POIForm
            id={id}
            initial={initial}
            onSaved={() => {
              router.replace("/admin");
              router.refresh();
            }}
            onCancel={() => router.back()}
          />
        )}
      </div>
    </main>
  );
}

