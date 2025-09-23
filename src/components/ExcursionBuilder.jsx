"use client";

import React, { useMemo, useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  Trash2,
  GripVertical,
  Search,
  Bus,
  Train,
  Car,
  Footprints,
  Ship,
  Plane,
  AlertTriangle,
} from "lucide-react";

const uid = () => Math.random().toString(36).slice(2);

function minsToLabel(mins) {
  if (!mins || mins <= 0) return "";
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

function modeIcon(m) {
  const cl = "h-4 w-4";
  switch (m) {
    case "walk":
      return <Footprints className={cl} />;
    case "bus":
      return <Bus className={cl} />;
    case "train":
      return <Train className={cl} />;
    case "ferry":
      return <Ship className={cl} />;
    case "car":
      return <Car className={cl} />;
    case "plane":
      return <Plane className={cl} />;
    default:
      return <Car className={cl + " opacity-50"} />;
  }
}

function defaultSearch(query) {
  if (!query) return Promise.resolve(MOCK_POIS);
  const q = query.toLowerCase();
  return Promise.resolve(
    MOCK_POIS.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.destination || "").toLowerCase().includes(q)
    )
  );
}

function POIPickerSheet({
  open,
  onOpenChange,
  onAdd,
  searchPois,
  initialKind = "sight",
}) {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState(initialKind);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    (searchPois || defaultSearch)(query)
      .then(setResults)
      .finally(() => setLoading(false));
  }, [open, query, searchPois]);

  const kinds = ["sight", "experience", "tour", "accommodation", "food_drink"];

  const grouped = useMemo(() => {
    const g = Object.fromEntries(kinds.map((k) => [k, []]));
    for (const r of results) {
      if (g[r.kind]) g[r.kind].push(r);
    }
    return g;
  }, [results]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Add POIs</SheetTitle>
        </SheetHeader>

        <div className="mt-2 space-y-4 px-4">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="Search sights, experiences, tours…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <Tabs value={kind} onValueChange={setKind}>
            <TabsList className="grid grid-cols-5">
              {kinds.map((k) => (
                <TabsTrigger key={k} value={k} className="capitalize">
                  {k.replace("_", " ")}
                </TabsTrigger>
              ))}
            </TabsList>
            {kinds.map((k) => (
              <TabsContent key={k} value={k} className="pt-3">
                {loading && (
                  <div className="text-sm text-muted-foreground">
                    Searching…
                  </div>
                )}
                {!loading && grouped[k].length === 0 && (
                  <div className="text-sm text-muted-foreground">
                    No results
                  </div>
                )}
                {!loading && grouped[k].length > 0 ? (
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {grouped[k].map((p) => (
                      <li key={p.id}>
                        <div className="flex items-center justify-between rounded-lg border p-3">
                          <div className="min-w-0">
                            <div
                              className="font-medium truncate"
                              title={p.name}
                            >
                              {p.name}
                            </div>
                            <div
                              className="text-xs text-muted-foreground truncate"
                              title={`${p.destination || "—"} · ${p.kind}`}
                            >
                              {p.destination || "—"} · {p.kind}
                            </div>
                          </div>
                          <Button size="sm" onClick={() => onAdd && onAdd(p)}>
                            Add
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </TabsContent>
            ))}
          </Tabs>
        </div>

        <Separator className="my-4" />
        <SheetFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// ----------------------------------------------------------------------
// Duration‑sized stacked timeline (cards height follow duration)
function ExcursionTimeline({
  items,
  minutesPerUnit = 30,
  unitRowPx = 16, // larger base row height to avoid visual overlap
  accommodationFixedUnits = 6,
}) {
  const minRows = 6; // ensure enough vertical space for badges/title
  const computed = (items || []).map((it) => {
    const isAccommodation = it.item_type === "accommodation";
    const base = isAccommodation
      ? minutesPerUnit * accommodationFixedUnits
      : it.duration_minutes || minutesPerUnit;
    const span = Math.max(minRows, Math.ceil(base / minutesPerUnit));
    return { ...it, _rowSpan: span };
  });

  const gridStyle = { gridAutoRows: `${unitRowPx}px` };

  return (
    <div>
      <div
        className="grid gap-2 [&&>*]:rounded-xl [&&>*]:border [&&>*]:p-3"
        style={gridStyle}
      >
        {computed.map((it) => (
          <div
            key={it.id}
            style={{ gridRowEnd: `span ${it._rowSpan}` }}
            className={bgByType(it.item_type) + " overflow-hidden"}
          >
            <div className="mb-1 flex items-center gap-2">
              <Badge variant="secondary" className="capitalize">
                {it.item_type.replace("_", " ")}
              </Badge>
              {it.duration_minutes ? (
                <span className="text-xs text-muted-foreground">
                  {minsToLabel(it.duration_minutes)}
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">—</span>
              )}
            </div>
            <div className="font-medium leading-tight truncate">
              {it.title || it.name || "(untitled)"}
            </div>
            {it.details && (
              <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">
                {it.details}
              </p>
            )}
            {it.maps_url && (
              <a
                className="mt-1 block text-xs text-primary underline"
                href={it.maps_url}
                target="_blank"
                rel="noreferrer"
              >
                Maps link
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function bgByType(t) {
  switch (t) {
    case "sight":
      return "bg-orange-50/60 dark:bg-orange-900/20";
    case "experience":
      return "bg-purple-50/60 dark:bg-purple-900/20";
    case "tour":
      return "bg-cyan-50/60 dark:bg-cyan-900/20";
    case "food_drink":
      return "bg-rose-50/60 dark:bg-rose-900/20";
    case "accommodation":
      return "bg-amber-50/60 dark:bg-amber-900/20";
    case "transport":
      return "bg-slate-50/60 dark:bg-slate-800/40";
    case "note":
      return "bg-emerald-50/60 dark:bg-emerald-900/20";
    default:
      return "bg-muted";
  }
}

// ----------------------------------------------------------------------
// Main Builder (JS) – wired to Sheet + Timeline
function newExcursionDraft() {
  return {
    id: uid(),
    name: "",
    status: "draft",
    description: "",
    maps_url: "",
    items: [],
  };
}

export default function ExcursionsBuilderJS() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [openPoi, setOpenPoi] = useState(false);
  const [openTransport, setOpenTransport] = useState(false);
  const [excursion, setExcursion] = useState(() => newExcursionDraft());
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState(null);
  const [error, setError] = useState("");
  const [draggingId, setDraggingId] = useState(null);
  const [loadingExcursion, setLoadingExcursion] = useState(false);
  const [loadError, setLoadError] = useState("");

  const errorMessages = useMemo(
    () => [loadError, error].filter(Boolean),
    [loadError, error]
  );

  async function searchPoisApi(q) {
    try {
      const res = await fetch(
        `/api/excursions/search?q=${encodeURIComponent(q || "")}`,
        { cache: "no-store" }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);
      return Array.isArray(json.items) ? json.items : [];
    } catch {
      return [];
    }
  }

  function toDbPayload(statusOverride) {
    const allowed = new Set(["sight", "experience", "tour", "accommodation"]);
    const items = (excursion.items || []).map((it) => ({
      ...it,
      sort_order: Number(it.sort_order) || 0,
    }));
    const dbItems = items
      .filter((it) => allowed.has(it.item_type))
      .map((it) => ({
        item_type: it.item_type,
        ref_id: it.ref_id,
        sort_order: it.sort_order,
      }));

    const transport = items.filter((it) => it.item_type === "transport");
    const notes = items.filter((it) => it.item_type === "note");
    const description = { text: excursion.description || "", notes };

    return {
      name: excursion.name,
      maps_url: excursion.maps_url || null,
      status: statusOverride || excursion.status || "draft",
      description,
      transport,
      items: dbItems,
    };
  }

  async function save(statusOverride) {
    setSaving(true);
    setError("");
    try {
      const payload = toDbPayload(statusOverride);
      if (!savedId) {
        const res = await fetch(`/api/admin/excursions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok)
          throw new Error(json?.error || `Save failed (${res.status})`);
        setSavedId(json.id);
        setExcursion((prev) => ({ ...prev, id: json.id }));
        router.replace(
          `/admin/excursions/builder?id=${encodeURIComponent(json.id)}`,
          {
            scroll: false,
          }
        );
      } else {
        const res = await fetch(`/api/admin/excursions/${savedId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok)
          throw new Error(json?.error || `Update failed (${res.status})`);
      }
    } catch (e) {
      setError(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const [transportDraft, setTransportDraft] = useState({
    id: uid(),
    item_type: "transport",
    title: "",
    mode: "train",
    duration_minutes: "",
    distance_km: "",
    maps_url: "",
    details: "",
  });

  function addPoi(p) {
    const maxOrder = Math.max(
      0,
      ...excursion.items.map((i) => i.sort_order || 0)
    );
    const item = {
      id: uid(),
      sort_order: maxOrder + 10,
      item_type: p.kind,
      ref_id: p.id,
      name: p.name,
    };
    setExcursion((prev) => ({
      ...prev,
      items: sortByOrder([...prev.items, item]),
    }));
    setOpenPoi(false);
  }

  function addTransport() {
    const maxOrder = Math.max(
      0,
      ...excursion.items.map((i) => i.sort_order || 0)
    );
    const t = { ...transportDraft, id: uid(), sort_order: maxOrder + 10 };
    setExcursion((prev) => ({
      ...prev,
      items: sortByOrder([...prev.items, t]),
    }));
    setTransportDraft({
      id: uid(),
      item_type: "transport",
      title: "",
      mode: "train",
      duration_minutes: "",
      distance_km: "",
      maps_url: "",
      details: "",
    });
    setOpenTransport(false);
  }

  function removeItem(id) {
    setExcursion((prev) => ({
      ...prev,
      items: prev.items.filter((i) => i.id !== id),
    }));
  }

  function moveBefore(sourceId, targetId) {
    if (!sourceId || sourceId === targetId) return;
    setExcursion((prev) => {
      const list = sortByOrder(prev.items);
      const fromIndex = list.findIndex((item) => item.id === sourceId);
      const targetIndex = list.findIndex((item) => item.id === targetId);
      if (fromIndex === -1 || targetIndex === -1) return prev;
      if (fromIndex === targetIndex) {
        return prev;
      }
      if (fromIndex < targetIndex && fromIndex === targetIndex - 1) {
        return prev;
      }

      const moving = list[fromIndex];
      const without = list.filter((_, idx) => idx !== fromIndex);
      const newTargetIndex = without.findIndex((item) => item.id === targetId);
      if (newTargetIndex === -1) return prev;

      const next = [...without];
      next.splice(newTargetIndex, 0, moving);
      const withOrder = next.map((item, idx) => ({
        ...item,
        sort_order: (idx + 1) * 10,
      }));
      return { ...prev, items: withOrder };
    });
  }

  function moveToEnd(id) {
    if (!id) return;
    setExcursion((prev) => {
      const list = sortByOrder(prev.items);
      if (list[list.length - 1]?.id === id) return prev;
      const moving = list.find((item) => item.id === id);
      if (!moving) return prev;
      const next = list.filter((item) => item.id !== id);
      next.push(moving);
      const withOrder = next.map((item, idx) => ({
        ...item,
        sort_order: (idx + 1) * 10,
      }));
      return { ...prev, items: withOrder };
    });
  }

  function moveItem(id, dir) {
    const items = sortByOrder(excursion.items);
    const idx = items.findIndex((i) => i.id === id);
    if (idx === -1) return;
    const j = idx + dir;
    if (j < 0 || j >= items.length) return;
    const a = items[idx],
      b = items[j];
    const tmp = a.sort_order;
    a.sort_order = b.sort_order;
    b.sort_order = tmp;
    setExcursion((prev) => ({ ...prev, items: sortByOrder(items) }));
  }

  const timelineItems = useMemo(
    () => sortByOrder(excursion.items),
    [excursion.items]
  );

  function handleDragStart(event, id) {
    setDraggingId(id);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", id);
  }

  function handleDragOver(event, overId) {
    if (!draggingId) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (draggingId === overId) return;
    moveBefore(draggingId, overId);
  }

  function handleDrop(event, overId) {
    event.preventDefault();
    const sourceId = draggingId || event.dataTransfer.getData("text/plain");
    if (sourceId && sourceId !== overId) {
      moveBefore(sourceId, overId);
    }
    setDraggingId(null);
  }

  function handleDragEnd() {
    setDraggingId(null);
  }

  function hydrateExcursion(data) {
    const descriptionField =
      data?.description && typeof data.description === "object"
        ? data.description.text || ""
        : data?.description || "";
    const notesFromDescription =
      data?.description && typeof data.description === "object"
        ? Array.isArray(data.description.notes)
          ? data.description.notes
          : []
        : [];

    const curated = Array.isArray(data?.items)
      ? data.items.map((it, idx) => ({
          id:
            typeof it.id === "string" || typeof it.id === "number"
              ? `cur-${it.id}`
              : `cur-${it.item_type}-${it.ref_id}-${idx}`,
          item_type: it.item_type,
          ref_id: it.ref_id,
          sort_order: Number(it.sort_order) || (idx + 1) * 10,
          name: it.name || "",
          destination: it.destination || null,
        }))
      : [];

    const transportItems = Array.isArray(data?.transport)
      ? data.transport.map((t, idx) => ({
          ...t,
          id: t.id || `transport-${idx}-${uid()}`,
          item_type: "transport",
          sort_order: Number(t.sort_order) || (curated.length + idx + 1) * 10,
        }))
      : [];

    const noteItems = notesFromDescription.map((n, idx) => ({
      ...n,
      id: n.id || `note-${idx}-${uid()}`,
      item_type: "note",
      sort_order:
        Number(n.sort_order) ||
        (curated.length + transportItems.length + idx + 1) * 10,
    }));

    setExcursion({
      id: data?.id,
      name: data?.name || "",
      status: data?.status || "draft",
      description: descriptionField,
      maps_url: data?.maps_url || "",
      items: sortByOrder([...curated, ...transportItems, ...noteItems]),
    });
    setSavedId(data?.id || null);
    setDraggingId(null);
  }

  const excursionIdParam = searchParams?.get("id") || null;

  const resetToNewExcursion = useCallback(
    (options = { clearLoadError: true }) => {
      const draft = newExcursionDraft();
      setExcursion(draft);
      setSavedId(null);
      setError("");
      if (options.clearLoadError) setLoadError("");
      setDraggingId(null);
      router.replace(`/admin/excursions/builder`, { scroll: false });
    },
    [router]
  );

  useEffect(() => {
    if (!excursionIdParam) return;
    let ignore = false;
    async function load() {
      setLoadingExcursion(true);
      setLoadError("");
      try {
        const res = await fetch(`/api/admin/excursions/${excursionIdParam}`, {
          cache: "no-store",
        });
        const json = await res.json();
        if (res.status === 404) {
          if (!ignore) {
            resetToNewExcursion({ clearLoadError: false });
            setLoadError("Excursion not found – showing a new draft instead.");
          }
          return;
        }
        if (!res.ok)
          throw new Error(json?.error || `Load failed (${res.status})`);
        if (!ignore) {
          hydrateExcursion(json);
        }
      } catch (e) {
        if (!ignore) {
          setLoadError(e?.message || "Failed to load excursion");
        }
      } finally {
        if (!ignore) {
          setLoadingExcursion(false);
        }
      }
    }
    load();
    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [excursionIdParam, resetToNewExcursion]);

  return (
    <div className="mx-auto max-w-5xl p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Excursions Builder</h1>
        <div className="space-x-2">
          <Button
            variant="outline"
            disabled={saving}
            onClick={() => resetToNewExcursion()}
          >
            New excursion
          </Button>
          <Button
            variant="secondary"
            disabled={saving}
            onClick={() => save("draft")}
          >
            {saving ? "Saving…" : "Save draft"}
          </Button>
          <Button disabled={saving} onClick={() => save("published")}>
            Publish
          </Button>
        </div>
      </div>

      {errorMessages.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Heads up</AlertTitle>
          <AlertDescription>
            {errorMessages.map((msg, idx) => (
              <p key={idx}>{msg}</p>
            ))}
          </AlertDescription>
        </Alert>
      )}

      {loadingExcursion && (
        <div className="rounded border border-muted bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          Loading excursion…
        </div>
      )}

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Header</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Name</Label>
            <Input
              value={excursion.name}
              onChange={(e) =>
                setExcursion({ ...excursion, name: e.target.value })
              }
            />
          </div>
          <div>
            <Label>Maps URL (overall)</Label>
            <Input
              value={excursion.maps_url}
              onChange={(e) =>
                setExcursion({ ...excursion, maps_url: e.target.value })
              }
            />
          </div>
          <div className="md:col-span-2">
            <Label>Description</Label>
            <Textarea
              rows={3}
              value={excursion.description}
              onChange={(e) =>
                setExcursion({ ...excursion, description: e.target.value })
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Items</CardTitle>
          <div className="space-x-2">
            <Sheet open={openPoi} onOpenChange={setOpenPoi}>
              <SheetTrigger asChild>
                <Button size="sm" variant="secondary">
                  <Plus className="h-4 w-4 mr-1" /> Add POI
                </Button>
              </SheetTrigger>
              <POIPickerSheet
                open={openPoi}
                onOpenChange={setOpenPoi}
                onAdd={addPoi}
                searchPois={searchPoisApi}
              />
            </Sheet>

            <Sheet open={openTransport} onOpenChange={setOpenTransport}>
              <SheetTrigger asChild>
                <Button size="sm" variant="secondary">
                  <Plus className="h-4 w-4 mr-1" /> Add Transport
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:max-w-xl">
                <SheetHeader>
                  <SheetTitle>Add Transport</SheetTitle>
                </SheetHeader>
                <div className="mt-4 space-y-3">
                  <div>
                    <Label>Title</Label>
                    <Input
                      value={transportDraft.title}
                      onChange={(e) =>
                        setTransportDraft((td) => ({
                          ...td,
                          title: e.target.value,
                        }))
                      }
                      placeholder="Train: Osaka → Himeji"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Mode</Label>
                      <select
                        className="w-full rounded-md border bg-background p-2"
                        value={transportDraft.mode}
                        onChange={(e) =>
                          setTransportDraft((td) => ({
                            ...td,
                            mode: e.target.value,
                          }))
                        }
                      >
                        {[
                          "walk",
                          "bus",
                          "train",
                          "subway",
                          "tram",
                          "ferry",
                          "car",
                          "plane",
                          "other",
                        ].map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label>Duration (min)</Label>
                      <Input
                        type="number"
                        value={transportDraft.duration_minutes}
                        onChange={(e) =>
                          setTransportDraft((td) => ({
                            ...td,
                            duration_minutes: e.target.value
                              ? Number(e.target.value)
                              : "",
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label>Distance (km)</Label>
                      <Input
                        type="number"
                        value={transportDraft.distance_km}
                        onChange={(e) =>
                          setTransportDraft((td) => ({
                            ...td,
                            distance_km: e.target.value
                              ? Number(e.target.value)
                              : "",
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label>Maps URL</Label>
                      <Input
                        value={transportDraft.maps_url}
                        onChange={(e) =>
                          setTransportDraft((td) => ({
                            ...td,
                            maps_url: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Instructions</Label>
                    <Textarea
                      rows={4}
                      value={transportDraft.details}
                      onChange={(e) =>
                        setTransportDraft((td) => ({
                          ...td,
                          details: e.target.value,
                        }))
                      }
                      placeholder="Alpico bus every 30–60 min; buy ticket at Matsumoto."
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <Button
                      variant="secondary"
                      onClick={() => setOpenTransport(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={addTransport}>Add transport</Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                const maxOrder = Math.max(
                  0,
                  ...excursion.items.map((i) => i.sort_order || 0)
                );
                const note = {
                  id: uid(),
                  sort_order: maxOrder + 10,
                  item_type: "note",
                  title: "Note",
                  details: "Add note text…",
                };
                setExcursion((prev) => ({
                  ...prev,
                  items: sortByOrder([...prev.items, note]),
                }));
              }}
            >
              <Plus className="h-4 w-4 mr-1" /> Add Note
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {timelineItems.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No items yet. Use the buttons above to add POIs, transport, or
              notes.
            </div>
          ) : (
            <div className="space-y-3">
              {/* Timeline preview */}
              <ExcursionTimeline
                items={timelineItems}
                minutesPerUnit={30}
                unitRowPx={12}
              />

              {/* Simple controls */}
              <div className="space-y-2">
                {timelineItems.map((i) => (
                  <div
                    key={i.id}
                    className={
                      "flex items-center justify-between rounded-lg border p-2 cursor-grab" +
                      (draggingId === i.id ? " opacity-50" : "")
                    }
                    draggable
                    aria-grabbed={draggingId === i.id}
                    onDragStart={(event) => handleDragStart(event, i.id)}
                    onDragOver={(event) => handleDragOver(event, i.id)}
                    onDrop={(event) => handleDrop(event, i.id)}
                    onDragEnd={handleDragEnd}
                  >
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <Badge variant="secondary" className="capitalize">
                        {i.item_type.replace("_", " ")}
                      </Badge>
                      <span className="font-medium">
                        {i.title || i.name || "(untitled)"}
                      </span>
                      {i.item_type === "transport" && (
                        <span className="ml-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
                          {modeIcon(i.mode)}
                          {i.duration_minutes ? (
                            <span>{minsToLabel(i.duration_minutes)}</span>
                          ) : null}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => moveItem(i.id, -1)}
                        aria-label="Move up"
                      >
                        ▲
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => moveItem(i.id, 1)}
                        aria-label="Move down"
                      >
                        ▼
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeItem(i.id)}
                        aria-label="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                <div
                  className={
                    "h-6 rounded border border-dashed border-transparent transition-colors" +
                    (draggingId ? " border-muted" : "")
                  }
                  onDragOver={(event) => {
                    if (!draggingId) return;
                    event.preventDefault();
                    event.dataTransfer.dropEffect = "move";
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    const sourceId =
                      draggingId || event.dataTransfer.getData("text/plain");
                    if (sourceId) moveToEnd(sourceId);
                    setDraggingId(null);
                  }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function sortByOrder(arr) {
  return [...arr].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
}
