"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import SightsForm from "./SightsForm";
import ConfirmDeleteButton from "@/components/admin/ConfirmDeleteButton";
import StatusBadge from "@/components/admin/StatusBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function SightsManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [destMap, setDestMap] = useState({});
  const [editing, setEditing] = useState(null); // null: none, {}: new, obj: edit
  const [countryFilter, setCountryFilter] = useState("");
  const [destinationFilter, setDestinationFilter] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/sights", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);
      setItems(json.items || []);
      const res2 = await fetch("/api/admin/meta/destinations", {
        cache: "no-store",
      });
      const json2 = await res2.json();
      if (res2.ok) {
        const map = Object.fromEntries(
          (json2.items || []).map((d) => [d.id, d])
        );
        setDestMap(map);
      }
    } catch (e) {
      setError(e?.message || "Failed to load sights");
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

  const sightHref = (it) => {
    const dest = destMap?.[it.destination_id];
    const destSlug = dest?.slug;
    const countrySlug = dest?.countries?.slug;
    if (destSlug && countrySlug && it.slug) {
      return `/sights/${encodeURIComponent(countrySlug)}/${encodeURIComponent(
        destSlug
      )}/${encodeURIComponent(it.slug)}`;
    }
    return null;
  };

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
        <h2 className="text-xl font-semibold">Sights</h2>
        <Button onClick={() => setEditing({})}>+ New Sight</Button>
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

      <Dialog
        open={!!editing}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-8xl">
          <DialogHeader>
            <DialogTitle>
              {editing?.id ? `Edit ${editing.name || "sight"}` : "New Sight"}
            </DialogTitle>
          </DialogHeader>
          {editing ? (
            <SightsForm
              id={editing.id}
              initial={editing.id ? editing : null}
              onSaved={() => {
                setEditing(null);
                load();
              }}
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
            <TableHead className="text-right sm:min-w-[280px] md:w-[320px]">
              Actions
            </TableHead>
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
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-3"
                  onClick={load}
                >
                  Retry
                </Button>
              </TableCell>
            </TableRow>
          ) : filteredItems.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4}>No sights yet.</TableCell>
            </TableRow>
          ) : (
            filteredItems.map((it) => (
              <TableRow key={it.id}>
                <TableCell>{it.name}</TableCell>
                <TableCell>
                  <StatusBadge status={it.status} />
                </TableCell>
                <TableCell>
                  {destMap[it.destination_id]?.name || it.destination_id || "—"}
                </TableCell>
                <TableCell className="text-center sm:text-right sm:min-w-[280px] md:w-[320px]">
                  <div className="flex flex-col items-center gap-2 sm:flex-row sm:flex-nowrap sm:justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-20"
                      onClick={async () => {
                        try {
                          const res = await fetch(
                            `/api/admin/sights/${it.id}`,
                            { cache: "no-store" }
                          );
                          const json = await res.json();
                          if (!res.ok)
                            throw new Error(
                              json?.error || `HTTP ${res.status}`
                            );
                          function trimTime(t) {
                            if (!t) return "";
                            const s = String(t);
                            const m = s.match(/^([0-9]{2}:[0-9]{2})/);
                            return m ? m[1] : s;
                          }
                          const toPlain = (x) => {
                            try {
                              return JSON.parse(JSON.stringify(x));
                            } catch {
                              return x;
                            }
                          };
                          const init = {
                            ...json.sight,
                            hours: (json.hours || []).map((h) => ({
                              ...h,
                              open_time: trimTime(h.open_time),
                              close_time: trimTime(h.close_time),
                            })),
                            exceptions: (json.exceptions || []).map((e) => ({
                              ...e,
                              open_time: trimTime(e.open_time),
                              close_time: trimTime(e.close_time),
                            })),
                            admission: Array.isArray(json.admission)
                              ? json.admission
                              : [],
                          };
                          setEditing(toPlain(init));
                        } catch (e) {
                          alert(e?.message || "Failed to load sight");
                        }
                      }}
                    >
                      Edit
                    </Button>
                    {it.slug ? (
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="h-8 w-20"
                      >
                        <Link href={sightHref(it) || "#"} target="_blank">
                          View
                        </Link>
                      </Button>
                    ) : null}
                    <ConfirmDeleteButton
                      title="Delete this sight?"
                      description="This action cannot be undone. This will permanently delete the item and remove any associated data."
                      triggerClassName="w-20"
                      onConfirm={async () => {
                        try {
                          const res = await fetch(
                            `/api/admin/sights/${it.id}`,
                            { method: "DELETE" }
                          );
                          if (!res.ok) {
                            const json = await res.json().catch(() => ({}));
                            alert(
                              json?.error || `Delete failed (${res.status})`
                            );
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
