"use client";
import { useEffect, useState } from "react";
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

export default function DestinationsManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null=new form closed; {}=new; obj=edit
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/destinations", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);
      setItems(json.items || []);
    } catch (e) {
      console.error("Failed to load locations", e);
      setError(e?.message || "Failed to load locations");
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

      <Table>
        <TableHeader variant="secondary">
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden md:table-cell">Summary</TableHead>
            <TableHead className="text-right sm:min-w-[280px]">
              Actions
            </TableHead>
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
          ) : items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5}>
                No destinations. Click “New Destination” to create your first
                one.
              </TableCell>
            </TableRow>
          ) : (
            items.map((it) => (
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
                    href={`/destination/${encodeURIComponent(it.slug)}`}
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
                            const json = await res.json().catch(() => ({}));
                            alert(
                              json?.error || `Delete failed (${res.status})`
                            );
                            return;
                          }
                          try {
                            await fetch(`/api/revalidate`, {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
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
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
