"use client";
import { useEffect, useState } from "react";
import FoodDrinkForm from "./FoodDrinkForm";
import ConfirmDeleteButton from "@/components/admin/ConfirmDeleteButton";
import Link from "next/link";
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
import { destinationItemPath } from "@/lib/routes";

export default function FoodDrinkManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");
  const [destMap, setDestMap] = useState({});
  const [countryFilter, setCountryFilter] = useState("");
  const [destinationFilter, setDestinationFilter] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/food-drink", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);
      const nextItems = json.items || [];
      setItems(nextItems);
      const res2 = await fetch("/api/admin/meta/destinations", { cache: "no-store" });
      const json2 = await res2.json();
      if (res2.ok) {
        const map = Object.fromEntries((json2.items || []).map((d) => [d.id, d]));
        setDestMap(map);
      }
      return nextItems;
    } catch (e) {
      console.error("Failed to load food_drink", e);
      setError(e?.message || "Failed to load food & drink");
    } finally {
      setLoading(false);
    }
    return [];
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

  const destinationsList = Object.values(destMap || {});
  const countries = Array.from(
    new Map(
      destinationsList
        .filter((d) => d?.countries?.slug && d?.countries?.name)
        .map((d) => [d.countries.slug, d.countries])
    ).values()
  ).sort((a, b) => (a.name || "").localeCompare(b.name || ""));

  const filteredDestinations = destinationsList
    .filter((d) => (countryFilter ? d.country_id === countryFilter : true))
    .sort((a, b) => (a.name || "").localeCompare(b.name || ""));

  const filteredItems = items.filter((it) => {
    if (countryFilter) {
      const dest = destMap[it.destination_id];
      if (!dest || dest.country_id !== countryFilter) return false;
    }
    if (destinationFilter && it.destination_id !== destinationFilter) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Food &amp; Drink</h2>
        <Button onClick={() => setEditing({})}>+ New Food/Drink</Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-1">
          <label className="text-sm font-medium text-muted-foreground">
            Country
          </label>
          <select
            value={countryFilter || "__all"}
            onChange={(e) => {
              const val = e.target.value === "__all" ? "" : e.target.value;
              setCountryFilter(val);
              setDestinationFilter("");
            }}
            className="w-full rounded-md border px-2 py-2 text-sm"
          >
            <option value="__all">All countries</option>
            {countries.map((c) => (
              <option key={c.slug} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-muted-foreground">
            Destination
          </label>
          <select
            value={destinationFilter || "__all"}
            onChange={(e) => {
              const val = e.target.value === "__all" ? "" : e.target.value;
              setDestinationFilter(val);
            }}
            className="w-full rounded-md border px-2 py-2 text-sm"
          >
            <option value="__all">All destinations</option>
            {filteredDestinations.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
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
          ) : filteredItems.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5}>
                No food &amp; drink yet. Click “New Food/Drink” to create your first one.
              </TableCell>
            </TableRow>
          ) : (
            filteredItems.map((it) => (
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
                    {(() => {
                      const dest = destMap[it.destination_id];
                      const href =
                        dest?.countries?.slug && dest?.slug && it.slug
                          ? destinationItemPath(
                              dest.countries.slug,
                              dest.slug,
                              "food-drink",
                              it.slug
                            )
                          : null;
                      return href ? (
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="h-8 w-20"
                        >
                          <Link href={href} target="_blank">
                            View
                          </Link>
                        </Button>
                      ) : null;
                    })()}
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
            onSaved={async (saved) => {
              const refreshed = await onSaved?.();
              const savedId = saved?.id || editing?.id;
              if (savedId && Array.isArray(refreshed)) {
                const match = refreshed.find((item) => item.id === savedId);
                if (match) {
                  setEditing(match);
                  return;
                }
              }
            }}
            onCancel={() => setEditing(null)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
