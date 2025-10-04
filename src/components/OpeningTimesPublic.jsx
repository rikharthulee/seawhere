import { Label } from "@/components/ui/label";

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

const WEEKDAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const MONTH_LABELS = [
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
];

function formatMonthLabel(value) {
  const idx = Number(value) - 1;
  return idx >= 0 && idx < MONTH_LABELS.length ? MONTH_LABELS[idx] : null;
}

function normaliseRangeKey({ startMonth, startDay, endMonth, endDay }) {
  const sm = startMonth ?? 1;
  const sd = startDay ?? 1;
  const em = endMonth ?? 12;
  const ed = endDay ?? 31;
  return `${sm}:${sd}-${em}:${ed}`;
}

function formatSeasonLabel({ startMonth, startDay, endMonth, endDay }) {
  const startMonthLabel = formatMonthLabel(startMonth) || "January";
  const endMonthLabel = formatMonthLabel(endMonth) || "December";

  if (startMonth && endMonth && startMonth === endMonth) {
    const startSuffix = startDay ? ` ${startDay}` : "";
    const endSuffix = endDay && endDay !== startDay ? `–${endDay}` : "";
    return `${startMonthLabel}${startSuffix}${endSuffix}`;
  }

  return `${startMonthLabel} – ${endMonthLabel}`;
}

function formatDayList(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) =>
      String(item || "")
        .trim()
        .toUpperCase()
    )
    .filter(Boolean);
}

function pickRuleForDay(rules, dayCode) {
  if (!Array.isArray(rules)) return null;

  let fallback = null;
  for (const rule of rules) {
    if (!rule) continue;
    if (!Array.isArray(rule.days)) {
      rule.days = formatDayList(rule.days);
    }
    const days = Array.isArray(rule.days) ? rule.days : [];
    if (days.length === 0 && !fallback) {
      fallback = rule;
    }
    if (days.includes(dayCode)) {
      return rule;
    }
  }
  return fallback;
}

function formatTimeTo12h(value) {
  if (!value) return "";
  const [hh = "0", mm = "00"] = String(value).split(":");
  const hours = Number.parseInt(hh, 10);
  if (Number.isNaN(hours)) return value;
  const minutes = Number.parseInt(mm, 10) || 0;
  const suffix = hours >= 12 ? "PM" : "AM";
  const normalised = hours % 12 || 12;
  const minutePart = minutes > 0 ? `:${String(minutes).padStart(2, "0")}` : "";
  return `${normalised}${minutePart} ${suffix}`;
}

function groupHoursBySeason(hours = []) {
  const map = new Map();
  hours.forEach((hour) => {
    const key = normaliseRangeKey(hour || {});
    if (!map.has(key)) {
      map.set(key, {
        key,
        label: formatSeasonLabel(hour || {}),
        rules: [],
      });
    }
    map.get(key).rules.push(hour);
  });
  return Array.from(map.values());
}

function formatClosure(closure) {
  if (!closure) return { title: "Closure", note: "" };
  const note = closure.notes ? closure.notes.trim() : "";

  if (closure.type === "weekly") {
    const idx = Number(closure.weekday);
    if (Number.isInteger(idx) && idx >= 0 && idx < WEEKDAY_LABELS.length) {
      return { title: `Closed every ${WEEKDAY_LABELS[idx]}`, note };
    }
    return { title: "Closed weekly", note };
  }

  const formatDate = (value) => {
    if (!value) return null;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (closure.type === "range") {
    const start = formatDate(closure.startDate);
    const end = formatDate(closure.endDate);
    if (start && end) {
      return { title: `Closed ${start} – ${end}`, note };
    }
    if (start) return { title: `Closed from ${start}`, note };
    if (end) return { title: `Closed until ${end}`, note };
  }

  const fixed = formatDate(closure.startDate);
  if (fixed) {
    return { title: `Closed on ${fixed}`, note };
  }

  return { title: "Closure", note };
}

export default function OpeningTimesPublic({ openingTimes }) {
  const hours = Array.isArray(openingTimes?.hours)
    ? openingTimes.hours.map((hour) => ({
        ...hour,
        days: formatDayList(hour?.days),
      }))
    : [];
  const closures = Array.isArray(openingTimes?.closures)
    ? openingTimes.closures
    : [];
  const officialUrl = openingTimes?.officialUrl
    ? String(openingTimes.officialUrl).trim()
    : "";

  const grouped = groupHoursBySeason(hours);

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">Opening Times</h2>
        {grouped.length > 0 ? (
          <div className="space-y-3">
            {grouped.map((group) => (
              <div key={group.key} className="rounded border">
                <div className="border-b bg-muted/40 px-3 py-2 text-sm font-medium">
                  {group.label}
                </div>
                <ul className="space-y-1 px-3 py-2 text-sm">
                  {DAY_ORDER.map((dayCode) => {
                    const rule = pickRuleForDay(group.rules, dayCode);
                    const isClosed =
                      !rule ||
                      rule.isClosed ||
                      !rule.openTime ||
                      !rule.closeTime;
                    return (
                      <li
                        key={dayCode}
                        className="flex items-center justify-between gap-3"
                      >
                        <span className="font-medium text-foreground">
                          {DAY_LABEL[dayCode]}
                        </span>
                        {isClosed ? (
                          <span className="text-muted-foreground">Closed</span>
                        ) : (
                          <span className="flex items-center gap-2 text-foreground">
                            <span>
                              {formatTimeTo12h(rule.openTime)} –{" "}
                              {formatTimeTo12h(rule.closeTime)}
                            </span>
                            {rule.lastEntryMins > 0 ? (
                              <span className="text-xs text-muted-foreground">
                                · Last entry {rule.lastEntryMins} min before
                              </span>
                            ) : null}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Opening times not published.
          </p>
        )}
      </div>

      <div className="space-y-3">
        <Label className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Closures
        </Label>
        {closures.length > 0 ? (
          <ul className="space-y-2 text-sm">
            {closures.map((closure, index) => {
              const { title, note } = formatClosure(closure);
              return (
                <li
                  key={`${closure.type}-${closure.startDate}-${closure.endDate}-${closure.weekday}-${index}`}
                  className="rounded border px-3 py-2"
                >
                  <div className="flex flex-col gap-1">
                    <span className="font-medium text-foreground">{title}</span>
                    {note ? (
                      <span className="text-xs text-muted-foreground">
                        {note}
                      </span>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No planned closures.</p>
        )}
      </div>

      {(officialUrl?.length ?? 0) > 0 ? (
        <div className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <a
            href={officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline"
          >
            View official hours →
          </a>{" "}
          Always check the official website before travelling as schedules can
          change without notice.
        </div>
      ) : null}
    </div>
  );
}
