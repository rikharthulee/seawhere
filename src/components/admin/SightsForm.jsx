"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import ConfirmDeleteButton from "@/components/admin/ConfirmDeleteButton";
import MultiImageUpload from "./MultiImageUpload";
import RichTextEditor from "./RichTextEditor";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

export default function SightsForm({ id, initial, onSaved, onCancel }) {
  const supabase = createClientComponentClient();
  const isEditing = !!id;

  const [name, setName] = useState(initial?.name || "");
  const [slug, setSlug] = useState(initial?.slug || "");
  const [slugTouched, setSlugTouched] = useState(!!initial?.id);
  const [summary, setSummary] = useState(initial?.summary || "");
  const [body, setBody] = useState(initial?.body_richtext || null);
  const [images, setImages] = useState(Array.isArray(initial?.images) ? initial.images : []);
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
  const [priceCurrency, setPriceCurrency] = useState(initial?.price_currency || "JPY");

  const [regions, setRegions] = useState([]);
  const [prefectures, setPrefectures] = useState([]);
  const [divisionsForDest, setDivisionsForDest] = useState([]);
  const [destinations, setDestinations] = useState([]);

  const [regionId, setRegionId] = useState("");
  const [prefectureId, setPrefectureId] = useState("");
  const [divisionId, setDivisionId] = useState("");

  const [hours, setHours] = useState(Array.isArray(initial?.hours) ? initial.hours : []);
  const [exceptions, setExceptions] = useState(Array.isArray(initial?.exceptions) ? initial.exceptions : []);
  const [dragHourIdx, setDragHourIdx] = useState(null);

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

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

  // Load geo + destinations
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/admin/meta/geo", { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          if (!cancelled) {
            setRegions(json.regions || []);
            setPrefectures(json.prefectures || []);
          }
        }
      } catch {}
      try {
        const res = await fetch("/api/admin/meta/destinations", { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          if (!cancelled) setDestinations(json.items || []);
        }
      } catch {}
      // Client fallback reads in case admin meta is blocked
      try {
        const { data: r } = await supabase.from("regions").select("id,name,slug,order_index").order("order_index", { ascending: true });
        if (!cancelled && r && r.length && regions.length === 0) setRegions(r);
      } catch {}
      try {
        const { data: p } = await supabase.from("prefectures").select("id,name,slug,region_id,order_index").order("order_index", { ascending: true });
        if (!cancelled && p && p.length && prefectures.length === 0) setPrefectures(p);
      } catch {}
      // Division options are loaded via RPC per destination; no general divisions fetch here.
      try {
        const { data: dst } = await supabase
          .from("destinations")
          .select("id,name,slug,prefecture_id,division_id,status")
          .order("name", { ascending: true });
        if (!cancelled && dst && dst.length && destinations.length === 0) setDestinations(dst);
      } catch {}
    }
    load();
    return () => { cancelled = true; };
  }, [supabase]);

  useEffect(() => {
    setSlug(initial?.slug || "");
    setName(initial?.name || "");
    setSummary(initial?.summary || "");
    setBody(initial?.body_richtext || null);
    setImages(Array.isArray(initial?.images) ? initial.images : []);
    setDestinationId(initial?.destination_id || "");
    setDivisionId(initial?.division_id || "");
    setStatus(initial?.status || "draft");
    setLat(initial?.lat ?? "");
    setLng(initial?.lng ?? "");
    setTags(Array.isArray(initial?.tags) ? initial.tags : []);
    setDurationMinutes(initial?.duration_minutes ?? "");
    setProvider(initial?.provider || "internal");
    setDeeplink(initial?.deeplink || "");
    setGygId(initial?.gyg_id || "");
    setPriceAmount(initial?.price_amount ?? "");
    setPriceCurrency(initial?.price_currency || "JPY");
    function trimTime(t) {
      if (!t) return "";
      const s = String(t);
      const m = s.match(/^([0-9]{2}:[0-9]{2})/);
      return m ? m[1] : s;
    }
    setHours(Array.isArray(initial?.hours) ? initial.hours.map(h => ({
      ...h,
      open_time: trimTime(h.open_time),
      close_time: trimTime(h.close_time),
    })) : []);
    setExceptions(Array.isArray(initial?.exceptions) ? initial.exceptions.map(e => ({
      ...e,
      open_time: trimTime(e.open_time),
      close_time: trimTime(e.close_time),
    })) : []);
  }, [initial]);

  // Derive geo scope (region/pref) from destination
  useEffect(() => {
    const d = destinations.find((x) => x.id === destinationId);
    if (!d) {
      setPrefectureId("");
      setRegionId("");
      return;
    }
    setPrefectureId(d.prefecture_id || "");
    const pref = prefectures.find((p) => p.id === d.prefecture_id);
    setRegionId(pref?.region_id || "");
  }, [destinationId, destinations, prefectures]);

  // On destination change, fetch divisions via RPC and clear division only after initial mount
  const prevDestIdRef = useRef(null);
  useEffect(() => {
    let cancelled = false;
    async function fetchDivs() {
      if (!destinationId) { setDivisionsForDest([]); return; }
      try {
        const { data } = await supabase.rpc('get_divisions_for_destination', { dst_id: destinationId });
        if (!cancelled) setDivisionsForDest(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setDivisionsForDest([]);
      }
    }
    if (prevDestIdRef.current !== null && prevDestIdRef.current !== destinationId) {
      setDivisionId("");
    }
    fetchDivs();
    prevDestIdRef.current = destinationId;
    return () => { cancelled = true; };
  }, [destinationId, supabase]);

  const prefecturesForRegion = useMemo(() => prefectures.filter((p) => p.region_id === regionId), [prefectures, regionId]);
  const destinationsForScope = useMemo(() => {
    return destinations.filter((d) => {
      if (prefectureId && d.prefecture_id !== prefectureId) return false;
      return true;
    });
  }, [destinations, prefectureId]);

  const destSlugForUpload = useMemo(() => {
    const d = destinations.find((x) => x.id === destinationId);
    return d?.slug || "unsorted";
  }, [destinations, destinationId]);

  function addHour() {
    setHours([...(hours || []), { weekday: 0, open_time: "", close_time: "", is_closed: false, valid_from: "", valid_to: "" }]);
  }
  function updHour(i, patch) {
    setHours((hours || []).map((h, idx) => (idx === i ? { ...h, ...patch } : h)));
  }
  function moveHour(from, to) {
    if (from == null || to == null || from === to) return;
    const arr = Array.isArray(hours) ? [...hours] : [];
    const [item] = arr.splice(from, 1);
    arr.splice(to, 0, item);
    setHours(arr);
  }
  function delHour(i) {
    setHours((hours || []).filter((_, idx) => idx !== i));
  }

  function addException() {
    setExceptions([...(exceptions || []), { date: "", is_closed: true, open_time: "", close_time: "", note: "" }]);
  }
  function updException(i, patch) {
    setExceptions((exceptions || []).map((e, idx) => (idx === i ? { ...e, ...patch } : e)));
  }
  function delException(i) {
    setExceptions((exceptions || []).filter((_, idx) => idx !== i));
  }

  async function save() {
    setSaving(true);
    setFormError("");
    try {
      if (!name.trim()) throw new Error("Name is required");
      const finalSlug = slugify(slug || name);
      if (!finalSlug) throw new Error("Slug is required");
      if (!destinationId) throw new Error("Select a destination");
      // Basic validation for hours
      const timeRe = /^\d{2}:\d{2}$/;
      for (const h of hours || []) {
        const wd = Number(h.weekday);
        if (!(wd >= 0 && wd <= 6)) throw new Error("Opening hours: weekday must be 0–6");
        if (!h.is_closed) {
          if (h.open_time && !timeRe.test(h.open_time)) throw new Error("Opening hours: invalid open time (HH:MM)");
          if (h.close_time && !timeRe.test(h.close_time)) throw new Error("Opening hours: invalid close time (HH:MM)");
        }
      }
      // Basic validation for exceptions
      for (const e of exceptions || []) {
        if (!e.date) throw new Error("Exceptions: date is required");
        if (!e.is_closed) {
          if (e.open_time && !timeRe.test(e.open_time)) throw new Error("Exceptions: invalid open time (HH:MM)");
          if (e.close_time && !timeRe.test(e.close_time)) throw new Error("Exceptions: invalid close time (HH:MM)");
        }
      }
      const payload = {
        name,
        slug: finalSlug,
        summary,
        body_richtext: body,
        images: Array.isArray(images) ? images : [],
        destination_id: destinationId,
        division_id: divisionId || null,
        status,
        lat: lat === "" ? null : Number(lat),
        lng: lng === "" ? null : Number(lng),
        tags: Array.isArray(tags) ? tags : [],
        duration_minutes: durationMinutes === "" ? null : Number(durationMinutes),
        provider: provider || null,
        deeplink: deeplink || null,
        gyg_id: gygId === "" ? null : String(gygId),
        price_amount: priceAmount === "" ? null : Number(priceAmount),
        price_currency: priceCurrency || null,
        opening_hours: (hours || []).map((h, idx) => ({
          weekday: Number(h.weekday) || 0,
          idx,
          open_time: h.open_time || null,
          close_time: h.close_time || null,
          is_closed: !!h.is_closed,
          valid_from: h.valid_from || null,
          valid_to: h.valid_to || null,
        })),
        opening_exceptions: (exceptions || []).map((e) => ({
          date: e.date || null,
          is_closed: !!e.is_closed,
          open_time: e.open_time || null,
          close_time: e.close_time || null,
          note: e.note || null,
        })),
      };
      const res = await fetch(isEditing ? `/api/admin/sights/${id}` : "/api/admin/sights", {
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
      <CardContent>
      {formError ? (
        <div className="rounded border border-red-200 bg-red-50 text-red-800 px-3 py-2 text-sm">{formError}</div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        <div className="md:col-span-2">
          <label className="block text-sm font-medium">Name</label>
          <input className="w-full rounded border p-2" value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div>
          <label className="block text-sm font-medium">Slug</label>
          <input
            className="w-full rounded border p-2"
            value={slug}
            onChange={(e) => { setSlug(e.target.value); setSlugTouched(true); }}
            placeholder="e.g. meiji-shrine"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium">Summary</label>
          <textarea className="w-full rounded border p-2" rows={3} value={summary} onChange={(e) => setSummary(e.target.value)} />
        </div>

        <div>
          <label className="block text-sm font-medium">Region</label>
          <Select value={regionId || "__EMPTY__"} onValueChange={(v) => { const val = v === "__EMPTY__" ? "" : v; setRegionId(val); setPrefectureId(""); setDivisionId(""); }}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All regions…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__EMPTY__">All regions…</SelectItem>
              {regions.map((r) => (
                <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium">Prefecture</label>
          <Select value={prefectureId || "__EMPTY__"} onValueChange={(v) => { const val = v === "__EMPTY__" ? "" : v; setPrefectureId(val); setDivisionId(""); }}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All prefectures…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__EMPTY__">All prefectures…</SelectItem>
              {prefecturesForRegion.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* Division is chosen within destination context below */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium">Destination</label>
          <Select value={destinationId || "__EMPTY__"} onValueChange={(v) => setDestinationId(v === "__EMPTY__" ? "" : v)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a destination…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__EMPTY__">Select a destination…</SelectItem>
              {destinationsForScope.map((d) => (
                <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium">Division (optional)</label>
          <Select value={divisionId || "__EMPTY__"} onValueChange={(v) => setDivisionId(v === "__EMPTY__" ? "" : v)}>
            <SelectTrigger className="w-full" disabled={!destinationId}>
              <SelectValue placeholder="No division (entire destination)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__EMPTY__">No division (entire destination)</SelectItem>
              {divisionsForDest.map((d) => (
                <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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
          <label className="block text-sm font-medium">Provider</label>
          <Select value={provider} onValueChange={setProvider}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Provider" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="internal">internal</SelectItem>
              <SelectItem value="gyg">gyg</SelectItem>
              <SelectItem value="dekitabi">dekitabi</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium">Deeplink</label>
          <input className="w-full rounded border p-2" value={deeplink} onChange={(e) => setDeeplink(e.target.value)} placeholder="https://…" />
        </div>
        <div>
          <label className="block text-sm font-medium">GYG ID</label>
          <input className="w-full rounded border p-2" value={gygId} onChange={(e) => setGygId(e.target.value)} placeholder="e.g. 1035544" />
          <div className="text-xs text-black/60 mt-1">Used to render the GetYourGuide availability widget.</div>
        </div>
        <div>
          <label className="block text-sm font-medium">Price Amount</label>
          <input className="w-full rounded border p-2" value={priceAmount} onChange={(e) => setPriceAmount(e.target.value)} placeholder="e.g. 5000" />
        </div>
        <div>
          <label className="block text-sm font-medium">Price Currency</label>
          <Select value={priceCurrency} onValueChange={setPriceCurrency}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Currency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="JPY">JPY</SelectItem>
              <SelectItem value="GBP">GBP</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <MultiImageUpload
        label="Images"
        value={Array.isArray(images) ? images : []}
        onChange={setImages}
        prefix={`destinations/${destSlugForUpload}/sights`}
      />
      <div className="text-xs text-black/60">Tip: The first image is used as the hero/thumbnail across the site. Use the arrows to reorder.</div>

      <div>
        <label className="block text-sm font-medium">Tags (comma-separated)</label>
        <input
          className="w-full rounded border p-2"
          value={(tags || []).join(", ")}
          onChange={(e) => setTags(e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
          placeholder="e.g. temple,shrine,park"
        />
      </div>

      <RichTextEditor value={body} onChange={setBody} label="Details" warnOnUnsaved={true} />

      <div className="space-y-2">
        <div className="text-sm font-medium">Opening hours</div>
        <Button type="button" variant="outline" size="sm" onClick={addHour}>Add row</Button>
        {Array.isArray(hours) && hours.length > 0 ? (
          <ul className="space-y-2 mt-2">
            {hours.map((h, idx) => (
              <li
                key={idx}
                className="grid grid-cols-2 md:grid-cols-8 gap-2 items-center"
                draggable
                onDragStart={() => setDragHourIdx(idx)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => { moveHour(dragHourIdx, idx); setDragHourIdx(null); }}
                title="Drag to reorder"
              >
                <Select value={String(h.weekday ?? 0)} onValueChange={(v) => updHour(idx, { weekday: Number(v) })}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Mon</SelectItem>
                    <SelectItem value="1">Tue</SelectItem>
                    <SelectItem value="2">Wed</SelectItem>
                    <SelectItem value="3">Thu</SelectItem>
                    <SelectItem value="4">Fri</SelectItem>
                    <SelectItem value="5">Sat</SelectItem>
                    <SelectItem value="6">Sun</SelectItem>
                  </SelectContent>
                </Select>
                <label className="inline-flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={!!h.is_closed} onChange={(e) => updHour(idx, { is_closed: e.target.checked })} />
                  Closed
                </label>
                <input type="time" className="rounded border p-2" placeholder="Open" value={h.open_time || ""} onChange={(e) => updHour(idx, { open_time: e.target.value })} />
                <input type="time" className="rounded border p-2" placeholder="Close" value={h.close_time || ""} onChange={(e) => updHour(idx, { close_time: e.target.value })} />
                <input type="date" className="rounded border p-2" placeholder="Valid from" value={h.valid_from || ""} onChange={(e) => updHour(idx, { valid_from: e.target.value })} />
                <input type="date" className="rounded border p-2" placeholder="Valid to" value={h.valid_to || ""} onChange={(e) => updHour(idx, { valid_to: e.target.value })} />
                <span className="text-xs text-neutral-500">☰</span>
                <Button type="button" variant="destructive" size="sm" className="h-8 px-2 text-xs" onClick={() => delHour(idx)}>Remove</Button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="space-y-2">
        <div className="text-sm font-medium">Opening exceptions</div>
        <Button type="button" variant="outline" size="sm" onClick={addException}>Add exception</Button>
        {Array.isArray(exceptions) && exceptions.length > 0 ? (
          <ul className="space-y-2 mt-2">
            {exceptions.map((e, idx) => (
              <li key={idx} className="grid grid-cols-2 md:grid-cols-6 gap-2 items-center">
                <input type="date" className="rounded border p-2" placeholder="Date" value={e.date || ""} onChange={(ev) => updException(idx, { date: ev.target.value })} />
                <label className="inline-flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={!!e.is_closed} onChange={(ev) => updException(idx, { is_closed: ev.target.checked })} />
                  Closed
                </label>
                <input type="time" className="rounded border p-2" placeholder="Open" value={e.open_time || ""} onChange={(ev) => updException(idx, { open_time: ev.target.value })} />
                <input type="time" className="rounded border p-2" placeholder="Close" value={e.close_time || ""} onChange={(ev) => updException(idx, { close_time: ev.target.value })} />
                <input className="rounded border p-2" placeholder="Note (optional)" value={e.note || ""} onChange={(ev) => updException(idx, { note: ev.target.value })} />
                <Button type="button" variant="destructive" size="sm" className="h-8 px-2 text-xs" onClick={() => delException(idx)}>Remove</Button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        {isEditing ? (
          <ConfirmDeleteButton
            title="Delete this sight?"
            description="This action cannot be undone. This will permanently delete the item and remove any associated data."
            triggerClassName="ml-auto rounded bg-red-600 text-white px-4 py-2"
            onConfirm={handleDelete}
          />
        ) : null}
      </div>
      </CardContent>
    </Card>
  );
}
