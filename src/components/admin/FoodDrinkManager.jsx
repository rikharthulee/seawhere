"use client";
import { useEffect, useState } from "react";
import FoodDrinkForm from "./FoodDrinkForm";
import ConfirmDeleteButton from "@/components/admin/ConfirmDeleteButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function FoodDrinkManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");
  const [destMap, setDestMap] = useState({});

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/food-drink", { cache: "no-store" });
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
      console.error("Failed to load food_drink", e);
      setError(e?.message || "Failed to load food & drink");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(() => {
      if (loading) {
        setError(
          "Request timed out. Check RLS policies on public.food_drink and your Supabase URL/key."
        );
        setLoading(false);
      }
    }, 10000);
    load().finally(() => clearTimeout(t));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Food &amp; Drink</h2>
        <Button onClick={() => setEditing({})}>+ New Food/Drink</Button>
      </div>

      <DialogWrapper editing={editing} setEditing={setEditing} onSaved={load} />

      <Table>
        <TableHeader variant="secondary">
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Type / Price</TableHead>
            <TableHead>Destination</TableHead>
            <TableHead className="hidden md:table-cell">Address</TableHead>
            <TableHead className="text-right sm:min-w-[280px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={5}>Loading…</TableCell>
            </TableRow>
          ) : error ? (
            <TableRow>
              <TableCell className="text-red-700" colSpan={5}>
                {error}
                <Button variant="outline" size="sm" className="ml-3" onClick={load}>
                  Retry
                </Button>
              </TableCell>
            </TableRow>
          ) : items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5}>
                No food &amp; drink yet. Click “New Food/Drink” to create your first one.
              </TableCell>
            </TableRow>
          ) : (
            items.map((it) => (
              <TableRow key={it.id}>
                <TableCell>{it.name}</TableCell>
                <TableCell>
                  {it.status ? (
                    <Badge variant={it.status === "published" ? "success" : "secondary"}>
                      {it.status}
                    </Badge>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell className="capitalize">{[it.type, it.price_band].filter(Boolean).join(" · ")}</TableCell>
                <TableCell>{destMap[it.destination_id]?.name || "—"}</TableCell>
                <TableCell className="hidden md:table-cell align-top max-w-[320px] truncate">
                  {it.address || ""}
                </TableCell>
                <TableCell className="text-center sm:text-right sm:min-w-[280px]">
                  <div className="flex flex-col items-center gap-2 sm:flex-row sm:flex-nowrap sm:justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-20"
                      onClick={() => setEditing(it)}
                    >
                      Edit
                    </Button>
                    <ConfirmDeleteButton
                      title="Delete this place?"
                      description="This action cannot be undone. This will permanently delete the record and attempt to revalidate related pages."
                      triggerClassName="w-20"
                      onConfirm={async () => {
                        try {
                          const res = await fetch(`/api/admin/food-drink/${it.id}`, { method: "DELETE" });
                          if (!res.ok) {
                            const json = await res.json().catch(() => ({}));
                            alert(json?.error || `Delete failed (${res.status})`);
                            return;
                          }
                          try {
                            await fetch(`/api/revalidate`, {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ tags: ["food_drink"] }),
                            });
                          } catch {}
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

// imports moved to top

function DialogWrapper({ editing, setEditing, onSaved }) {
  return (
    <Dialog
      open={!!editing}
      onOpenChange={(open) => {
        if (!open) setEditing(null);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            {editing?.id ? `Edit ${editing.name || "place"}` : "New Food/Drink"}
          </DialogTitle>
        </DialogHeader>
        {editing ? (
          <FoodDrinkForm
            initial={editing.id ? editing : null}
            onSaved={() => {
              setEditing(null);
              onSaved?.();
            }}
            onCancel={() => setEditing(null)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
