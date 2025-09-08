"use client";
import { useEffect, useMemo, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import ImageUpload from "./ImageUpload";
import ParagraphEditor from "./ParagraphEditor";

function slugify(s) {
  return (s || "")
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function LocationForm({ initial, onSaved, onCancel }) {
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
  const [saving, setSaving] = useState(false);
  const [assignTo, setAssignTo] = useState(initial?.division_id ? "division" : "prefecture");
  const [prefectureId, setPrefectureId] = useState(initial?.prefecture_id || "");
  const [divisionId, setDivisionId] = useState(initial?.division_id || "");
  const [prefectures, setPrefectures] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [formError, setFormError] = useState("");
  const isEditing = !!initial?.id;

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
    setAssignTo(initial?.division_id ? "division" : "prefecture");
    setPrefectureId(initial?.prefecture_id || "");
    setDivisionId(initial?.division_id || "");
  }, [initial]);

  // Load selection lists
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const { data: prefs } = await supabase
          .from("prefectures")
          .select("id,name,slug,region_id,order_index")
          .order("order_index", { ascending: true });
        if (!cancelled) setPrefectures(prefs || []);
      } catch {}
      try {
        const { data: divs } = await supabase
          .from("divisions")
          .select("id,name,slug,prefecture_id,order_index")
          .order("order_index", { ascending: true });
        if (!cancelled) setDivisions(divs || []);
      } catch {}
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

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
      const baseSlug = slug || slugify(name);
      if (!name.trim()) throw new Error("Name is required");
      if (!baseSlug) throw new Error("Slug is required");
      if (assignTo === "prefecture" && !prefectureId) throw new Error("Select a prefecture");
      if (assignTo === "division" && !divisionId) throw new Error("Select a division");

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
        status,
        credit: credit || null,
        prefecture_id: assignTo === "prefecture" ? prefectureId : finalPrefectureId || null,
        division_id: assignTo === "division" ? divisionId : null,
      };
      let savedSlug = payload.slug;
      let res, json;
      if (isEditing) {
        res = await fetch(`/api/admin/locations/${initial.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        json = await res.json();
        if (!res.ok) throw new Error(json?.error || `Save failed (${res.status})`);
        savedSlug = json.slug || savedSlug;
      } else {
        res = await fetch(`/api/admin/locations`, {
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
    if (!confirm("Delete this destination? This cannot be undone.")) return;
    const res = await fetch(`/api/admin/locations/${initial.id}`, { method: "DELETE" });
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
    <div className="space-y-4 border rounded-lg p-4">
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
                onChange={() => setAssignTo("division")}
              />
              Division
            </label>
          </div>
          <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
            {assignTo === "prefecture" ? (
              <div>
                <label className="block text-sm text-black/70">Prefecture</label>
                <select
                  className="w-full rounded border p-2"
                  value={prefectureId}
                  onChange={(e) => setPrefectureId(e.target.value)}
                >
                  <option value="">Select a prefecture…</option>
                  {prefectures.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm text-black/70">Prefecture (for filtering)</label>
                  <select
                    className="w-full rounded border p-2"
                    value={prefectureId}
                    onChange={(e) => setPrefectureId(e.target.value)}
                  >
                    <option value="">All prefectures…</option>
                    {prefectures.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-black/70">Division</label>
                  <select
                    className="w-full rounded border p-2"
                    value={divisionId}
                    onChange={(e) => {
                      const v = e.target.value;
                      setDivisionId(v);
                      const div = divisions.find((d) => d.id === v);
                      if (div?.prefecture_id) setPrefectureId(div.prefecture_id);
                    }}
                  >
                    <option value="">Select a division…</option>
                    {(prefectureId
                      ? divisions.filter((d) => d.prefecture_id === prefectureId)
                      : divisions
                    ).map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>
        </div>
        <div>
          <ImageUpload label="Hero image" value={hero} onChange={setHero} />
        </div>
        <div>
          <ImageUpload label="Thumbnail image" value={thumb} onChange={setThumb} />
        </div>
        <div>
          <label className="block text-sm font-medium">Status</label>
          <select
            className="w-full rounded border p-2"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="draft">draft</option>
            <option value="published">published</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Credit</label>
          <input
            className="w-full rounded border p-2"
            value={credit}
            onChange={(e) => setCredit(e.target.value)}
          />
        </div>
      </div>

      <ParagraphEditor value={body} onChange={setBody} label="Body (paragraphs)" />

      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="rounded bg-black text-white px-4 py-2 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        <button onClick={onCancel} className="rounded border px-4 py-2">
          Cancel
        </button>
        {isEditing ? (
          <button
            onClick={handleDelete}
            className="ml-auto rounded bg-red-600 text-white px-4 py-2"
          >
            Delete
          </button>
        ) : null}
      </div>
    </div>
  );
}
