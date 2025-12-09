"use client";
import { useEffect, useMemo, useState } from "react";
import MultiImageUpload from "./MultiImageUpload";
import ConfirmDeleteButton from "@/components/admin/ConfirmDeleteButton";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

function slugify(s) {
  return (s || "")
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function FoodDrinkForm({ initial, onSaved, onCancel }) {
  const isEditing = !!initial?.id;
  const [name, setName] = useState(initial?.name || "");
  const [slug, setSlug] = useState(initial?.slug || "");
  const [slugTouched, setSlugTouched] = useState(!!initial?.id);
  const [summary, setSummary] = useState(initial?.description || "");
  const [images, setImages] = useState(Array.isArray(initial?.images) ? initial.images : []);
  const [status, setStatus] = useState(initial?.status || "draft");
  const [type, setType] = useState(initial?.type || "restaurant");
  const [priceBand, setPriceBand] = useState(initial?.price_band || "");
  const [rating, setRating] = useState(initial?.rating ?? "");
  const [bookingUrl, setBookingUrl] = useState(initial?.booking_url || "");
  const [addressText, setAddressText] = useState(initial?.address ? JSON.stringify(initial.address, null, 2) : "");
  const [destinationId, setDestinationId] = useState(initial?.destination_id || "");
  const [countryId, setCountryId] = useState(initial?.country_id || "");
  const [tags, setTags] = useState(Array.isArray(initial?.tags) ? initial.tags : []);
  const [countries, setCountries] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

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
    setSummary(initial?.description || "");
    setImages(Array.isArray(initial?.images) ? initial.images : []);
    setStatus(initial?.status || "draft");
    setType(initial?.type || "restaurant");
    setPriceBand(initial?.price_band || "");
    setRating(initial?.rating ?? "");
    setBookingUrl(initial?.booking_url || "");
    setAddressText(initial?.address ? JSON.stringify(initial.address, null, 2) : "");
    setDestinationId(initial?.destination_id || "");
    setCountryId(initial?.country_id || "");
    setTags(Array.isArray(initial?.tags) ? initial.tags : []);
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

  async function save() {
    try {
      setFormError("");
      if (!name.trim()) throw new Error("Name is required");
      const finalSlug = slugify(slug || name);
      if (!finalSlug) throw new Error("Slug is required");
      if (!countryId) throw new Error("Select a country");
      if (!destinationId) throw new Error("Select a destination");

      let addressJson = null;
      if (addressText && addressText.trim()) {
        try {
          addressJson = JSON.parse(addressText);
        } catch (e) {
          throw new Error("Address must be valid JSON or empty");
        }
      }

      const payload = {
        name,
        slug: finalSlug,
        description: summary,
        images: Array.isArray(images) ? images : [],
        status,
        type,
        price_band: priceBand || null,
        rating: rating === "" ? null : Number(rating),
        booking_url: bookingUrl || null,
        address: addressJson,
        destination_id: destinationId,
        country_id: countryId,
        tags: Array.isArray(tags) ? tags : [],
      };

      const res = await fetch(isEditing ? `/api/admin/food-drink/${initial.id}` : "/api/admin/food-drink", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || `Save failed (${res.status})`);
      onSaved?.();
    } catch (e) {
      console.error(e);
      setFormError(e?.message || "Save failed");
    }
  }

  return (
    <Card>
      <CardContent className="space-y-4">
        {formError ? (
          <div className="rounded border border-red-200 bg-red-50 text-red-800 px-3 py-2 text-sm">
            {formError}
          </div>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium">Slug</label>
            <Input value={slug} onChange={(e) => { setSlug(e.target.value); setSlugTouched(true); }} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium">Description</label>
            <Textarea rows={4} value={summary} onChange={(e) => setSummary(e.target.value)} />
          </div>

          <div>
            <label className="block text-sm font-medium">Country</label>
            <Select
              value={countryId || "__EMPTY__"}
              onValueChange={(v) => { const val = v === "__EMPTY__" ? "" : v; setCountryId(val); setDestinationId(""); }}
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
            <label className="block text-sm font-medium">Type</label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="restaurant">restaurant</SelectItem>
                <SelectItem value="bar">bar</SelectItem>
                <SelectItem value="cafe">cafe</SelectItem>
                <SelectItem value="other">other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium">Price band</label>
            <Select value={priceBand || "__EMPTY__"} onValueChange={setPriceBand}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__EMPTY__">None</SelectItem>
                <SelectItem value="$">$</SelectItem>
                <SelectItem value="$$">$$</SelectItem>
                <SelectItem value="$$$">$$$</SelectItem>
                <SelectItem value="$$$$">$$$$</SelectItem>
                <SelectItem value="$$$$$">$$$$$</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium">Rating</label>
            <Input value={rating} onChange={(e) => setRating(e.target.value)} />
          </div>

          <div>
            <label className="block text-sm font-medium">Booking URL</label>
            <Input value={bookingUrl} onChange={(e) => setBookingUrl(e.target.value)} />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium">Address JSON</label>
            <Textarea rows={4} value={addressText} onChange={(e) => setAddressText(e.target.value)} />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium">Tags (comma separated)</label>
            <Input
              value={(tags || []).join(",")}
              onChange={(e) => setTags(e.target.value.split(",").map((t) => t.trim()).filter(Boolean))}
            />
          </div>
        </div>

        <MultiImageUpload
          label="Images"
          value={images}
          onChange={setImages}
          prefix={`media/food-drink/${slug || slugify(name) || "unsorted"}`}
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
              title="Delete this entry?"
              description="This action cannot be undone."
              triggerClassName="ml-auto"
              onConfirm={async () => {
                const res = await fetch(`/api/admin/food-drink/${initial.id}`, { method: "DELETE" });
                if (!res.ok) {
                  const json = await res.json().catch(() => ({}));
                  alert(json?.error || `Delete failed (${res.status})`);
                  return;
                }
                onSaved?.();
              }}
            />
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
