"use client";
import { useCallback, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { resolveImageUrl } from "@/lib/imageUrl";
import SafeImage from "@/components/SafeImage";

export default function MultiImageUpload({ label, value = [], onChange, prefix = "media/misc" }) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [error, setError] = useState("");

  const previews = useMemo(() => (Array.isArray(value) ? value.map((v) => ({ key: v, url: resolveImageUrl(v) })) : []), [value]);
  const MAX_IMAGE_MB = 4.5;
  const MAX_IMAGE_BYTES = MAX_IMAGE_MB * 1024 * 1024;

  const handleFiles = useCallback(async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setError("");
    const tooLarge = files.find((file) => file.size > MAX_IMAGE_BYTES);
    if (tooLarge) {
      const sizeMb = (tooLarge.size / 1024 / 1024).toFixed(2);
      setError(`Images must be ${MAX_IMAGE_MB} MB or smaller. "${tooLarge.name}" is ${sizeMb} MB.`);
      if (e?.target) e.target.value = "";
      return;
    }
    setUploading(true);
    try {
      const uploadedKeys = [];
      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("prefix", prefix);
        const res = await fetch("/api/upload", { method: "POST", body: fd, credentials: "same-origin" });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.error || `Upload failed (${res.status})`);
        const nextValue = json?.url || json?.key || json?.pathname;
        if (nextValue) uploadedKeys.push(nextValue);
      }
      const next = [...(Array.isArray(value) ? value : []), ...uploadedKeys];
      onChange?.(next);
      setError("");
    } catch (err) {
      console.error("Upload failed", err);
      const message = err.message || "Upload failed";
      setError(message);
      alert(message);
    } finally {
      setUploading(false);
      if (e?.target) e.target.value = "";
    }
  }, [onChange, value, prefix]);

  function removeAt(idx) {
    const next = (Array.isArray(value) ? value : []).filter((_, i) => i !== idx);
    onChange?.(next);
  }

  function move(idx, delta) {
    const arr = Array.isArray(value) ? [...value] : [];
    const newIdx = idx + delta;
    if (newIdx < 0 || newIdx >= arr.length) return;
    const [spliced] = arr.splice(idx, 1);
    arr.splice(newIdx, 0, spliced);
    onChange?.(arr);
  }

  return (
    <div className="space-y-2 mb-2">
      {label ? <label className="block text-sm font-medium">{label}</label> : null}
      <div className="flex items-center gap-3">
        <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFiles} className="hidden" />
        <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
          {uploading ? "Uploading…" : "Choose images"}
        </Button>
      </div>
      <p className={`text-xs ${error ? "text-red-600" : "text-neutral-500"}`}>
        {error || `Images must be ${MAX_IMAGE_MB} MB or smaller.`}
      </p>
      {previews.length > 0 ? (
        <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {previews.map((p, idx) => (
            <li key={`${p.key}-${idx}`} className="border rounded p-2 space-y-2">
              {p.url ? (
                <SafeImage src={p.url} alt={`Gallery ${idx + 1}`} width={320} height={160} className="h-28 w-full object-cover rounded" />
              ) : null}
              <div className="flex items-center justify-between gap-2">
                <div className="text-[10px] text-neutral-600 truncate" title={p.key}>{p.key}</div>
                <div className="flex items-center gap-1">
                  <Button type="button" variant="outline" size="sm" className="h-8 px-2 text-xs" onClick={() => move(idx, -1)} disabled={idx === 0}>
                    ↑
                  </Button>
                  <Button type="button" variant="outline" size="sm" className="h-8 px-2 text-xs" onClick={() => move(idx, 1)} disabled={idx === previews.length - 1}>
                    ↓
                  </Button>
                  <Button type="button" variant="destructive" size="sm" className="h-8 px-2 text-xs" onClick={() => removeAt(idx)}>
                    Remove
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-xs text-neutral-500">No gallery images</div>
      )}
      <div className="text-xs text-muted-foreground">
        Tip: The first image is used as the hero/thumbnail across the site. Use the arrows to reorder.
      </div>
    </div>
  );
}
