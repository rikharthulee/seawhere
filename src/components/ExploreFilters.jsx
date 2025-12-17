"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ExploreFilters({
  countries = [],
  destinations = [],
  tags = [],
  onChange = () => {},
}) {
  const [countryId, setCountryId] = useState("");
  const [destinationId, setDestinationId] = useState("");
  const [activeTags, setActiveTags] = useState(new Set());

  const destinationsForCountry = useMemo(() => {
    if (!countryId) return destinations;
    return destinations.filter((d) => d.country_id === countryId);
  }, [destinations, countryId]);

  function toggleTag(tag) {
    const next = new Set(activeTags);
    if (next.has(tag)) next.delete(tag);
    else next.add(tag);
    setActiveTags(next);
    onChange({ countryId, destinationId, tags: Array.from(next) });
  }

  return (
    <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Select
          value={countryId || "__all"}
          onValueChange={(v) => {
            const val = v === "__all" ? "" : v;
            setCountryId(val);
            setDestinationId("");
            onChange({ countryId: val, destinationId: "", tags: Array.from(activeTags) });
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Filter by country" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">All countries</SelectItem>
            {countries.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={destinationId || "__all"}
          onValueChange={(v) => {
            const val = v === "__all" ? "" : v;
            setDestinationId(val);
            onChange({ countryId, destinationId: val, tags: Array.from(activeTags) });
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Filter by destination" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">All destinations</SelectItem>
            {destinationsForCountry.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {tags.length ? (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Button
              key={tag}
              variant={activeTags.has(tag) ? "default" : "outline"}
              size="sm"
              className="rounded-full"
              onClick={() => toggleTag(tag)}
            >
              {tag}
            </Button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
