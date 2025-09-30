"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

// shadcn ui
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  loadOpeningTimes,
  saveOpeningTimes,
  toISODate,
} from "@/lib/data/openingTimesApi";

const MONTH_OPTIONS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
].map((label, idx) => ({ label, value: idx + 1 }));

function isValidMonthDay(month, day) {
  if (!month) return false;
  if (!day) return true; // day optional
  const test = new Date(2024, month - 1, day); // leap year to allow Feb 29
  return test.getMonth() === month - 1 && test.getDate() === day;
}

// --- Small helper: Date picker field using shadcn Calendar + Popover ---
function DatePickerField({
  label,
  value,
  onChange,
  placeholder = "Pick a date",
  className = "",
}) {
  return (
    <div className={cn("min-w-[140px]", className)}>
      <Label className="mb-1 block text-xs font-medium">{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "h-8 w-full justify-start px-2 text-left text-xs font-normal",
              !value && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-3.5 w-3.5" />
            {value ? format(value, "dd/MM/yy") : <span>{placeholder}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value || undefined}
            onSelect={(d) => onChange(d ?? null)}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

const OpeningTimes = forwardRef(function OpeningTimes({ sightId }, ref) {
  const [hours, setHours] = useState([]); // items contain Date objects now
  const [closures, setClosures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!sightId) {
      setHours([]);
      setClosures([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError("");
    loadOpeningTimes(sightId)
      .then(({ hours, closures }) => {
        if (cancelled) return;
        setHours(
          (hours || []).map((h) => ({
            startMonth:
              typeof h.startMonth === "number"
                ? h.startMonth
                : h.startMonth
                ? Number(h.startMonth)
                : null,
            startDay:
              typeof h.startDay === "number"
                ? h.startDay
                : h.startDay
                ? Number(h.startDay)
                : null,
            endMonth:
              typeof h.endMonth === "number"
                ? h.endMonth
                : h.endMonth
                ? Number(h.endMonth)
                : null,
            endDay:
              typeof h.endDay === "number"
                ? h.endDay
                : h.endDay
                ? Number(h.endDay)
                : null,
            openTime: h.openTime || "",
            closeTime: h.closeTime || "",
            lastEntryMins:
              typeof h.lastEntryMins === "number"
                ? h.lastEntryMins
                : h.lastEntryMins
                ? Number(h.lastEntryMins)
                : 0,
          }))
        );
        setClosures(closures || []);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e?.message || "Failed to load opening times");
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [sightId]);

  const addHour = () => {
    setHours([
      ...hours,
      {
        startMonth: null,
        startDay: null,
        endMonth: null,
        endDay: null,
        openTime: "",
        closeTime: "",
        lastEntryMins: 30,
      },
    ]);
  };

  const updateHour = (i, field, value) => {
    const updated = [...hours];
    updated[i][field] = value;
    setHours(updated);
  };

  const removeHour = (i) => setHours(hours.filter((_, idx) => idx !== i));

  const addClosure = () => {
    setClosures([
      ...closures,
      {
        type: "fixed", // "fixed" | "range" | "weekly"
        startDate: null, // Date | null
        endDate: null, // Date | null
        weekday: undefined, // 0..6
        notes: "",
      },
    ]);
  };

  const updateClosure = (i, field, value) => {
    const updated = [...closures];
    updated[i][field] = value;
    setClosures(updated);
  };

  const removeClosure = (i) =>
    setClosures(closures.filter((_, idx) => idx !== i));

  async function persistOpeningTimes(targetId = sightId) {
    if (!targetId)
      throw new Error("Save the sight before saving opening times");
    setSaving(true);
    setLoading(true);
    setError("");
    try {
      await saveOpeningTimes(targetId, { hours, closures });
      const refreshed = await loadOpeningTimes(targetId);
      setHours(refreshed.hours || []);
      setClosures(refreshed.closures || []);
    } catch (e) {
      setError(e?.message || "Failed to save opening times");
      throw e;
    } finally {
      setSaving(false);
      setLoading(false);
    }
  }

  useImperativeHandle(ref, () => ({
    save: persistOpeningTimes,
  }));

  const debugPayload = useMemo(() => {
    const hourRows = (hours || []).map((h) => ({
      sight_id: sightId || null,
      start_month: h.startMonth ?? null,
      start_day: h.startDay ?? null,
      end_month: h.endMonth ?? null,
      end_day: h.endDay ?? null,
      open_time: h.openTime || "",
      close_time: h.closeTime || "",
      last_entry_mins: Number(h.lastEntryMins) || 0,
    }));
    const excRows = (closures || []).map((c) => ({
      sight_id: sightId || null,
      type: c.type,
      start_date: toISODate(c.startDate),
      end_date: toISODate(c.endDate),
      weekday:
        c.weekday === undefined || c.weekday === null || c.weekday === ""
          ? null
          : Number(c.weekday),
      note: c.notes || null,
    }));
    return { hours: hourRows, closures: excRows };
  }, [hours, closures, sightId]);

  // Minimal validation helpers (client-side only)
  const seasonHasError = (h) => {
    if (!h.startMonth) return "Start month required";
    if (!isValidMonthDay(h.startMonth, h.startDay)) return "Start day invalid";
    if (!h.endMonth) return "End month required";
    if (!isValidMonthDay(h.endMonth, h.endDay)) return "End day invalid";
    if ((h.openTime && !h.closeTime) || (!h.openTime && h.closeTime))
      return "Provide both open and close times";
    if (h.openTime && h.closeTime && h.closeTime <= h.openTime)
      return "Close must be later than open";
    return "";
  };

  return (
    <div className="space-y-6">
      {!sightId ? (
        <div className="rounded border border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          Save the sight first to enable opening hours.
        </div>
      ) : null}

      {/* Opening Hours */}
      <Card>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Opening Hours (by season)</h2>
            <Button
              onClick={addHour}
              size="sm"
              className="h-8 px-3"
              disabled={!sightId || loading || saving}
            >
              + Add Season
            </Button>
          </div>

          {loading ? (
            <p className="text-xs text-muted-foreground">
              Loading opening hours…
            </p>
          ) : null}

          {error ? (
            <div className="rounded border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </div>
          ) : null}

          {sightId && !loading && hours.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No seasons yet. Add one to begin.
            </p>
          )}

          {hours.map((h, i) => {
            const err = seasonHasError(h);
            return (
              <div
                key={i}
                className="grid grid-cols-[repeat(7,minmax(0,1fr))_auto] gap-2 items-end border p-3 rounded-lg text-xs"
              >
                <div className="flex flex-col gap-1 min-w-[120px]">
                  <Label>Start Month</Label>
                  <Select
                    value={h.startMonth ? String(h.startMonth) : ""}
                    onValueChange={(val) =>
                      updateHour(i, "startMonth", Number(val))
                    }
                  >
                    <SelectTrigger className="h-8 w-full text-xs">
                      <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTH_OPTIONS.map((m) => (
                        <SelectItem key={m.value} value={String(m.value)}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1 min-w-[110px]">
                  <Label>Start Day</Label>
                  <Input
                    type="number"
                    min={1}
                    max={31}
                    value={h.startDay ?? ""}
                    onChange={(e) =>
                      updateHour(
                        i,
                        "startDay",
                        e.target.value ? Number(e.target.value) : null
                      )
                    }
                    className="h-8 w-full px-2 text-xs"
                    placeholder="Day"
                  />
                </div>
                <div className="flex flex-col gap-1 min-w-[120px]">
                  <Label>End Month</Label>
                  <Select
                    value={h.endMonth ? String(h.endMonth) : ""}
                    onValueChange={(val) =>
                      updateHour(i, "endMonth", Number(val))
                    }
                  >
                    <SelectTrigger className="h-8 w-full text-xs">
                      <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTH_OPTIONS.map((m) => (
                        <SelectItem key={m.value} value={String(m.value)}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1 min-w-[110px]">
                  <Label>End Day</Label>
                  <Input
                    type="number"
                    min={1}
                    max={31}
                    value={h.endDay ?? ""}
                    onChange={(e) =>
                      updateHour(
                        i,
                        "endDay",
                        e.target.value ? Number(e.target.value) : null
                      )
                    }
                    className="h-8 w-full px-2 text-xs"
                    placeholder="Day"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label>Open</Label>
                  <Input
                    type="time"
                    value={h.openTime}
                    onChange={(e) => updateHour(i, "openTime", e.target.value)}
                    className="h-8 w-full px-2 text-xs"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label>Close</Label>
                  <Input
                    type="time"
                    value={h.closeTime}
                    onChange={(e) => updateHour(i, "closeTime", e.target.value)}
                    className="h-8 w-full px-2 text-xs"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label>Last Entry (mins)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={h.lastEntryMins}
                    onChange={(e) =>
                      updateHour(
                        i,
                        "lastEntryMins",
                        e.target.value === ""
                          ? 0
                          : Number.isFinite(Number(e.target.value))
                          ? Number(e.target.value)
                          : h.lastEntryMins
                      )
                    }
                    className="h-8 w-full px-2 text-xs"
                  />
                </div>
                <div className="flex flex-col justify-end gap-1">
                  <Button
                    variant="destructive"
                    onClick={() => removeHour(i)}
                    className="h-8 px-3 text-xs"
                    size="sm"
                    disabled={!sightId || saving || loading}
                  >
                    Remove
                  </Button>
                  {err && <span className="text-xs text-red-600">{err}</span>}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Closures */}
      <Card>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Closures / Exceptions</h2>
            <Button
              onClick={addClosure}
              size="sm"
              className="h-8 px-3"
              disabled={!sightId || loading || saving}
            >
              + Add Closure
            </Button>
          </div>

          {sightId && !loading && closures.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No closures yet. Add one to begin.
            </p>
          )}

          {closures.map((c, i) => (
            <div
              key={i}
              className="grid grid-cols-[minmax(180px,2fr)_repeat(3,minmax(0,1fr))_auto] gap-2 items-end border p-3 rounded-lg text-xs"
            >
              <div className="flex flex-col gap-1">
                <Label>Type</Label>
                <Select
                  value={c.type}
                  onValueChange={(val) => updateClosure(i, "type", val)}
                >
                  <SelectTrigger className="h-8 w-full text-xs">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixed Date</SelectItem>
                    <SelectItem value="range">Date Range</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {c.type === "fixed" && (
                <DatePickerField
                  label="Date"
                  value={c.startDate}
                  onChange={(d) => updateClosure(i, "startDate", d)}
                  className="w-full"
                />
              )}

              {c.type === "range" && (
                <>
                  <DatePickerField
                    label="Start"
                    value={c.startDate}
                    onChange={(d) => updateClosure(i, "startDate", d)}
                    className="w-full"
                  />
                  <DatePickerField
                    label="End"
                    value={c.endDate}
                    onChange={(d) => updateClosure(i, "endDate", d)}
                    className="w-full"
                  />
                </>
              )}

              {c.type === "weekly" && (
                <div className="flex flex-col gap-1">
                  <Label>Weekday</Label>
                  <Select
                    value={(c.weekday ?? "").toString()}
                    onValueChange={(val) =>
                      updateClosure(i, "weekday", parseInt(val, 10))
                    }
                  >
                    <SelectTrigger className="h-8 w-full text-xs">
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Sunday</SelectItem>
                      <SelectItem value="1">Monday</SelectItem>
                      <SelectItem value="2">Tuesday</SelectItem>
                      <SelectItem value="3">Wednesday</SelectItem>
                      <SelectItem value="4">Thursday</SelectItem>
                      <SelectItem value="5">Friday</SelectItem>
                      <SelectItem value="6">Saturday</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex flex-col gap-1">
                <Label>Notes</Label>
                <Input
                  value={c.notes || ""}
                  onChange={(e) => updateClosure(i, "notes", e.target.value)}
                  className="h-8 w-full px-2 text-xs"
                />
              </div>

              <div className="flex justify-end">
                <Button
                  variant="destructive"
                  onClick={() => removeClosure(i)}
                  className="h-8 px-3 text-xs"
                  size="sm"
                  disabled={!sightId || saving || loading}
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <h2 className="text-lg font-bold">Debug Output</h2>
          <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
            {JSON.stringify(debugPayload, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
});

export default OpeningTimes;
