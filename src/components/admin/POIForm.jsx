"use client";
import { useEffect, useMemo, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import ImageUpload from "./ImageUpload";
import RichTextEditor from "./RichTextEditor";

const POI_TYPES = [
  "sight",
  "food",
  "tour",
  "experience",
  "transport",
  "other",
];

export default function POIForm({ id, initial, onSaved, onCancel }) {
  const supabase = createClientComponentClient();
  const isEditing = !!id;

  // Core fields
  const [type, setType] = useState(initial?.type || "sight");
  const [title, setTitle] = useState(initial?.title || "");
  const [summary, setSummary] = useState(initial?.summary || "");
  const [details, setDetails] = useState(initial?.details || null);
  const [destinationId, setDestinationId] = useState(initial?.destination_id || "");
  const [status, setStatus] = useState(initial?.status || "draft");
  const [lat, setLat] = useState(initial?.lat ?? "");
  const [lng, setLng] = useState(initial?.lng ?? "");
  const [image, setImage] = useState(initial?.image || "");
  const [provider, setProvider] = useState(initial?.provider || "internal");
  const [deeplink, setDeeplink] = useState(initial?.deeplink || "");
  const [durationMinutes, setDurationMinutes] = useState(initial?.duration_minutes ?? "");
  const [priceGBP, setPriceGBP] = useState(initial?.price?.gbp ?? "");
  const [priceUSD, setPriceUSD] = useState(initial?.price?.usd ?? "");
  const [priceJPY, setPriceJPY] = useState(initial?.price?.jpy ?? "");

  // Opening hours (simple array editor; defaults handled by DB trigger)
  const [rules, setRules] = useState(Array.isArray(initial?.opening_rules) ? initial.opening_rules : []);
  const [exceptions, setExceptions] = useState(Array.isArray(initial?.opening_exceptions) ? initial.opening_exceptions : []);

  // Geo hierarchies
  const [regions, setRegions] = useState([]);
  const [prefectures, setPrefectures] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [destinations, setDestinations] = useState([]);

  const [regionId, setRegionId] = useState("");
  const [prefectureId, setPrefectureId] = useState("");
  const [divisionId, setDivisionId] = useState("");

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Load geo data; prefer server-backed admin endpoint for reliability
  useEffect(() => {
    let cancelled = false;
    async function load() {
      // Try server meta endpoint first (avoids any client-side RLS hiccups)
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
      } catch (_) {}
      // Prefer server destinations list too
      try {
        const res = await fetch("/api/admin/meta/destinations", { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          if (!cancelled) setDestinations(Array.isArray(json.items) ? json.items : []);
        }
      } catch (_) {}

      // Fallback to client-side Supabase reads
      try {
        const { data: r } = await supabase.from("regions").select("id,name,slug,order_index").order("order_index", { ascending: true });
        if (!cancelled) setRegions(r || []);
      } catch {}
      try {
        const { data: p } = await supabase.from("prefectures").select("id,name,slug,region_id,order_index").order("order_index", { ascending: true });
        if (!cancelled) setPrefectures(p || []);
      } catch {}
      try {
        const { data: d } = await supabase.from("divisions").select("id,name,slug,prefecture_id,order_index").order("order_index", { ascending: true });
        if (!cancelled) setDivisions(d || []);
      } catch {}
      try {
        const { data: dst } = await supabase
          .from("destinations")
          .select("id,name,slug,prefecture_id,division_id,status")
          .order("name", { ascending: true });
        if (!cancelled && (!Array.isArray(destinations) || destinations.length === 0)) setDestinations(dst || []);
      } catch {}
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  // If editing and opening data not provided, fetch once
  useEffect(() => {
    let cancelled = false;
    async function primeOpenings() {
      if (!id) return;
      if ((rules && rules.length) || (exceptions && exceptions.length)) return;
      try {
        const res = await fetch(`/api/admin/pois/${id}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || `Load failed (${res.status})`);
        if (!cancelled) {
          setRules(Array.isArray(json.rules) ? json.rules : []);
          setExceptions(Array.isArray(json.exceptions) ? json.exceptions : []);
          // Also hydrate any missing core fields if initial was sparse
          if (!initial) {
            setType(json.poi?.type || "sight");
            setTitle(json.poi?.title || "");
            setSummary(json.poi?.summary || "");
            setDetails(json.poi?.details || null);
            setDurationMinutes(json.poi?.duration_minutes ?? "");
            setPriceGBP(json.poi?.price?.gbp ?? "");
            setPriceUSD(json.poi?.price?.usd ?? "");
            setPriceJPY(json.poi?.price?.jpy ?? "");
            setDestinationId(json.poi?.destination_id || "");
            setStatus(json.poi?.status || "draft");
            setLat(json.poi?.lat ?? "");
            setLng(json.poi?.lng ?? "");
            setImage(json.poi?.image || "");
            setProvider(json.poi?.provider || "");
            setDeeplink(json.poi?.deeplink || "");
          }
        }
      } catch (_) {}
    }
    primeOpenings();
    return () => {
      cancelled = true;
    };
  }, [id]);

  // Keep price/duration/provider in sync if initial changes (safety for edit flows)
  useEffect(() => {
    if (!initial) return;
    setDurationMinutes(initial.duration_minutes ?? "");
    setPriceGBP(initial?.price?.gbp ?? "");
    setPriceUSD(initial?.price?.usd ?? "");
    setPriceJPY(initial?.price?.jpy ?? "");
    setProvider(initial?.provider || "internal");
  }, [initial]);

  // If editing with a known destination, preselect region/pref/div
  useEffect(() => {
    if (!destinationId || destinations.length === 0 || prefectures.length === 0 || divisions.length === 0) return;
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

  const prefecturesForRegion = useMemo(() => prefectures.filter((p) => p.region_id === regionId), [prefectures, regionId]);
  const divisionsForPref = useMemo(() => divisions.filter((d) => d.prefecture_id === prefectureId), [divisions, prefectureId]);
  const destinationsForScope = useMemo(() => {
    return destinations.filter((d) => {
      if (!prefectureId) return true;
      if (d.prefecture_id !== prefectureId) return false;
      if (divisionId && d.division_id && d.division_id !== divisionId) return false;
      if (divisionId && !d.division_id) return false;
      return true;
    });
  }, [destinations, prefectureId, divisionId]);

  // Derive upload prefix same as destinations form: destinations/<slug>
  const destSlugForUpload = useMemo(() => {
    const d = destinations.find((x) => x.id === destinationId);
    return d?.slug || "unsorted";
  }, [destinations, destinationId]);

  function addRule() {
    const next = [...rules, { day_of_week: "tue", open: "10:00", close: "17:00" }];
    setRules(next);
  }
  function updRule(i, patch) {
    const next = rules.map((r, idx) => (idx === i ? { ...r, ...patch } : r));
    setRules(next);
  }
  function delRule(i) {
    const next = rules.filter((_, idx) => idx !== i);
    setRules(next);
  }
  function addException() {
    const next = [...exceptions, { date: "", open: "", close: "", closed: true }];
    setExceptions(next);
  }
  function updException(i, patch) {
    const next = exceptions.map((r, idx) => (idx === i ? { ...r, ...patch } : r));
    setExceptions(next);
  }
  function delException(i) {
    const next = exceptions.filter((_, idx) => idx !== i);
    setExceptions(next);
  }

  async function save() {
    setSaving(true);
    setFormError("");
    try {
      if (!title.trim()) throw new Error("Title is required");
      if (!destinationId) throw new Error("Select a destination");
      const payload = {
        type,
        title,
        summary,
        details,
        duration_minutes: durationMinutes === "" ? null : Number(durationMinutes),
        price: (function () {
          const p = {};
          if (priceGBP !== "" && !Number.isNaN(Number(priceGBP))) p.gbp = Number(priceGBP);
          if (priceUSD !== "" && !Number.isNaN(Number(priceUSD))) p.usd = Number(priceUSD);
          if (priceJPY !== "" && !Number.isNaN(Number(priceJPY))) p.jpy = Number(priceJPY);
          return Object.keys(p).length ? p : null;
        })(),
        destination_id: destinationId,
        status,
        lat: lat === "" ? null : Number(lat),
        lng: lng === "" ? null : Number(lng),
        image: image || null,
        provider: provider || null,
        deeplink: deeplink || null,
        opening_rules: rules,
        opening_exceptions: exceptions,
      };
      const res = await fetch(isEditing ? `/api/admin/pois/${id}` : "/api/admin/pois", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || `Save failed (${res.status})`);
      onSaved?.(json);
    } catch (e) {
      setFormError(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!isEditing) return;
    if (!confirm("Delete this POI? This cannot be undone.")) return;
    const res = await fetch(`/api/admin/pois/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      alert(json?.error || `Delete failed (${res.status})`);
      return;
    }
    onSaved?.({ deleted: true });
  }

  return (
    <div className="space-y-4 border rounded-lg p-4">
      {formError ? (
        <div className="rounded border border-red-200 bg-red-50 text-red-800 px-3 py-2 text-sm">{formError}</div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Type</label>
          <select className="w-full rounded border p-2" value={type} onChange={(e) => setType(e.target.value)}>
            {POI_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Status</label>
          <select className="w-full rounded border p-2" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="draft">draft</option>
            <option value="published">published</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium">Title</label>
          <input className="w-full rounded border p-2" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium">Summary</label>
          <textarea className="w-full rounded border p-2" rows={3} value={summary} onChange={(e) => setSummary(e.target.value)} />
        </div>

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
          <select className="w-full rounded border p-2" value={divisionId} onChange={(e) => setDivisionId(e.target.value)} disabled={prefectureId === ""}>
            <option value="">All divisions…</option>
            {divisionsForPref.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium">Destination</label>
          <select className="w-full rounded border p-2" value={destinationId} onChange={(e) => setDestinationId(e.target.value)}>
            <option value="">Select a destination…</option>
            {destinationsForScope.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Latitude</label>
          <input className="w-full rounded border p-2" value={lat} onChange={(e) => setLat(e.target.value)} placeholder="e.g. 35.6762" />
        </div>
        <div>
          <label className="block text-sm font-medium">Longitude</label>
          <input className="w-full rounded border p-2" value={lng} onChange={(e) => setLng(e.target.value)} placeholder="e.g. 139.6503" />
        </div>

        <div>
          <label className="block text-sm font-medium">Duration (minutes)</label>
          <input className="w-full rounded border p-2" value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} placeholder="e.g. 90" />
        </div>

        <div>
          <ImageUpload
            label="Image"
            value={image}
            onChange={setImage}
            prefix={`destinations/${destSlugForUpload}`}
          />
        </div>
        

        <div>
          <label className="block text-sm font-medium">Provider</label>
          <select className="w-full rounded border p-2" value={provider} onChange={(e) => setProvider(e.target.value)}>
            <option value="internal">internal</option>
            <option value="gyg">gyg</option>
            <option value="dekitabi">dekitabi</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Deeplink</label>
          <input className="w-full rounded border p-2" value={deeplink} onChange={(e) => setDeeplink(e.target.value)} placeholder="https://…" />
        </div>

        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium">Price GBP (£)</label>
            <input className="w-full rounded border p-2" value={priceGBP} onChange={(e) => setPriceGBP(e.target.value)} placeholder="e.g. 25.00" />
          </div>
          <div>
            <label className="block text-sm font-medium">Price USD ($)</label>
            <input className="w-full rounded border p-2" value={priceUSD} onChange={(e) => setPriceUSD(e.target.value)} placeholder="e.g. 29.00" />
          </div>
          <div>
            <label className="block text-sm font-medium">Price JPY (¥)</label>
            <input className="w-full rounded border p-2" value={priceJPY} onChange={(e) => setPriceJPY(e.target.value)} placeholder="e.g. 3200" />
          </div>
        </div>
      </div>

      <RichTextEditor value={details} onChange={setDetails} label="Details" warnOnUnsaved={true} />

      <div className="space-y-2">
        <div className="text-sm font-medium">Opening rules (optional)</div>
        <button type="button" className="rounded border px-3 py-1 text-sm" onClick={addRule}>Add rule</button>
        {rules.length > 0 ? (
          <ul className="space-y-2 mt-2">
            {rules.map((r, idx) => (
              <li key={idx} className="grid grid-cols-2 md:grid-cols-5 gap-2 items-center">
                <select className="rounded border p-2" value={r.day_of_week} onChange={(e) => updRule(idx, { day_of_week: Number(e.target.value) })}>
                  <option value={0}>Mon</option>
                  <option value={1}>Tue</option>
                  <option value={2}>Wed</option>
                  <option value={3}>Thu</option>
                  <option value={4}>Fri</option>
                  <option value={5}>Sat</option>
                  <option value={6}>Sun</option>
                </select>
                <input className="rounded border p-2" placeholder="Open (HH:MM)" value={r.open_time || ""} onChange={(e) => updRule(idx, { open_time: e.target.value })} />
                <input className="rounded border p-2" placeholder="Close (HH:MM)" value={r.close_time || ""} onChange={(e) => updRule(idx, { close_time: e.target.value })} />
                <div className="text-xs text-black/60 md:col-span-2">Leave empty to use defaults from DB trigger</div>
                <button type="button" className="rounded border px-2 py-1 text-xs text-red-700" onClick={() => delRule(idx)}>Remove</button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="space-y-2">
        <div className="text-sm font-medium">Opening exceptions (optional)</div>
        <button type="button" className="rounded border px-3 py-1 text-sm" onClick={addException}>Add exception</button>
        {exceptions.length > 0 ? (
          <ul className="space-y-2 mt-2">
            {exceptions.map((r, idx) => (
              <li key={idx} className="grid grid-cols-2 md:grid-cols-5 gap-2 items-center">
                <input className="rounded border p-2" placeholder="YYYY-MM-DD" value={r.date || r.start_date || ""} onChange={(e) => updException(idx, { date: e.target.value })} />
                <label className="inline-flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={!!r.closed} onChange={(e) => updException(idx, { closed: e.target.checked })} />
                  Closed
                </label>
                <input className="rounded border p-2" placeholder="Open (HH:MM)" value={r.open_time || r.open || ""} onChange={(e) => updException(idx, { open_time: e.target.value })} />
                <input className="rounded border p-2" placeholder="Close (HH:MM)" value={r.close_time || r.close || ""} onChange={(e) => updException(idx, { close_time: e.target.value })} />
                <button type="button" className="rounded border px-2 py-1 text-xs text-red-700" onClick={() => delException(idx)}>Remove</button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

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
