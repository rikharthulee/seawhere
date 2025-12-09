"use client";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
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

export default function SightsForm({ id, initial, onSaved, onCancel }) {
  const isEditing = !!id;

  const [name, setName] = useState(initial?.name || "");
  const [slug, setSlug] = useState(initial?.slug || "");
  const [slugTouched, setSlugTouched] = useState(!!initial?.id);
  const [summary, setSummary] = useState(initial?.summary || "");
  const [body, setBody] = useState(initial?.body_richtext || null);
  const [images, setImages] = useState(Array.isArray(initial?.images) ? initial.images : []);
  const [countryId, setCountryId] = useState(initial?.country_id || "");
  const [destinationId, setDestinationId] = useState(initial?.destination_id || "");
  const [status, setStatus] = useState(initial?.status || "draft");
  const [lat, setLat] = useState(initial?.lat ?? "");
  const [lng, setLng] = useState(initial?.lng ?? "");
  const [tags, setTags] = useState(Array.isArray(initial?.tags) ? initial.tags : []);
  const [durationMinutes, setDurationMinutes] = useState(initial?.duration_minutes ?? "");
  const [provider, setProvider] = useState(initial?.provider || "internal");
  const [deeplink, setDeeplink] = useState(initial?.deeplink || "");
  const [gygId, setGygId] = useState(initial?.gyg_id || "");
  const [priceAmount, setPriceAmount] = useState(initial?.price_amount ?? "");
  const [priceCurrency, setPriceCurrency] = useState(initial?.price_currency || "USD");
  const [admissionFee, setAdmissionFee] = useState(initial?.admission_fee_richtext || null);
  const [openingTimesText, setOpeningTimesText] = useState(initial?.opening_times_richtext || null);

  const [countries, setCountries] = useState([]);
  const [destinations, setDestinations] = useState([]);

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const openingTimesRef = useRef(null);
  const admissionRef = useRef(null);

  const sightId = id || initial?.id || null;

  // Ensure anything we pass to client children is plain JSON (no Date/Map/URL/classes)
  const toPlain = useCallback((x) => {
    try {
      return JSON.parse(JSON.stringify(x));
    } catch {
      return x;
    }
  }, []);

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
    setName(initial?.name || "");
    setSlug(initial?.slug || "");
    setSlugTouched(!!initial?.id);
    setSummary(initial?.summary || "");
    setBody(initial?.body_richtext || null);
    setImages(Array.isArray(initial?.images) ? initial.images : []);
    setDestinationId(initial?.destination_id || "");
    setCountryId(initial?.country_id || "");
    setStatus(initial?.status || "draft");
    setLat(initial?.lat ?? "");
    setLng(initial?.lng ?? "");
    setTags(Array.isArray(initial?.tags) ? initial.tags : []);
    setDurationMinutes(initial?.duration_minutes ?? "");
    setProvider(initial?.provider || "internal");
    setDeeplink(initial?.deeplink || "");
    setGygId(initial?.gyg_id || "");
    setPriceAmount(initial?.price_amount ?? "");
    setPriceCurrency(initial?.price_currency || "USD");
    setAdmissionFee(initial?.admission_fee_richtext || null);
    setOpeningTimesText(initial?.opening_times_richtext || null);
  }, [initial]);

  useEffect(() => {
    if (!destinationId) return;
    const dest = destinations.find((d) => d.id === destinationId);
    if (dest?.country_id && dest.country_id !== countryId) {
      setCountryId(dest.country_id);
    }
  }, [destinationId, destinations, countryId]);

  const filteredDestinations = useMemo(
    () => destinations.filter((d) => !countryId || d.country_id === countryId),
    [destinations, countryId]
  );

  const destSlugForUpload = useMemo(() => {
    const d = destinations.find((x) => x.id === destinationId);
    return d?.slug || "unsorted";
  }, [destinations, destinationId]);

  const sightUploadSlug = slugify(slug || name) || (initial?.id ? `id-${initial.id}` : "unsorted");
  const sightUploadPrefix = `media/sights/${destSlugForUpload || "unsorted"}/${sightUploadSlug}`;

  async function save() {
    setSaving(true);
    setFormError("");
    try {
      if (!name.trim()) throw new Error("Name is required");
      const finalSlug = slugify(slug || name);
      if (!finalSlug) throw new Error("Slug is required");
      if (!countryId) throw new Error("Select a country");
      if (!destinationId) throw new Error("Select a destination");
      const payload = {
        name,
        slug: finalSlug,
        summary,
        body_richtext: body,
        images: Array.isArray(images) ? images : [],
        country_id: countryId,
        destination_id: destinationId,
        status,
        lat: lat === "" ? null : Number(lat),
        lng: lng === "" ? null : Number(lng),
        tags: Array.isArray(tags)
          ? tags
              .map((t) => (typeof t === "string" ? t.trim() : ""))
              .filter(Boolean)
          : [],
        duration_minutes: durationMinutes === "" ? null : Number(durationMinutes),
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
        json?.id || json?.sight?.id || json?.data?.id || id || initial?.id || null;

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
                {filteredDestinations.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
          <div>
            <label className="block text-sm font-medium">Tags (comma separated)</label>
            <input
              className="w-full rounded border p-2"
              value={(tags || []).join(",")}
              onChange={(e) =>
                setTags(
                  e.target.value
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean)
                )
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Duration (minutes)</label>
            <input
              className="w-full rounded border p-2"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Provider</label>
            <input
              className="w-full rounded border p-2"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Deeplink</label>
            <input
              className="w-full rounded border p-2"
              value={deeplink}
              onChange={(e) => setDeeplink(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">GYG ID</label>
            <input
              className="w-full rounded border p-2"
              value={gygId}
              onChange={(e) => setGygId(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Price amount</label>
            <input
              className="w-full rounded border p-2"
              value={priceAmount}
              onChange={(e) => setPriceAmount(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Currency</label>
            <input
              className="w-full rounded border p-2"
              value={priceCurrency}
              onChange={(e) => setPriceCurrency(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Latitude</label>
            <input
              className="w-full rounded border p-2"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Longitude</label>
            <input
              className="w-full rounded border p-2"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
            />
          </div>
        </div>

        <MultiImageUpload
          label="Images"
          value={images}
          onChange={setImages}
          prefix={sightUploadPrefix}
        />

        <RichTextEditor value={body} onChange={setBody} label="Body" />

        <OpeningTimes
          ref={openingTimesRef}
          sightId={sightId}
          initial={toPlain(initial?.openingTimes)}
          openingTimesRichText={openingTimesText}
          onOpeningTimesRichTextChange={setOpeningTimesText}
        />

        <AdmissionEditor
          ref={admissionRef}
          sightId={sightId}
          initialRows={admissionRowsPlain}
          admissionRichText={admissionFee}
          onAdmissionRichTextChange={setAdmissionFee}
        />

        <div className="flex items-center gap-3">
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving…" : isEditing ? "Save" : "Create"}
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          {isEditing ? (
            <ConfirmDeleteButton
              title="Delete this sight?"
              description="This action cannot be undone."
              triggerClassName="ml-auto"
              onConfirm={handleDelete}
            />
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
