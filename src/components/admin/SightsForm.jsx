"use client";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import ConfirmDeleteButton from "@/components/admin/ConfirmDeleteButton";
import MultiImageUpload from "./MultiImageUpload";
import RichTextEditor from "./RichTextEditor";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import OpeningTimes from "@/components/admin/OpeningTimesEditor";
import AdmissionEditor from "@/components/admin/AdmissionEditor";
import {
  normalizePrefectureShape,
  sortGeoRows,
  shouldUseGeoViews,
} from "@/lib/geo-normalize";

export default function SightsForm({ id, initial, onSaved, onCancel }) {
  const supabase = createClient();
  const useGeoViews = shouldUseGeoViews();
  const isEditing = !!id;

  const [name, setName] = useState(initial?.name || "");
  const [slug, setSlug] = useState(initial?.slug || "");
  const [slugTouched, setSlugTouched] = useState(!!initial?.id);
  const [summary, setSummary] = useState(initial?.summary || "");
  const [body, setBody] = useState(initial?.body_richtext || null);
  const [images, setImages] = useState(
    Array.isArray(initial?.images) ? initial.images : []
  );
  const [destinationId, setDestinationId] = useState(
    initial?.destination_id || ""
  );
  const [status, setStatus] = useState(initial?.status || "draft");
  const [lat, setLat] = useState(initial?.lat ?? "");
  const [lng, setLng] = useState(initial?.lng ?? "");
  const [tags, setTags] = useState(
    Array.isArray(initial?.tags) ? initial.tags : []
  );
  const [durationMinutes, setDurationMinutes] = useState(
    initial?.duration_minutes ?? ""
  );
  const [provider, setProvider] = useState(initial?.provider || "internal");
  const [deeplink, setDeeplink] = useState(initial?.deeplink || "");
  const [gygId, setGygId] = useState(initial?.gyg_id || "");
  const [priceAmount, setPriceAmount] = useState(initial?.price_amount ?? "");
  const [priceCurrency, setPriceCurrency] = useState(
    initial?.price_currency || "JPY"
  );
  const [admissionFee, setAdmissionFee] = useState(
    initial?.admission_fee_richtext || null
  );
  const [openingTimesText, setOpeningTimesText] = useState(
    initial?.opening_times_richtext || null
  );

  const [regions, setRegions] = useState([]);
  const [prefectures, setPrefectures] = useState([]);
  const [divisionsForDest, setDivisionsForDest] = useState([]);
  const [destinations, setDestinations] = useState([]);

  const [regionId, setRegionId] = useState("");
  const [prefectureId, setPrefectureId] = useState("");
  const [divisionId, setDivisionId] = useState("");

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const openingTimesRef = useRef(null);
  const admissionRef = useRef(null);

  // Ensure anything we pass to client children is plain JSON (no Date/Map/URL/classes)
  const toPlain = useCallback((x) => {
    try {
      return JSON.parse(JSON.stringify(x));
    } catch {
      return x;
    }
  }, []);

  const sightId = id || initial?.id || null;

  const admissionRowsPlain = useMemo(() => {
    const rows = Array.isArray(initial?.admission) ? initial.admission : [];
    return toPlain(rows);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial?.admission]);

  function slugify(s) {
    return (s || "")
      .toLowerCase()
      .trim()
      .replace(/['"]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  useEffect(() => {
    if (!slugTouched) setSlug(slugify(name));
  }, [name, slugTouched]);

  // Load geo + destinations
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/admin/meta/geo", { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          if (!cancelled) {
            setRegions(json.regions || []);
            setPrefectures(json.prefectures || []);
          }
        }
      } catch {}
      try {
        const res = await fetch("/api/admin/meta/destinations", {
          cache: "no-store",
        });
        if (res.ok) {
          const json = await res.json();
          if (!cancelled) setDestinations(json.items || []);
        }
      } catch {}
      // Client fallback reads in case admin meta is blocked
      try {
        const { data: r } = await supabase
          .from("regions")
          .select("id,name,slug,order_index")
          .order("order_index", { ascending: true });
        if (!cancelled && r && r.length && regions.length === 0) setRegions(r);
      } catch {}
      try {
        const prefQuery = useGeoViews
          ? supabase.from("geo_prefectures_v").select("*")
          : supabase
              .from("prefectures")
              .select("id,name,slug,region_id,order_index")
              .order("order_index", { ascending: true });
        const { data: p } = await prefQuery;
        if (
          !cancelled &&
          Array.isArray(p) &&
          p.length &&
          prefectures.length === 0
        ) {
          setPrefectures(
            sortGeoRows(p.map(normalizePrefectureShape).filter(Boolean))
          );
        }
      } catch {}
      // Division options are loaded via RPC per destination; no general divisions fetch here.
      try {
        const { data: dst } = await supabase
          .from("destinations")
          .select("id,name,slug,prefecture_id,division_id,status")
          .order("name", { ascending: true });
        if (!cancelled && dst && dst.length && destinations.length === 0)
          setDestinations(dst);
      } catch {}
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  useEffect(() => {
    setSlug(initial?.slug || "");
    setName(initial?.name || "");
    setSummary(initial?.summary || "");
    setBody(initial?.body_richtext || null);
    setImages(Array.isArray(initial?.images) ? initial.images : []);
    setDestinationId(initial?.destination_id || "");
    setDivisionId(initial?.division_id || "");
    setStatus(initial?.status || "draft");
    setLat(initial?.lat ?? "");
    setLng(initial?.lng ?? "");
    setTags(Array.isArray(initial?.tags) ? initial.tags : []);
    setDurationMinutes(initial?.duration_minutes ?? "");
    setProvider(initial?.provider || "internal");
    setDeeplink(initial?.deeplink || "");
    setGygId(initial?.gyg_id || "");
    setPriceAmount(initial?.price_amount ?? "");
    setPriceCurrency(initial?.price_currency || "JPY");
    setAdmissionFee(initial?.admission_fee_richtext || null);
    setOpeningTimesText(initial?.opening_times_richtext || null);
  }, [initial]);

  // Derive geo scope (region/pref) from destination
  useEffect(() => {
    const d = destinations.find((x) => x.id === destinationId);
    if (!d) {
      setPrefectureId("");
      setRegionId("");
      return;
    }
    setPrefectureId(d.prefecture_id || "");
    const pref = prefectures.find((p) => p.id === d.prefecture_id);
    setRegionId(pref?.region_id || "");
  }, [destinationId, destinations, prefectures]);

  // On destination change, fetch divisions via RPC and clear division only after initial mount
  const prevDestIdRef = useRef(null);
  useEffect(() => {
    let cancelled = false;
    async function fetchDivs() {
      if (!destinationId) {
        setDivisionsForDest([]);
        return;
      }
      try {
        const { data } = await supabase.rpc("get_divisions_for_destination", {
          dst_id: destinationId,
        });
        if (!cancelled) setDivisionsForDest(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setDivisionsForDest([]);
      }
    }
    if (
      prevDestIdRef.current !== null &&
      prevDestIdRef.current !== destinationId
    ) {
      setDivisionId("");
    }
    fetchDivs();
    prevDestIdRef.current = destinationId;
    return () => {
      cancelled = true;
    };
  }, [destinationId, supabase]);

  const prefecturesForRegion = useMemo(
    () => prefectures.filter((p) => p.region_id === regionId),
    [prefectures, regionId]
  );
  const destinationsForScope = useMemo(() => {
    return destinations.filter((d) => {
      if (prefectureId && d.prefecture_id !== prefectureId) return false;
      return true;
    });
  }, [destinations, prefectureId]);

  const destSlugForUpload = useMemo(() => {
    const d = destinations.find((x) => x.id === destinationId);
    return d?.slug || "unsorted";
  }, [destinations, destinationId]);

  async function save() {
    setSaving(true);
    setFormError("");
    try {
      if (!name.trim()) throw new Error("Name is required");
      const finalSlug = slugify(slug || name);
      if (!finalSlug) throw new Error("Slug is required");
      if (!destinationId) throw new Error("Select a destination");
      const payload = {
        name,
        slug: finalSlug,
        summary,
        body_richtext: body,
        images: Array.isArray(images) ? images : [],
        destination_id: destinationId,
        division_id: divisionId || null,
        status,
        lat: lat === "" ? null : Number(lat),
        lng: lng === "" ? null : Number(lng),
        tags: Array.isArray(tags) ? tags : [],
        duration_minutes:
          durationMinutes === "" ? null : Number(durationMinutes),
        provider: provider || null,
        deeplink: deeplink || null,
        gyg_id: gygId === "" ? null : String(gygId),
        price_amount: priceAmount === "" ? null : Number(priceAmount),
        price_currency: priceCurrency || null,
        admission_fee_richtext: admissionFee,
        opening_times_richtext: openingTimesText,
      };
      const res = await fetch(
        isEditing ? `/api/admin/sights/${id}` : "/api/admin/sights",
        {
          method: isEditing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok)
        throw new Error(json?.error || `Save failed (${res.status})`);

      const savedSightId =
        json?.id ||
        json?.sight?.id ||
        json?.data?.id ||
        id ||
        initial?.id ||
        null;

      if (openingTimesRef.current) {
        if (!savedSightId) {
          throw new Error("Unable to determine sight ID for opening times");
        }
        await openingTimesRef.current.save(savedSightId);
      }

      if (admissionRef.current) {
        if (!savedSightId) {
          throw new Error("Unable to determine sight ID for admission pricing");
        }
        await admissionRef.current.save(savedSightId);
      }

      onSaved?.(json);
    } catch (e) {
      setFormError(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!isEditing) return;
    const res = await fetch(`/api/admin/sights/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      alert(json?.error || `Delete failed (${res.status})`);
      return;
    }
    onSaved?.({ deleted: true });
  }

  return (
    <Card className="space-y-4">
      <CardContent className="space-y-6">
        {formError ? (
          <div className="rounded border border-red-200 bg-red-50 text-red-800 px-3 py-2 text-sm">
            {formError}
          </div>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Status</label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">draft</SelectItem>
                <SelectItem value="published">published</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium">Name</label>
            <input
              className="w-full rounded border p-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Slug</label>
            <input
              className="w-full rounded border p-2"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugTouched(true);
              }}
              placeholder="e.g. meiji-shrine"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium">Summary</label>
            <textarea
              className="w-full rounded border p-2"
              rows={3}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Region</label>
            <Select
              value={regionId || "__EMPTY__"}
              onValueChange={(v) => {
                const val = v === "__EMPTY__" ? "" : v;
                setRegionId(val);
                setPrefectureId("");
                setDivisionId("");
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All regions…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__EMPTY__">All regions…</SelectItem>
                {regions.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium">Prefecture</label>
            <Select
              value={prefectureId || "__EMPTY__"}
              onValueChange={(v) => {
                const val = v === "__EMPTY__" ? "" : v;
                setPrefectureId(val);
                setDivisionId("");
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All prefectures…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__EMPTY__">All prefectures…</SelectItem>
                {prefecturesForRegion.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Division is chosen within destination context below */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium">Destination</label>
            <Select
              value={destinationId || "__EMPTY__"}
              onValueChange={(v) =>
                setDestinationId(v === "__EMPTY__" ? "" : v)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a destination…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__EMPTY__">Select a destination…</SelectItem>
                {destinationsForScope.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium">
              Division (optional)
            </label>
            <Select
              value={divisionId || "__EMPTY__"}
              onValueChange={(v) => setDivisionId(v === "__EMPTY__" ? "" : v)}
            >
              <SelectTrigger className="w-full" disabled={!destinationId}>
                <SelectValue placeholder="No division (entire destination)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__EMPTY__">
                  No division (entire destination)
                </SelectItem>
                {divisionsForDest.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium">Latitude</label>
            <input
              className="w-full rounded border p-2"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              placeholder="e.g. 35.6762"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Longitude</label>
            <input
              className="w-full rounded border p-2"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              placeholder="e.g. 139.6503"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">
              Duration (minutes)
            </label>
            <input
              className="w-full rounded border p-2"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              placeholder="e.g. 90"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Provider</label>
            <Select value={provider} onValueChange={setProvider}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="internal">internal</SelectItem>
                <SelectItem value="gyg">gyg</SelectItem>
                <SelectItem value="dekitabi">dekitabi</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium">Deeplink</label>
            <input
              className="w-full rounded border p-2"
              value={deeplink}
              onChange={(e) => setDeeplink(e.target.value)}
              placeholder="https://…"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">GYG ID</label>
            <input
              className="w-full rounded border p-2"
              value={gygId}
              onChange={(e) => setGygId(e.target.value)}
              placeholder="e.g. 1035544"
            />
            <div className="text-xs text-black/60 mt-1">
              Used to render the GetYourGuide availability widget.
            </div>
          </div>
        </div>

        <MultiImageUpload
          label="Images"
          value={Array.isArray(images) ? images : []}
          onChange={setImages}
          prefix={`destinations/${destSlugForUpload}/sights`}
        />

        <div>
          <label className="block text-sm font-medium">
            Tags (comma-separated)
          </label>
          <input
            className="w-full rounded border p-2"
            value={(tags || []).join(", ")}
            onChange={(e) =>
              setTags(
                e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean)
              )
            }
            placeholder="e.g. temple,shrine,park"
          />
        </div>

        <RichTextEditor
          value={body}
          onChange={setBody}
          label="Details"
          warnOnUnsaved={true}
        />

        <Card>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">Admission</h3>
              <p className="text-sm text-muted-foreground">
                Configure ticket categories, pricing, and validity windows.
              </p>
            </div>
            {sightId ? (
              <AdmissionEditor
                ref={admissionRef}
                sightId={sightId}
                initialRows={admissionRowsPlain}
              />
            ) : (
              <div className="rounded border border-dashed border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
                Save the sight first to manage admission pricing.
              </div>
            )}
          </CardContent>
        </Card>

        <OpeningTimes ref={openingTimesRef} sightId={sightId} />
        <div className="flex items-center gap-3">
          <Button
            onClick={save}
            disabled={saving}
            size="sm"
            className="h-9 px-4"
          >
            {saving ? "Saving…" : "Save"}
          </Button>
          <Button
            variant="outline"
            onClick={onCancel}
            size="sm"
            className="h-9 px-4"
          >
            Cancel
          </Button>
          {isEditing ? (
            <ConfirmDeleteButton
              title="Delete this sight?"
              description="This action cannot be undone. This will permanently delete the item and remove any associated data."
              triggerClassName="ml-auto h-9 px-4"
              triggerSize="sm"
              fullscreen
              onConfirm={handleDelete}
            />
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
