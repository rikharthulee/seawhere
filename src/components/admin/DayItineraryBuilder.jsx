"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import SingleImageUpload from "@/components/admin/SingleImageUpload";
import {
  Plus,
  Trash2,
  GripVertical,
  Search,
  Bus,
  Train,
  Car,
  Bike,
  Footprints,
  Ship,
  Plane,
  AlertTriangle,
} from "lucide-react";

const uid = () => Math.random().toString(36).slice(2);

const COST_BAND_OPTIONS = [
  { value: "budget", label: "€ (budget)" },
  { value: "midrange", label: "€€ (mid)" },
  { value: "premium", label: "€€€ (high)" },
];

const COST_BAND_LABEL_BY_VALUE = new Map(
  COST_BAND_OPTIONS.map((opt) => [opt.value, opt.label])
);

function slugify(input) {
  return (
    String(input || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "") || "day-itinerary"
  );
}

function minsToLabel(mins) {
  if (!mins || mins <= 0) return "";
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

function listToText(value) {
  if (!Array.isArray(value)) return "";
  return value.filter(Boolean).join("\n");
}

function textToList(value) {
  return String(value || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
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
    case "motorbike":
      return <Bike className={cl} />;
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

function normalizeTransportItem(raw, idx = 0, baseOffset = 0) {
  if (!raw || typeof raw !== "object") return null;
  const mode =
    typeof raw.mode === "string" && raw.mode.trim()
      ? raw.mode.trim().toLowerCase()
      : typeof raw.primary_mode === "string"
        ? raw.primary_mode.trim().toLowerCase()
        : "other";
  const rawDuration =
    raw.duration_minutes ??
    raw.est_duration_min ??
    raw.duration ??
    raw.time ??
    null;
  const durationMinutes =
    rawDuration === "" || rawDuration === null || rawDuration === undefined
      ? ""
      : Number(rawDuration);
  const rawDistance =
    raw.distance_km ??
    (typeof raw.est_distance_m === "number"
      ? raw.est_distance_m / 1000
      : raw.distance || null);
  const distanceKm =
    rawDistance === "" || rawDistance === null || rawDistance === undefined
      ? ""
      : Number(rawDistance);
  const mapsUrl =
    typeof raw.maps_url === "string"
      ? raw.maps_url
      : typeof raw.mapsUrl === "string"
        ? raw.mapsUrl
        : typeof raw?.meta?.maps_url === "string"
          ? raw.meta.maps_url
          : null;
  const detailText =
    typeof raw.details === "string"
      ? raw.details
      : typeof raw.summary === "string"
        ? raw.summary
        : typeof raw.notes === "string"
          ? raw.notes
          : "";
  const sortCandidate =
    raw.sort_order ??
    raw.sortOrder ??
    (baseOffset + idx + 1) * 10;
  const sortOrder =
    typeof sortCandidate === "number"
      ? sortCandidate || (baseOffset + idx + 1) * 10
      : Number(sortCandidate) || (baseOffset + idx + 1) * 10;

  return {
    ...raw,
    id: raw.id || `transport-${idx}-${uid()}`,
    item_type: "transport",
    mode,
    primary_mode: raw.primary_mode || mode.toUpperCase(),
    duration_minutes: Number.isFinite(durationMinutes)
      ? Math.max(0, Math.round(durationMinutes))
      : "",
    est_duration_min: Number.isFinite(durationMinutes)
      ? Math.max(0, Math.round(durationMinutes))
      : null,
    distance_km: Number.isFinite(distanceKm)
      ? Math.max(0, Number(distanceKm.toFixed(2)))
      : "",
    est_distance_m: Number.isFinite(distanceKm)
      ? Math.max(0, Math.round(distanceKm * 1000))
      : null,
    maps_url: mapsUrl || "",
    details: detailText,
    summary: raw.summary || detailText || "",
    sort_order: sortOrder,
  };
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

  const kinds = [
    "sight",
    "experience",
    "tour",
    "destination",
    "accommodation",
    "food_drink",
  ];

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
              placeholder="Search destinations, sights, experiences, tours…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <Tabs value={kind} onValueChange={setKind}>
            <TabsList className="grid grid-cols-6">
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
function DayItineraryTimeline({
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
            {typeof it.details === "string" && it.details.trim().length > 0 ? (
              <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">
                {it.details}
              </p>
            ) : null}
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
    case "destination":
      return "bg-blue-50/60 dark:bg-blue-900/20";
    case "food_drink":
      return "bg-rose-50/60 dark:bg-rose-900/20";
    case "accommodation":
      return "bg-amber-50/60 dark:bg-amber-900/20";
    case "transport":
      return "bg-slate-50/60 dark:bg-slate-800/40";
    case "note":
      return "bg-emerald-50/60 dark:bg-emerald-900/20";
    case "meal":
      return "bg-lime-50/60 dark:bg-lime-900/20";
    default:
      return "bg-muted";
  }
}

// ----------------------------------------------------------------------
// Main Builder (JS) – wired to Sheet + Timeline
function newDayItineraryDraft() {
  return {
    id: uid(),
    name: "",
    status: "draft",
    summary: "",
    description: "",
    full_description: "",
    destination_id: "",
    // NEW: dayItinerary-level meta
    tags: [],
    cost_band: "",
    notes: "",
    accessible: false,
    with_kids: false,
    highlights: [],
    includes: [],
    not_suitable_for: [],
    important_information: [],
    items: [],
  };
}

export default function DayItineraryBuilder() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [openPoi, setOpenPoi] = useState(false);
  const [openTransport, setOpenTransport] = useState(false);
  const [dayItinerary, setDayItinerary] = useState(() => newDayItineraryDraft());
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState(null);
  const [error, setError] = useState("");
  const [draggingId, setDraggingId] = useState(null);
  const [loadingDayItinerary, setLoadingDayItinerary] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [coverImage, setCoverImage] = useState("");
  const [openMap, setOpenMap] = useState(false);
  // Option A: new state for selected item and patching
  const [selectedItemId, setSelectedItemId] = useState(null);
  const selectedItem = useMemo(
    () =>
      selectedItemId
        ? dayItinerary.items.find((i) => i.id === selectedItemId)
        : null,
    [selectedItemId, dayItinerary.items]
  );
  // patchItem is a local draft for editing
  const [patchItem, setPatchItem] = useState(null);
  const [tagsRaw, setTagsRaw] = useState("");
  const [highlightsRaw, setHighlightsRaw] = useState("");
  const [includesRaw, setIncludesRaw] = useState("");
  const [notSuitableRaw, setNotSuitableRaw] = useState("");
  const [importantRaw, setImportantRaw] = useState("");

  const [countries, setCountries] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [countryId, setCountryId] = useState("");

  const errorMessages = useMemo(
    () => [loadError, error].filter(Boolean),
    [loadError, error]
  );

  useEffect(() => {
    let ignore = false;
    async function loadGeo() {
      try {
        const res = await fetch("/api/admin/meta/geo", { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          if (!ignore) {
            setCountries(Array.isArray(json.countries) ? json.countries : []);
          }
        }
      } catch {}
      try {
        const res = await fetch("/api/admin/meta/destinations", { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          if (!ignore) {
            const list = Array.isArray(json.items) ? json.items : [];
            setDestinations(list);
          }
        }
      } catch {}
    }
    loadGeo();
    return () => {
      ignore = true;
    };
  }, []);

  const destinationsForScope = useMemo(() => {
    const filtered = destinations.filter((dst) => {
      if (countryId) return dst.country_id === countryId;
      return true;
    });
    return [...filtered].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  }, [destinations, countryId]);

  useEffect(() => {
    const destId =
      typeof dayItinerary.destination_id === "string"
        ? dayItinerary.destination_id
        : "";
    if (!destId) return;
    const dest = destinations.find((d) => d.id === destId);
    if (!dest) return;
    if (dest.country_id && dest.country_id !== countryId) {
      setCountryId(dest.country_id);
    }
  }, [dayItinerary.destination_id, destinations, countryId]);

  const destinationValue =
    typeof dayItinerary.destination_id === "string" && dayItinerary.destination_id
      ? dayItinerary.destination_id
      : "__EMPTY__";

  async function searchPoisApi(q) {
    try {
      const res = await fetch(
        `/api/day-itineraries/search?q=${encodeURIComponent(q || "")}`,
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
    const allowed = new Set([
      "sight",
      "experience",
      "tour",
      "destination",
      "accommodation",
      "food_drink",
    ]);
    const items = (dayItinerary.items || []).map((it, idx) => ({
      ...it,
      sort_order: Number.isFinite(Number(it.sort_order))
        ? Number(it.sort_order)
        : (idx + 1) * 10,
    }));

    const transport = items.filter((it) => it.item_type === "transport");

  const entityItems = items
    .filter((it) => allowed.has(it.item_type))
    .map((it) => ({
      item_type: it.item_type,
      sort_order: it.sort_order,
      ref_id:
        typeof it.ref_id === "string" && it.ref_id.trim()
          ? it.ref_id.trim()
          : null,
      details:
        typeof it.details === "string" && it.details.trim().length > 0
          ? it.details.trim()
          : null,
      duration_minutes:
        it.duration_minutes === "" || it.duration_minutes === null
          ? null
          : Number.isFinite(Number(it.duration_minutes))
            ? Number(it.duration_minutes)
            : null,
      maps_url:
        typeof it.maps_url === "string" && it.maps_url.trim().length > 0
          ? it.maps_url.trim()
          : null,
      is_optional: Boolean(it.is_optional),
      meal_type: null,
    }))
    .filter((it) => it.ref_id);

    const noteItems = items
      .filter((it) => it.item_type === "note")
      .map((it) => ({
        item_type: "note",
        sort_order: it.sort_order,
        ref_id:
          typeof it.ref_id === "string" && it.ref_id.trim()
            ? it.ref_id.trim()
            : null,
        title:
          typeof it.title === "string" && it.title.trim().length > 0
            ? it.title.trim()
            : null,
        details:
          typeof it.details === "string" && it.details.length > 0
            ? it.details
            : null,
        is_optional: Boolean(it.is_optional),
        meal_type: null,
      }));

    const mealItems = items
      .filter((it) => it.item_type === "meal")
      .map((it) => ({
        item_type: "meal",
        sort_order: it.sort_order,
        ref_id: null,
        details:
          typeof it.details === "string" && it.details.trim().length > 0
            ? it.details.trim()
            : null,
        duration_minutes:
          it.duration_minutes === "" || it.duration_minutes === null
            ? null
            : Number.isFinite(Number(it.duration_minutes))
              ? Number(it.duration_minutes)
              : null,
        maps_url:
          typeof it.maps_url === "string" && it.maps_url.trim().length > 0
            ? it.maps_url.trim()
            : null,
        is_optional: Boolean(it.is_optional),
        meal_type:
          typeof it.meal_type === "string" && it.meal_type.trim().length > 0
            ? it.meal_type.trim()
            : null,
      }));

    const dbItems = [...entityItems, ...noteItems, ...mealItems].sort(
      (a, b) => (a.sort_order || 0) - (b.sort_order || 0)
    );

    const description = {
      text: dayItinerary.description || "",
    };

    const destinationIdRaw = dayItinerary.destination_id;
    let destination_id = null;
    if (
      typeof destinationIdRaw === "string" &&
      destinationIdRaw.trim().length > 0
    ) {
      destination_id = destinationIdRaw.trim();
    } else if (
      destinationIdRaw !== null &&
      destinationIdRaw !== undefined &&
      destinationIdRaw !== ""
    ) {
      destination_id = destinationIdRaw;
    }

    const tags = (tagsRaw || "")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    const costBandValue = COST_BAND_OPTIONS.some(
      (opt) => opt.value === dayItinerary.cost_band
    )
      ? dayItinerary.cost_band
      : "";

    return {
      name: dayItinerary.name,
      slug: slug || slugify(dayItinerary.name || ""),
      summary: typeof dayItinerary.summary === "string" ? dayItinerary.summary : null,
      cover_image: coverImage || null,
      status: statusOverride || dayItinerary.status || "draft",
      description,
      full_description:
        typeof dayItinerary.full_description === "string"
          ? dayItinerary.full_description
          : null,
      transport,
      items: dbItems,
      destination_id,
      tags,
      highlights: Array.isArray(dayItinerary.highlights)
        ? dayItinerary.highlights
        : [],
      includes: Array.isArray(dayItinerary.includes) ? dayItinerary.includes : [],
      not_suitable_for: Array.isArray(dayItinerary.not_suitable_for)
        ? dayItinerary.not_suitable_for
        : [],
      important_information: Array.isArray(dayItinerary.important_information)
        ? dayItinerary.important_information
        : [],
      cost_band: costBandValue || null,
      notes:
        typeof dayItinerary.notes === "string" &&
        dayItinerary.notes.trim().length > 0
          ? dayItinerary.notes.trim()
          : null,
      wheelchair_friendly:
        typeof dayItinerary.accessible === "boolean"
          ? dayItinerary.accessible
          : null,
      good_with_kids:
        typeof dayItinerary.with_kids === "boolean" ? dayItinerary.with_kids : null,
    };
  }

  async function save(statusOverride) {
    setError("");
    if (!dayItinerary.destination_id) {
      setError("Select a destination before saving.");
      return;
    }
    setSaving(true);
    try {
      const payload = toDbPayload(statusOverride);
      if (!savedId) {
        const res = await fetch(`/api/admin/itineraries`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok)
          throw new Error(json?.error || `Save failed (${res.status})`);
        setSavedId(json.id);
        setDayItinerary((prev) => ({ ...prev, id: json.id }));
        setSlugTouched(true);
        router.replace(
          `/admin/itineraries/builder?id=${encodeURIComponent(json.id)}`,
          {
            scroll: false,
          }
        );
      } else {
        const res = await fetch(`/api/admin/itineraries/${savedId}`, {
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
      ...dayItinerary.items.map((i) => i.sort_order || 0)
    );
    const item = {
      id: uid(),
      sort_order: maxOrder + 10,
      item_type: p.kind,
      ref_id: p.id,
      name: p.name,
      latitude: p.latitude ?? p.lat ?? p.lat_deg ?? null,
      longitude: p.longitude ?? p.lng ?? p.lon ?? p.lon_deg ?? null,
      details: "",
      duration_minutes: "",
      maps_url: "",
      is_optional: false,
      meal_type: null,
    };
    setDayItinerary((prev) => ({
      ...prev,
      items: sortByOrder([...prev.items, item]),
    }));
    setOpenPoi(false);
  }

  function addTransport() {
    const maxOrder = Math.max(
      0,
      ...dayItinerary.items.map((i) => i.sort_order || 0)
    );
    const t = { ...transportDraft, id: uid(), sort_order: maxOrder + 10 };
    setDayItinerary((prev) => ({
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

  function addMeal() {
    const maxOrder = Math.max(
      0,
      ...dayItinerary.items.map((i) => i.sort_order || 0)
    );
    const meal = {
      id: uid(),
      sort_order: maxOrder + 10,
      item_type: "meal",
      meal_type: "lunch",
      title: "Lunch",
      details: "",
      duration_minutes: "",
      maps_url: "",
      is_optional: false,
    };
    setDayItinerary((prev) => ({
      ...prev,
      items: sortByOrder([...prev.items, meal]),
    }));
  }

  function removeItem(id) {
    setDayItinerary((prev) => ({
      ...prev,
      items: prev.items.filter((i) => i.id !== id),
    }));
  }

  function moveBefore(sourceId, targetId) {
    if (!sourceId || sourceId === targetId) return;
    setDayItinerary((prev) => {
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
    setDayItinerary((prev) => {
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
    const items = sortByOrder(dayItinerary.items);
    const idx = items.findIndex((i) => i.id === id);
    if (idx === -1) return;
    const j = idx + dir;
    if (j < 0 || j >= items.length) return;
    const a = items[idx],
      b = items[j];
    const tmp = a.sort_order;
    a.sort_order = b.sort_order;
    b.sort_order = tmp;
    setDayItinerary((prev) => ({ ...prev, items: sortByOrder(items) }));
  }

  const timelineItems = useMemo(
    () => sortByOrder(dayItinerary.items),
    [dayItinerary.items]
  );
  const costBandLabel = COST_BAND_LABEL_BY_VALUE.get(
    dayItinerary.cost_band || ""
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

  function hydrateDayItinerary(data) {
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
    const descriptionMeta =
      data?.description && typeof data.description === "object"
        ? data.description.meta || {}
        : {};
    const legacyNotes =
      typeof data?.notes === "string" ? data.notes.trim() : "";
    let notesText = legacyNotes;
    if (!notesText && typeof descriptionMeta.seasonality === "string") {
      notesText = descriptionMeta.seasonality.trim();
    }
    if (!notesText && typeof descriptionMeta.dow_tips === "string") {
      notesText = descriptionMeta.dow_tips.trim();
    }

    const rawItems = Array.isArray(data?.items) ? data.items : [];
    const curated = rawItems.map((it, idx) => {
      const sortOrder = Number(it.sort_order) || (idx + 1) * 10;
      const baseId =
        typeof it.id === "string" || typeof it.id === "number"
          ? String(it.id)
          : `cur-${it.item_type}-${it.ref_id}-${idx}`;
      if ((it.item_type || "").toLowerCase() === "note") {
        return {
          id: baseId,
          item_type: "note",
          ref_id:
            typeof it.ref_id === "string" && it.ref_id.trim()
              ? it.ref_id.trim()
              : null,
          sort_order: sortOrder,
          title: typeof it.title === "string" ? it.title : "Note",
          details:
            typeof it.details === "string" ? it.details : "",
          is_optional: Boolean(it.is_optional),
        };
      }
      if ((it.item_type || "").toLowerCase() === "meal") {
        const mealLabel =
          typeof it.meal_type === "string" && it.meal_type.trim().length > 0
            ? it.meal_type.trim()
            : "meal";
        return {
          id: baseId,
          item_type: "meal",
          ref_id: null,
          sort_order: sortOrder,
          meal_type: mealLabel,
          title: mealLabel.charAt(0).toUpperCase() + mealLabel.slice(1),
          details:
            typeof it.details === "string" && it.details.trim().length > 0
              ? it.details
              : "",
          duration_minutes:
            it.duration_minutes === null || it.duration_minutes === undefined
              ? null
              : Number.isFinite(Number(it.duration_minutes))
                ? Number(it.duration_minutes)
                : null,
          maps_url:
            typeof it.maps_url === "string" && it.maps_url.trim().length > 0
              ? it.maps_url.trim()
              : null,
          is_optional: Boolean(it.is_optional),
        };
      }
      return {
        id: baseId,
        item_type: it.item_type,
        ref_id: it.ref_id,
        sort_order: sortOrder,
        name: it.name || "",
        destination: it.destination || null,
        latitude:
          typeof it.latitude === "number"
            ? it.latitude
            : typeof it.lat === "number"
              ? it.lat
              : Number.isFinite(Number(it.latitude))
                ? Number(it.latitude)
                : Number.isFinite(Number(it.lat))
                  ? Number(it.lat)
                  : null,
        longitude:
          typeof it.longitude === "number"
            ? it.longitude
            : typeof it.lng === "number"
              ? it.lng
              : Number.isFinite(Number(it.longitude))
                ? Number(it.longitude)
                : Number.isFinite(Number(it.lng))
                  ? Number(it.lng)
                  : null,
        duration_minutes:
          it.duration_minutes === null || it.duration_minutes === undefined
            ? null
            : Number.isFinite(Number(it.duration_minutes))
              ? Number(it.duration_minutes)
              : null,
        maps_url:
          typeof it.maps_url === "string" && it.maps_url.trim().length > 0
            ? it.maps_url.trim()
            : null,
        details:
          typeof it.details === "string" && it.details.trim().length > 0
            ? it.details
            : "",
        is_optional: Boolean(it.is_optional),
        meal_type: it.meal_type || null,
      };
    });
    const hasLinkedNotes = curated.some((item) => item.item_type === "note");

    const transportItems = Array.isArray(data?.transport)
      ? data.transport
          .map((t, idx) => normalizeTransportItem(t, idx, curated.length))
          .filter(Boolean)
      : [];

    const fallbackNoteItems = hasLinkedNotes
      ? []
      : notesFromDescription.map((n, idx) => ({
          ...n,
          id: n.id || `note-${idx}-${uid()}`,
          item_type: "note",
          sort_order:
            Number(n.sort_order) ||
            (curated.length + transportItems.length + idx + 1) * 10,
          ref_id: null,
          title:
            typeof n.title === "string" && n.title.trim().length > 0
              ? n.title.trim()
              : "Note",
          details:
            typeof n.details === "string" ? n.details : "",
        }));

    setDayItinerary({
      id: data?.id,
      name: data?.name || "",
      status: data?.status || "draft",
      summary: data?.summary || "",
      description: descriptionField,
      full_description: data?.full_description || "",
      destination_id:
        typeof data?.destination_id === "string" ||
        typeof data?.destination_id === "number"
          ? data.destination_id
          : "",
      // NEW: meta with reasonable fallbacks
      tags: Array.isArray(data?.tags)
        ? data.tags
            .map((tag) =>
              typeof tag === "string" ? tag.trim() : String(tag || "")
            )
            .filter(Boolean)
        : [],
      cost_band: COST_BAND_OPTIONS.some((opt) => opt.value === data?.cost_band)
        ? data.cost_band
        : "",
      notes: notesText || "",
      accessible: Boolean(
        data?.wheelchair_friendly ?? data?.accessible ?? false
      ),
      with_kids: Boolean(data?.good_with_kids ?? data?.with_kids ?? false),
      highlights: Array.isArray(data?.highlights)
        ? data.highlights.filter(Boolean)
        : [],
      includes: Array.isArray(data?.includes) ? data.includes.filter(Boolean) : [],
      not_suitable_for: Array.isArray(data?.not_suitable_for)
        ? data.not_suitable_for.filter(Boolean)
        : [],
      important_information: Array.isArray(data?.important_information)
        ? data.important_information.filter(Boolean)
        : [],
      items: sortByOrder([
        ...curated,
        ...transportItems,
        ...fallbackNoteItems,
      ]),
    });
    setTagsRaw(
      Array.isArray(data?.tags)
        ? data.tags
            .map((tag) =>
              typeof tag === "string" ? tag.trim() : String(tag || "")
            )
            .filter(Boolean)
            .join(", ")
        : ""
    );
    setHighlightsRaw(listToText(data?.highlights || []));
    setIncludesRaw(listToText(data?.includes || []));
    setNotSuitableRaw(listToText(data?.not_suitable_for || []));
    setImportantRaw(listToText(data?.important_information || []));
    setSavedId(data?.id || null);
    setDraggingId(null);
  }

  const dayItineraryIdParam = searchParams?.get("id") || null;

  const resetToNewDayItinerary = useCallback(
    (options = { clearLoadError: true }) => {
    const draft = newDayItineraryDraft();
    setDayItinerary(draft);
      setSavedId(null);
      setSlug("");
      setSlugTouched(false);
      setCoverImage("");
      setError("");
      setTagsRaw("");
      setHighlightsRaw("");
      setIncludesRaw("");
      setNotSuitableRaw("");
      setImportantRaw("");
      if (options.clearLoadError) setLoadError("");
      setDraggingId(null);
      router.replace(`/admin/itineraries/builder`, { scroll: false });
    },
    [router]
  );

  useEffect(() => {
    if (!dayItineraryIdParam) return;
    let ignore = false;
    async function load() {
      setLoadingDayItinerary(true);
      setLoadError("");
      try {
        const res = await fetch(`/api/admin/itineraries/${dayItineraryIdParam}`, {
          cache: "no-store",
        });
        const json = await res.json();
        if (res.status === 404) {
          if (!ignore) {
            resetToNewDayItinerary({ clearLoadError: false });
            setLoadError("Day itinerary not found – showing a new draft instead.");
          }
          return;
        }
        if (!res.ok)
          throw new Error(json?.error || `Load failed (${res.status})`);
        if (!ignore) {
          hydrateDayItinerary(json);
          setSlug(json.slug || slugify(json.name || ""));
          setCoverImage(json.cover_image || "");
          setSlugTouched(Boolean(json.slug));
        }
      } catch (e) {
        if (!ignore) {
          setLoadError(e?.message || "Failed to load day itinerary");
        }
      } finally {
        if (!ignore) {
          setLoadingDayItinerary(false);
        }
      }
    }
    load();
    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayItineraryIdParam, resetToNewDayItinerary]);

  // Map plotting state and helpers
  const curatedKinds = useMemo(
    () =>
      new Set([
        "sight",
        "experience",
        "tour",
        "destination",
        "accommodation",
        "food_drink",
      ]),
    []
  );
  const mapPoints = useMemo(() => {
    return (dayItinerary.items || [])
      .filter((it) => curatedKinds.has(it.item_type))
      .map((it) => {
        const lat =
          typeof it.latitude === "number" ? it.latitude : Number(it.latitude);
        const lng =
          typeof it.longitude === "number"
            ? it.longitude
            : Number(it.longitude);
        return {
          id: it.id,
          title: it.name || it.title || it.item_type,
          item_type: it.item_type,
          lat: isFinite(lat) ? lat : null,
          lng: isFinite(lng) ? lng : null,
        };
      })
      .filter((pt) => pt.lat !== null && pt.lng !== null);
  }, [dayItinerary.items, curatedKinds]);

  function buildGmapsMultiUrl(points) {
    if (!points || points.length === 0) return null;
    if (points.length === 1) {
      const p = points[0];
      return `https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}`;
    }
    const origin = `${points[0].lat},${points[0].lng}`;
    const destination = `${points[points.length - 1].lat},${
      points[points.length - 1].lng
    }`;
    const waypoints = points
      .slice(1, -1)
      .map((p) => `${p.lat},${p.lng}`)
      .join("|");
    const wpParam = waypoints
      ? `&waypoints=${encodeURIComponent(waypoints)}`
      : "";
    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${wpParam}`;
  }

  useEffect(() => {
    if (!openMap) return;
    if (typeof window === "undefined") return;
    const container = document.getElementById("day-itinerary-map");
    if (!container) return;
    if (!mapPoints.length) return;

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    function init() {
      if (!window.google || !window.google.maps) return;
      const center = { lat: mapPoints[0].lat, lng: mapPoints[0].lng };
      const map = new window.google.maps.Map(container, {
        center,
        zoom: 12,
        mapTypeControl: false,
        streetViewControl: false,
      });
      const bounds = new window.google.maps.LatLngBounds();
      mapPoints.forEach((pt) => {
        const pos = { lat: pt.lat, lng: pt.lng };
        const marker = new window.google.maps.Marker({
          position: pos,
          map,
          title: pt.title,
        });
        bounds.extend(pos);
      });
      if (mapPoints.length > 1) {
        map.fitBounds(bounds);
      }
    }

    if (window.google && window.google.maps) {
      init();
      return;
    }

    if (!apiKey) {
      // No API key: leave container with a simple message
      container.innerHTML =
        "<div style='padding:12px;font-size:14px;color:var(--muted-foreground)'>Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable the interactive map. You can still use the “Open in Google Maps” link below.</div>";
      return;
    }

    const scriptId = "gmaps-js";
    if (!document.getElementById(scriptId)) {
      const s = document.createElement("script");
      s.id = scriptId;
      s.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
      s.async = true;
      s.onload = init;
      document.body.appendChild(s);
    } else {
      init();
    }
  }, [openMap, mapPoints]);

  // Compute total duration in minutes for all items
  const totalMinutes = useMemo(() => {
    const items = dayItinerary.items || [];
    const sum = items.reduce((acc, it) => {
      const n =
        typeof it.duration_minutes === "number"
          ? it.duration_minutes
          : Number(it.duration_minutes) || 0;
      return acc + (n > 0 ? n : 0);
    }, 0);
    return sum;
  }, [dayItinerary.items]);

  // Option A: sticky header, 2-pane grid, persistent preview, inline inspector
  return (
    <div className="mx-auto max-w-5xl p-4 space-y-6">
      {/* Sticky top bar */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur border-b border-muted mb-4 pb-2 pt-3 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Day Itinerary Builder</h1>
        <div className="space-x-2">
          {savedId ? (
            <Button
              variant="destructive"
              disabled={saving}
              onClick={async () => {
                if (!savedId) return;
                const ok = window.confirm(
                  "Delete this day itinerary? This cannot be undone."
                );
                if (!ok) return;
                try {
                  const res = await fetch(`/api/admin/itineraries/${savedId}`, {
                    method: "DELETE",
                  });
                  if (!res.ok) {
                    const json = await res.json().catch(() => ({}));
                    throw new Error(
                      json?.error || `Delete failed (${res.status})`
                    );
                  }
                  router.replace(`/admin/itineraries`, { scroll: false });
                } catch (e) {
                  alert(e?.message || "Failed to delete day itinerary");
                }
              }}
              title="Delete day itinerary"
            >
              Delete
            </Button>
          ) : null}
          <Button
            variant="outline"
            disabled={saving}
            onClick={() => resetToNewDayItinerary()}
          >
            New day itinerary
          </Button>
          <Button
            variant="secondary"
            disabled={saving}
            onClick={() => save("draft")}
          >
            {saving ? "Saving…" : "Save draft"}
          </Button>
          <Button
            variant="outline"
            disabled={mapPoints.length === 0}
            onClick={() => setOpenMap(true)}
            title={
              mapPoints.length
                ? "Show markers for curated items"
                : "Add POIs with coordinates to enable"
            }
          >
            View map
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

      {loadingDayItinerary && (
        <div className="rounded border border-muted bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          Loading day itinerary…
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
              value={dayItinerary.name}
              onChange={(e) => {
                const value = e.target.value;
                setDayItinerary({ ...dayItinerary, name: value });
                if (!slugTouched) {
                  const auto = value
                    .toLowerCase()
                    .trim()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/(^-|-$)+/g, "");
                  setSlug(auto);
                }
              }}
            />
          </div>
          <div>
            <Label>Country</Label>
            <Select
              value={countryId || "__ALL__"}
              onValueChange={(val) => {
                const next = val === "__ALL__" ? "" : val;
                setCountryId(next);
                setDayItinerary((prev) => ({ ...prev, destination_id: "" }));
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All countries" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__ALL__">All countries</SelectItem>
                {countries.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <Label>Destination</Label>
            <Select
              value={destinationValue}
              onValueChange={(val) => {
                const next = val === "__EMPTY__" ? "" : val;
                setDayItinerary((prev) => ({ ...prev, destination_id: next }));
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select destination…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__EMPTY__">Select destination…</SelectItem>
                {destinationsForScope.map((dst) => (
                  <SelectItem key={dst.id} value={dst.id}>
                    {dst.name}
                    {dst.slug ? ` (${dst.slug})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Slug</Label>
            <Input
              value={slug}
              onChange={(e) => {
                const raw = e.target.value || "";
                // Allow hyphens while typing; filter any disallowed chars only.
                const next = raw.toLowerCase().replace(/[^a-z0-9-]/g, "");
                setSlug(next);
                setSlugTouched(raw.length > 0);
              }}
              onBlur={() => {
                // On blur, canonicalize: collapse multiple hyphens and trim edges.
                setSlug((prev) =>
                  String(prev || "")
                    .replace(/-+/g, "-")
                    .replace(/(^-|-$)/g, "")
                );
              }}
              placeholder="tokyo-nightlife"
            />
          </div>
          <div className="md:col-span-2">
            <SingleImageUpload
              label="Cover image"
              value={coverImage}
              onChange={setCoverImage}
              prefix="media/day-itineraries"
            />
          </div>
          <div className="md:col-span-2">
            <Label>Summary (highlights intro)</Label>
            <Textarea
              rows={2}
              value={dayItinerary.summary}
              onChange={(e) =>
                setDayItinerary({ ...dayItinerary, summary: e.target.value })
              }
              placeholder="Short intro shown at the top of the public itinerary."
            />
          </div>
          <div className="md:col-span-2">
            <Label>Description</Label>
            <Textarea
              rows={3}
              value={dayItinerary.description}
              onChange={(e) =>
                setDayItinerary({ ...dayItinerary, description: e.target.value })
              }
            />
          </div>
          <div className="md:col-span-2">
            <Label>Full description (collapsible)</Label>
            <Textarea
              rows={4}
              value={dayItinerary.full_description}
              onChange={(e) =>
                setDayItinerary({
                  ...dayItinerary,
                  full_description: e.target.value,
                })
              }
              placeholder="Longer overview shown under 'Full description'."
            />
          </div>
          <div className="md:col-span-2">
            <Label>Highlights (one per line)</Label>
            <Textarea
              rows={4}
              value={highlightsRaw}
              onChange={(e) => {
                const raw = e.target.value;
                setHighlightsRaw(raw);
                setDayItinerary((prev) => ({
                  ...prev,
                  highlights: textToList(raw),
                }));
              }}
              placeholder="Take in the unique sight of...\nExplore Kuang Si Falls..."
            />
          </div>
          <div className="md:col-span-2">
            <Label>Includes (one per line)</Label>
            <Textarea
              rows={3}
              value={includesRaw}
              onChange={(e) => {
                const raw = e.target.value;
                setIncludesRaw(raw);
                setDayItinerary((prev) => ({
                  ...prev,
                  includes: textToList(raw),
                }));
              }}
              placeholder="Hotel pickup and drop-off\nEntrance fees"
            />
          </div>
          <div className="md:col-span-2">
            <Label>Not suitable for (one per line)</Label>
            <Textarea
              rows={2}
              value={notSuitableRaw}
              onChange={(e) => {
                const raw = e.target.value;
                setNotSuitableRaw(raw);
                setDayItinerary((prev) => ({
                  ...prev,
                  not_suitable_for: textToList(raw),
                }));
              }}
              placeholder="Wheelchair users"
            />
          </div>
          <div className="md:col-span-2">
            <Label>Important information (one per line)</Label>
            <Textarea
              rows={4}
              value={importantRaw}
              onChange={(e) => {
                const raw = e.target.value;
                setImportantRaw(raw);
                setDayItinerary((prev) => ({
                  ...prev,
                  important_information: textToList(raw),
                }));
              }}
              placeholder="Comfortable shoes\nSwimwear\nTowel"
            />
          </div>
          {/* --- NEW FIELDS --- */}
          <div>
            <Label>Tags</Label>
            <Input
              value={tagsRaw}
              onChange={(e) => {
                const raw = e.target.value;
                setTagsRaw(raw);
                const tags = raw
                  .split(",")
                  .map((t) => t.trim())
                  .filter(Boolean);
                setDayItinerary({ ...dayItinerary, tags });
              }}
              placeholder="family, rainy day, foodie"
            />
          </div>
          <div>
            <Label>Cost band</Label>
            <select
              className="w-full rounded-md border bg-background p-2"
              value={dayItinerary.cost_band || ""}
              onChange={(e) =>
                setDayItinerary({ ...dayItinerary, cost_band: e.target.value })
              }
            >
              <option value="">— select —</option>
              {COST_BAND_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <Label>Notes</Label>
            <Textarea
              rows={2}
              value={dayItinerary.notes || ""}
              onChange={(e) =>
                setDayItinerary({ ...dayItinerary, notes: e.target.value })
              }
              placeholder="Optional notes shown to admins when editing."
            />
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={Boolean(dayItinerary.accessible)}
                onChange={(e) =>
                  setDayItinerary({ ...dayItinerary, accessible: e.target.checked })
                }
              />
              Wheelchair‑friendly
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={Boolean(dayItinerary.with_kids)}
                onChange={(e) =>
                  setDayItinerary({ ...dayItinerary, with_kids: e.target.checked })
                }
              />
              Good with kids
            </label>
          </div>
          {/* --- END NEW FIELDS --- */}
        </CardContent>
      </Card>

      {/* Editor (Items) first; Preview stacked below */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Items</CardTitle>
          <div className="space-x-2">
            {/* keep the existing Add POI / Add Transport / Add Note controls exactly as they were */}
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
                      placeholder="e.g. Minivan: Luang Prabang → Kuang Si"
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
                          "motorbike",
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
                  ...dayItinerary.items.map((i) => i.sort_order || 0)
                );
                const note = {
                  id: uid(),
                  sort_order: maxOrder + 10,
                  item_type: "note",
                  title: "Note",
                  details: "Add note text…",
                  ref_id: null,
                  is_optional: false,
                  meal_type: null,
                };
                setDayItinerary((prev) => ({
                  ...prev,
                  items: sortByOrder([...prev.items, note]),
                }));
              }}
            >
              <Plus className="h-4 w-4 mr-1" /> Add Note
            </Button>
            <Button size="sm" variant="secondary" onClick={addMeal}>
              <Plus className="h-4 w-4 mr-1" /> Add Meal
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* keep the existing list + inline inspector block EXACTLY as before */}
          {timelineItems.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No items yet. Use the buttons above to add POIs, transport, or
              notes.
            </div>
          ) : (
            <div className="flex flex-col md:flex-row gap-4">
              {/* Left: list */}
              <div className="flex-1 min-w-0 space-y-2">
                {timelineItems.map((i) => (
                  <div
                    key={i.id}
                    className={
                      "flex items-center justify-between rounded-lg border p-2 cursor-pointer select-none transition-colors" +
                      (draggingId === i.id
                        ? " opacity-50"
                        : selectedItemId === i.id
                        ? " bg-muted"
                        : "")
                    }
                    draggable
                    aria-grabbed={draggingId === i.id}
                    onDragStart={(event) => handleDragStart(event, i.id)}
                    onDragOver={(event) => handleDragOver(event, i.id)}
                    onDrop={(event) => handleDrop(event, i.id)}
                    onDragEnd={handleDragEnd}
                    onClick={() => setSelectedItemId(i.id)}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <Badge variant="secondary" className="capitalize">
                        {i.item_type.replace("_", " ")}
                      </Badge>
                      <span className="font-medium truncate">
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
                        onClick={(e) => {
                          e.stopPropagation();
                          moveItem(i.id, -1);
                        }}
                        aria-label="Move up"
                      >
                        ▲
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          moveItem(i.id, 1);
                        }}
                        aria-label="Move down"
                      >
                        ▼
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeItem(i.id);
                        }}
                        aria-label="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {/* Drag target for end-of-list */}
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
              {/* Right: Inline inspector */}
              <div className="flex-1 min-w-0">
                {selectedItem ? (
                  <Card className="border shadow-none">
                    <CardHeader>
                      <CardTitle>
                        Edit:{" "}
                        {selectedItem.title ||
                          selectedItem.name ||
                          "(untitled)"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {/* Inspector fields (minimal for demo, can expand) */}
                      <div className="space-y-2">
                        {/* Title / Name */}
                        {[
                          "sight",
                          "experience",
                          "tour",
                          "destination",
                          "accommodation",
                          "food_drink",
                        ].includes(selectedItem.item_type) ? (
                          <>
                            <Label>Name (from POI)</Label>
                            <Input
                              value={
                                selectedItem.name || selectedItem.title || ""
                              }
                              disabled
                            />
                          </>
                        ) : (
                          <>
                            <Label>Title</Label>
                            <Input
                              value={selectedItem.title || ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                setDayItinerary((prev) => ({
                                  ...prev,
                                  items: prev.items.map((it) =>
                                    it.id === selectedItem.id
                                      ? { ...it, title: val }
                                      : it
                                  ),
                                }));
                              }}
                            />
                          </>
                        )}
                        {selectedItem.item_type === "meal" ? (
                          <>
                            <Label>Meal type</Label>
                            <Select
                              value={selectedItem.meal_type || "lunch"}
                              onValueChange={(value) => {
                                const label =
                                  value.charAt(0).toUpperCase() + value.slice(1);
                                setDayItinerary((prev) => ({
                                  ...prev,
                                  items: prev.items.map((it) =>
                                    it.id === selectedItem.id
                                      ? { ...it, meal_type: value, title: label }
                                      : it
                                  ),
                                }));
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select meal type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="breakfast">
                                  Breakfast
                                </SelectItem>
                                <SelectItem value="lunch">Lunch</SelectItem>
                                <SelectItem value="dinner">Dinner</SelectItem>
                                <SelectItem value="coffee">Coffee</SelectItem>
                              </SelectContent>
                            </Select>
                          </>
                        ) : null}
                        <Label>Details</Label>
                        <Textarea
                          rows={3}
                          value={selectedItem.details || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setDayItinerary((prev) => ({
                              ...prev,
                              items: prev.items.map((it) =>
                                it.id === selectedItem.id
                                  ? { ...it, details: val }
                                  : it
                              ),
                            }));
                          }}
                        />
                        <Label>Duration (min)</Label>
                        <Input
                          type="number"
                          value={selectedItem.duration_minutes || ""}
                          onChange={(e) => {
                            const val = e.target.value
                              ? Number(e.target.value)
                              : "";
                            setDayItinerary((prev) => ({
                              ...prev,
                              items: prev.items.map((it) =>
                                it.id === selectedItem.id
                                  ? { ...it, duration_minutes: val }
                                  : it
                              ),
                            }));
                          }}
                        />
                        <div className="flex items-center gap-2 pt-2">
                          <Checkbox
                            id="day-itinerary-optional"
                            checked={Boolean(selectedItem.is_optional)}
                            onCheckedChange={(checked) => {
                              const isOptional = checked === true;
                              setDayItinerary((prev) => ({
                                ...prev,
                                items: prev.items.map((it) =>
                                  it.id === selectedItem.id
                                    ? { ...it, is_optional: isOptional }
                                    : it
                                ),
                              }));
                            }}
                          />
                          <Label htmlFor="day-itinerary-optional">
                            Optional stop
                          </Label>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setSelectedItemId(null)}
                          >
                            Close
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="text-sm text-muted-foreground pt-4">
                    Select an item to edit.
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      {/* Stacked Preview below the editor to avoid clipping */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Preview</CardTitle>
          <p className="text-sm text-muted-foreground">
            Estimated total duration:{" "}
            {totalMinutes ? minsToLabel(totalMinutes) : "—"}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {(dayItinerary.tags || []).map((t, idx) => (
              <Badge key={t + idx} variant="secondary" className="capitalize">
                {t}
              </Badge>
            ))}
            {costBandLabel ? (
              <Badge variant="outline">{costBandLabel}</Badge>
            ) : null}
            {dayItinerary.accessible ? (
              <Badge variant="secondary">Accessible</Badge>
            ) : null}
            {dayItinerary.with_kids ? (
              <Badge variant="secondary">With kids</Badge>
            ) : null}
          </div>
        </CardHeader>
        <CardContent>
          <DayItineraryTimeline
            items={timelineItems}
            minutesPerUnit={30}
            unitRowPx={14}
          />
        </CardContent>
      </Card>
      {/* Map Sheet */}
      <Sheet open={openMap} onOpenChange={setOpenMap}>
        <SheetContent side="right" className="w-full sm:max-w-3xl">
          <SheetHeader>
            <SheetTitle>Day Itinerary Map</SheetTitle>
          </SheetHeader>
          <div className="mt-3 space-y-3">
            <div
              id="day-itinerary-map"
              className="w-full rounded-lg border"
              style={{ height: 420 }}
            />
            <div className="text-sm text-muted-foreground">
              {mapPoints.length
                ? `${mapPoints.length} point${
                    mapPoints.length > 1 ? "s" : ""
                  } plotted from your curated items.`
                : "No plottable points yet."}
            </div>
            {mapPoints.length > 0 && (
              <a
                href={buildGmapsMultiUrl(mapPoints)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center text-sm underline"
              >
                Open in Google Maps
              </a>
            )}
          </div>
          <SheetFooter className="mt-4">
            <Button variant="secondary" onClick={() => setOpenMap(false)}>
              Close
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function sortByOrder(arr) {
  return [...arr].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
}
