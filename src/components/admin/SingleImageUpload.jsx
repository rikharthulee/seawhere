"use client";

import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import SafeImage from "@/components/SafeImage";
import { resolveImageUrl } from "@/lib/imageUrl";

export default function SingleImageUpload({
  label,
  value,
  onChange,
  prefix = "media/misc",
}) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const previewUrl = resolveImageUrl(value);
  const MAX_IMAGE_MB = 4.5;
  const MAX_IMAGE_BYTES = MAX_IMAGE_MB * 1024 * 1024;

  const handleFile = useCallback(
    async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      if (file.size > MAX_IMAGE_BYTES) {
        const sizeMb = (file.size / 1024 / 1024).toFixed(2);
        setError(
          `Images must be ${MAX_IMAGE_MB} MB or smaller. "${file.name}" is ${sizeMb} MB.`
        );
        if (event?.target) event.target.value = "";
        return;
      }
      setUploading(true);
      setError("");
      try {
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
      } catch (err) {
        const message = err?.message || "Upload failed";
        setError(message);
        alert(message);
      } finally {
        setUploading(false);
        if (event?.target) event.target.value = "";
      }
    },
    [MAX_IMAGE_BYTES, MAX_IMAGE_MB, onChange, prefix]
  );

  return (
    <div className="space-y-2">
      {label ? <label className="block text-sm font-medium">{label}</label> : null}
      <div className="flex items-center gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFile}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? "Uploading..." : "Choose image"}
        </Button>
        {value ? (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => onChange?.("")}
            disabled={uploading}
          >
            Remove
          </Button>
        ) : null}
      </div>
      <p className={`text-xs ${error ? "text-red-600" : "text-muted-foreground"}`}>
        {error || `Images must be ${MAX_IMAGE_MB} MB or smaller.`}
      </p>
      {previewUrl ? (
        <div className="relative h-40 w-full overflow-hidden rounded-lg border">
          <SafeImage
            src={previewUrl}
            alt="Cover preview"
            fill
            className="object-cover"
          />
        </div>
      ) : (
        <div className="text-xs text-muted-foreground">No image selected</div>
      )}
    </div>
  );
}
