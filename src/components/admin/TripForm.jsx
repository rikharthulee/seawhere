"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import SingleImageUpload from "@/components/admin/SingleImageUpload";

function uniqueOptions(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

export default function TripForm({
  mode,
  trip,
  countries = [],
  destinations = [],
  onCreate,
  onUpdate,
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [title, setTitle] = useState(trip?.title || "");
  const [slug, setSlug] = useState(trip?.slug || "");
  const [slugTouched, setSlugTouched] = useState(Boolean(trip?.slug));
  const [summary, setSummary] = useState(trip?.summary || "");
  const [countryId, setCountryId] = useState(trip?.country_id || "");
  const [destinationId, setDestinationId] = useState(trip?.destination_id || "");
  const [status, setStatus] = useState(trip?.status || "draft");
  const [visibility, setVisibility] = useState(trip?.visibility || "private");
  const [heroImage, setHeroImage] = useState(trip?.hero_image || "");
  const [thumbnailImage, setThumbnailImage] = useState(trip?.thumbnail_image || "");

  function slugify(s) {
    return (s || "")
      .toLowerCase()
      .trim()
      .replace(/['"]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  useEffect(() => {
    if (!slugTouched) setSlug(slugify(title));
  }, [title, slugTouched]);

  const destinationsForCountry = useMemo(() => {
    if (!countryId) return destinations;
    return destinations.filter((d) => d.country_id === countryId);
  }, [destinations, countryId]);

  const statusOptions = uniqueOptions([
    trip?.status,
    "draft",
    "published",
  ]);
  const visibilityOptions = uniqueOptions([
    trip?.visibility,
    "private",
    "public",
  ]);

  function handleCountryChange(value) {
    const nextCountryId = value === "__none" ? "" : value;
    setCountryId(nextCountryId);
    const nextDestinations = nextCountryId
      ? destinations.filter((d) => d.country_id === nextCountryId)
      : destinations;
    if (!nextDestinations.some((d) => d.id === destinationId)) {
      setDestinationId("");
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    setError("");
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!slug.trim()) {
      setError("Slug is required.");
      return;
    }
    const payload = {
      title,
      slug: slugify(slug),
      summary,
      country_id: countryId || null,
      destination_id: destinationId || null,
      status,
      visibility,
      hero_image: heroImage || null,
      thumbnail_image: thumbnailImage || null,
    };

    startTransition(async () => {
      try {
        if (mode === "create") {
          const result = await onCreate(payload);
          if (result?.id) {
            router.push(`/admin/trips/${result.id}`);
          }
        } else {
          await onUpdate(payload);
        }
      } catch (err) {
        setError(err?.message || "Failed to save trip");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border p-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="trip-title">Title</Label>
          <Input
            id="trip-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Laos Explorer"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="trip-slug">Slug</Label>
          <Input
            id="trip-slug"
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setSlugTouched(true);
            }}
            placeholder="e.g. 5-days-in-laos"
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="trip-summary">Summary</Label>
          <Textarea
            id="trip-summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Short overview for the public trip page"
            rows={3}
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <SingleImageUpload
            label="Hero image"
            value={heroImage}
            onChange={setHeroImage}
            prefix="media/trips/hero"
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <SingleImageUpload
            label="Thumbnail image"
            value={thumbnailImage}
            onChange={setThumbnailImage}
            prefix="media/trips/thumbnail"
          />
        </div>
        <div className="space-y-2">
          <Label>Country</Label>
          <Select value={countryId || "__none"} onValueChange={handleCountryChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select a country" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none">No country</SelectItem>
              {countries.map((country) => (
                <SelectItem key={country.id} value={country.id}>
                  {country.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Destination</Label>
          <Select
            value={destinationId || "__none"}
            onValueChange={(value) =>
              setDestinationId(value === "__none" ? "" : value)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Optional destination" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none">No destination</SelectItem>
              {destinationsForCountry.map((destination) => (
                <SelectItem key={destination.id} value={destination.id}>
                  {destination.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((value) => (
                <SelectItem key={value} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Visibility</Label>
          <Select value={visibility} onValueChange={setVisibility}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {visibilityOptions.map((value) => (
                <SelectItem key={value} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          {isPending ? "Saving..." : " "}
        </div>
        <Button type="submit" disabled={isPending}>
          {mode === "create" ? "Create Trip" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
