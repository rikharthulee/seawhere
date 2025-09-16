"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import MultiImageUpload from "./MultiImageUpload";
import ConfirmDeleteButton from "@/components/admin/ConfirmDeleteButton";
import RichTextEditor from "./RichTextEditor";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

export default function ToursForm({ id, initial, onSaved, onCancel }) {
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
  const [durationMinutes, setDurationMinutes] = useState(initial?.duration_minutes ?? "");
  const [provider, setProvider] = useState(initial?.provider || "internal");
  const [deeplink, setDeeplink] = useState(initial?.deeplink || "");
  const [gygId, setGygId] = useState(initial?.gyg_id || "");
  const [priceAmount, setPriceAmount] = useState(initial?.price_amount ?? "");
  const [priceCurrency, setPriceCurrency] = useState(initial?.price_currency || "JPY");
  const [tags, setTags] = useState(Array.isArray(initial?.tags) ? initial.tags : []);

  const [regions, setRegions] = useState([]);
  const [prefectures, setPrefectures] = useState([]);
  const [divisionsForDest, setDivisionsForDest] = useState([]);
  const [destinations, setDestinations] = useState([]);

  const [regionId, setRegionId] = useState("");
  const [prefectureId, setPrefectureId] = useState("");
  const [divisionId, setDivisionId] = useState("");

  const [rules, setRules] = useState(Array.isArray(initial?.rules) ? initial.rules : []);
  const [exceptions, setExceptions] = useState(Array.isArray(initial?.exceptions) ? initial.exceptions : []);

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
      // Fallbacks
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
    setDurationMinutes(initial?.duration_minutes ?? "");
    setProvider(initial?.provider || "internal");
    setDeeplink(initial?.deeplink || "");
    setGygId(initial?.gyg_id || "");
    setPriceAmount(initial?.price_amount ?? "");
    setPriceCurrency(initial?.price_currency || "JPY");
    setTags(Array.isArray(initial?.tags) ? initial.tags : []);
    setRules(Array.isArray(initial?.rules) ? initial.rules : []);
    setExceptions(Array.isArray(initial?.exceptions) ? initial.exceptions : []);
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

  function addRule() {
    setRules([...(rules || []), { days_of_week: [0], start_times: ["09:00"], valid_from: "", valid_to: "", timezone: "Asia/Tokyo" }]);
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
      if (!name.trim()) throw new Error("Name is required");
      const finalSlug = slugify(slug || name);
      if (!finalSlug) throw new Error("Slug is required");
      if (!destinationId) throw new Error("Select a destination");

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
        duration_minutes: durationMinutes === "" ? null : Number(durationMinutes),
        provider: provider || null,
        deeplink: deeplink || null,
        gyg_id: gygId === "" ? null : String(gygId),
        price_amount: priceAmount === "" ? null : Number(priceAmount),
        price_currency: priceCurrency || null,
        tags: Array.isArray(tags) ? tags : null,
        availability_rules: (rules || []).map((r, idx) => ({
          idx,
          days_of_week: Array.isArray(r.days_of_week) ? r.days_of_week : String(r.days_of_week || "").split(",").map(s => Number(s.trim())).filter(n => !isNaN(n)),
          start_times: Array.isArray(r.start_times) ? r.start_times : String(r.start_times || "").split(",").map(s => s.trim()).filter(Boolean),
          valid_from: r.valid_from || null,
          valid_to: r.valid_to || null,
          timezone: r.timezone || "Asia/Tokyo",
        })),
        exceptions: (exceptions || []).map((e) => ({
          date: e.date || null,
          action: e.action || "cancel",
          start_time: e.start_time || null,
          note: e.note || null,
        })),
      };
      const res = await fetch(isEditing ? `/api/admin/tours/${id}` : "/api/admin/tours", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || `Save failed (${res.status})`);
      onSaved?.(json);
    } catch (e) {
      alert(e?.message || "Save failed");
    }
  }

  async function handleDelete() {
    if (!isEditing) return;
    const res = await fetch(`/api/admin/tours/${id}`, { method: "DELETE" });
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
            placeholder="e.g. tokyo-walking-tour"
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
        {/* Division selection depends on destination and is provided below */}
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
          <input className="w-full rounded border p-2" value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} placeholder="e.g. 120" />
        </div>
        <div>
          <label className="block text-sm font-medium">Provider</label>
          <input className="w-full rounded border p-2" value={provider} onChange={(e) => setProvider(e.target.value)} placeholder="e.g. gyg, viator" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium">Booking link</label>
          <input className="w-full rounded border p-2" value={deeplink} onChange={(e) => setDeeplink(e.target.value)} placeholder="https://…" />
        </div>
        <div>
          <label className="block text-sm font-medium">GetYourGuide ID (optional)</label>
          <input className="w-full rounded border p-2" value={gygId} onChange={(e) => setGygId(e.target.value)} placeholder="e.g. 123456" />
        </div>

        <div>
          <label className="block text-sm font-medium">Price amount</label>
          <input className="w-full rounded border p-2" value={priceAmount} onChange={(e) => setPriceAmount(e.target.value)} placeholder="e.g. 8000" />
        </div>
        <div>
          <label className="block text-sm font-medium">Price currency</label>
          <input className="w-full rounded border p-2" value={priceCurrency} onChange={(e) => setPriceCurrency(e.target.value)} placeholder="e.g. JPY" />
        </div>

        <div className="md:col-span-2">
          <MultiImageUpload value={images} onChange={setImages} folderHint={`tours/${destSlugForUpload}`} />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium">Tags (comma separated)</label>
          <input
            className="w-full rounded border p-2"
            value={(tags || []).join(", ")}
            onChange={(e) => setTags(e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
            placeholder="e.g. walking,food,evening"
          />
        </div>
      </div>

      <RichTextEditor value={body} onChange={setBody} label="Details" warnOnUnsaved={true} />

      <div className="space-y-2">
        <div className="text-sm font-medium">Availability rules</div>
        <Button type="button" variant="outline" size="sm" onClick={addRule}>Add rule</Button>
        {Array.isArray(rules) && rules.length > 0 ? (
          <ul className="space-y-2 mt-2">
            {rules.map((r, idx) => (
              <li key={idx} className="grid grid-cols-2 md:grid-cols-6 gap-2 items-center">
                <input className="rounded border p-2" placeholder="Days (e.g. 0,1,2)" value={Array.isArray(r.days_of_week) ? r.days_of_week.join(",") : r.days_of_week || ""} onChange={(e) => updRule(idx, { days_of_week: e.target.value })} />
                <input className="rounded border p-2" placeholder="Start times (e.g. 09:00,14:00)" value={Array.isArray(r.start_times) ? r.start_times.join(",") : r.start_times || ""} onChange={(e) => updRule(idx, { start_times: e.target.value })} />
                <input type="date" className="rounded border p-2" placeholder="Valid from" value={r.valid_from || ""} onChange={(e) => updRule(idx, { valid_from: e.target.value })} />
                <input type="date" className="rounded border p-2" placeholder="Valid to" value={r.valid_to || ""} onChange={(e) => updRule(idx, { valid_to: e.target.value })} />
                <input className="rounded border p-2" placeholder="Timezone" value={r.timezone || "Asia/Tokyo"} onChange={(e) => updRule(idx, { timezone: e.target.value })} />
                <Button type="button" variant="destructive" size="sm" className="h-8 px-2 text-xs" onClick={() => delRule(idx)}>Remove</Button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="space-y-2">
        <div className="text-sm font-medium">Exceptions</div>
        <Button type="button" variant="outline" size="sm" onClick={addException}>Add exception</Button>
        {Array.isArray(exceptions) && exceptions.length > 0 ? (
          <ul className="space-y-2 mt-2">
            {exceptions.map((e, idx) => (
              <li key={idx} className="grid grid-cols-2 md:grid-cols-5 gap-2 items-center">
                <input type="date" className="rounded border p-2" placeholder="Date" value={e.date || ""} onChange={(ev) => updException(idx, { date: ev.target.value })} />
                <Select value={e.action || "cancel"} onValueChange={(v) => updException(idx, { action: v })}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cancel">cancel</SelectItem>
                    <SelectItem value="add">add</SelectItem>
                    <SelectItem value="modify">modify</SelectItem>
                  </SelectContent>
                </Select>
                <input type="time" className="rounded border p-2" placeholder="Start time" value={e.start_time || ""} onChange={(ev) => updException(idx, { start_time: ev.target.value })} />
                <input className="rounded border p-2" placeholder="Note (optional)" value={e.note || ""} onChange={(ev) => updException(idx, { note: ev.target.value })} />
                <Button type="button" variant="destructive" size="sm" className="h-8 px-2 text-xs" onClick={() => delException(idx)}>Remove</Button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={save}>Save</Button>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        {isEditing ? (
          <ConfirmDeleteButton
            title="Delete this tour?"
            description="This action cannot be undone. This will permanently delete the item and remove any associated data."
            triggerClassName="ml-auto"
            onConfirm={handleDelete}
          />
        ) : null}
      </div>
      </CardContent>
    </Card>
  );
}
