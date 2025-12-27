export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function fetchPlaces(query) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return { error: "GOOGLE_MAPS_API_KEY is not set in the environment." };
  }
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.location",
    },
    body: JSON.stringify({ textQuery: query, maxResultCount: 1 }),
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, json };
}

export default async function PlacesTestPage({ searchParams }) {
  const query =
    (await searchParams)?.query ||
    "Ban Xang Hai - Whiskey Village, Luang Prabang, Laos";
  const result = await fetchPlaces(query);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Places API Test</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Server-side Places API (New) searchText using `GOOGLE_MAPS_API_KEY`.
        </p>
      </div>

      <form className="flex flex-col gap-3 sm:flex-row sm:items-end" method="get">
        <label className="flex-1 space-y-2">
          <span className="text-sm font-medium">Query</span>
          <input
            type="text"
            name="query"
            defaultValue={query}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            placeholder="e.g. Ban Xang Hai - Whiskey Village, Luang Prabang, Laos"
          />
        </label>
        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          Test
        </button>
      </form>

      <div className="rounded-xl border bg-muted/30 p-4">
        <pre className="text-xs overflow-x-auto">
          {JSON.stringify({ query, ...result }, null, 2)}
        </pre>
      </div>
    </main>
  );
}
