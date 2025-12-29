import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Check, X } from "lucide-react";
import SafeImage from "@/components/SafeImage";
import { resolveImageUrl } from "@/lib/imageUrl";
import { getCuratedDayItineraryBySlugPublic } from "@/lib/data/public/itineraries";
import { getPublicDB } from "@/lib/supabase/public";
import { destinationItemPath } from "@/lib/routes";
import ItineraryTimeline from "@/components/day-itineraries/ItineraryTimeline";
import DayMap from "@/components/day/DayMap";

export const revalidate = 300; // ISR every 5 minutes

const COST_BAND_LABELS = {
  budget: "€ (budget)",
  midrange: "€€ (mid)",
  premium: "€€€ (high)",
};

function firstParagraph(value) {
  try {
    if (!value) return "";
    if (typeof value === "string") return value.trim();
    if (Array.isArray(value)) {
      for (const entry of value) {
        if (typeof entry === "string" && entry.trim()) return entry.trim();
        if (entry && typeof entry === "object" && typeof entry.text === "string" && entry.text.trim()) {
          return entry.text.trim();
        }
      }
      return "";
    }
    if (typeof value === "object") {
      if (value.type === "paragraph") {
        const nodes = Array.isArray(value.content) ? value.content : [];
        const text = nodes.map((n) => n?.text || "").join("").trim();
        if (text) return text;
      }
      if (value.type === "doc" && Array.isArray(value.content)) {
        for (const node of value.content) {
          if (node?.type === "paragraph") {
            const nodes = Array.isArray(node.content) ? node.content : [];
            const text = nodes.map((n) => n?.text || "").join("").trim();
            if (text) return text;
          }
        }
      }
      if (typeof value.summary === "string" && value.summary.trim()) {
        return value.summary.trim();
      }
      if (typeof value.text === "string" && value.text.trim()) {
        return value.text.trim();
      }
    }
  } catch {}
  return "";
}

function firstImage(srcLike) {
  if (!srcLike) return null;
  if (typeof srcLike === "string") return srcLike;
  if (Array.isArray(srcLike) && srcLike.length) {
    const f = srcLike[0];
    if (typeof f === "string") return f;
    if (f?.src) return f.src;
  }
  if (srcLike?.src) return srcLike.src;
  return null;
}

function normalizeItem(it) {
  const e = it?.entity || null;
  const itemType = (it?.item_type || "").toLowerCase();
  const isNote = itemType === "note";
  const isMeal = itemType === "meal";
  const noteTitle = isNote ? e?.title || it?.title || "Note" : null;
  const noteDetails = isNote ? e?.details ?? it?.details ?? "" : null;
  const displayImage = isNote
    ? null
    : resolveImageUrl(firstImage(e?.images) || firstImage(it?.images));
  const entitySummary =
    e?.summary ||
    (e?.description ? firstParagraph(e.description) : "");
  const mealLabel = it?.meal_type
    ? it.meal_type.charAt(0).toUpperCase() + it.meal_type.slice(1)
    : "Meal";
  const latValue =
    typeof e?.lat === "number" ? e.lat : Number.parseFloat(e?.lat ?? "");
  const lngValue =
    typeof e?.lng === "number" ? e.lng : Number.parseFloat(e?.lng ?? "");
  return {
    ...it,
    isNote,
    displayName: isMeal ? mealLabel : isNote ? noteTitle : e?.name || it?.name || "(untitled)",
    displaySummary: isNote
      ? noteDetails || ""
      : entitySummary || it?.summary || "",
    opening_times_url: isNote
      ? null
      : e?.opening_times_url || it?.opening_times_url || null,
    displayImage,
    details: isNote
      ? noteDetails
      : typeof it?.details === "string" && it.details.trim().length > 0
        ? it.details
        : null,
    descriptionText: e?.description ? firstParagraph(e.description) : "",
    tags: Array.isArray(e?.tags) ? e.tags : [],
    destination_id: e?.destination_id || it?.destination_id || null,
    lat: Number.isFinite(latValue) ? latValue : null,
    lng: Number.isFinite(lngValue) ? lngValue : null,
    is_optional: Boolean(it?.is_optional),
    meal_type: it?.meal_type || null,
    slug: e?.slug || it?.slug || null,
  };
}

