// moved from [poi]/page.jsx
import { notFound } from "next/navigation";
import SafeImage from "@/components/SafeImage";
import Link from "next/link";
import { firstImageFromImages, resolveImageUrl } from "@/lib/imageUrl";
import { Card, CardContent } from "@/components/ui/card";
import RichTextReadOnly from "@/components/RichTextReadOnly";
import GygWidget from "@/components/GygWidget";
import {
  getSightBySlugs,
  getSightOpeningHours,
  getSightOpeningExceptions,
} from "@/lib/data/sights";
import { fetchAdmissionPrices } from "@/lib/data/admission";
import { fmtTime, fmtJPY } from "@/lib/format";
import { getRouteParams } from "@/lib/route-params";

export const revalidate = 300;
export const runtime = 'nodejs';


const MONTH_NAMES = [
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

const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function formatMonthDay(month, day) {
  if (!month) return null;
  const name = MONTH_NAMES[(month - 1 + 12) % 12];
  if (!day) return name;
  return `${name} ${day}`;
}

function formatSeasonRange(season) {
  const start = formatMonthDay(season.startMonth, season.startDay);
  const end = formatMonthDay(season.endMonth, season.endDay);
  if (start && end) {
    if (start === end) return start;
    return `${start} – ${end}`;
  }
  return start || end || "Season";
}

function formatDateLabel(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatAdmissionAmount(row) {
  if (row?.is_free) return "Free";
  const raw = row?.amount;
  if (raw === null || raw === undefined || raw === "") return null;
  const currency = (row?.currency || "JPY").toUpperCase();
  const amount = Number(raw);
  if (Number.isNaN(amount)) return null;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch (_) {
    return `${currency} ${amount.toLocaleString()}`;
  }
}

function groupAdmissionsBySubsection(rows = []) {
  const map = new Map();
  rows.forEach((row) => {
    if (!row) return;
    const key = row.subsection ? String(row.subsection).trim() : "";
    const normalizedKey = key.length > 0 ? key : null;
    if (!map.has(normalizedKey)) map.set(normalizedKey, []);
    map.get(normalizedKey).push(row);
  });
  return map;
}

function formatAgeRange(row) {
  const min = row?.min_age !== undefined && row?.min_age !== null && row?.min_age !== ""
    ? Number(row.min_age)
    : null;
  const max = row?.max_age !== undefined && row?.max_age !== null && row?.max_age !== ""
    ? Number(row.max_age)
    : null;
  if (min === null && max === null) return null;
  if (min !== null && max !== null) return `${min}–${max}`;
  if (min !== null) return `${min}+`;
  return `Up to ${max}`;
}

export default async function SightDetailBySlugPage(props) {
  const { params } = await getRouteParams(props);
  const { slug, sight } = params || {};
  const result = await getSightBySlugs(slug, sight).catch(() => null);
  if (!result?.sight || !result?.destination) notFound();
  const { sight: p, destination: dest } = result;
  const openingTimesUrl = p.opening_times_url || null;
  let seasons = [];
  let closures = [];
  const [r, e] = await Promise.all([
    getSightOpeningHours(p.id).catch(() => []),
    getSightOpeningExceptions(p.id).catch(() => []),
  ]);
  const admissions = await fetchAdmissionPrices(p.id).catch(() => []);
  seasons = Array.isArray(r)
    ? r.map((row) => ({
        startMonth: row.start_month ?? null,
        startDay: row.start_day ?? null,
        endMonth: row.end_month ?? null,
        endDay: row.end_day ?? null,
        openTime: row.open_time || null,
        closeTime: row.close_time || null,
        lastEntryMins: row.last_entry_mins ?? 0,
      }))
    : [];
  closures = Array.isArray(e)
    ? e.map((row) => ({
        type: row.type || "fixed",
        startDate: row.start_date || null,
        endDate: row.end_date || null,
        weekday:
          typeof row.weekday === "number" ? row.weekday : row.weekday ?? null,
        note: row.note || null,
      }))
    : [];

  const img = resolveImageUrl(firstImageFromImages(p?.images));

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="border-t-2 border-border pt-2">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl md:text-4xl font-medium text-center md:text-left flex-1">{p.name}</h1>
          <Link href={`/sights/${dest.slug}`} className="underline ml-4">Back</Link>
        </div>
        <div className="border-b-2 border-border mt-3" />
      </div>

      <section className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start">
        <div className="md:col-span-2">
          {img ? (
            <SafeImage
              src={img}
              alt={p.name}
              width={1200}
              height={800}
              className="w-full h-auto rounded-xl object-cover"
            />
          ) : null}
        </div>

        <div className="md:col-span-2">
          {p.summary ? <p className="text-lg leading-relaxed mb-3">{p.summary}</p> : null}
          {Array.isArray(p.tags) && p.tags.length > 0 ? (
            <div className="mb-3 flex flex-wrap gap-2">
              {p.tags.map((t, i) => (
                <span key={i} className="inline-block rounded-full bg-accent text-accent-foreground px-2 py-0.5 text-xs">{t}</span>
              ))}
            </div>
          ) : null}
          {p.body_richtext ? <RichTextReadOnly value={p.body_richtext} /> : null}
        </div>
      </section>

      <section className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-2">Admission Prices</h2>
            {Array.isArray(admissions) && admissions.length > 0 ? (
              Array.from(groupAdmissionsBySubsection(admissions).entries()).map(
                ([subsection, items]) => (
                  <div key={subsection || "__DEFAULT__"} className="space-y-3">
                    {subsection ? (
                      <h3 className="text-lg font-semibold">{subsection}</h3>
                    ) : null}
                    <ul className="space-y-3">
                      {items.map((row) => {
                        const amountLabel = formatAdmissionAmount(row);
                        const ages = formatAgeRange(row);
                        const validFrom = formatDateLabel(row.valid_from);
                        const validTo = formatDateLabel(row.valid_to);
                        const validity = validFrom || validTo ? (
                          <span className="text-xs text-muted-foreground">
                            {validFrom && validTo
                              ? `Valid ${validFrom} – ${validTo}`
                              : validFrom
                              ? `Valid from ${validFrom}`
                              : `Valid until ${validTo}`}
                          </span>
                        ) : null;

                        return (
                          <li
                            key={`${row.id || row.label}-${row.idx}`}
                            className="rounded border px-3 py-2 bg-card text-card-foreground"
                          >
                            <div className="flex flex-col gap-1">
                              <div className="flex flex-wrap items-baseline justify-between gap-2">
                                <span className="font-medium">{row.label}</span>
                                <span className="text-sm text-muted-foreground">
                                  {amountLabel || "See details"}
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                {ages ? <span>Age {ages}</span> : null}
                                {row.requires_id ? (
                                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wide">
                                    ID required
                                  </span>
                                ) : null}
                              </div>
                              {validity}
                              {row.note ? (
                                <span className="text-xs text-muted-foreground">{row.note}</span>
                              ) : null}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )
              )
            ) : (
              <p className="text-muted-foreground">Admission pricing not available.</p>
            )}
          </div>

          <div className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Always check the official website before travelling as schedules can
            change without notice.
            {openingTimesUrl ? (
              <>
                {" "}
                <a
                  href={openingTimesUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium underline"
                >
                  Official site
                </a>
              </>
            ) : null}
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">Seasonal Opening Hours</h2>
            {seasons.length > 0 ? (
              <ul className="space-y-3">
                {seasons.map((season, i) => {
                  const range = formatSeasonRange(season);
                  const timeLabel = `${fmtTime(season.openTime) || "—"} – ${
                    fmtTime(season.closeTime) || "—"
                  }`;
                  return (
                    <li
                      key={`${season.startMonth}-${season.startDay}-${season.endMonth}-${season.endDay}-${i}`}
                      className="rounded border px-3 py-2 bg-card text-card-foreground"
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <span className="font-medium">{range}</span>
                          <span className="text-sm text-muted-foreground">{timeLabel}</span>
                        </div>
                        {season.lastEntryMins ? (
                          <span className="text-xs text-muted-foreground">
                            Last entry {season.lastEntryMins} mins before close
                          </span>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-muted-foreground">Seasonal hours not available.</p>
            )}
          </div>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">Closure Notices</h2>
          {closures.length > 0 ? (
            <ul className="space-y-3">
              {closures.map((closure, i) => {
                let title = "Closure";
                if (closure.type === "weekly" && closure.weekday !== null && closure.weekday !== undefined) {
                  const idx = Number(closure.weekday);
                  title = idx >= 0 && idx < WEEKDAY_NAMES.length
                    ? `Closed every ${WEEKDAY_NAMES[idx]}`
                    : "Recurring closure";
                } else if (closure.type === "range" && closure.startDate && closure.endDate) {
                  const start = formatDateLabel(closure.startDate);
                  const end = formatDateLabel(closure.endDate);
                  if (start && end) {
                    title = `Closed ${start} – ${end}`;
                  }
                } else if (closure.startDate) {
                  const date = formatDateLabel(closure.startDate);
                  if (date) title = `Closed ${date}`;
                }

                return (
                  <li
                    key={`${closure.type}-${closure.startDate}-${closure.endDate}-${closure.weekday}-${i}`}
                    className="rounded border px-3 py-2 bg-card text-card-foreground"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">{title}</span>
                      {closure.note ? (
                        <span className="text-xs text-muted-foreground">{closure.note}</span>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-muted-foreground">No closure notices at this time.</p>
          )}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold mb-2">Popular tours</h2>
        <GygWidget tourId={p.gyg_id} />
      </section>

      <section className="mt-10">
        <Card>
          <CardContent className="p-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="text-sm text-muted-foreground flex flex-wrap gap-3">
                {dest ? (
                  <span>
                    <span className="font-medium text-foreground">Destination:</span>{" "}
                    <Link href={`/destinations/${dest.slug}`} className="underline">{dest.name}</Link>
                  </span>
                ) : null}
                {fmtJPY(p.price_amount) ? (
                  <span><span className="font-medium text-foreground">Price:</span> {fmtJPY(p.price_amount)}</span>
                ) : null}
                {p.duration_minutes ? (
                  <span><span className="font-medium text-foreground">Duration:</span> {p.duration_minutes} min</span>
                ) : null}
              </div>
              {p.deeplink ? (
                <a
                  href={p.deeplink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-4 py-2 hover:opacity-90"
                >
                  {p.provider && String(p.provider).toLowerCase() === "gyg"
                    ? "Book on GetYourGuide"
                    : "Book Now"}
                </a>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
