"use client";
import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import ImageUpload from "./ImageUpload";
import MultiImageUpload from "./MultiImageUpload";
import ParagraphEditor from "./ParagraphEditor";

function slugify(s) {
  return (s || "")
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function AccommodationForm({ initial, onSaved, onCancel }) {
  const supabase = createClientComponentClient();
  const [name, setName] = useState(initial?.name || "");
  const [slug, setSlug] = useState(initial?.slug || "");
  const [slugTouched, setSlugTouched] = useState(!!initial?.id);
  const [summary, setSummary] = useState(initial?.summary || "");
  const [body, setBody] = useState(initial?.description || null);
  const [hero, setHero] = useState(initial?.hero_image || "");
  const [thumb, setThumb] = useState(initial?.thumbnail_image || "");
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
  const isEditing = !!initial?.id;

  // Geo selection similar to POI form
  const [regions, setRegions] = useState([]);
  const [prefectures, setPrefectures] = useState([]);
  const [divisions, setDivisions] = useState([]);
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
    setHero(initial?.hero_image || "");
    setThumb(initial?.thumbnail_image || "");
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

  async function save() {
    setSaving(true);
    try {
      // Validate address JSON if provided
      let addressJson = null;
      if (addressText && addressText.trim().length) {
        try {
          addressJson = JSON.parse(addressText);
        } catch (e) {
          throw new Error("Address must be valid JSON or left blank");
        }
      }
      const payload = {
        name,
        slug: slug || slugify(name),
        summary,
        description: body,
        hero_image: hero || null,
        thumbnail_image: thumb || null,
        images: Array.isArray(images) ? images : [],
        status,
        credit: credit || null,
        destination_id: destinationId || null,
        prefecture_id: prefectureId || null,
        division_id: divisionId || null,
        price_band: priceBand || null,
        rating: rating === "" ? null : Number(rating),
        website_url: websiteUrl || null,
        affiliate_url: affiliateUrl || null,
        lat: lat === "" ? null : Number(lat),
        lng: lng === "" ? null : Number(lng),
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
            setDivisions(Array.isArray(json.divisions) ? json.divisions : []);
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
        const { data: prefs } = await supabase
          .from("prefectures")
          .select("id,name,slug,region_id,order_index")
          .order("order_index", { ascending: true });
        if (!cancelled && (!prefectures || prefectures.length === 0)) setPrefectures(prefs || []);
      } catch {}
      try {
        const { data: divs } = await supabase
          .from("divisions")
          .select("id,name,slug,prefecture_id,order_index")
          .order("order_index", { ascending: true });
        if (!cancelled && (!divisions || divisions.length === 0)) setDivisions(divs || []);
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

  // When editing, preselect region/pref/div based on destination
  useEffect(() => {
    if (!destinationId || destinations.length === 0 || prefectures.length === 0 || divisions.length === 0) return;
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
    if (dst.division_id) setDivisionId(dst.division_id);
  }, [destinationId, destinations, prefectures, divisions, regions]);

  const prefecturesForRegion = prefectures.filter((p) => !regionId || p.region_id === regionId);
  const divisionsForPref = divisions.filter((d) => !prefectureId || d.prefecture_id === prefectureId);
  const destinationsForScope = destinations.filter((d) => {
    if (prefectureId && d.prefecture_id !== prefectureId) return false;
    // Include both top-level destinations and those matching the selected division
    if (divisionId && d.division_id && d.division_id !== divisionId) return false;
    return true;
  });

  // Keep region in sync when prefecture changes
  useEffect(() => {
    if (!prefectureId) return;
    const pref = prefectures.find((p) => p.id === prefectureId);
    if (pref && pref.region_id && regionId !== pref.region_id) setRegionId(pref.region_id);
  }, [prefectureId, prefectures]);

  async function handleDelete() {
    if (!isEditing) return;
    if (!confirm("Delete this accommodation? This cannot be undone.")) return;
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
    <div className="space-y-4 border rounded-lg p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Name</label>
          <input className="w-full rounded border p-2" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium">Slug</label>
          <input className="w-full rounded border p-2" value={slug} onChange={onSlugInput} />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium">Summary</label>
          <textarea className="w-full rounded border p-2" rows={3} value={summary} onChange={(e) => setSummary(e.target.value)} />
        </div>
        <div>
          <ImageUpload label="Hero image" value={hero} onChange={setHero} prefix="accommodation" />
        </div>
        <div>
          <ImageUpload label="Thumbnail image" value={thumb} onChange={setThumb} prefix="accommodation" />
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
          <label className="block text-sm font-medium">Status</label>
          <select className="w-full rounded border p-2" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="draft">draft</option>
            <option value="published">published</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Credit</label>
          <input className="w-full rounded border p-2" value={credit} onChange={(e) => setCredit(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium">Price band</label>
          <select className="w-full rounded border p-2" value={priceBand} onChange={(e) => setPriceBand(e.target.value)}>
            <option value="">—</option>
            <option value="$$">$$</option>
            <option value="$$$">$$$</option>
            <option value="$$$$">$$$$</option>
            <option value="$$$$$">$$$$$</option>
          </select>
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
            <select className="w-full rounded border p-2" value={regionId} onChange={(e) => { setRegionId(e.target.value); setPrefectureId(""); setDivisionId(""); }}>
              <option value="">All regions…</option>
              {regions.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Prefecture</label>
            <select className="w-full rounded border p-2" value={prefectureId} onChange={(e) => { setPrefectureId(e.target.value); setDivisionId(""); }}>
              <option value="">All prefectures…</option>
              {prefecturesForRegion.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Division (optional)</label>
            <select className="w-full rounded border p-2" value={divisionId} onChange={(e) => setDivisionId(e.target.value)} disabled={!prefectureId}>
              <option value="">All divisions…</option>
              {divisionsForPref.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-1">
            <label className="block text-sm font-medium">Destination</label>
            <select className="w-full rounded border p-2" value={destinationId} onChange={(e) => setDestinationId(e.target.value)}>
              <option value="">Select a destination…</option>
              {destinationsForScope.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <ParagraphEditor value={body} onChange={setBody} label="Details (paragraphs)" />

      <div className="flex items-center gap-3">
        <button onClick={save} disabled={saving} className="rounded bg-black text-white px-4 py-2 disabled:opacity-60">
          {saving ? "Saving…" : "Save"}
        </button>
        <button onClick={onCancel} className="rounded border px-4 py-2">Cancel</button>
        {isEditing ? (
          <button onClick={handleDelete} className="ml-auto rounded bg-red-600 text-white px-4 py-2">Delete</button>
        ) : null}
      </div>
    </div>
  );
}
