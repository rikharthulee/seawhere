export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function fetchGeocode(address) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return { error: "GOOGLE_MAPS_API_KEY is not set in the environment." };
  }
  const params = new URLSearchParams({
    address,
    key: apiKey,
  });
  const res = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`,
    { cache: "no-store" }
  );
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, json };
}

export default async function GeocodeTestPage({ searchParams }) {
  const address = (await searchParams)?.address || "Kuang Si Waterfalls";
  const result = await fetchGeocode(address);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Geocoding API Test</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Server-side fetch using `GOOGLE_MAPS_API_KEY`.
        </p>
      </div>

      <form className="flex flex-col gap-3 sm:flex-row sm:items-end" method="get">
        <label className="flex-1 space-y-2">
          <span className="text-sm font-medium">Address</span>
          <input
            type="text"
            name="address"
            defaultValue={address}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            placeholder="e.g. Kuang Si Waterfalls"
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
          {JSON.stringify({ address, ...result }, null, 2)}
        </pre>
      </div>
    </main>
  );
}
