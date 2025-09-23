import { notFound } from "next/navigation";
import SafeImage from "@/components/SafeImage";
import { getServiceSupabase } from "@/lib/supabase";
import { resolveImageUrl } from "@/lib/imageUrl";
import { getRouteParams } from "@/lib/route-params";

export const runtime = "nodejs";
export const revalidate = 300;

function slugify(input) {
  return (
    String(input || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "") || "excursion"
  );
}

function extractSummary(row) {
  if (!row) return null;
  if (typeof row.summary === "string" && row.summary.trim()) return row.summary;
  if (typeof row.description === "string" && row.description.trim()) {
    return row.description;
  }
  if (
    typeof row.description === "object" &&
    row.description !== null &&
    typeof row.description.text === "string"
  ) {
    return row.description.text;
  }
  return null;
}

function extractNotes(row) {
  if (
    typeof row.description === "object" &&
    row.description !== null &&
    Array.isArray(row.description.notes)
  ) {
    return row.description.notes
      .map((entry) => String(entry?.text || "").trim())
      .filter(Boolean);
  }
  return [];
}

async function fetchExcursions() {
  const supabase = getServiceSupabase();
  const selectWithCover =
    "id, slug, name, summary, description, transport, maps_url, cover_image, updated_at, status";
  const selectFallback =
    "id, name, summary, description, transport, maps_url, cover_image, updated_at, status";

  const { data, error } = await supabase
    .from("excursions")
    .select(selectWithCover)
    .eq("status", "published")
    .order("updated_at", { ascending: false })
    .limit(200);

  if (error) {
    if (error.code === "42703") {
      const { data: fallbackData, error: fallbackError } = await supabase
        .from("excursions")
        .select(selectFallback)
        .eq("status", "published")
        .order("updated_at", { ascending: false })
        .limit(200);
      if (fallbackError) throw fallbackError;
      return fallbackData || [];
    }
    throw error;
  }

  return data || [];
}

export default async function ExcursionDetailPage(props) {
  const { params } = await getRouteParams(props);
  const slugParam = decodeURIComponent(params?.slug || "").trim().toLowerCase();
  const excursions = await fetchExcursions();

  const match = excursions.find((row) => {
    const explicitSlug = String(row.slug || "").trim().toLowerCase();
    const generatedSlug = slugify(row.name || row.title || row.id);
    if (explicitSlug && explicitSlug === slugParam) return true;
    if (generatedSlug === slugParam) return true;
    if (String(row.id).toLowerCase() === slugParam) return true;
    return false;
  });

  if (!match) return notFound();

  const imageSrc = resolveImageUrl(match.cover_image);
  const summary = extractSummary(match);
  const notes = extractNotes(match);
  const transportEntries = Array.isArray(match.transport) ? match.transport : [];

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 space-y-8">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {match.name || "Untitled excursion"}
        </h1>
        {summary ? (
          <p className="text-base text-muted-foreground sm:text-lg">{summary}</p>
        ) : null}
        {match.updated_at ? (
          <p className="text-xs text-muted-foreground">
            Updated {new Date(match.updated_at).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        ) : null}
      </header>

      {imageSrc ? (
        <div className="relative h-72 w-full overflow-hidden rounded-xl border border-border">
          <SafeImage
            src={imageSrc}
            alt={match.name || "Excursion hero"}
            fill
            sizes="(min-width: 1024px) 800px, 100vw"
            className="object-cover"
            priority
          />
        </div>
      ) : null}

      {notes.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Highlights</h2>
          <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            {notes.map((entry, idx) => (
              <li key={idx}>{entry}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {transportEntries.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Suggested Transport</h2>
          <div className="space-y-3">
            {transportEntries.map((entry, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-border bg-card/60 p-4 text-sm text-muted-foreground"
              >
                {entry.title ? (
                  <p className="font-medium text-foreground">{entry.title}</p>
                ) : null}
                <ul className="mt-2 space-y-1 text-xs">
                  {entry.mode ? <li>Mode: {entry.mode}</li> : null}
                  {entry.duration_minutes ? (
                    <li>Duration: {entry.duration_minutes} minutes</li>
                  ) : null}
                  {entry.details ? <li>{entry.details}</li> : null}
                </ul>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {match.maps_url ? (
        <section className="space-y-2 text-sm">
          <h2 className="text-2xl font-semibold">Map</h2>
          <a
            href={match.maps_url}
            className="text-primary underline"
            target="_blank"
            rel="noreferrer"
          >
            View itinerary map
          </a>
        </section>
      ) : null}
    </main>
  );
}
