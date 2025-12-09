"use client";
import { useEffect, useMemo, useState } from "react";
import MultiImageUpload from "./MultiImageUpload";
import ConfirmDeleteButton from "@/components/admin/ConfirmDeleteButton";
import RichTextEditor from "./RichTextEditor";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

function slugify(s) {
  return (s || "")
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function ToursForm({ id, initial, onSaved, onCancel }) {
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
  const [durationMinutes, setDurationMinutes] = useState(initial?.duration_minutes ?? "");
  const [provider, setProvider] = useState(initial?.provider || "internal");
  const [deeplink, setDeeplink] = useState(initial?.deeplink || "");
  const [gygId, setGygId] = useState(initial?.gyg_id || "");
  const [priceAmount, setPriceAmount] = useState(initial?.price_amount ?? "");
  const [priceCurrency, setPriceCurrency] = useState(initial?.price_currency || "USD");
  const [tags, setTags] = useState(Array.isArray(initial?.tags) ? initial.tags : []);
  const [rules, setRules] = useState(Array.isArray(initial?.rules) ? initial.rules : []);
  const [exceptions, setExceptions] = useState(Array.isArray(initial?.exceptions) ? initial.exceptions : []);

  const [countries, setCountries] = useState([]);
  const [destinations, setDestinations] = useState([]);
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
    setSlug(initial?.slug || "");
    setName(initial?.name || "");
    setSummary(initial?.summary || "");
    setBody(initial?.body_richtext || null);
    setImages(Array.isArray(initial?.images) ? initial.images : []);
    setDestinationId(initial?.destination_id || "");
    setCountryId(initial?.country_id || "");
    setStatus(initial?.status || "draft");
    setLat(initial?.lat ?? "");
    setLng(initial?.lng ?? "");
    setDurationMinutes(initial?.duration_minutes ?? "");
    setProvider(initial?.provider || "internal");
    setDeeplink(initial?.deeplink || "");
    setGygId(initial?.gyg_id || "");
    setPriceAmount(initial?.price_amount ?? "");
    setPriceCurrency(initial?.price_currency || "USD");
    setTags(Array.isArray(initial?.tags) ? initial.tags : []);
    setRules(Array.isArray(initial?.rules) ? initial.rules : []);
    setExceptions(Array.isArray(initial?.exceptions) ? initial.exceptions : []);
  }, [initial]);

  // Keep country in sync with selected destination
  useEffect(() => {
    if (!destinationId) return;
    const dest = destinations.find((d) => d.id === destinationId);
    if (dest?.country_id && dest.country_id !== countryId) {
      setCountryId(dest.country_id);
    }
  }, [destinationId, destinations, countryId]);

  const filteredDestinations = useMemo(() => {
    return destinations.filter((d) => !countryId || d.country_id === countryId);
  }, [destinations, countryId]);

  const destSlugForUpload = useMemo(() => {
    const d = destinations.find((x) => x.id === destinationId);
    return d?.slug || "unsorted";
  }, [destinations, destinationId]);

  const tourUploadSlug = slugify(slug || name) || (initial?.id ? `id-${initial.id}` : "unsorted");
  const tourUploadPrefix = `media/tours/${destSlugForUpload || "unsorted"}/${tourUploadSlug}`;

  function addRule() {
    setRules([...(rules || []), { days_of_week: [0], start_times: ["09:00"], valid_from: "", valid_to: "", timezone: "Asia/Bangkok" }]);
  }
  function updRule(i, patch) {
    setRules((rules || []).map((h, idx) => (idx === i ? { ...h, ...patch } : h)));
  }
  function delRule(i) {
    setRules((rules || []).filter((_, idx) => idx !== i));
  }

  function addException() {
    setExceptions([...(exceptions || []), { date: "", action: "cancel", start_time: "", note: "" }]);
  }
  function updException(i, patch) {
    setExceptions((exceptions || []).map((e, idx) => (idx === i ? { ...e, ...patch } : e)));
  }
  function delException(i) {
    setExceptions((exceptions || []).filter((_, idx) => idx !== i));
  }

  async function save() {
    try {
      setFormError("");
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
        duration_minutes: durationMinutes === "" ? null : Number(durationMinutes),
        provider,
        deeplink: deeplink || null,
        gyg_id: gygId || null,
        price_amount: priceAmount === "" ? null : Number(priceAmount),
        price_currency: priceCurrency || "USD",
        tags: Array.isArray(tags) ? tags : [],
        rules,
        exceptions,
      };

      let savedSlug = payload.slug;
      let res;
      let json;
      if (isEditing) {
        res = await fetch(`/api/admin/tours/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`/api/admin/tours`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      json = await res.json();
      if (!res.ok) throw new Error(json?.error || `Save failed (${res.status})`);
      savedSlug = json.slug || savedSlug;

      try {
        await fetch(`/api/revalidate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tags: ["tours", `tours:${savedSlug}`] }),
        });
      } catch {}
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
            <input className="w-full rounded border p-2" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium">Slug</label>
            <input className="w-full rounded border p-2" value={slug} onChange={(e) => { setSlug(e.target.value); setSlugTouched(true); }} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium">Summary</label>
            <textarea className="w-full rounded border p-2" rows={3} value={summary} onChange={(e) => setSummary(e.target.value)} />
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
            <label className="block text-sm font-medium">Credit</label>
            <input className="w-full rounded border p-2" value={provider} onChange={(e) => setProvider(e.target.value)} />
          </div>

          <div>
            <label className="block text-sm font-medium">Latitude</label>
            <input className="w-full rounded border p-2" value={lat} onChange={(e) => setLat(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium">Longitude</label>
            <input className="w-full rounded border p-2" value={lng} onChange={(e) => setLng(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium">Duration (minutes)</label>
            <input className="w-full rounded border p-2" value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium">Provider</label>
            <input className="w-full rounded border p-2" value={provider} onChange={(e) => setProvider(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium">Deeplink</label>
            <input className="w-full rounded border p-2" value={deeplink} onChange={(e) => setDeeplink(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium">GYG ID</label>
            <input className="w-full rounded border p-2" value={gygId} onChange={(e) => setGygId(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium">Price amount</label>
            <input className="w-full rounded border p-2" value={priceAmount} onChange={(e) => setPriceAmount(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium">Currency</label>
            <input className="w-full rounded border p-2" value={priceCurrency} onChange={(e) => setPriceCurrency(e.target.value)} />
          </div>
        </div>

        <MultiImageUpload label="Images" value={images} onChange={setImages} prefix={tourUploadPrefix} />

        <RichTextEditor value={body} onChange={setBody} label="Body" />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Availability rules</h3>
            <Button size="sm" variant="outline" onClick={addRule}>Add rule</Button>
          </div>
          <div className="space-y-3">
            {(rules || []).map((rule, idx) => (
              <Card key={idx}>
                <CardContent className="space-y-2 p-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-muted-foreground">Days of week</label>
                      <input
                        className="w-full rounded border p-2"
                        value={(rule.days_of_week || []).join(",")}
                        onChange={(e) => updRule(idx, { days_of_week: e.target.value.split(",").map((v) => Number(v.trim())).filter((n) => Number.isInteger(n)) })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground">Start times (HH:MM, comma separated)</label>
                      <input
                        className="w-full rounded border p-2"
                        value={(rule.start_times || []).join(",")}
                        onChange={(e) => updRule(idx, { start_times: e.target.value.split(",").map((v) => v.trim()).filter(Boolean) })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground">Valid from</label>
                      <input className="w-full rounded border p-2" value={rule.valid_from || ""} onChange={(e) => updRule(idx, { valid_from: e.target.value || null })} />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground">Valid to</label>
                      <input className="w-full rounded border p-2" value={rule.valid_to || ""} onChange={(e) => updRule(idx, { valid_to: e.target.value || null })} />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground">Timezone</label>
                      <input className="w-full rounded border p-2" value={rule.timezone || ""} onChange={(e) => updRule(idx, { timezone: e.target.value })} />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button size="sm" variant="destructive" onClick={() => delRule(idx)}>
                      Delete rule
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Exceptions</h3>
            <Button size="sm" variant="outline" onClick={addException}>Add exception</Button>
          </div>
          <div className="space-y-3">
            {(exceptions || []).map((exc, idx) => (
              <Card key={idx}>
                <CardContent className="space-y-2 p-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-muted-foreground">Date</label>
                      <input className="w-full rounded border p-2" value={exc.date || ""} onChange={(e) => updException(idx, { date: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground">Action</label>
                      <Select value={exc.action || "cancel"} onValueChange={(v) => updException(idx, { action: v })}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cancel">cancel</SelectItem>
                          <SelectItem value="add">add</SelectItem>
                          <SelectItem value="modify">modify</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground">Start time</label>
                      <input className="w-full rounded border p-2" value={exc.start_time || ""} onChange={(e) => updException(idx, { start_time: e.target.value })} />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs text-muted-foreground">Note</label>
                      <textarea className="w-full rounded border p-2" rows={2} value={exc.note || ""} onChange={(e) => updException(idx, { note: e.target.value })} />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button size="sm" variant="destructive" onClick={() => delException(idx)}>
                      Delete exception
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={save}>{isEditing ? "Save" : "Create"}</Button>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          {isEditing ? (
            <ConfirmDeleteButton
              title="Delete this tour?"
              description="This action cannot be undone."
              triggerClassName="ml-auto"
              onConfirm={async () => {
                const res = await fetch(`/api/admin/tours/${id}`, { method: "DELETE" });
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
