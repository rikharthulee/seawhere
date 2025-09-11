"use client";
import { useMemo, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { resolveImageUrl } from "@/lib/imageUrl";
import SafeImage from "@/components/SafeImage";

export default function ImageUpload({
  label,
  value,
  onChange,
  prefix = "destinations",
}) {
  const supabase = createClientComponentClient();
  const [uploading, setUploading] = useState(false);
  const bucket = process.env.NEXT_PUBLIC_SUPABASE_BUCKET;
  const previewUrl = useMemo(() => resolveImageUrl(value), [value]);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!bucket) {
      alert("Missing NEXT_PUBLIC_SUPABASE_BUCKET env var");
      return;
    }
    setUploading(true);
    try {
      // Always use the server upload route for reliability (bypasses Storage RLS)
      const fd = new FormData();
      fd.append("file", file);
      fd.append("prefix", prefix);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: fd,
        credentials: "same-origin",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || `Upload failed (${res.status})`);
      if (json?.key) onChange?.(json.key);
    } catch (err) {
      console.error("Upload failed", err);
      alert(err.message || "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">{label}</label>
      <div className="flex items-center gap-3">
        <input type="file" accept="image/*" onChange={handleFile} />
        {uploading ? <span className="text-sm">Uploading…</span> : null}
      </div>
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
