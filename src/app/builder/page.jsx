import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import { resolveImageUrl } from "@/lib/imageUrl";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Lock } from "lucide-react";

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
    const candidate = images.url || images.src || images.cover || images.default;
    if (candidate) return resolveImageUrl(candidate);
  }

  return null;
}

function formatMeta(row) {
  const meta = [];
  const durationDays = Number(row?.duration_days);
  if (Number.isFinite(durationDays) && durationDays > 0) {
    meta.push(`${durationDays} day${durationDays === 1 ? "" : "s"}`);
  }
  const durationMinutes = Number(row?.duration_minutes);
  if (Number.isFinite(durationMinutes) && durationMinutes > 0) {
    const hours = durationMinutes / 60;
    if (hours >= 1) {
      const formatted = hours % 1 === 0 ? `${hours}h` : `${hours.toFixed(1)}h`;
      meta.push(formatted);
    } else {
      meta.push(`${durationMinutes} min`);
    }
  }
  if (row?.difficulty && typeof row.difficulty === "string") {
    meta.push(row.difficulty);
  }
  return meta.join(" • ");
}

function normalizeTemplates(rows = []) {
  return rows
    .filter((row) => row && (row.slug || row.id))
    .map((row) => ({
      ...row,
      slug: row.slug || row.id,
      title: row.title || row.name,
      summary: row.summary || row.description || row.excerpt,
      image: extractImageSrc(row),
      meta: formatMeta(row),
      isPremium: Boolean(row.is_premium ?? row.premium ?? row.requires_membership),
      updatedAt: row.updated_at || row.updatedAt || row.modified_at,
    }));
}

function TemplateCard({ template, subscribed }) {
  const href = `/builder/${encodeURIComponent(template.slug)}`;
  return (
    <Card asChild className="group h-full overflow-hidden border-border/70 p-0">
      <Link href={href} className="flex h-full flex-col">
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
          {template.image ? (
            <img
              src={template.image}
              alt={template.title || "Excursion"}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center text-sm text-muted-foreground">
              Image coming soon
            </div>
          )}
          {template.isPremium ? (
            <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-background/85 px-3 py-1 text-xs font-medium">
              <Lock className="h-3 w-3" />
              Premium
            </span>
          ) : null}
          {template.isPremium && !subscribed ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/80 text-center backdrop-blur-sm">
              <div className="inline-flex items-center gap-2 text-sm font-medium">
                <Lock className="h-4 w-4" /> Unlock with Membership
              </div>
              <p className="text-xs text-muted-foreground">
                Start exploring templates with a JapanMan membership.
              </p>
            </div>
          ) : null}
        </div>
        <CardContent className="flex flex-1 flex-col gap-3 p-5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-lg font-semibold leading-tight">
              {template.title || "Untitled excursion"}
            </h3>
          </div>
          {template.summary ? (
            <p className="line-clamp-3 text-sm text-muted-foreground">
              {template.summary}
            </p>
          ) : null}
          <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground">
            <span>{template.meta}</span>
            {template.updatedAt ? (
              <time dateTime={template.updatedAt}>
                {new Date(template.updatedAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </time>
            ) : null}
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}

function CreateYourOwnCard() {
  return (
    <Card asChild className="h-full overflow-hidden border-dashed border-border/70 bg-muted/30 p-0 transition hover:border-primary/40 hover:bg-muted/60">
      <Link href="/builder/new" className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
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
          <h3 className="text-lg font-semibold">Create your own</h3>
          <p className="text-sm text-muted-foreground">
            Start from a blank canvas and build a bespoke excursion for your trip.
          </p>
        </div>
      </Link>
    </Card>
  );
}

export default async function BuilderLandingPage() {
  const supabase = supabaseServer();
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data?.user || null;
  } catch (_) {
    user = null;
  }

  let rows = [];
  try {
    const { data, error } = await supabase
      .from("excursion_templates")
      .select("*")
      .order("updated_at", { ascending: false });
    if (!error && Array.isArray(data)) {
      rows = data;
    }
  } catch (_) {
    rows = [];
  }

  const templates = normalizeTemplates(rows);
  const subscribed = Boolean(
    user?.app_metadata?.is_subscribed ||
      user?.app_metadata?.subscription_active ||
      user?.user_metadata?.is_subscribed ||
      user?.user_metadata?.subscription_active ||
      user?.app_metadata?.role === "member"
  );

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12">
      <header className="max-w-3xl space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Excursion Builder</h1>
        <p className="text-base text-muted-foreground sm:text-lg">
          Pick a curated itinerary to customise or start from scratch. Each template comes with
          sights, logistics, and local tips you can adapt for your travellers.
        </p>
      </header>

      <section className="mt-10">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <CreateYourOwnCard />
          {templates.map((template) => (
            <TemplateCard key={template.slug} template={template} subscribed={subscribed} />
          ))}
        </div>
        {templates.length === 0 ? (
          <div className="mt-12 rounded-lg border border-dashed border-border/70 bg-muted/20 p-8 text-center text-sm text-muted-foreground">
            No curated excursions yet. Check back soon or jump in with the blank builder.
          </div>
        ) : null}
      </section>
    </main>
  );
}

export const revalidate = 120;
export const runtime = "nodejs";
