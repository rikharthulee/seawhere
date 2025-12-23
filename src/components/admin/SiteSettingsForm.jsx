"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import MultiImageUpload from "@/components/admin/MultiImageUpload";

export default function SiteSettingsForm({ initial, onSave }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [headline, setHeadline] = useState(initial?.hero_headline || "");
  const [tagline, setTagline] = useState(initial?.hero_tagline || "");
  const [images, setImages] = useState(
    Array.isArray(initial?.hero_images) ? initial.hero_images : []
  );

  useEffect(() => {
    setHeadline(initial?.hero_headline || "");
    setTagline(initial?.hero_tagline || "");
    setImages(Array.isArray(initial?.hero_images) ? initial.hero_images : []);
  }, [initial]);

  function handleSubmit(event) {
    event.preventDefault();
    setError("");
    startTransition(async () => {
      try {
        await onSave({
          hero_headline: headline,
          hero_tagline: tagline,
          hero_images: images,
        });
      } catch (err) {
        setError(err?.message || "Failed to save hero settings.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border p-4">
      <div className="space-y-2">
        <Label htmlFor="hero-headline">Hero headline</Label>
        <Input
          id="hero-headline"
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          placeholder="Plan immersive trips by country or by interest"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="hero-tagline">Hero tagline</Label>
        <Input
          id="hero-tagline"
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          placeholder="Browse curated destinations, sights, food, stays and experiences."
        />
      </div>
      <MultiImageUpload
        label="Hero images"
        value={images}
        onChange={setImages}
        prefix="media/site/hero"
      />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="flex items-center justify-end gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Save hero settings"}
        </Button>
      </div>
    </form>
  );
}
