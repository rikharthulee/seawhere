"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import ToursForm from "./ToursForm";
import ConfirmDeleteButton from "@/components/admin/ConfirmDeleteButton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import StatusBadge from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function ToursManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [destMap, setDestMap] = useState({});
  const [editing, setEditing] = useState(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/tours", { cache: "no-store" });
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
      setError(e?.message || "Failed to load tours");
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
        <h2 className="text-xl font-semibold">Tours</h2>
        <Button onClick={() => setEditing({})}>+ New Tour</Button>
      </div>

      <Dialog open={!!editing} onOpenChange={(open) => { if (!open) setEditing(null); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {editing?.id ? `Edit ${editing.name || "tour"}` : "New Tour"}
            </DialogTitle>
          </DialogHeader>
          {editing ? (
            <ToursForm
              id={editing.id}
              initial={editing.id ? editing : null}
              onSaved={() => { setEditing(null); load(); }}
              onCancel={() => setEditing(null)}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <Table>
        <TableHeader variant="secondary">
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Destination</TableHead>
            <TableHead className="text-right sm:min-w-[280px] md:w-[320px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4}>Loading…</TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell className="text-red-700" colSpan={4}>
                  {error}
                  <Button variant="outline" size="sm" className="ml-3" onClick={load}>Retry</Button>
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4}>No tours yet.</TableCell>
              </TableRow>
            ) : (
              items.map((it) => (
                <TableRow key={it.id}>
                  <TableCell>{it.name}</TableCell>
                  <TableCell><StatusBadge status={it.status} /></TableCell>
                  <TableCell>{destMap[it.destination_id]?.name || it.destination_id || "—"}</TableCell>
                  <TableCell className="text-center sm:text-right sm:min-w-[280px] md:w-[320px]">
                    <div className="flex flex-col items-center gap-2 sm:flex-row sm:flex-nowrap sm:justify-end">
                      <Button variant="outline" size="sm" className="h-8 w-20" onClick={async () => {
                      try {
                        const res = await fetch(`/api/admin/tours/${it.id}`, { cache: "no-store" });
                        const json = await res.json();
                        if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);
                        const { tour, rules, exceptions } = json;
                        setEditing({ ...tour, rules, exceptions });
                      } catch (e) {
                        alert(e?.message || "Failed to load tour");
                      }
                      }}>Edit</Button>
                      {it.slug ? (
                        <Button asChild variant="outline" size="sm" className="h-8 w-20">
                          <Link
                            href={`/tours/${encodeURIComponent(it.slug)}`}
                            target="_blank"
                          >
                            View
                          </Link>
                        </Button>
                      ) : null}
                      <ConfirmDeleteButton
                        title="Delete this tour?"
                        description="This action cannot be undone. This will permanently delete the item and remove any associated data."
                        triggerClassName="w-20"
                        
                        onConfirm={async () => {
                          try {
                            const res = await fetch(`/api/admin/tours/${it.id}`, { method: "DELETE" });
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
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
        </TableBody>
      </Table>
    </div>
  );
}
