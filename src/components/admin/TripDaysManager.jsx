"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function filterByScope(list, destinationId, countryId) {
  if (destinationId) {
    return list.filter((item) => item.destination_id === destinationId);
  }
  if (countryId) {
    return list.filter((item) => item.country_id === countryId);
  }
  return list;
}

export default function TripDaysManager({
  tripId,
  tripCountryId,
  initialDays = [],
  destinations = [],
  accommodations = [],
  dayItineraries = [],
  onAddDay,
  onUpdateDay,
  onDeleteDay,
}) {
  const [days, setDays] = useState(initialDays);
  const [saving, setSaving] = useState({});
  const [errors, setErrors] = useState({});
  const [selectedDayId, setSelectedDayId] = useState(
    initialDays?.[0]?.id || null
  );
  const [preview, setPreview] = useState({ loading: false, items: [], title: "" });
  const [isPending, startTransition] = useTransition();

  const destinationsForCountry = useMemo(() => {
    if (!tripCountryId) return destinations;
    return destinations.filter((d) => d.country_id === tripCountryId);
  }, [destinations, tripCountryId]);

  const accommodationsByScope = useMemo(
    () => (day) => filterByScope(accommodations, day.destination_id, tripCountryId),
    [accommodations, tripCountryId]
  );

  const itinerariesByScope = useMemo(
    () => (day) => filterByScope(dayItineraries, day.destination_id, tripCountryId),
    [dayItineraries, tripCountryId]
  );

  function markSaving(dayId, state) {
    setSaving((prev) => ({ ...prev, [dayId]: state }));
    if (state !== "error") {
      setErrors((prev) => ({ ...prev, [dayId]: "" }));
    }
  }

  async function handleUpdate(dayId, patch) {
    markSaving(dayId, "saving");
    try {
      await onUpdateDay(dayId, patch);
      markSaving(dayId, "saved");
      setTimeout(() => markSaving(dayId, ""), 1200);
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        [dayId]: err?.message || "Failed to save",
      }));
      markSaving(dayId, "error");
    }
  }

  function handleFieldChange(day, field, value) {
    const nextDays = days.map((row) =>
      row.id === day.id ? { ...row, [field]: value } : row
    );
    setDays(nextDays);
    handleUpdate(day.id, { [field]: value });
  }

  function handleAddDay() {
    startTransition(async () => {
      try {
        const result = await onAddDay(tripId);
        if (result?.day) {
          setDays((prev) => [...prev, result.day]);
          setSelectedDayId(result.day.id);
        }
      } catch (err) {
        setErrors((prev) => ({
          ...prev,
          _global: err?.message || "Failed to add day",
        }));
      }
    });
  }

  async function loadPreview(day) {
    const itineraryId = day?.day_itinerary_id;
    if (!itineraryId) {
      setPreview({ loading: false, items: [], title: "" });
      return;
    }
    setPreview({ loading: true, items: [], title: "" });
    try {
      const res = await fetch(`/api/admin/itineraries/${itineraryId}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Preview failed");
      const items = Array.isArray(json.items) ? json.items : [];
      setPreview({
        loading: false,
        items,
        title: json.name || json.title || "Day itinerary",
      });
    } catch (err) {
      setPreview({
        loading: false,
        items: [],
        title: err?.message || "Preview unavailable",
      });
    }
  }

  useEffect(() => {
    const day = days.find((row) => row.id === selectedDayId);
    if (day) {
      loadPreview(day);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDayId]);

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <section className="space-y-4 rounded-xl border p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Trip Days</h2>
            <p className="text-sm text-muted-foreground">
              Assign destinations, accommodation, and day itineraries to each day.
            </p>
          </div>
          <Button onClick={handleAddDay} disabled={isPending}>
            Add day
          </Button>
        </div>

        {errors._global ? (
          <p className="text-sm text-red-600">{errors._global}</p>
        ) : null}

        <div className="space-y-3">
          {days.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground space-y-3">
              <div>No days yet. Add one to start planning.</div>
              <Button onClick={handleAddDay} disabled={isPending}>
                Add Day 1
              </Button>
            </div>
          ) : null}

          {days.map((day) => {
            const accommodationsForDay = accommodationsByScope(day);
            const itinerariesForDay = itinerariesByScope(day);
            return (
              <div
                key={day.id}
                className={`rounded-lg border p-4 transition ${
                  selectedDayId === day.id ? "border-primary/50 bg-muted/20" : ""
                }`}
                onClick={() => {
                  setSelectedDayId(day.id);
                  loadPreview(day);
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="font-semibold">Day {day.day_index}</div>
                  <div className="text-xs text-muted-foreground">
                    {saving[day.id] === "saving"
                      ? "Saving..."
                      : saving[day.id] === "saved"
                        ? "Saved"
                        : saving[day.id] === "error"
                          ? "Error"
                          : " "}
                  </div>
                </div>

                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="text-xs text-muted-foreground">
                      Destination
                    </label>
                    <Select
                      value={day.destination_id || "__none"}
                      onValueChange={(value) =>
                        handleFieldChange(
                          day,
                          "destination_id",
                          value === "__none" ? null : value
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Optional destination" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none">No destination</SelectItem>
                        {destinationsForCountry.map((dest) => (
                          <SelectItem key={dest.id} value={dest.id}>
                            {dest.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">
                      Accommodation
                    </label>
                    <Select
                      value={day.accommodation_id || "__none"}
                      onValueChange={(value) =>
                        handleFieldChange(
                          day,
                          "accommodation_id",
                          value === "__none" ? null : value
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Optional stay" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none">No accommodation</SelectItem>
                        {accommodationsForDay.map((stay) => (
                          <SelectItem key={stay.id} value={stay.id}>
                            {stay.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">
                      Day itinerary
                    </label>
                    <Select
                      value={day.day_itinerary_id || "__none"}
                      onValueChange={(value) => {
                        const nextValue = value === "__none" ? null : value;
                        handleFieldChange(day, "day_itinerary_id", nextValue);
                        if (selectedDayId === day.id) {
                          loadPreview({ ...day, day_itinerary_id: nextValue });
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Optional template" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none">No day itinerary</SelectItem>
                        {itinerariesForDay.map((itinerary) => (
                          <SelectItem key={itinerary.id} value={itinerary.id}>
                            {itinerary.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {errors[day.id] ? (
                  <p className="mt-2 text-xs text-red-600">{errors[day.id]}</p>
                ) : null}

                {onDeleteDay ? (
                  <div className="mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(event) => {
                        event.stopPropagation();
                        onDeleteDay(day.id);
                        setDays((prev) => prev.filter((row) => row.id !== day.id));
                        if (selectedDayId === day.id) {
                          setSelectedDayId(null);
                          setPreview({ loading: false, items: [], title: "" });
                        }
                      }}
                    >
                      Remove day
                    </Button>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>

      <aside className="rounded-xl border p-4">
        <h3 className="text-lg font-semibold">Day itinerary preview</h3>
        <p className="text-sm text-muted-foreground">
          Select a day itinerary to preview its contents.
        </p>

        <div className="mt-4 space-y-2">
          {preview.loading ? (
            <div className="text-sm text-muted-foreground">Loading preview...</div>
          ) : preview.items.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No itinerary selected.
            </div>
          ) : (
            <>
              <div className="text-sm font-semibold">{preview.title}</div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {preview.items.map((item) => (
                  <li key={item.id} className="border-b pb-2 last:border-b-0">
                    <div className="font-medium text-foreground">
                      {item.name || item.title || item.item_type}
                    </div>
                    {item.destination ? (
                      <div className="text-xs">{item.destination}</div>
                    ) : null}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
