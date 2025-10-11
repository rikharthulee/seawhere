"use client";
import { useMemo, useRef, useState } from "react";
import { resolveImageUrl } from "@/lib/imageUrl";
import SafeImage from "@/components/SafeImage";
import { Button } from "@/components/ui/button";

export default function ImageUpload({
  label,
  value,
  onChange,
  prefix = "media/misc",
}) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const previewUrl = useMemo(() => resolveImageUrl(value), [value]);
  const [error, setError] = useState("");

  const MAX_IMAGE_MB = 4.5;
  const MAX_IMAGE_BYTES = MAX_IMAGE_MB * 1024 * 1024;

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    if (file.size > MAX_IMAGE_BYTES) {
      const sizeMb = (file.size / 1024 / 1024).toFixed(2);
      setError(`Images must be ${MAX_IMAGE_MB} MB or smaller. Selected file is ${sizeMb} MB.`);
      if (e?.target) e.target.value = "";
      return;
    }
    setUploading(true);
    try {
      // Always use the server upload route for reliability (bypasses Storage RLS)
      const fd = new FormData();
      fd.append("file", file);
      fd.append("prefix", prefix);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: fd,
        credentials: "same-origin",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || `Upload failed (${res.status})`);
      const nextValue = json?.url || json?.key || json?.pathname;
      if (nextValue) onChange?.(nextValue);
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
  }

  return (
    <div className="space-y-2 mb-2">
      <label className="block text-sm font-medium">{label}</label>
      <div className="flex items-center gap-3">
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
        <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
          {uploading ? "Uploading…" : "Choose image"}
        </Button>
      </div>
      <p className={`text-xs ${error ? "text-red-600" : "text-neutral-500"}`}>
        {error || `Images must be ${MAX_IMAGE_MB} MB or smaller.`}
      </p>
      {value ? (
        <div className="flex items-start gap-3">
          {previewUrl ? (
            <SafeImage
              src={previewUrl}
              alt={`${label} preview`}
              width={144}
              height={96}
              className="h-24 w-36 object-cover rounded border"
            />
          ) : null}
          <div className="text-xs break-all text-neutral-600">
            <div className="font-mono">{value}</div>
            {previewUrl ? (
              <a
                href={previewUrl}
                target="_blank"
                rel="noreferrer"
                className="text-blue-700 underline"
              >
                Open full image
              </a>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="text-xs text-neutral-500">No image set</div>
      )}
    </div>
  );
}
