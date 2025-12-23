import Link from "next/link";
import { getPublicDB } from "@/lib/supabase/public";
import {
  destinationItemPath,
  destinationPath,
} from "@/lib/routes";

export const revalidate = 60;
export const runtime = "nodejs";

const EXAMPLES = [
  "Luang Prabang",
  "temples",
  "street food",
  "waterfalls",
  "boutique hotels",
  "cycling tour",
];

function buildResult({ id, name, summary, href, meta }) {
  return { id, name, summary, href, meta };
}

function toText(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    const entry = value.find((v) => typeof v === "string");
    return entry || "";
  }
  if (typeof value === "object") {
    if (typeof value.text === "string") return value.text;
    if (typeof value.summary === "string") return value.summary;
  }
  return "";
}

export default async function SearchPage(props) {
  const searchParams = props.searchParams ? await props.searchParams : {};
  const q = String(searchParams?.q || "").trim();

  if (!q) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10 space-y-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-semibold">Search Seawhere</h1>
          <p className="mt-2 text-muted-foreground">
            Search destinations, sights, food, stays, experiences, and tours.
          </p>
        </div>

        <form action="/search" method="get" className="flex gap-2">
          <input
            type="search"
            name="q"
            placeholder="Search"
            className="flex-1 rounded-md border px-3 py-2"
          />
          <button
            type="submit"
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            Search
          </button>
        </form>

        <div className="rounded-xl border bg-muted/40 p-4">
          <div className="text-sm font-semibold text-foreground">
            Example searches
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {EXAMPLES.map((term) => (
              <Link
                key={term}
                href={`/search?q=${encodeURIComponent(term)}`}
                className="rounded-full border bg-background px-3 py-1 text-sm text-muted-foreground hover:text-foreground"
              >
                {term}
              </Link>
            ))}
          </div>
        </div>
      </main>
    );
  }

  const db = getPublicDB();
  const like = `%${q}%`;

  const [
    destinationsRes,
    sightsRes,
    foodRes,
    accommodationRes,
    experiencesRes,
    toursRes,
  ] = await Promise.all([
    db
      .from("destinations")
      .select("id, slug, name, summary, images, countries ( slug, name )")
      .eq("status", "published")
      .or(`name.ilike.${like},summary.ilike.${like}`)
      .order("name", { ascending: true })
      .limit(12),
    db
      .from("sights")
      .select(
        "id, slug, name, summary, images, destinations ( slug, name, countries ( slug, name ) )"
      )
      .eq("status", "published")
      .or(`name.ilike.${like},summary.ilike.${like},description.ilike.${like}`)
      .order("name", { ascending: true })
      .limit(12),
    db
      .from("food_drink")
      .select(
        "id, slug, name, description, images, destinations ( slug, name, countries ( slug, name ) )"
      )
      .eq("status", "published")
      .or(`name.ilike.${like},description.ilike.${like}`)
      .order("name", { ascending: true })
      .limit(12),
    db
      .from("accommodation")
      .select(
        "id, slug, name, summary, description, images, destinations ( slug, name, countries ( slug, name ) )"
      )
      .eq("status", "published")
      .or(`name.ilike.${like},summary.ilike.${like},description.ilike.${like}`)
      .order("name", { ascending: true })
      .limit(12),
    db
      .from("experiences")
      .select(
        "id, slug, name, summary, images, destinations ( slug, name, countries ( slug, name ) )"
      )
      .eq("status", "published")
      .or(`name.ilike.${like},summary.ilike.${like}`)
      .order("name", { ascending: true })
      .limit(12),
    db
      .from("tours")
      .select(
        "id, slug, name, summary, images, destinations ( slug, name, countries ( slug, name ) )"
      )
      .eq("status", "published")
      .or(`name.ilike.${like},summary.ilike.${like}`)
      .order("name", { ascending: true })
      .limit(12),
  ]);

  const destinations = (destinationsRes.data || [])
    .map((item) => {
      const href =
        item?.countries?.slug && item?.slug
          ? destinationPath(item.countries.slug, item.slug)
          : null;
      return href
        ? buildResult({
            id: item.id,
            name: item.name,
            summary: toText(item.summary),
            href,
            meta: item?.countries?.name || "",
          })
        : null;
    })
    .filter(Boolean);

  const sights = (sightsRes.data || [])
    .map((item) => {
      const countrySlug = item?.destinations?.countries?.slug;
      const destinationSlug = item?.destinations?.slug;
      const href =
        countrySlug && destinationSlug && item.slug
          ? destinationItemPath(countrySlug, destinationSlug, "sights", item.slug)
          : null;
      return href
        ? buildResult({
            id: item.id,
            name: item.name,
            summary: toText(item.summary),
            href,
            meta: item?.destinations?.name || "",
          })
        : null;
    })
    .filter(Boolean);

  const food = (foodRes.data || [])
    .map((item) => {
      const countrySlug = item?.destinations?.countries?.slug;
      const destinationSlug = item?.destinations?.slug;
      const href =
        countrySlug && destinationSlug && item.slug
          ? destinationItemPath(
              countrySlug,
              destinationSlug,
              "food-drink",
              item.slug
            )
          : null;
      return href
        ? buildResult({
            id: item.id,
            name: item.name,
            summary: toText(item.description),
            href,
            meta: item?.destinations?.name || "",
          })
        : null;
    })
    .filter(Boolean);

  const accommodation = (accommodationRes.data || [])
    .map((item) => {
      const countrySlug = item?.destinations?.countries?.slug;
      const destinationSlug = item?.destinations?.slug;
      const href =
        countrySlug && destinationSlug && item.slug
          ? destinationItemPath(
              countrySlug,
              destinationSlug,
              "accommodation",
              item.slug
            )
          : null;
      return href
        ? buildResult({
            id: item.id,
            name: item.name,
            summary: toText(item.summary || item.description),
            href,
            meta: item?.destinations?.name || "",
          })
        : null;
    })
    .filter(Boolean);

  const experiences = (experiencesRes.data || [])
    .map((item) => {
      const countrySlug = item?.destinations?.countries?.slug;
      const destinationSlug = item?.destinations?.slug;
      const href =
        countrySlug && destinationSlug && item.slug
          ? destinationItemPath(
              countrySlug,
              destinationSlug,
              "experiences",
              item.slug
            )
          : null;
      return href
        ? buildResult({
            id: item.id,
            name: item.name,
            summary: toText(item.summary),
            href,
            meta: item?.destinations?.name || "",
          })
        : null;
    })
    .filter(Boolean);

  const tours = (toursRes.data || [])
    .map((item) => {
      const countrySlug = item?.destinations?.countries?.slug;
      const destinationSlug = item?.destinations?.slug;
      const href =
        countrySlug && destinationSlug && item.slug
          ? destinationItemPath(countrySlug, destinationSlug, "tours", item.slug)
          : null;
      return href
        ? buildResult({
            id: item.id,
            name: item.name,
            summary: toText(item.summary),
            href,
            meta: item?.destinations?.name || "",
          })
        : null;
    })
    .filter(Boolean);

  const groups = [
    { label: "Destinations", badge: "Destination", items: destinations },
    { label: "Sights", badge: "Sight", items: sights },
    { label: "Food & Drink", badge: "Food", items: food },
    { label: "Accommodation", badge: "Stay", items: accommodation },
    { label: "Experiences", badge: "Experience", items: experiences },
    { label: "Tours", badge: "Tour", items: tours },
  ].filter((group) => group.items.length > 0);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-semibold">Search results</h1>
        <p className="mt-2 text-muted-foreground">
          Showing results for <span className="font-semibold">"{q}"</span>
        </p>
      </div>

      <form action="/search" method="get" className="flex gap-2">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search"
          className="flex-1 rounded-md border px-3 py-2"
        />
        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          Search
        </button>
      </form>

      {groups.length === 0 ? (
        <div className="rounded-xl border bg-muted/40 p-6 text-muted-foreground">
          No results found. Try a different search.
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map((group) => (
            <section key={group.label} className="space-y-3">
              <h2 className="text-xl font-semibold">{group.label}</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {group.items.map((item) => (
                  <Link
                    key={`${group.label}-${item.id}`}
                    href={item.href}
                    className="rounded-xl border bg-card p-4 transition hover:shadow-md"
                  >
                    <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      <span>{group.badge}</span>
                      {item.meta ? <span>{item.meta}</span> : null}
                    </div>
                    <div className="mt-2 text-lg font-semibold">{item.name}</div>
                    {item.summary ? (
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
                        {item.summary}
                      </p>
                    ) : null}
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
