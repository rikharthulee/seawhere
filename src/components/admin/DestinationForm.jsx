"use client";
import { useEffect, useMemo, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import ConfirmDeleteButton from "@/components/admin/ConfirmDeleteButton";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import ImageUpload from "./ImageUpload";
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
  const supabase = createClientComponentClient();
  const [name, setName] = useState(initial?.name || "");
  const [slug, setSlug] = useState(initial?.slug || "");
  const [slugTouched, setSlugTouched] = useState(!!initial?.id);
  const [summary, setSummary] = useState(initial?.summary || "");
  const [body, setBody] = useState(initial?.body_richtext || null);
  const [hero, setHero] = useState(initial?.hero_image || "");
  const [thumb, setThumb] = useState(initial?.thumbnail_image || "");
  const [status, setStatus] = useState(initial?.status || "draft");
  const [credit, setCredit] = useState(initial?.credit || "");
  const [images, setImages] = useState(Array.isArray(initial?.images) ? initial.images : []);
  const [gygLocationId, setGygLocationId] = useState(initial?.gyg_location_id || "");
  const [saving, setSaving] = useState(false);
  const [assignTo, setAssignTo] = useState(initial?.division_id ? "division" : "prefecture");
  const [prefectureId, setPrefectureId] = useState(initial?.prefecture_id || "");
  const [divisionId, setDivisionId] = useState(initial?.division_id || "");
  const [prefectures, setPrefectures] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [formError, setFormError] = useState("");
  const isEditing = !!initial?.id;

  // Derived: divisions for the selected prefecture
  const divisionsForPref = useMemo(
    () => (prefectureId ? divisions.filter((d) => d.prefecture_id === prefectureId) : []),
    [divisions, prefectureId]
  );
  const hasDivisionsForPref = divisionsForPref.length > 0;

  // Sync state when switching between rows or opening the editor
  useEffect(() => {
    setName(initial?.name || "");
    setSlug(initial?.slug || "");
    setSlugTouched(!!initial?.id); // editing: don't auto-sync slug; creating: do
    setSummary(initial?.summary || "");
    setBody(initial?.body_richtext || null);
    setHero(initial?.hero_image || "");
    setThumb(initial?.thumbnail_image || "");
    setStatus(initial?.status || "draft");
    setCredit(initial?.credit || "");
    setImages(Array.isArray(initial?.images) ? initial.images : []);
    setGygLocationId(initial?.gyg_location_id || "");
    setAssignTo(initial?.division_id ? "division" : "prefecture");
    setPrefectureId(initial?.prefecture_id || "");
    setDivisionId(initial?.division_id || "");
  }, [initial]);

  // Load selection lists
  useEffect(() => {
    let cancelled = false;
    async function load() {
      // Prefer a server-backed admin endpoint to avoid client-side RLS issues
      try {
        const res = await fetch("/api/admin/meta/geo", { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          if (!cancelled) {
            setPrefectures(Array.isArray(json.prefectures) ? json.prefectures : []);
            setDivisions(Array.isArray(json.divisions) ? json.divisions : []);
            return; // done
          }
        }
      } catch {}
      // Fallback chain: Supabase client → REST public
      try {
        const { data: prefs } = await supabase
          .from("prefectures")
          .select("id,name,slug,region_id,order_index")
          .order("order_index", { ascending: true });
        if (!cancelled) setPrefectures(Array.isArray(prefs) ? prefs : []);
      } catch {}
      try {
        const { data: divs } = await supabase
          .from("divisions")
          .select("id,name,slug,prefecture_id,order_index")
          .order("order_index", { ascending: true });
        if (!cancelled) setDivisions(Array.isArray(divs) ? divs : []);
      } catch {}
      // No further fallback; admin meta + client reads should suffice
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  // If user is assigning to division but selected prefecture has no divisions, switch back to prefecture
  useEffect(() => {
    if (assignTo === "division" && (!prefectureId || !hasDivisionsForPref)) {
      setAssignTo("prefecture");
      setDivisionId("");
    }
  }, [assignTo, prefectureId, hasDivisionsForPref]);

  useEffect(() => {
    if (!slugTouched) {
      setSlug(slugify(name));
    }
  }, [name, slugTouched]);

  function onSlugInput(e) {
    const raw = e.target.value;
    const v = slugify(raw);
    setSlug(v);
    // If user clears the field, resume auto-sync; otherwise lock
    setSlugTouched(raw.length > 0);
  }

  async function save() {
    setSaving(true);
    try {
      setFormError("");
      // Basic validation
      // Always sanitize slug on save to avoid stray characters like '?' or spaces
      const baseSlug = slugify(slug || name);
      if (!name.trim()) throw new Error("Name is required");
      if (!baseSlug) throw new Error("Slug is required");
      if (assignTo === "prefecture" && !prefectureId) throw new Error("Select a prefecture");
      if (assignTo === "division") {
        if (!prefectureId) throw new Error("Select a prefecture with divisions");
        if (!hasDivisionsForPref) throw new Error("Selected prefecture has no divisions");
        if (!divisionId) throw new Error("Select a division");
      }

      // Auto-sync prefecture from division when division chosen
      let finalPrefectureId = prefectureId;
      if (assignTo === "division") {
        const div = divisions.find((d) => d.id === divisionId);
        if (div?.prefecture_id) finalPrefectureId = div.prefecture_id;
      }

      const payload = {
        name,
        slug: baseSlug,
        summary,
        body_richtext: body,
        hero_image: hero || null,
        thumbnail_image: thumb || null,
        images: Array.isArray(images) ? images : [],
        status,
        credit: credit || null,
        gyg_location_id: gygLocationId === "" ? null : String(gygLocationId),
        prefecture_id: assignTo === "prefecture" ? prefectureId : finalPrefectureId || null,
        division_id: assignTo === "division" ? divisionId : null,
      };
      let savedSlug = payload.slug;
      let res, json;
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
      // Revalidate caches
      try {
        await fetch(`/api/revalidate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tags: ["destinations", `destinations:${savedSlug}`] }),
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

  async function handleDelete() {
    if (!isEditing) return;
    const res = await fetch(`/api/admin/destinations/${initial.id}`, { method: "DELETE" });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      alert(json?.error || `Delete failed (${res.status})`);
      return;
    }
    try {
      await fetch(`/api/revalidate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: ["destinations", `destinations:${slug || initial.slug}`] }),
      });
    } catch {}
    onSaved?.();
  }

  return (
    <Card className="space-y-4">
      <CardContent>
      {formError ? (
        <div className="rounded border border-red-200 bg-red-50 text-red-800 px-3 py-2 text-sm">{formError}</div>
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
        <div className="md:col-span-2">
          <label className="block text-sm font-medium">Assign to</label>
          <div className="flex items-center gap-4 mt-1">
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="radio"
                className="h-4 w-4"
                name="assign"
                checked={assignTo === "prefecture"}
                onChange={() => setAssignTo("prefecture")}
              />
              Prefecture
            </label>
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="radio"
                className="h-4 w-4"
                name="assign"
                checked={assignTo === "division"}
                onChange={() => hasDivisionsForPref && prefectureId ? setAssignTo("division") : null}
                disabled={!prefectureId || !hasDivisionsForPref}
              />
              Division{!prefectureId ? " (select prefecture)" : !hasDivisionsForPref ? " (none available)" : ""}
            </label>
          </div>
          <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
            {assignTo === "prefecture" ? (
              <div>
                <label className="block text-sm text-black/70">Prefecture</label>
                    <Select value={prefectureId || "__EMPTY__"} onValueChange={(v) => setPrefectureId(v === "__EMPTY__" ? "" : v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a prefecture…" />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="__EMPTY__">Select a prefecture…</SelectItem>
                    {prefectures.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm text-black/70">Prefecture</label>
                  <Select value={prefectureId || "__EMPTY__"} onValueChange={(v) => setPrefectureId(v === "__EMPTY__" ? "" : v)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All prefectures…" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__EMPTY__">All prefectures…</SelectItem>
                      {prefectures.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {hasDivisionsForPref ? (
                  <div>
                    <label className="block text-sm text-black/70">Division</label>
                    <Select value={divisionId || "__EMPTY__"} onValueChange={(v) => setDivisionId(v === "__EMPTY__" ? "" : v)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a division…" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__EMPTY__">Select a division…</SelectItem>
                        {divisionsForPref.map((d) => (
                          <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="text-sm text-black/60 self-end">
                    No divisions available for this prefecture.
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        <div>
          <ImageUpload
            label="Hero image"
            value={hero}
            onChange={setHero}
            prefix={`destinations/${slug || slugify(name) || "unsorted"}`}
          />
        </div>
        <div>
          <ImageUpload
            label="Thumbnail image"
            value={thumb}
            onChange={setThumb}
            prefix={`destinations/${slug || slugify(name) || "unsorted"}`}
          />
        </div>
        <div className="md:col-span-2">
          <MultiImageUpload
            label="Gallery images"
            value={images}
            onChange={setImages}
            prefix={`destinations/${slug || slugify(name) || "unsorted"}`}
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
          <div className="text-xs text-black/60 mt-1">Used to render the GetYourGuide city widget.</div>
        </div>
      </div>

      <ParagraphEditor value={body} onChange={setBody} label="Body (paragraphs)" />

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
