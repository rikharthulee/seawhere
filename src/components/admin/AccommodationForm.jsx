"use client";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import MultiImageUpload from "./MultiImageUpload";
import ConfirmDeleteButton from "@/components/admin/ConfirmDeleteButton";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import ParagraphEditor from "./ParagraphEditor";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import {
  normalizePrefectureShape,
  sortGeoRows,
  shouldUseGeoViews,
} from "@/lib/geo-normalize";

const numberFromString = z.preprocess((v) => {
  if (v === "" || v === undefined || v === null) return undefined;
  if (typeof v === "string") return Number(v);
  return v;
}, z.number().optional());

const urlOrEmpty = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : undefined))
  .refine((v) => !v || /^https?:\/\//i.test(v), { message: "Enter a valid URL (http/https)" });

const accommodationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().optional(),
  summary: z.string().optional(),
  status: z.enum(["draft", "published"], { required_error: "Select a status" }),
  credit: z.string().optional(),
  priceBand: z.enum(["__EMPTY__", "$$", "$$$", "$$$$", "$$$$$"]).optional(),
  rating: numberFromString,
  websiteUrl: urlOrEmpty,
  affiliateUrl: urlOrEmpty,
  lat: numberFromString,
  lng: numberFromString,
  addressText: z.string().optional(),
});

