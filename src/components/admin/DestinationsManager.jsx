"use client";
import { useEffect, useMemo, useState } from "react";
import DestinationForm from "./DestinationForm";
import ConfirmDeleteButton from "@/components/admin/ConfirmDeleteButton";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import StatusBadge from "@/components/admin/StatusBadge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DestinationsManager() {
  const [destinations, setDestinations] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null=new form closed; {}=new; obj=edit
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/meta/geo", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);
      setDestinations(Array.isArray(json.destinations) ? json.destinations : []);
      setCountries(Array.isArray(json.countries) ? json.countries : []);
    } catch (e) {
      console.error("Failed to load destinations", e);
      setError(e?.message || "Failed to load destinations");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(() => {
      if (loading) {
        setError(
          "Request timed out. Check RLS policies on public.destinations and your Supabase URL/key."
        );
        setLoading(false);
      }
    }, 10000);
    load().finally(() => clearTimeout(t));
    // Realtime optional: could subscribe to changes here
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const grouped = useMemo(() => {
    const buckets = new Map();
    const NO_COUNTRY = "__NONE__";
    destinations.forEach((dst) => {
      const key = dst.country_id || NO_COUNTRY;
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key).push(dst);
    });

    const ordered = [];
    countries.forEach((c) => {
      if (buckets.has(c.id)) {
        ordered.push({ country: c, destinations: buckets.get(c.id) });
        buckets.delete(c.id);
      } else {
        ordered.push({ country: c, destinations: [] });
      }
    });
    if (buckets.has(NO_COUNTRY)) {
      ordered.push({ country: null, destinations: buckets.get(NO_COUNTRY) });
    }
    return ordered;
  }, [countries, destinations]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Destinations</h2>
        <Button onClick={() => setEditing({})}>+ New Destination</Button>
      </div>

      <Dialog
        open={!!editing}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {editing?.id
                ? `Edit ${editing.name || "destination"}`
                : "New Destination"}
            </DialogTitle>
          </DialogHeader>
          {editing ? (
            <DestinationForm
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

      {loading ? (
        <Table>
          <TableBody>
            <TableRow>
              <TableCell colSpan={5}>Loading…</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      ) : error ? (
        <Table>
          <TableBody>
            <TableRow>
              <TableCell className="text-red-700" colSpan={5}>
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
          </TableBody>
        </Table>
      ) : grouped.length === 0 ? (
        <Table>
          <TableBody>
            <TableRow>
              <TableCell colSpan={5}>
                No destinations. Click “New Destination” to create your first
                one.
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      ) : (
        <div className="space-y-4">
          {grouped.map(({ country, destinations: bucket }) => (
            <Card key={country?.id || "uncategorized"}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-lg">
                  {country?.name || "Unassigned country"}
                </CardTitle>
                <div className="text-sm text-muted-foreground">
                  {bucket.length} {bucket.length === 1 ? "destination" : "destinations"}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {bucket.length === 0 ? (
                  <div className="py-4 text-sm text-muted-foreground">
                    No destinations for this country yet.
                  </div>
                ) : (
                  <Table>
                    <TableHeader variant="secondary">
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Slug</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden md:table-cell">
                          Summary
                        </TableHead>
                        <TableHead className="text-right sm:min-w-[280px]">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bucket.map((it) => (
                        <TableRow key={it.id}>
                          <TableCell>{it.name}</TableCell>
                          <TableCell>{it.slug}</TableCell>
                          <TableCell>
                            <StatusBadge status={it.status} />
                          </TableCell>
                          <TableCell className="hidden md:table-cell align-top">
                            {it.summary}
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
                              <Button
                                asChild
                                variant="outline"
                                size="sm"
                                className="h-8 w-20"
                              >
                                <a
                                  href={`/destinations/${encodeURIComponent(
                                    it.slug
                                  )}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  View
                                </a>
                              </Button>
                              <ConfirmDeleteButton
                                title="Delete this destination?"
                                description="This action cannot be undone. This will permanently delete the destination and attempt to revalidate related pages."
                                triggerClassName="w-20"
                                onConfirm={async () => {
                                  try {
                                    const res = await fetch(
                                      `/api/admin/destinations/${it.id}`,
                                      { method: "DELETE" }
                                    );
                                    if (!res.ok) {
                                      const json = await res
                                        .json()
                                        .catch(() => ({}));
                                      alert(
                                        json?.error ||
                                          `Delete failed (${res.status})`
                                      );
                                      return;
                                    }
                                    try {
                                      await fetch(`/api/revalidate`, {
                                        method: "POST",
                                        headers: {
                                          "Content-Type": "application/json",
                                        },
                                        body: JSON.stringify({
                                          tags: [
                                            "destinations",
                                            `destinations:${it.slug}`,
                                          ],
                                        }),
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
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
