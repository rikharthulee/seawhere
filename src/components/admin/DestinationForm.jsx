"use client";
import { useEffect, useMemo, useState } from "react";
import ConfirmDeleteButton from "@/components/admin/ConfirmDeleteButton";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import MultiImageUpload from "@/components/admin/MultiImageUpload";
import ParagraphEditor from "./ParagraphEditor";

function slugify(s) {
  return (s || "")
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function DestinationForm({ initial, onSaved, onCancel }) {
  const [name, setName] = useState(initial?.name || "");
  const [slug, setSlug] = useState(initial?.slug || "");
  const [slugTouched, setSlugTouched] = useState(!!initial?.id);
  const [summary, setSummary] = useState(initial?.summary || "");
  const [body, setBody] = useState(initial?.body_richtext || null);
  const [status, setStatus] = useState(initial?.status || "draft");
  const [credit, setCredit] = useState(initial?.credit || "");
  const [images, setImages] = useState(
    Array.isArray(initial?.images) ? initial.images : []
  );
  const [gygLocationId, setGygLocationId] = useState(
    initial?.gyg_location_id || ""
  );
  const [countryId, setCountryId] = useState(initial?.country_id || "");
  const [countries, setCountries] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const isEditing = !!initial?.id;

  const destinationUploadSlug =
    slug || slugify(name) || (initial?.id ? `id-${initial.id}` : "unsorted");
  const destinationUploadPrefix = `media/destinations/${destinationUploadSlug}`;

  useEffect(() => {
    setName(initial?.name || "");
    setSlug(initial?.slug || "");
    setSlugTouched(!!initial?.id);
    setSummary(initial?.summary || "");
    setBody(initial?.body_richtext || null);
    setStatus(initial?.status || "draft");
    setCredit(initial?.credit || "");
    setImages(Array.isArray(initial?.images) ? initial.images : []);
    setGygLocationId(initial?.gyg_location_id || "");
    setCountryId(initial?.country_id || "");
  }, [initial]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/admin/meta/geo", { cache: "no-store" });
        if (!res.ok) return;
        const json = await res.json();
        if (cancelled) return;
        setCountries(Array.isArray(json.countries) ? json.countries : []);
        setDestinations(Array.isArray(json.destinations) ? json.destinations : []);
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
    if (!slugTouched) {
      setSlug(slugify(name));
    }
  }, [name, slugTouched]);

  function onSlugInput(e) {
    const raw = e.target.value;
    const v = slugify(raw);
    setSlug(v);
    setSlugTouched(raw.length > 0);
  }

  async function save() {
    setSaving(true);
    try {
      setFormError("");
      const baseSlug = slugify(slug || name);
      if (!name.trim()) throw new Error("Name is required");
      if (!baseSlug) throw new Error("Slug is required");
      if (!countryId) throw new Error("Select a country");

      const normalizedImages = Array.isArray(images)
        ? images
            .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
            .filter((entry) => entry && entry.length)
        : [];

      const payload = {
        name,
        slug: baseSlug,
        summary,
        body_richtext: body,
        images: normalizedImages,
        status,
        credit: credit || null,
        gyg_location_id: gygLocationId === "" ? null : String(gygLocationId),
        country_id: countryId,
      };

      let savedSlug = payload.slug;
      let res;
      let json;
      if (isEditing) {
        res = await fetch(`/api/admin/destinations/${initial.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        json = await res.json();
        if (!res.ok) throw new Error(json?.error || `Save failed (${res.status})`);
        savedSlug = json.slug || savedSlug;
      } else {
        res = await fetch(`/api/admin/destinations`, {
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
          body: JSON.stringify({
            tags: ["destinations", `destinations:${savedSlug}`],
          }),
        });
      } catch {}
      onSaved?.();
    } catch (e) {
      console.error(e);
      setFormError(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!isEditing) return;
    const res = await fetch(`/api/admin/destinations/${initial.id}`, {
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
          tags: ["destinations", `destinations:${slug || initial.slug}`],
        }),
      });
    } catch {}
    onSaved?.();
  }

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
              onChange={onSlugInput}
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
                setParentDestinationId("");
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
          <div className="md:col-span-2">
            <MultiImageUpload
              label="Gallery images"
              value={images}
              onChange={setImages}
              prefix={destinationUploadPrefix}
            />
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
            <input
              className="w-full rounded border p-2"
              value={credit}
              onChange={(e) => setCredit(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">GYG Location ID</label>
            <input
              className="w-full rounded border p-2"
              value={gygLocationId}
              onChange={(e) => setGygLocationId(e.target.value)}
              placeholder="e.g. 193"
            />
            <div className="text-xs text-black/60 mt-1">
              Used to render the GetYourGuide city widget.
            </div>
          </div>
        </div>

        <ParagraphEditor
          value={body}
          onChange={setBody}
          label="Body (paragraphs)"
        />

        <div className="flex items-center gap-3">
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          {isEditing ? (
            <ConfirmDeleteButton
              title="Delete this destination?"
              description="This action cannot be undone. This will permanently delete the destination and attempt to revalidate related pages."
              triggerClassName="ml-auto"
              onConfirm={handleDelete}
            />
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
