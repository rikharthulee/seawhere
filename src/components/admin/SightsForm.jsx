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
  const [geocodedAddress, setGeocodedAddress] = useState(
    initial?.geocoded_address || ""
  );
  const [geocodedPlaceName, setGeocodedPlaceName] = useState(
    initial?.geocoded_place_name || ""
  );
  const [geocodePlaceId, setGeocodePlaceId] = useState(
    initial?.geocode_place_id || ""
  );
  const [geocodeSource, setGeocodeSource] = useState(
    initial?.geocode_source || ""
  );
  const [geocodeStatus, setGeocodeStatus] = useState(
    initial?.geocode_status || ""
  );
  const [geocodedAt, setGeocodedAt] = useState(
    initial?.geocoded_at || ""
  );
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
  const [geocodeLoading, setGeocodeLoading] = useState(false);
  const [geocodeMessage, setGeocodeMessage] = useState("");
  const [geocodeError, setGeocodeError] = useState("");
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
    setGeocodedAddress(initial?.geocoded_address || "");
    setGeocodedPlaceName(initial?.geocoded_place_name || "");
    setGeocodePlaceId(initial?.geocode_place_id || "");
    setGeocodeSource(initial?.geocode_source || "");
    setGeocodeStatus(initial?.geocode_status || "");
    setGeocodedAt(initial?.geocoded_at || "");
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

  const geocodeQuery = useMemo(() => {
    const parts = [];
    if (name?.trim()) parts.push(name.trim());
    const dest = destinations.find((d) => d.id === destinationId);
    if (dest?.name) parts.push(dest.name);
    const country = countries.find((c) => c.id === countryId);
    if (country?.name) parts.push(country.name);
    return parts.join(", ");
  }, [name, destinations, destinationId, countries, countryId]);

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

  async function handleResolveLocation() {
    setGeocodeLoading(true);
    setGeocodeMessage("");
    setGeocodeError("");
    try {
      if (!isEditing || !sightId) {
        throw new Error("Save the sight before resolving location.");
      }
      if (!geocodeQuery) {
        throw new Error("Add a name, destination, and country first.");
      }
      const res = await fetch(`/api/admin/sights/${sightId}/geocode`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: geocodeQuery }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.error || `Geocode failed (${res.status})`);
      }

      const sight = json?.sight || {};
      if (sight?.lat !== undefined && sight?.lat !== null) {
        setLat(String(sight.lat));
      }
      if (sight?.lng !== undefined && sight?.lng !== null) {
        setLng(String(sight.lng));
      }
      setGeocodedAddress(sight.geocoded_address || "");
      setGeocodedPlaceName(sight.geocoded_place_name || "");
      setGeocodePlaceId(sight.geocode_place_id || "");
      setGeocodeSource(sight.geocode_source || "");
      setGeocodeStatus(sight.geocode_status || json?.status || "");
      setGeocodedAt(sight.geocoded_at || "");

      if (json?.ok) {
        setGeocodeMessage(
          sight?.geocoded_address
            ? `Resolved: ${sight.geocoded_address}`
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
                {geocodeSource ? <div>Source: {geocodeSource}</div> : null}
                {geocodedAt ? <div>Last resolved: {geocodedAt}</div> : null}
                {geocodePlaceId ? <div>Place ID: {geocodePlaceId}</div> : null}
                {geocodedPlaceName ? (
                  <div>Place name: {geocodedPlaceName}</div>
                ) : null}
                {geocodedAddress ? <div>Address: {geocodedAddress}</div> : null}
              </div>
            ) : null}
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
