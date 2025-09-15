"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import ExperiencesForm from "./ExperiencesForm";

export default function ExperiencesManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [destMap, setDestMap] = useState({});
  const [editing, setEditing] = useState(null); // null: none, {}: new, obj: edit

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/experiences", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);
      setItems(json.items || []);
      const res2 = await fetch("/api/admin/meta/destinations", { cache: "no-store" });
      const json2 = await res2.json();
      if (res2.ok) {
        const map = Object.fromEntries((json2.items || []).map((d) => [d.id, d]));
        setDestMap(map);
      }
    } catch (e) {
      setError(e?.message || "Failed to load experiences");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(() => {
      if (loading) {
        setError("Request timed out. Check RLS and API config.");
        setLoading(false);
      }
    }, 10000);
    load().finally(() => clearTimeout(t));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Experiences</h2>
        <button className="rounded bg-black text-white px-3 py-2" onClick={() => setEditing({})}>+ New Experience</button>
      </div>

      {editing ? (
        <ExperiencesForm
          id={editing.id}
          initial={editing.id ? editing : null}
          onSaved={() => { setEditing(null); load(); }}
          onCancel={() => setEditing(null)}
        />
      ) : null}

      <div className="overflow-auto rounded border">
        <table className="min-w-full text-sm">
          <thead className="bg-black text-white">
            <tr>
              <th className="text-left px-3 py-2">Name</th>
              <th className="text-left px-3 py-2">Status</th>
              <th className="text-left px-3 py-2">Destination</th>
              <th className="text-right px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-3 py-3" colSpan={4}>Loading…</td>
              </tr>
            ) : error ? (
              <tr>
                <td className="px-3 py-3 text-red-700" colSpan={4}>
                  {error}
                  <button className="ml-3 rounded border px-2 py-1" onClick={load}>Retry</button>
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td className="px-3 py-3" colSpan={4}>No experiences yet.</td>
              </tr>
            ) : (
              items.map((it) => (
                <tr key={it.id} className="border-t">
                  <td className="px-3 py-2">{it.name}</td>
                  <td className="px-3 py-2">{it.status}</td>
                  <td className="px-3 py-2">{destMap[it.destination_id]?.name || it.destination_id || "—"}</td>
                  <td className="px-3 py-2 text-right">
                    <button className="rounded border px-2 py-1 mr-2" onClick={async () => {
                      try {
                        const res = await fetch(`/api/admin/experiences/${it.id}`, { cache: "no-store" });
                        const json = await res.json();
                        if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);
                        setEditing(json);
                      } catch (e) {
                        alert(e?.message || "Failed to load experience");
                      }
                    }}>Edit</button>
                    {destMap[it.destination_id]?.slug && it.slug ? (
                      <Link
                        className="rounded border px-2 py-1 inline-block"
                        href={`/experiences/${encodeURIComponent(destMap[it.destination_id].slug)}/${encodeURIComponent(it.slug)}`}
                        target="_blank"
                      >
                        View
                      </Link>
                    ) : null}
                    <button
                      className="rounded bg-red-600 text-white px-2 py-1 ml-2"
                      onClick={async () => {
                        if (!confirm("Delete this experience? This cannot be undone.")) return;
                        try {
                          const res = await fetch(`/api/admin/experiences/${it.id}`, { method: "DELETE" });
                          if (!res.ok) {
                            const json = await res.json().catch(() => ({}));
                            alert(json?.error || `Delete failed (${res.status})`);
                            return;
                          }
                          load();
                        } catch (e) {
                          alert(e?.message || "Delete failed");
                        }
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
