"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useCallback,
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

// Day constants
const ALL_DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const WEEKDAYS = ["MON", "TUE", "WED", "THU", "FRI"];
const WEEKEND = ["SAT", "SUN"];

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

// Mirror AdmissionEditor: save via admin endpoint with an _action
async function saveOpeningTimesHttp(sightId, payload) {
  const res = await fetch(`/api/admin/sights/${sightId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      _action: "saveOpeningTimes",
      openingTimes: payload,
    }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);
  // Expect server to return a normalized shape similar to { hours, closures, officialUrl }
  return json?.openingTimes || json || {};
}

async function fetchOpeningTimesClient(sightId) {
  const res = await fetch(`/api/admin/sights/${sightId}`, {
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);
  function trimTime(t) {
    if (!t) return "";
    const s = String(t);
    const m = s.match(/^([0-9]{1,2}:[0-9]{2})/);
    return m ? m[1] : s;
  }
  const hours = (json.hours || []).map((h) => ({
    startMonth: typeof h.start_month === "number" ? h.start_month : null,
    startDay: typeof h.start_day === "number" ? h.start_day : null,
    endMonth: typeof h.end_month === "number" ? h.end_month : null,
    endDay: typeof h.end_day === "number" ? h.end_day : null,
    openTime: trimTime(h.open_time || ""),
    closeTime: trimTime(h.close_time || ""),
    lastEntryMins: h.last_entry_mins ?? 0,
    days: Array.isArray(h.days)
      ? h.days.map((d) => String(d || "").trim().toUpperCase()).filter(Boolean)
      : [],
    isClosed: !!h.is_closed,
  }));
  const closures = (json.exceptions || []).map((c) => ({
    type: c.type || "fixed",
    startDate: c.start_date || null, // strings (YYYY-MM-DD)
    endDate: c.end_date || null,
    weekday: typeof c.weekday === "number" ? c.weekday : undefined,
    notes: c.note || "",
  }));
  const officialUrl = json?.sight?.opening_times_url || "";
  return { hours, closures, officialUrl };
}

function isValidMonthDay(month, day) {
  if (!month) return false;
  if (!day) return true; // day optional
  const test = new Date(2024, month - 1, day); // leap year to allow Feb 29
  return test.getMonth() === month - 1 && test.getDate() === day;
}

const DAY_ORDER = ["SAT", "SUN", "MON", "TUE", "WED", "THU", "FRI"];
const DAY_LABEL = {
  MON: "Monday",
  TUE: "Tuesday",
  WED: "Wednesday",
  THU: "Thursday",
  FRI: "Friday",
  SAT: "Saturday",
  SUN: "Sunday",
};

function fmtMonthRangeLabel(
  startMonth,
  endMonth,
  startDay = null,
  endDay = null
) {
  const sm =
    MONTH_OPTIONS.find((m) => m.value === (startMonth || 1))?.label ||
    "January";
  const em =
    MONTH_OPTIONS.find((m) => m.value === (endMonth || 12))?.label ||
    "December";
  if (startMonth === endMonth) {
    const sd = startDay ? ` ${startDay}` : "";
    const ed = endDay && endDay !== startDay ? `–${endDay}` : "";
    return `${sm}${sd}${ed}`;
  }
  return `${sm} – ${em}`;
}

function fmtTime12h(hhmm = "") {
  if (!hhmm) return "";
  const [hStr, mStr] = hhmm.split(":");
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr || "0", 10);
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}${m ? `:${String(m).padStart(2, "0")}` : ""} ${ampm}`;
}

function pickRuleForDay(rules, dayCode) {
  // Prefer explicit day match; otherwise fall back to a rule with no days (treat as all-days)
  if (!Array.isArray(rules)) return null;
  const explicit = rules.find(
    (r) => Array.isArray(r.days) && r.days.includes(dayCode)
  );
  if (explicit) return explicit;
  return rules.find((r) => !Array.isArray(r.days) || r.days.length === 0) || null;
}

function normalizeRangeKey(h) {
  const sm = h.startMonth || 1;
  const sd = h.startDay || 1;
  const em = h.endMonth || 12;
  const ed = h.endDay || 31;
  return `${sm}:${sd}-${em}:${ed}`;
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
              "h-9 w-full justify-start px-3 text-left text-sm font-normal",
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

function OpeningHoursPreview({ hours }) {
  const groups = (hours || []).reduce((acc, h) => {
    const key = normalizeRangeKey(h);
    if (!acc[key]) {
      acc[key] = {
        key,
        rules: [],
        label: fmtMonthRangeLabel(
          h.startMonth,
          h.endMonth,
          h.startDay,
          h.endDay
        ),
      };
    }
    acc[key].rules.push(h);
    return acc;
  }, {});
  const groupList = Object.values(groups);
  if (groupList.length === 0) return null;

  return (
    <div className="space-y-6">
      {groupList.map((g) => (
        <div key={g.key} className="rounded-lg border">
          <div className="border-b px-4 py-2 text-sm font-semibold">
            {g.label}
          </div>
          <div className="p-4">
            <ul className="space-y-1">
              {DAY_ORDER.map((day) => {
                const rule = pickRuleForDay(g.rules, day);

                return (
                  <li
                    key={day}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="font-medium">{DAY_LABEL[day]}</span>
                    {(() => {
                      if (!rule) {
                        return <span>—</span>;
                      }
                      if (rule.isClosed) {
                        return <span>Closed</span>;
                      }
                      const range = `${fmtTime12h(rule.openTime)}–${fmtTime12h(
                        rule.closeTime
                      )}`;
                      return (
                        <span className="flex items-center gap-2">
                          <span>{range}</span>
                          {rule.lastEntryMins > 0 ? (
                            <span className="text-xs text-muted-foreground">
                              · Last entry {rule.lastEntryMins} min before
                            </span>
                          ) : null}
                        </span>
                      );
                    })()}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
}

const OpeningTimes = forwardRef(function OpeningTimes({ sightId }, ref) {
  const [hours, setHours] = useState([]);
  const [closures, setClosures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [officialUrl, setOfficialUrl] = useState("");

  const seasonHasError = (h) => {
    if (!h.startMonth) return "Start month required";
    if (!isValidMonthDay(h.startMonth, h.startDay)) return "Start day invalid";
    if (!h.endMonth) return "End month required";
    if (!isValidMonthDay(h.endMonth, h.endDay)) return "End day invalid";
    if (h.isClosed) return "";
    if ((h.openTime && !h.closeTime) || (!h.openTime && h.closeTime))
      return "Provide both open and close times";
    if (h.openTime && h.closeTime && h.closeTime <= h.openTime)
      return "Close must be later than open";
    return "";
  };

  const canSave = useMemo(() => {
    if (!sightId) return false;
    if (saving || loading) return false;
    // Allow saving if no seasons/closures yet (to save officialUrl), otherwise require valid seasons
    if ((hours?.length || 0) === 0 && (closures?.length || 0) === 0)
      return true;
    return (hours || []).every((h) => seasonHasError(h) === "");
  }, [sightId, saving, loading, hours, closures]);

  useEffect(() => {
    if (!sightId) {
      setHours([]);
      setClosures([]);
      setOfficialUrl("");
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError("");
    fetchOpeningTimesClient(sightId)
      .then(({ hours, closures, officialUrl }) => {
        if (cancelled) return;
        setHours(hours);
        setClosures(
          (closures || []).map((c) => ({
            ...c,
            startDate: c.startDate ? new Date(c.startDate) : null,
            endDate: c.endDate ? new Date(c.endDate) : null,
          }))
        );
        setOfficialUrl(officialUrl || "");
      })
      .catch((e) => {
        if (!cancelled) setError(e?.message || "Failed to load opening times");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
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
        days: [],
        isClosed: false,
      },
    ]);
  };

  const updateHour = (i, field, value) => {
    const updated = [...hours];
    updated[i][field] = value;
    setHours(updated);
  };

  const toggleHourClosed = (index, nextClosed) => {
    setHours((current) => {
      const list = Array.isArray(current) ? [...current] : [];
      const base = list[index] ? { ...list[index] } : {};
      const isClosed = !!nextClosed;
      base.isClosed = isClosed;
      if (isClosed) {
        base.openTime = "";
        base.closeTime = "";
        base.lastEntryMins = 0;
      }
      list[index] = base;
      return list;
    });
  };

  const removeHour = (i) => setHours(hours.filter((_, idx) => idx !== i));

  const addClosure = () => {
    setClosures([
      ...closures,
      {
        type: "fixed",
        startDate: null,
        endDate: null,
        weekday: undefined,
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

  const persistOpeningTimes = useCallback(
    async (targetId = sightId) => {
      if (!targetId)
        throw new Error("Save the sight before saving opening times");
      setSaving(true);
      setLoading(true);
      setError("");
      try {
        // Normalize hours and closures prior to saving
        const hoursToSave = (hours || []).map((h) => ({
          startMonth: h.startMonth ?? null,
          startDay: h.startDay ?? null,
          endMonth: h.endMonth ?? null,
          endDay: h.endDay ?? null,
          openTime: h.isClosed ? "" : h.openTime || "",
          closeTime: h.isClosed ? "" : h.closeTime || "",
          lastEntryMins: h.isClosed
            ? 0
            : typeof h.lastEntryMins === "number"
            ? h.lastEntryMins
            : h.lastEntryMins
            ? Number(h.lastEntryMins)
            : 0,
          days: Array.isArray(h.days)
            ? h.days
                .map((d) => String(d || "").trim().toUpperCase())
                .filter(Boolean)
            : [],
          isClosed: !!h.isClosed,
        }));

        const closuresToSave = (closures || []).map((c) => ({
          type: c.type || "fixed",
          startDate:
            c.startDate instanceof Date
              ? format(c.startDate, "yyyy-MM-dd")
              : c.startDate || null,
          endDate:
            c.endDate instanceof Date
              ? format(c.endDate, "yyyy-MM-dd")
              : c.endDate || null,
          weekday:
            typeof c.weekday === "number"
              ? c.weekday
              : c.weekday
              ? Number(c.weekday)
              : undefined,
          notes: c.notes || "",
        }));

        // Unified admin endpoint (parity with AdmissionEditor)
        const saved = await saveOpeningTimesHttp(targetId, {
          hours: hoursToSave,
          closures: closuresToSave,
          officialUrl: officialUrl.trim(),
        });

        // Normalize response into editor state without reloading again
        setHours(
          (saved.hours || []).map((h) => ({
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
            days: Array.isArray(h.days)
              ? h.days
                  .map((d) => String(d || "").trim().toUpperCase())
                  .filter(Boolean)
              : [],
            isClosed: !!h.isClosed,
          }))
        );
        setClosures(
          (saved.closures || []).map((c) => ({
            type: c.type || "fixed",
            startDate: c.startDate
              ? c.startDate instanceof Date
                ? c.startDate
                : new Date(c.startDate)
              : null,
            endDate: c.endDate
              ? c.endDate instanceof Date
                ? c.endDate
                : new Date(c.endDate)
              : null,
            weekday:
              typeof c.weekday === "number"
                ? c.weekday
                : c.weekday
                ? Number(c.weekday)
                : undefined,
            notes: c.notes || "",
          }))
        );
        setOfficialUrl(saved.officialUrl || "");
        setMessage("Opening hours saved");
        return saved;
      } catch (e) {
        setError(e?.message || "Failed to save opening times");
        throw e;
      } finally {
        setSaving(false);
        setLoading(false);
      }
    },
    [sightId, hours, closures, officialUrl]
  );

  useImperativeHandle(
    ref,
    () => ({
      save: persistOpeningTimes,
    }),
    [persistOpeningTimes]
  );

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(""), 3000);
    return () => clearTimeout(timer);
  }, [message]);

  return (
    <div className="space-y-6">
      {!sightId ? (
        <div className="rounded border border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          Save the sight first to enable opening hours.
        </div>
      ) : null}

      <Card>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold">Opening Hours & Exceptions</h2>
            <div className="flex items-center gap-2">
              <Button
                onClick={addHour}
                size="sm"
                className="h-9 px-3"
                disabled={!sightId || loading || saving}
              >
                + Add Season
              </Button>
              <Button
                onClick={addClosure}
                size="sm"
                className="h-9 px-3"
                disabled={!sightId || loading || saving}
              >
                + Add Closure
              </Button>
            </div>
          </div>

          {saving ? (
            <p className="text-xs text-muted-foreground">
              Saving opening hours…
            </p>
          ) : loading ? (
            <p className="text-xs text-muted-foreground">
              Loading opening hours…
            </p>
          ) : null}

          {error ? (
            <div className="rounded border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </div>
          ) : null}

          {message ? (
            <div className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {message}
            </div>
          ) : null}

          {sightId && !loading && hours.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No seasons yet. Add one to begin.
            </p>
          ) : null}

          <div className="space-y-4">
            {hours.map((h, i) => {
              const err = seasonHasError(h);
              return (
                <div
                  key={i}
                  className="grid grid-cols-[140px_minmax(360px,3fr)_110px_140px_110px_120px_120px_110px_140px_auto] gap-2 items-end border p-3 rounded-lg text-sm"
                >
                  <div className="flex flex-col gap-1 w-[140px]">
                    <Label>Start Month</Label>
                    <Select
                      value={h.startMonth ? String(h.startMonth) : ""}
                      onValueChange={(val) =>
                        updateHour(i, "startMonth", Number(val))
                      }
                    >
                      <SelectTrigger className="h-9 w-full text-sm">
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
                  {/* Days selection column */}
                  <div className="flex flex-col gap-1 min-w-[360px] w-full">
                    <Label>Days</Label>
                    <div className="flex flex-wrap gap-1">
                      {ALL_DAYS.map((d) => {
                        const checked = Array.isArray(h.days)
                          ? h.days.includes(d)
                          : false;
                        return (
                          <label
                            key={d}
                            className="flex items-center gap-1.5 text-xs border rounded px-2 py-1 whitespace-nowrap shrink-0 min-w-[64px] justify-center"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                const next = new Set(h.days || []);
                                if (e.target.checked) next.add(d);
                                else next.delete(d);
                                updateHour(i, "days", Array.from(next));
                              }}
                            />
                            <span>{d}</span>
                          </label>
                        );
                      })}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="h-7 px-2"
                        onClick={() => updateHour(i, "days", [...WEEKDAYS])}
                      >
                        Weekdays
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="h-7 px-2"
                        onClick={() => updateHour(i, "days", [...WEEKEND])}
                      >
                        Weekend
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2"
                        onClick={() => updateHour(i, "days", [])}
                      >
                        Clear
                      </Button>
                    </div>
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
                      className="h-9 w-full px-3 text-sm"
                      placeholder="Day"
                    />
                  </div>
                  <div className="flex flex-col gap-1 w-[140px]">
                    <Label>End Month</Label>
                    <Select
                      value={h.endMonth ? String(h.endMonth) : ""}
                      onValueChange={(val) =>
                        updateHour(i, "endMonth", Number(val))
                      }
                    >
                      <SelectTrigger className="h-9 w-full text-sm">
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
                      className="h-9 w-full px-3 text-sm"
                      placeholder="Day"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label>Open</Label>
                    <Input
                      type="time"
                      value={h.openTime}
                      onChange={(e) =>
                        updateHour(i, "openTime", e.target.value)
                      }
                      className="h-9 w-full px-3 text-sm"
                      disabled={!!h.isClosed}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label>Close</Label>
                    <Input
                      type="time"
                      value={h.closeTime}
                      onChange={(e) =>
                        updateHour(i, "closeTime", e.target.value)
                      }
                      className="h-9 w-full px-3 text-sm"
                      disabled={!!h.isClosed}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label htmlFor={`closed-${i}`}>Closed</Label>
                    <div className="flex h-9 items-center gap-2 rounded border px-3">
                      <input
                        id={`closed-${i}`}
                        type="checkbox"
                        checked={!!h.isClosed}
                        onChange={(event) =>
                          toggleHourClosed(i, event.target.checked)
                        }
                        className="h-4 w-4"
                      />
                      <span className="text-xs text-muted-foreground">
                        {h.isClosed ? "Closed" : "Open"}
                      </span>
                    </div>
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
                      className="h-9 w-full px-3 text-sm"
                      disabled={!!h.isClosed}
                    />
                  </div>
                  <div className="flex items-end justify-end gap-1">
                    <Button
                      variant="destructive"
                      onClick={() => removeHour(i)}
                      className="h-9 px-3 text-sm w-auto"
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
          </div>

          <div className="space-y-4">
            {closures.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No closures yet. Add one to begin.
              </p>
            ) : (
              closures.map((c, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[minmax(180px,2fr)_repeat(3,minmax(0,1fr))_auto] gap-2 items-end border p-3 rounded-lg text-sm"
                >
                  <div className="flex flex-col gap-1">
                    <Label>Type</Label>
                    <Select
                      value={c.type}
                      onValueChange={(val) => updateClosure(i, "type", val)}
                    >
                      <SelectTrigger className="h-9 w-full text-sm">
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
                        <SelectTrigger className="h-9 w-full text-sm">
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
                      onChange={(e) =>
                        updateClosure(i, "notes", e.target.value)
                      }
                      className="h-9 w-full px-3 text-sm"
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button
                      variant="destructive"
                      onClick={() => removeClosure(i)}
                      className="h-9 px-3 text-sm"
                      size="sm"
                      disabled={!sightId || saving || loading}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex justify-start">
            <Button
              onClick={() => {
                persistOpeningTimes().catch(() => {});
              }}
              size="sm"
              className="h-9 px-4"
              disabled={!canSave}
            >
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>

          {/* Read-only preview of what travellers will see */}
          <div className="space-y-2 border-t pt-4">
            <Label className="text-sm font-medium">Preview</Label>
            <OpeningHoursPreview hours={hours} />
          </div>

          <div className="space-y-2 border-t pt-4">
            <Label className="text-sm font-medium">
              Official opening hours link
            </Label>
            <Input
              type="url"
              value={officialUrl}
              onChange={(event) => setOfficialUrl(event.target.value)}
              placeholder="https://example.com/opening-times"
              className="max-w-xl"
              disabled={!sightId || loading}
            />
            <p className="text-xs text-muted-foreground">
              Provide the venue&rsquo;s official site so travellers can confirm
              the latest opening hours.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

export default OpeningTimes;