function minsToLabel(mins) {
  if (!mins || mins <= 0) return "";
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export default async function Page({ params, searchParams }) {
  const { slug } = await params;
  const { debug } = (await searchParams) || {};
  const { dayItinerary, items, transport } = await getCuratedDayItineraryBySlugPublic(
    slug
  );
  if (!dayItinerary && !debug) return notFound();

  const normalizedItems = (items || []).map((it) => normalizeItem(it));
  const destinationIds = Array.from(
    new Set(normalizedItems.map((it) => it.destination_id).filter(Boolean))
  );
  let destinationMap = new Map();
  if (destinationIds.length > 0) {
    const db = getPublicDB();
    const { data: destinations } = await db
      .from("destinations")
      .select("id, slug, countries ( slug )")
      .in("id", destinationIds);
    destinationMap = new Map(
      (destinations || []).map((row) => [row.id, row])
    );
  }
  const itemRouteByType = {
    sight: "sights",
    experience: "experiences",
    tour: "tours",
    accommodation: "accommodation",
    food_drink: "food-drink",
  };

  const enrichedItems = normalizedItems.map((it) => {
    const destination = it.destination_id
      ? destinationMap.get(it.destination_id)
      : null;
    const itemRoute = itemRouteByType[it.item_type];
    if (
      itemRoute &&
      destination?.slug &&
      destination?.countries?.slug &&
      it.slug
    ) {
      return {
        ...it,
        destinationSlug: destination.slug,
        countrySlug: destination.countries.slug,
        href: destinationItemPath(
          destination.countries.slug,
          destination.slug,
          itemRoute,
          it.slug
        ),
      };
    }
    return it;
  });
  const totalMinutes = enrichedItems.reduce((acc, it) => {
    const n =
      typeof it.duration_minutes === "number"
        ? it.duration_minutes
        : Number(it.duration_minutes) || 0;
    return acc + (n > 0 ? n : 0);
  }, 0);
  const transportMinutes = (transport || []).reduce((acc, leg) => {
    const n =
      typeof leg?.est_duration_min === "number"
        ? leg.est_duration_min
        : Number(leg?.est_duration_min) || 0;
    return acc + (n > 0 ? n : 0);
  }, 0);
  const totalDurationLabel = minsToLabel(totalMinutes + transportMinutes);
  const flow = [
    ...(transport || []).map((leg) => ({
      kind: "leg",
      sort_order: Number.isFinite(leg?.sort_order) ? leg.sort_order : Infinity,
      leg,
    })),
    ...enrichedItems.map((it) => ({
      kind: "item",
      sort_order: Number.isFinite(it?.sort_order) ? it.sort_order : Infinity,
      isNote: it.isNote,
      isOptional: it.is_optional,
      it,
    })),
  ].sort((a, b) => {
    const orderA = Number.isFinite(a.sort_order) ? a.sort_order : Infinity;
    const orderB = Number.isFinite(b.sort_order) ? b.sort_order : Infinity;
    if (orderA !== orderB) return orderA - orderB;
    const priority = (entry) => {
      if (entry.kind === "leg") return 0;
      if (entry.kind === "item" && !entry.isNote) return 1;
      return 2; // notes last
    };
    return priority(a) - priority(b);
  });

  const introText =
    dayItinerary?.summary || firstParagraph(dayItinerary?.description);
  const highlights = Array.isArray(dayItinerary?.highlights)
    ? dayItinerary.highlights.filter(Boolean)
    : [];
  const includes = Array.isArray(dayItinerary?.includes)
    ? dayItinerary.includes.filter(Boolean)
    : [];
  const notSuitable = Array.isArray(dayItinerary?.not_suitable_for)
    ? dayItinerary.not_suitable_for.filter(Boolean)
    : [];
  const importantInfo = Array.isArray(dayItinerary?.important_information)
    ? dayItinerary.important_information.filter(Boolean)
    : [];
  const fullDescription =
    dayItinerary?.full_description ||
    firstParagraph(dayItinerary?.description);

  const mainFlow = flow;
  const optionalItems = [];
  const mapCandidates = mainFlow.filter((entry) => {
    if (entry.kind !== "item" || !entry.it || entry.it.isNote) return false;
    if (entry.it.item_type === "meal") return false;
    return true;
  });
  const pins = mapCandidates
    .filter((entry) => Number.isFinite(entry.it.lat) && Number.isFinite(entry.it.lng))
    .map((entry, idx) => ({
      id: entry.it.id,
      name: entry.it.displayName || entry.it.name || "Stop",
      lat: entry.it.lat,
      lng: entry.it.lng,
      order: idx + 1,
      href: entry.it.href || null,
    }));
  const missingCoordsCount = mapCandidates.length - pins.length;

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 space-y-8">
      {!dayItinerary && debug ? (
        <pre className="rounded-md border bg-muted p-3 text-xs overflow-x-auto">
          {JSON.stringify(
            { slug, debug, dayItinerary, items, transport },
            null,
            2
          )}
        </pre>
      ) : null}
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {dayItinerary ? dayItinerary.name : "Day Itinerary"}
        </h1>
        {dayItinerary?.cover_image && (
          <div className="relative h-72 w-full overflow-hidden rounded-xl border">
            <SafeImage
              src={resolveImageUrl(dayItinerary.cover_image)}
              alt={dayItinerary.name}
              fill
              sizes="(min-width: 1024px) 800px, 100vw"
              className="object-cover"
            />
          </div>
        )}
        {introText ||
        (Array.isArray(dayItinerary?.tags) && dayItinerary.tags.length > 0) ||
        dayItinerary?.cost_band ||
        dayItinerary?.wheelchair_friendly ||
        dayItinerary?.good_with_kids ? (
          <div className="rounded-xl border bg-card/40 p-4 space-y-3">
            {introText ? (
              <p className="text-base text-muted-foreground sm:text-lg">
                {introText}
              </p>
            ) : null}
            {highlights.length > 0 ? (
              <div className="space-y-2">
                <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Highlights
                </h2>
                <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
                  {highlights.map((item, idx) => (
                    <li key={`${item}-${idx}`}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {(Array.isArray(dayItinerary?.tags) && dayItinerary.tags.length > 0) ||
            dayItinerary?.cost_band ||
            dayItinerary?.wheelchair_friendly ||
            dayItinerary?.good_with_kids ? (
              <div className="flex flex-wrap gap-2">
                {Array.isArray(dayItinerary?.tags) &&
                  dayItinerary.tags.map((t) => (
                    <Badge
                      key={`tag-${t}`}
                      variant="secondary"
                      className="capitalize"
                    >
                      {t}
                    </Badge>
                  ))}
                {dayItinerary?.cost_band &&
                  (COST_BAND_LABELS[dayItinerary.cost_band] ||
                    dayItinerary.cost_band) && (
                    <Badge key="meta-cost" variant="outline" className="capitalize">
                      {COST_BAND_LABELS[dayItinerary.cost_band] || dayItinerary.cost_band}
                    </Badge>
                  )}
                {dayItinerary?.wheelchair_friendly ? (
                  <Badge key="meta-accessible" variant="secondary">
                    Accessible
                  </Badge>
                ) : null}
                {dayItinerary?.good_with_kids ? (
                  <Badge key="meta-kids" variant="secondary">
                    Good with kids
                  </Badge>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </header>

      {fullDescription ? (
        <section className="rounded-xl border bg-card/40">
          <Accordion type="single" collapsible>
            <AccordionItem value="full-description" className="border-b-0">
              <AccordionTrigger className="px-4 py-3 text-left">
                Full description
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 text-sm text-muted-foreground whitespace-pre-line">
                {fullDescription}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>
      ) : null}

      {(includes.length > 0 || notSuitable.length > 0) ? (
        <section className="grid gap-4 md:grid-cols-2">
          {includes.length > 0 ? (
            <div className="rounded-xl border bg-card/40 p-4 space-y-2">
              <h2 className="text-lg font-semibold">Includes</h2>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {includes.map((item, idx) => (
                  <li key={`${item}-${idx}`} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-emerald-600 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {notSuitable.length > 0 ? (
            <div className="rounded-xl border bg-card/40 p-4 space-y-2">
              <h2 className="text-lg font-semibold">Not suitable for</h2>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {notSuitable.map((item, idx) => (
                  <li key={`${item}-${idx}`} className="flex items-start gap-2">
                    <X className="h-4 w-4 text-rose-500 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      ) : null}

      {importantInfo.length > 0 ||
      dayItinerary?.notes ||
      totalDurationLabel ? (
        <section className="rounded-xl border bg-card/40 p-4 space-y-2">
          <h2 className="text-lg font-semibold">Important information</h2>
          {importantInfo.length > 0 ? (
            <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
              {totalDurationLabel ? (
                <li>Total trip time: {totalDurationLabel}</li>
              ) : null}
              {importantInfo.map((item, idx) => (
                <li key={`${item}-${idx}`}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground whitespace-pre-line">
              {totalDurationLabel
                ? `Total trip time: ${totalDurationLabel}${
                    dayItinerary?.notes ? "\n\n" : ""
                  }${dayItinerary?.notes || ""}`
                : dayItinerary?.notes}
            </p>
          )}
        </section>
      ) : null}

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Day Itinerary</h2>
        {flow.length === 0 ? (
          <p className="text-sm text-muted-foreground">No items yet.</p>
        ) : (
          <div className="mt-3">
            <ItineraryTimeline flow={mainFlow} optionalItems={optionalItems} />
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Map</h2>
        {pins.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No stops have coordinates yet.
          </p>
        ) : (
          <DayMap pins={pins} />
        )}
        {missingCoordsCount > 0 ? (
          <p className="text-xs text-muted-foreground">
            {missingCoordsCount} stop
            {missingCoordsCount === 1 ? "" : "s"} don’t have coordinates yet.
          </p>
        ) : null}
      </section>

    </main>
  );
}
