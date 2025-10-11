"use client";
import { useEffect, useMemo, useState, useRef } from "react";
import MultiImageUpload from "./MultiImageUpload";
import ConfirmDeleteButton from "@/components/admin/ConfirmDeleteButton";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import ParagraphEditor from "./ParagraphEditor";
import { Input } from "@/components/ui/input";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  normalizePrefectureShape,
  sortGeoRows,
  shouldUseGeoViews,
} from "@/lib/geo-normalize";
import { createClient } from "@/lib/supabase/client";

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

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().optional(),
  status: z.enum(["draft", "published"]).optional(),
  type: z.enum(["restaurant", "bar", "cafe", "other"], { required_error: "Select a type" }),
  priceBand: z.enum(["__EMPTY__", "$", "$$", "$$$", "$$$$"]).optional(),
  bookingUrl: urlOrEmpty,
  address: z.string().optional(),
  rating: numberFromString,
});

export default function FoodDrinkForm({ initial, onSaved, onCancel }) {
  const useGeoViews = shouldUseGeoViews();
  const supabase = useMemo(() => createClient(), []);
  const isEditing = !!initial?.id;

  const [name, setName] = useState(initial?.name || "");
  const [slug, setSlug] = useState(initial?.slug || "");
  const [slugTouched, setSlugTouched] = useState(!!initial?.id);
  const [status, setStatus] = useState(initial?.status || "draft");
  const [type, setType] = useState(initial?.type || "restaurant");
  const [priceBand, setPriceBand] = useState(initial?.price_band || "");
  const [bookingUrl, setBookingUrl] = useState(initial?.booking_url || "");
  const [address, setAddress] = useState(initial?.address || "");
  const [rating, setRating] = useState(initial?.rating ?? "");
  const [images, setImages] = useState(Array.isArray(initial?.images) ? initial.images : []);
  const [body, setBody] = useState(initial?.description || null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const foodDrinkUploadSlug =
    slug ||
    slugify(name) ||
    (initial?.id ? `id-${initial.id}` : "unsorted");
  const foodDrinkUploadPrefix = `media/food_drink/${foodDrinkUploadSlug}`;

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initial?.name || "",
      slug: initial?.slug || "",
      status: initial?.status || "active",
      type: initial?.type || "restaurant",
      priceBand: (initial?.price_band || "") || "__EMPTY__",
      bookingUrl: initial?.booking_url || "",
      address: initial?.address || "",
      rating: initial?.rating?.toString?.() ?? "",
    },
  });

  // Geo selection
  const [regions, setRegions] = useState([]);
  const [prefectures, setPrefectures] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [divisionsForDest, setDivisionsForDest] = useState([]);

  const [regionId, setRegionId] = useState("");
  const [prefectureId, setPrefectureId] = useState("");
  const [destinationId, setDestinationId] = useState(initial?.destination_id || "");
  const [divisionId, setDivisionId] = useState(initial?.division_id || "");

  useEffect(() => {
    setName(initial?.name || "");
    setSlug(initial?.slug || "");
    setSlugTouched(!!initial?.id);
    setStatus(initial?.status || "draft");
    setType(initial?.type || "restaurant");
    setPriceBand(initial?.price_band || "");
    setBookingUrl(initial?.booking_url || "");
    setAddress(initial?.address || "");
    setRating(initial?.rating ?? "");
    setImages(Array.isArray(initial?.images) ? initial.images : []);
    setBody(initial?.description || null);
    setDestinationId(initial?.destination_id || "");
    setPrefectureId(initial?.prefecture_id || "");
    setDivisionId(initial?.division_id || "");
    form.reset({
      name: initial?.name || "",
      slug: initial?.slug || "",
      status: initial?.status || "draft",
      type: initial?.type || "restaurant",
      priceBand: (initial?.price_band || "") || "__EMPTY__",
      bookingUrl: initial?.booking_url || "",
      address: initial?.address || "",
      rating: initial?.rating?.toString?.() ?? "",
    });
  }, [initial]);

  useEffect(() => {
    if (!slugTouched) {
      const s = slugify(name);
      setSlug(s);
      try {
        // keep the form field in sync so the input shows the auto-slug
        form.setValue("slug", s, { shouldDirty: true, shouldValidate: false });
      } catch {}
    }
  }, [name, slugTouched]);

  function slugify(s) {
    return (s || "")
      .toLowerCase()
      .trim()
      .replace(/['"]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function onSlugInput(e) {
    const raw = e.target.value;
    const v = slugify(raw);
    setSlug(v);
    setSlugTouched(raw.length > 0);
  }

  // Load geo lists
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

  // Preselect region/prefecture based on destination
  useEffect(() => {
    if (!destinationId || destinations.length === 0 || prefectures.length === 0) return;
    if (prefectureId || regionId) return;
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

  // Fetch divisions via RPC
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
    const res = await fetch(`/api/admin/food-drink/${initial.id}`, { method: "DELETE" });
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
    onSaved?.();
  }

  async function save(values) {
    const errs = {};
    if (!(values.name || "").trim()) errs.name = "Name is required";
    if (!((values.slug || "").trim())) errs.slug = "Slug is required";
    if (!values.type) errs.type = "Select a type";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    try {
      const payload = {
        name: values.name,
        slug: (values.slug || slugify(values.name)),
        status: values.status || "draft",
        type: values.type,
        price_band: values.priceBand && values.priceBand !== "__EMPTY__" ? values.priceBand : null,
        booking_url: values.bookingUrl || null,
        address: values.address || null,
        description: body,
        images: Array.isArray(images) ? images : [],
        rating: values.rating === undefined ? null : Number(values.rating),
        destination_id: destinationId || null,
        division_id: divisionId || null,
      };
      let res, json;
      if (isEditing) {
        res = await fetch(`/api/admin/food-drink/${initial.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        json = await res.json();
        if (!res.ok) throw new Error(json?.error || `Save failed (${res.status})`);
      } else {
        res = await fetch(`/api/admin/food-drink`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        json = await res.json();
        if (!res.ok) throw new Error(json?.error || `Save failed (${res.status})`);
      }
      try {
        await fetch(`/api/revalidate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tags: ["food_drink"] }),
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
            <div>
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select value={field.value} onValueChange={(v) => { field.onChange(v); setType(v); }}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a type…" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="restaurant">Restaurant</SelectItem>
                        <SelectItem value="bar">Bar</SelectItem>
                        <SelectItem value="cafe">Café</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div>
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select value={field.value} onValueChange={(v) => { field.onChange(v); setStatus(v); }}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">draft</SelectItem>
                    <SelectItem value="published">published</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
                )}
              />
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
                    <SelectItem value="$">$</SelectItem>
                    <SelectItem value="$$">$$</SelectItem>
                    <SelectItem value="$$$">$$$</SelectItem>
                    <SelectItem value="$$$$">$$$$</SelectItem>
                  </SelectContent>
                </Select>
              )} />
            </div>
            <div className="md:col-span-2">
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input {...field} onChange={(e) => { field.onChange(e.target.value); setAddress(e.target.value); }} placeholder="e.g. 1-1 Shinjuku, Tokyo" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div>
              <FormField
                control={form.control}
                name="rating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rating</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" min="0" max="5" {...field} onChange={(e) => { field.onChange(e.target.value); setRating(e.target.value); }} placeholder="0–5" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div>
              <FormField
                control={form.control}
                name="bookingUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Booking URL</FormLabel>
                    <FormControl>
                      <Input {...field} onChange={(e) => { field.onChange(e.target.value); setBookingUrl(e.target.value); }} placeholder="https://…" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium">Destination</label>
              <Select value={destinationId || "__EMPTY__"} onValueChange={(v) => setDestinationId(v === "__EMPTY__" ? "" : v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a destination…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__EMPTY__">Select a destination…</SelectItem>
                  {destinations
                    .filter((d) => !prefectureId || d.prefecture_id === prefectureId)
                    .map((d) => (
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

          <ParagraphEditor value={body} onChange={setBody} label="Details (paragraphs)" />

          <div className="md:col-span-2">
            <MultiImageUpload
              label="Gallery images"
              value={images}
              onChange={setImages}
              prefix={foodDrinkUploadPrefix}
            />
          </div>

          <div className="flex items-center gap-3 mt-4">
            <Button onClick={form.handleSubmit(save)} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
            <Button variant="outline" onClick={onCancel}>Cancel</Button>
            {isEditing ? (
              <ConfirmDeleteButton
                title="Delete this place?"
                description="This action cannot be undone. This will permanently delete the item and attempt to revalidate related pages."
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
