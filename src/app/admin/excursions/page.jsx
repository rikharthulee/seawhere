import Link from "next/link";
import { headers, cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { resolveImageUrl } from "@/lib/imageUrl";
import { Card, CardContent } from "@/components/ui/card";

function extractImageSrc(row) {
  if (!row || typeof row !== "object") return null;

  const direct =
    row.cover_image_url ||
    row.cover_image ||
    row.hero_image ||
    row.thumbnail_image ||
    row.image_url ||
    row.image;
  if (typeof direct === "string" && direct.trim()) {
    return resolveImageUrl(direct.trim());
  }

  const images = row.images;
  if (Array.isArray(images) && images.length > 0) {
    const first = images[0];
    if (typeof first === "string") {
      return resolveImageUrl(first);
    }
    if (first && typeof first === "object") {
      const candidate = first.url || first.src || first.path;
      if (candidate) return resolveImageUrl(candidate);
    }
  } else if (images && typeof images === "object") {
    const candidate =
      images.url || images.src || images.cover || images.default;
    if (candidate) return resolveImageUrl(candidate);
  }

  return null;
}

function normalizeExcursions(rows = []) {
  return rows
    .filter((row) => row && row.id)
    .map((row) => {
      const description = (() => {
        if (!row?.description) return null;
        if (typeof row.description === "string") return row.description;
        if (typeof row.description === "object") {
          if (typeof row.description.text === "string")
            return row.description.text;
          if (typeof row.description.summary === "string")
            return row.description.summary;
        }
        return null;
      })();

      return {
        id: row.id,
        title: row.title || row.name || "Untitled excursion",
        summary: row.summary || description,
        image: extractImageSrc(row),
        updatedAt: row.updated_at || row.updatedAt || row.modified_at,
        status: row.status,
        hasTransport: Array.isArray(row.transport) && row.transport.length > 0,
        hasMap: Boolean(row.maps_url),
      };
    });
}

function excursionMeta(excursion) {
  const meta = [];
  if (excursion.status) {
    meta.push(
      excursion.status === "published"
        ? "Published"
        : excursion.status.charAt(0).toUpperCase() + excursion.status.slice(1)
    );
  }
  if (excursion.hasTransport) {
    meta.push("Includes transport");
  }
  if (excursion.hasMap) {
    meta.push("Map link");
  }
  return meta.join(" • ");
}

function ExcursionCard({ excursion }) {
  const meta = excursionMeta(excursion);
  const href = `/admin/excursions/builder?id=${encodeURIComponent(
    excursion.id
  )}`;
  const updatedDate = excursion.updatedAt
    ? new Date(excursion.updatedAt)
    : null;
  const updatedLabel =
    updatedDate && !Number.isNaN(updatedDate.valueOf())
      ? updatedDate.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        })
      : null;

  return (
    <Card asChild className="group h-full overflow-hidden border-border/70 p-0">
      <Link href={href} className="flex h-full flex-col">
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
          {excursion.image ? (
            <img
              src={excursion.image}
              alt={excursion.title}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center text-sm text-muted-foreground">
              Image coming soon
            </div>
          )}
        </div>
        <CardContent className="flex flex-1 flex-col gap-3 p-5">
          <h3 className="text-lg font-semibold leading-tight">
            {excursion.title}
          </h3>
          {excursion.summary ? (
            <p className="line-clamp-3 text-sm text-muted-foreground">
              {excursion.summary}
            </p>
          ) : null}
          <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground">
            <span>{meta || " "}</span>
            {updatedLabel ? (
              <time dateTime={updatedDate.toISOString()}>{updatedLabel}</time>
            ) : null}
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}

function CreateExcursionCard() {
  return (
    <Card
      asChild
      className="h-full overflow-hidden border-dashed border-border/70 bg-muted/30 p-0 transition hover:border-primary/40 hover:bg-muted/60"
    >
      <Link
        href="/admin/excursions/builder"
        className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-border/60 text-muted-foreground">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-8 w-8"
            aria-hidden="true"
          >
            <path d="M12 5v14" />
            <path d="M5 12h14" />
          </svg>
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Create new excursion</h3>
          <p className="text-sm text-muted-foreground">
            Start from a blank canvas and build a bespoke excursion for your
            trip.
          </p>
        </div>
      </Link>
    </Card>
  );
}

export default async function AdminExcursionsIndex() {
  let rows = [];

  try {
    const headerStore = headers();
    const host =
      headerStore.get("x-forwarded-host") ||
      headerStore.get("host") ||
      "localhost:3000";
    const protocol = headerStore.get("x-forwarded-proto") || "http";
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `${protocol}://${host}`;
    const cookieStore = await cookies();
    const cookieHeader = cookieStore
      .getAll()
      .map(({ name, value }) => `${name}=${value}`)
      .join("; ");

    const response = await fetch(`${baseUrl}/api/admin/excursions?limit=200`, {
      cache: "no-store",
      headers: cookieHeader ? { cookie: cookieHeader } : undefined,
    });

    if (response.ok) {
      const json = await response.json();
      if (Array.isArray(json?.items)) {
        rows = json.items;
      }
    }
    if (rows.length === 0) {
      const supabase = createClient();
      const baseSelect = [
        "id",
        "name",
        "summary",
        "description",
        "transport",
        "maps_url",
        "status",
        "updated_at",
      ];

      const { data, error } = await supabase
        .from("excursions")
        .select(baseSelect.join(","))
        .order("updated_at", { ascending: false });
      if (!error && Array.isArray(data)) {
        rows = data;
      } else if (error?.code === "42703") {
        const fallbackSelect = baseSelect.filter(
          (field) => field !== "updated_at"
        );
        const { data: fallbackData } = await supabase
          .from("excursions")
          .select(fallbackSelect.join(","))
          .order("name", { ascending: true });
        if (Array.isArray(fallbackData)) {
          rows = fallbackData;
        }
      }
    }
  } catch (_) {
    rows = [];
  }

  const excursions = normalizeExcursions(rows);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12">
      <header className="max-w-3xl space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Excursion Builder
        </h1>
        <p className="text-base text-muted-foreground sm:text-lg">
          Jump into an existing itinerary to tweak it or spin up a fresh
          excursion for your clients.
        </p>
      </header>

      <section className="mt-10">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <CreateExcursionCard />
          {excursions.map((excursion) => (
            <ExcursionCard key={excursion.id} excursion={excursion} />
          ))}
        </div>
        {excursions.length === 0 ? (
          <div className="mt-12 rounded-lg border border-dashed border-border/70 bg-muted/20 p-8 text-center text-sm text-muted-foreground">
            No excursions saved yet.
          </div>
        ) : null}
      </section>
    </main>
  );
}

export const runtime = "nodejs";
export const revalidate = 60;