function slugify(s) {
  return (s || "")
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function AccommodationForm({ initial, onSaved, onCancel }) {
  const supabase = createClient();
  const useGeoViews = shouldUseGeoViews();
  const [name, setName] = useState(initial?.name || "");
  const [slug, setSlug] = useState(initial?.slug || "");
  const [slugTouched, setSlugTouched] = useState(!!initial?.id);
  const [summary, setSummary] = useState(initial?.summary || "");
  const [body, setBody] = useState(initial?.description || null);
  const [images, setImages] = useState(Array.isArray(initial?.images) ? initial.images : []);
  const [status, setStatus] = useState(initial?.status || "draft");
  const [credit, setCredit] = useState(initial?.credit || "");
  const [priceBand, setPriceBand] = useState(initial?.price_band || "");
  const [rating, setRating] = useState(initial?.rating ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(initial?.website_url || "");
  const [affiliateUrl, setAffiliateUrl] = useState(initial?.affiliate_url || "");
  const [lat, setLat] = useState(initial?.lat ?? "");
  const [lng, setLng] = useState(initial?.lng ?? "");
  const [addressText, setAddressText] = useState(
    initial?.address ? JSON.stringify(initial.address, null, 2) : ""
  );
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const isEditing = !!initial?.id;

  const form = useForm({
    resolver: zodResolver(accommodationSchema),
    defaultValues: {
      name: initial?.name || "",
      slug: initial?.slug || "",
      summary: initial?.summary || "",
      status: initial?.status || "draft",
      credit: initial?.credit || "",
      priceBand: (initial?.price_band || "") || "__EMPTY__",
      rating: initial?.rating?.toString?.() ?? "",
      websiteUrl: initial?.website_url || "",
      affiliateUrl: initial?.affiliate_url || "",
      lat: initial?.lat?.toString?.() ?? "",
      lng: initial?.lng?.toString?.() ?? "",
      addressText: initial?.address ? JSON.stringify(initial.address, null, 2) : "",
    },
  });

  // Geo selection similar to POI form
  const [regions, setRegions] = useState([]);
  const [prefectures, setPrefectures] = useState([]);
  const [divisionsForDest, setDivisionsForDest] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [regionId, setRegionId] = useState("");
  const [prefectureId, setPrefectureId] = useState("");
  const [divisionId, setDivisionId] = useState("");
  const [destinationId, setDestinationId] = useState(initial?.destination_id || "");

  useEffect(() => {
    setName(initial?.name || "");
    setSlug(initial?.slug || "");
    setSlugTouched(!!initial?.id);
    setSummary(initial?.summary || "");
    setBody(initial?.description || null);
    setImages(Array.isArray(initial?.images) ? initial.images : []);
    setStatus(initial?.status || "draft");
    setCredit(initial?.credit || "");
    setPriceBand(initial?.price_band || "");
    setRating(initial?.rating ?? "");
    setWebsiteUrl(initial?.website_url || "");
    setAffiliateUrl(initial?.affiliate_url || "");
    setLat(initial?.lat ?? "");
    setLng(initial?.lng ?? "");
    setAddressText(initial?.address ? JSON.stringify(initial.address, null, 2) : "");
    setDestinationId(initial?.destination_id || "");
    setPrefectureId(initial?.prefecture_id || "");
    setDivisionId(initial?.division_id || "");
    form.reset({
      name: initial?.name || "",
      slug: initial?.slug || "",
      summary: initial?.summary || "",
      status: initial?.status || "draft",
      credit: initial?.credit || "",
      priceBand: (initial?.price_band || "") || "__EMPTY__",
      rating: initial?.rating?.toString?.() ?? "",
      websiteUrl: initial?.website_url || "",
      affiliateUrl: initial?.affiliate_url || "",
      lat: initial?.lat?.toString?.() ?? "",
      lng: initial?.lng?.toString?.() ?? "",
      addressText: initial?.address ? JSON.stringify(initial.address, null, 2) : "",
    });
  }, [initial]);

  useEffect(() => {
    if (!slugTouched) setSlug(slugify(name));
  }, [name, slugTouched]);

  function onSlugInput(e) {
    const raw = e.target.value;
    const v = slugify(raw);
    setSlug(v);
    setSlugTouched(raw.length > 0);
  }

  async function save(values) {
    const errs = {};
    if (!(values.name || "").trim()) errs.name = "Name is required";
    if (!((values.slug || "").trim())) errs.slug = "Slug is required";
    if (!values.status) errs.status = "Select a status";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    try {
      // Validate address JSON if provided
      let addressJson = null;
      if (values.addressText && values.addressText.trim().length) {
        try {
          addressJson = JSON.parse(values.addressText);
        } catch (e) {
          throw new Error("Address must be valid JSON or left blank");
        }
      }
      const payload = {
        name: values.name,
        slug: (values.slug || slugify(values.name)),
        summary: values.summary || "",
        description: body,
        images: Array.isArray(images) ? images : [],
        status: values.status,
        credit: values.credit || null,
        destination_id: destinationId || null,
        prefecture_id: prefectureId || null,
        division_id: divisionId || null,
        price_band: values.priceBand && values.priceBand !== "__EMPTY__" ? values.priceBand : null,
        rating: values.rating === undefined ? null : Number(values.rating),
        website_url: values.websiteUrl || null,
        affiliate_url: values.affiliateUrl || null,
        lat: values.lat === undefined ? null : Number(values.lat),
        lng: values.lng === undefined ? null : Number(values.lng),
        address: addressJson,
      };
      let savedSlug = payload.slug;
      let res, json;
      if (isEditing) {
        res = await fetch(`/api/admin/accommodation/${initial.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        json = await res.json();
        if (!res.ok) throw new Error(json?.error || `Save failed (${res.status})`);
        savedSlug = json.slug || savedSlug;
      } else {
        res = await fetch(`/api/admin/accommodation`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        json = await res.json();
        if (!res.ok) throw new Error(json?.error || `Save failed (${res.status})`);
        savedSlug = json.slug || savedSlug;
      }
      try {
        await fetch(`/api/revalidate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tags: ["accommodation", `accommodation:${savedSlug}`] }),
        });
      } catch {}
      onSaved?.();
    } catch (e) {
      console.error(e);
      alert(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  // Load geo lists using admin meta endpoints (service-role backed)
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/admin/meta/geo", { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          if (!cancelled) {
            setRegions(Array.isArray(json.regions) ? json.regions : []);
            setPrefectures(Array.isArray(json.prefectures) ? json.prefectures : []);
          }
        }
      } catch {}
      try {
        const res = await fetch("/api/admin/meta/destinations", { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          if (!cancelled) setDestinations(Array.isArray(json.items) ? json.items : []);
        }
      } catch {}
      // Fallback reads if needed
      try {
        const prefQuery = useGeoViews
          ? supabase.from("geo_prefectures_v").select("*")
          : supabase
              .from("prefectures")
              .select("id,name,slug,region_id,order_index")
              .order("order_index", { ascending: true });
        const { data: prefs } = await prefQuery;
        if (!cancelled && (!prefectures || prefectures.length === 0)) {
          const normalized = Array.isArray(prefs)
            ? sortGeoRows(prefs.map(normalizePrefectureShape).filter(Boolean))
            : [];
          setPrefectures(normalized);
        }
      } catch {}
      // Division options are loaded via RPC per destination; no general divisions fetch here.
      try {
        const { data: dst } = await supabase
          .from("destinations")
          .select("id,name,slug,prefecture_id,division_id,status")
          .order("name", { ascending: true });
        if (!cancelled && (!destinations || destinations.length === 0)) setDestinations(dst || []);
      } catch {}
    }
    load();
    return () => { cancelled = true; };
  }, [supabase]);

  // When editing, preselect region/pref based on destination
  useEffect(() => {
    if (!destinationId || destinations.length === 0 || prefectures.length === 0) return;
    // If already set on the record, do not override from destination
    if (prefectureId || divisionId) return;
    const dst = destinations.find((d) => d.id === destinationId);
    if (!dst) return;
    const pref = prefectures.find((p) => p.id === dst.prefecture_id);
    if (pref) {
      setPrefectureId(pref.id);
      const reg = regions.find((r) => r.id === pref.region_id);
      if (reg) setRegionId(reg.id);
    }
  }, [destinationId, destinations, prefectures, regions]);

  const prefecturesForRegion = prefectures.filter((p) => !regionId || p.region_id === regionId);
  // No prefecture-wide divisions list here; division options are from RPC
  const destinationsForScope = destinations.filter((d) => {
    if (prefectureId && d.prefecture_id !== prefectureId) return false;
    return true;
  });

  // Keep region in sync when prefecture changes
  useEffect(() => {
    if (!prefectureId) return;
    const pref = prefectures.find((p) => p.id === prefectureId);
    if (pref && pref.region_id && regionId !== pref.region_id) setRegionId(pref.region_id);
  }, [prefectureId, prefectures]);

  // Fetch divisions via RPC and clear division only after initial mount
  const prevDestIdRef = useRef(null);
  useEffect(() => {
    let cancelled = false;
    async function fetchDivs() {
      if (!destinationId) { setDivisionsForDest([]); return; }
      try {
        const { data } = await supabase.rpc('get_divisions_for_destination', { dst_id: destinationId });
        if (!cancelled) setDivisionsForDest(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setDivisionsForDest([]);
      }
    }
    if (prevDestIdRef.current !== null && prevDestIdRef.current !== destinationId) {
      setDivisionId("");
    }
    fetchDivs();
    prevDestIdRef.current = destinationId;
    return () => { cancelled = true; };
  }, [destinationId, supabase]);

  async function handleDelete() {
    if (!isEditing) return;
    const res = await fetch(`/api/admin/accommodation/${initial.id}`, { method: "DELETE" });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      alert(json?.error || `Delete failed (${res.status})`);
      return;
    }
    try {
      await fetch(`/api/revalidate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: ["accommodation", `accommodation:${slug || initial.slug}`] }),
      });
    } catch {}
    onSaved?.();
  }

  return (
    <Form {...form}>
    <Card className="space-y-4">
      <CardContent>
        {Object.keys(errors || {}).length ? (
          <div className="rounded border border-red-200 bg-red-50 text-red-800 px-3 py-2 text-sm">Please fix the highlighted fields.</div>
        ) : null}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} onChange={(e) => { field.onChange(e.target.value); setName(e.target.value); }} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div>
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug</FormLabel>
                  <FormControl>
                    <Input {...field} onChange={(e) => { onSlugInput(e); field.onChange(e.target.value); }} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        <div className="md:col-span-2">
          <FormField
            control={form.control}
            name="summary"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Summary</FormLabel>
                <FormControl>
                  <Textarea rows={3} {...field} onChange={(e) => { field.onChange(e.target.value); setSummary(e.target.value); }} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      <div className="md:col-span-2">
        <MultiImageUpload
          label="Gallery images"
          value={images}
          onChange={setImages}
          prefix="accommodation"
        />
      </div>
        <div>
          <FormLabel>Status</FormLabel>
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <Select value={field.value} onValueChange={(v) => { field.onChange(v); setStatus(v); }}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">draft</SelectItem>
                  <SelectItem value="published">published</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Credit</label>
          <input className="w-full rounded border p-2" value={credit} onChange={(e) => setCredit(e.target.value)} />
        </div>
        <div>
          <FormLabel>Price band</FormLabel>
          <FormField control={form.control} name="priceBand" render={({ field }) => (
            <Select value={field.value} onValueChange={(v) => { field.onChange(v); setPriceBand(v === "__EMPTY__" ? "" : v); }}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select band" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__EMPTY__">—</SelectItem>
                <SelectItem value="$$">$$</SelectItem>
                <SelectItem value="$$$">$$$</SelectItem>
                <SelectItem value="$$$$">$$$$</SelectItem>
                <SelectItem value="$$$$$">$$$$$</SelectItem>
              </SelectContent>
            </Select>
          )} />
        </div>
        <div>
          <label className="block text-sm font-medium">Rating</label>
          <input type="number" step="0.1" min="0" max="5" className="w-full rounded border p-2" value={rating} onChange={(e) => setRating(e.target.value)} placeholder="e.g. 4.5" />
        </div>
        <div>
          <label className="block text-sm font-medium">Website URL</label>
          <input className="w-full rounded border p-2" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://…" />
        </div>
        <div>
          <label className="block text-sm font-medium">Affiliate URL</label>
          <input className="w-full rounded border p-2" value={affiliateUrl} onChange={(e) => setAffiliateUrl(e.target.value)} placeholder="https://…" />
        </div>
        <div>
          <label className="block text-sm font-medium">Latitude</label>
          <input className="w-full rounded border p-2" value={lat} onChange={(e) => setLat(e.target.value)} placeholder="e.g. 35.6762" />
        </div>
        <div>
          <label className="block text-sm font-medium">Longitude</label>
          <input className="w-full rounded border p-2" value={lng} onChange={(e) => setLng(e.target.value)} placeholder="e.g. 139.6503" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium">Address (JSON)</label>
          <textarea className="w-full rounded border p-2 font-mono text-xs" rows={4} value={addressText} onChange={(e) => setAddressText(e.target.value)} placeholder='{"text":"1-1 Shinjuku, Tokyo"}' />
          <div className="text-xs text-black/60 mt-1">Optional. Provide JSON (e.g., {`{"text": "…"}`})</div>
        </div>
        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium">Region</label>
            <Select value={regionId || "__EMPTY__"} onValueChange={(v) => { const val = v === "__EMPTY__" ? "" : v; setRegionId(val); setPrefectureId(""); setDivisionId(""); }}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All regions…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__EMPTY__">All regions…</SelectItem>
                {regions.map((r) => (
                  <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium">Prefecture</label>
            <Select value={prefectureId || "__EMPTY__"} onValueChange={(v) => { const val = v === "__EMPTY__" ? "" : v; setPrefectureId(val); setDivisionId(""); }}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All prefectures…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__EMPTY__">All prefectures…</SelectItem>
                {prefecturesForRegion.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Division is selected per-destination below */}
          <div className="md:col-span-1">
            <label className="block text-sm font-medium">Destination</label>
            <Select value={destinationId || "__EMPTY__"} onValueChange={(v) => setDestinationId(v === "__EMPTY__" ? "" : v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a destination…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__EMPTY__">Select a destination…</SelectItem>
                {destinationsForScope.map((d) => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium">Division (optional)</label>
            <Select value={divisionId || "__EMPTY__"} onValueChange={(v) => setDivisionId(v === "__EMPTY__" ? "" : v)}>
              <SelectTrigger className="w-full" disabled={!destinationId}>
                <SelectValue placeholder="No division (entire destination)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__EMPTY__">No division (entire destination)</SelectItem>
                {divisionsForDest.map((d) => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <ParagraphEditor value={body} onChange={setBody} label="Details (paragraphs)" />

      <div className="flex items-center gap-3">
        <Button onClick={form.handleSubmit(save)} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        {isEditing ? (
          <ConfirmDeleteButton
            title="Delete this accommodation?"
            description="This action cannot be undone. This will permanently delete the accommodation and attempt to revalidate related pages."
            triggerClassName="ml-auto"
            onConfirm={handleDelete}
          />
        ) : null}
      </div>
      </CardContent>
    </Card>
    </Form>
  );
}
