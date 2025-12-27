"use client";
import { useEffect, useMemo, useState } from "react";
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
  const [geocodedAddress, setGeocodedAddress] = useState(
    initial?.geocoded_address || ""
  );
  const [geocodePlaceId, setGeocodePlaceId] = useState(
    initial?.geocode_place_id || ""
  );
  const [geocodeStatus, setGeocodeStatus] = useState(
    initial?.geocode_status || ""
  );
  const [geocodedAt, setGeocodedAt] = useState(initial?.geocoded_at || "");
  const [addressText, setAddressText] = useState(
    typeof initial?.address === "string" ? initial.address : initial?.address ? JSON.stringify(initial.address) : ""
  );
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [geocodeLoading, setGeocodeLoading] = useState(false);
  const [geocodeMessage, setGeocodeMessage] = useState("");
  const [geocodeError, setGeocodeError] = useState("");
  const isEditing = !!initial?.id;

  const [countries, setCountries] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [countryId, setCountryId] = useState(initial?.country_id || "");
  const [destinationId, setDestinationId] = useState(initial?.destination_id || "");

  const accommodationUploadSlug = slug || slugify(name) || (initial?.id ? `id-${initial.id}` : "unsorted");
  const accommodationUploadPrefix = `media/accommodation/${accommodationUploadSlug}`;

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
      addressText:
        typeof initial?.address === "string" ? initial.address : initial?.address ? JSON.stringify(initial.address) : "",
    },
  });

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
    setGeocodedAddress(initial?.geocoded_address || "");
    setGeocodePlaceId(initial?.geocode_place_id || "");
    setGeocodeStatus(initial?.geocode_status || "");
    setGeocodedAt(initial?.geocoded_at || "");
    setAddressText(
      typeof initial?.address === "string" ? initial.address : initial?.address ? JSON.stringify(initial.address) : ""
    );
    setDestinationId(initial?.destination_id || "");
    setCountryId(initial?.country_id || "");
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
      addressText:
        typeof initial?.address === "string" ? initial.address : initial?.address ? JSON.stringify(initial.address) : "",
    });
  }, [initial, form]);

  useEffect(() => {
    if (!slugTouched) setSlug(slugify(name));
  }, [name, slugTouched]);

  useEffect(() => {
    form.setValue("slug", slug || "");
  }, [form, slug]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/admin/meta/geo", { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          if (!cancelled) {
            setCountries(Array.isArray(json.countries) ? json.countries : []);
            setDestinations(Array.isArray(json.destinations) ? json.destinations : []);
          }
        }
      } catch (e) {
        console.error("Failed to load geo meta", e);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!destinationId) return;
    const dest = destinations.find((d) => d.id === destinationId);
    if (dest?.country_id && dest.country_id !== countryId) {
      setCountryId(dest.country_id);
    }
  }, [destinationId, destinations, countryId]);

  const destinationsForCountry = useMemo(() => {
    return destinations.filter((d) => !countryId || d.country_id === countryId);
  }, [destinations, countryId]);

  const geocodeQuery = useMemo(() => {
    const parts = [];
    if (name?.trim()) parts.push(name.trim());
    const dest = destinations.find((d) => d.id === destinationId);
    if (dest?.name) parts.push(dest.name);
    const country = countries.find((c) => c.id === countryId);
    if (country?.name) parts.push(country.name);
    return parts.join(", ");
  }, [name, destinations, destinationId, countries, countryId]);

  function onSlugInput(e) {
    const raw = e.target.value;
    const v = slugify(raw);
    setSlug(v);
    setSlugTouched(raw.length > 0);
  }

  async function handleResolveLocation() {
    setGeocodeLoading(true);
    setGeocodeMessage("");
    setGeocodeError("");
    try {
      if (!isEditing || !initial?.id) {
        throw new Error("Save the accommodation before resolving location.");
      }
      if (!geocodeQuery) {
        throw new Error("Add a name, destination, and country first.");
      }
      const res = await fetch(
        `/api/admin/accommodation/${initial.id}/geocode`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: geocodeQuery }),
        }
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.error || `Geocode failed (${res.status})`);
      }

      const updated = json?.accommodation || {};
      if (updated?.lat !== undefined && updated?.lat !== null) {
        setLat(String(updated.lat));
        form.setValue("lat", String(updated.lat));
      }
      if (updated?.lng !== undefined && updated?.lng !== null) {
        setLng(String(updated.lng));
        form.setValue("lng", String(updated.lng));
      }
      setGeocodedAddress(updated.geocoded_address || "");
      setGeocodePlaceId(updated.geocode_place_id || "");
      setGeocodeStatus(updated.geocode_status || json?.status || "");
      setGeocodedAt(updated.geocoded_at || "");

      if (json?.ok) {
        setGeocodeMessage(
          updated?.geocoded_address
            ? `Resolved: ${updated.geocoded_address}`
            : "Resolved location."
        );
      } else {
        setGeocodeError(
          json?.error_message
            ? `${json.status}: ${json.error_message}`
            : `Geocode status: ${json.status || "Unknown"}`
        );
      }
    } catch (err) {
      setGeocodeError(err?.message || "Failed to resolve location");
    } finally {
      setGeocodeLoading(false);
    }
  }

  async function save(values) {
    const errs = {};
    if (!(values.name || "").trim()) errs.name = "Name is required";
    if (!((values.slug || "").trim())) errs.slug = "Slug is required";
    if (!values.status) errs.status = "Select a status";
    if (!countryId) errs.country = "Select a country";
    if (!destinationId) errs.destination = "Select a destination";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    try {
      const payload = {
        name: values.name,
        slug: values.slug || slugify(values.name),
        summary: values.summary || "",
        description: body,
        images: Array.isArray(images) ? images : [],
        status: values.status,
        credit: values.credit || null,
        destination_id: destinationId || null,
        country_id: countryId || null,
        price_band: values.priceBand && values.priceBand !== "__EMPTY__" ? values.priceBand : null,
        rating: values.rating === undefined ? null : Number(values.rating),
        website_url: values.websiteUrl || null,
        affiliate_url: values.affiliateUrl || null,
        lat: values.lat === undefined ? null : Number(values.lat),
        lng: values.lng === undefined ? null : Number(values.lng),
        address: values.addressText?.trim() ? values.addressText.trim() : null,
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
        if (!res.ok)
          throw new Error(json?.error || `Save failed (${res.status})`);
        savedSlug = json.slug || savedSlug;
      } else {
        res = await fetch(`/api/admin/accommodation`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        json = await res.json();
        if (!res.ok)
          throw new Error(json?.error || `Save failed (${res.status})`);
        savedSlug = json.slug || savedSlug;
      }
      try {
        await fetch(`/api/revalidate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tags: ["accommodation", `accommodation:${savedSlug}`],
          }),
        });
      } catch {}
      onSaved?.();
    } catch (e) {
      console.error(e);
      const msg = e?.message || "Save failed";
      setFormError(msg);
    } finally {
      setSaving(false);
    }
  }

  const [formError, setFormError] = useState("");

  return (
    <Card className="space-y-4">
      <CardContent>
        {formError ? (
          <div className="rounded border border-red-200 bg-red-50 text-red-800 px-3 py-2 text-sm">
            {formError}
          </div>
        ) : null}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Name</label>
            <Input value={name} onChange={(e) => { setName(e.target.value); form.setValue("name", e.target.value); }} />
            {errors.name ? (
              <div className="text-xs text-red-600 mt-1">{errors.name}</div>
            ) : null}
          </div>
          <div>
            <label className="block text-sm font-medium">Slug</label>
            <Input value={slug} onChange={(e) => { onSlugInput(e); form.setValue("slug", slugify(e.target.value)); }} />
            {errors.slug ? (
              <div className="text-xs text-red-600 mt-1">{errors.slug}</div>
            ) : null}
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium">Summary</label>
            <Textarea
              value={summary}
              onChange={(e) => { setSummary(e.target.value); form.setValue("summary", e.target.value); }}
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Country</label>
            <Select
              value={countryId || "__EMPTY__"}
              onValueChange={(v) => {
                const val = v === "__EMPTY__" ? "" : v;
                setCountryId(val);
                setDestinationId("");
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a country…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__EMPTY__">Select a country…</SelectItem>
                {countries.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.country ? (
              <div className="text-xs text-red-600 mt-1">{errors.country}</div>
            ) : null}
          </div>

          <div>
            <label className="block text-sm font-medium">Destination</label>
            <Select
              value={destinationId || "__EMPTY__"}
              onValueChange={(v) => setDestinationId(v === "__EMPTY__" ? "" : v)}
              disabled={!countryId}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={countryId ? "Select a destination…" : "Select country first"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__EMPTY__">Select a destination…</SelectItem>
                {destinationsForCountry.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.destination ? (
              <div className="text-xs text-red-600 mt-1">{errors.destination}</div>
            ) : null}
          </div>

          <div>
            <label className="block text-sm font-medium">Status</label>
            <Select value={status} onValueChange={(v) => { setStatus(v); form.setValue("status", v); }}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">draft</SelectItem>
                <SelectItem value="published">published</SelectItem>
              </SelectContent>
            </Select>
            {errors.status ? (
              <div className="text-xs text-red-600 mt-1">{errors.status}</div>
            ) : null}
          </div>
          <div>
            <label className="block text-sm font-medium">Credit</label>
            <Input value={credit} onChange={(e) => { setCredit(e.target.value); form.setValue("credit", e.target.value); }} />
          </div>
          <div>
            <label className="block text-sm font-medium">Price band</label>
            <Select value={priceBand || "__EMPTY__"} onValueChange={(v) => { setPriceBand(v); form.setValue("priceBand", v); }}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__EMPTY__">None</SelectItem>
                <SelectItem value="$$">$$</SelectItem>
                <SelectItem value="$$$">$$$</SelectItem>
                <SelectItem value="$$$$">$$$$</SelectItem>
                <SelectItem value="$$$$$">$$$$$</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium">Rating</label>
            <Input value={rating} onChange={(e) => { setRating(e.target.value); form.setValue("rating", e.target.value); }} />
          </div>
          <div>
            <label className="block text-sm font-medium">Website URL</label>
            <Input value={websiteUrl} onChange={(e) => { setWebsiteUrl(e.target.value); form.setValue("websiteUrl", e.target.value); }} />
          </div>
          <div>
            <label className="block text-sm font-medium">Affiliate URL</label>
            <Input value={affiliateUrl} onChange={(e) => { setAffiliateUrl(e.target.value); form.setValue("affiliateUrl", e.target.value); }} />
          </div>
          <div>
            <label className="block text-sm font-medium">Latitude</label>
            <Input value={lat} onChange={(e) => { setLat(e.target.value); form.setValue("lat", e.target.value); }} />
          </div>
          <div>
            <label className="block text-sm font-medium">Longitude</label>
            <Input value={lng} onChange={(e) => { setLng(e.target.value); form.setValue("lng", e.target.value); }} />
          </div>
          <div className="md:col-span-2 space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleResolveLocation}
                disabled={geocodeLoading}
              >
                {geocodeLoading ? "Resolving..." : "Resolve location"}
              </Button>
              <span className="text-xs text-muted-foreground">
                Query: {geocodeQuery || "Add name + destination + country"}
              </span>
            </div>
            {geocodeMessage ? (
              <div className="text-xs text-emerald-600">{geocodeMessage}</div>
            ) : null}
            {geocodeError ? (
              <div className="text-xs text-red-600">{geocodeError}</div>
            ) : null}
            {(geocodeStatus || geocodedAt || geocodePlaceId) ? (
              <div className="text-xs text-muted-foreground space-y-1">
                {geocodeStatus ? <div>Status: {geocodeStatus}</div> : null}
                {geocodedAt ? <div>Last resolved: {geocodedAt}</div> : null}
                {geocodePlaceId ? <div>Place ID: {geocodePlaceId}</div> : null}
                {geocodedAddress ? <div>Address: {geocodedAddress}</div> : null}
              </div>
            ) : null}
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium">Address</label>
            <Textarea
              rows={3}
              placeholder="123 Example Street, City, Country"
              value={addressText}
              onChange={(e) => { setAddressText(e.target.value); form.setValue("addressText", e.target.value); }}
            />
          </div>
        </div>

        <MultiImageUpload
          label="Gallery images"
          value={images}
          onChange={setImages}
          prefix={accommodationUploadPrefix}
        />

        <ParagraphEditor
          value={body}
          onChange={setBody}
          label="Body (paragraphs)"
        />

        <div className="flex items-center gap-3">
          <Button onClick={form.handleSubmit(save)} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          {isEditing ? (
            <ConfirmDeleteButton
              title="Delete this accommodation?"
              description="This action cannot be undone. This will permanently delete the accommodation and attempt to revalidate related pages."
              triggerClassName="ml-auto"
              onConfirm={async () => {
                const res = await fetch(`/api/admin/accommodation/${initial.id}`, {
                  method: "DELETE",
                });
                if (!res.ok) {
                  const json = await res.json().catch(() => ({}));
                  alert(json?.error || `Delete failed (${res.status})`);
                  return;
                }
                try {
                  await fetch(`/api/revalidate`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      tags: ["accommodation", `accommodation:${slug || initial.slug}`],
                    }),
                  });
                } catch {}
                onSaved?.();
              }}
            />
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
