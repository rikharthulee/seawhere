// app/admin/page.js
import Link from "next/link";

export default function AdminHome() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      {/* Header styled like other sections */}
      <div className="border-t-2 border-black/10 pt-4">
        <h1 className="text-3xl md:text-4xl font-medium">Admin Dashboard</h1>
        <div className="border-b-2 border-black/10 mt-3" />
      </div>

      {/* Action cards */}
      <section className="mt-8 grid gap-6 sm:grid-cols-2">
        <article className="p-5 rounded-xl ring-1 ring-black/10">
          <h2 className="text-xl font-semibold">Edit Destinations</h2>
          <p className="mt-2 text-gray-700">Create, edit, or delete destinations shown on the site.</p>
          <Link
            href="/admin/destinations"
            className="inline-block mt-4 rounded bg-black text-white px-4 py-2 hover:opacity-90"
          >
            Go to Destinations
          </Link>
        </article>

        <article className="p-5 rounded-xl ring-1 ring-black/10">
          <h2 className="text-xl font-semibold">Edit Accommodation</h2>
          <p className="mt-2 text-gray-700">
            Manage accommodation entries displayed in the Accommodation section.
          </p>
          <Link
            href="/admin/accommodation"
            className="inline-block mt-4 rounded bg-black text-white px-4 py-2 hover:opacity-90"
          >
            Go to Accommodation
          </Link>
        </article>

        <article className="p-5 rounded-xl ring-1 ring-black/10">
          <h2 className="text-xl font-semibold">Edit Sights (new)</h2>
          <p className="mt-2 text-gray-700">Manage sights stored in the new tables.</p>
          <Link
            href="/admin/sights"
            className="inline-block mt-4 rounded bg-black text-white px-4 py-2 hover:opacity-90"
          >
            Go to Sights
          </Link>
        </article>

        <article className="p-5 rounded-xl ring-1 ring-black/10">
          <h2 className="text-xl font-semibold">Edit POIs</h2>
          <p className="mt-2 text-gray-700">
            Manage points of interest (sights, food, tours, etc.)
          </p>
          <Link
            href="/admin/pois"
            className="inline-block mt-4 rounded bg-black text-white px-4 py-2 hover:opacity-90"
          >
            Go to POIs
          </Link>
        </article>

        <article className="p-5 rounded-xl ring-1 ring-black/10">
          <h2 className="text-xl font-semibold">View Website</h2>
          <p className="mt-2 text-gray-700">
            Open the public homepage in a new tab.
          </p>
          <Link
            href="/"
            className="inline-block mt-4 rounded border border-black/20 px-4 py-2 hover:bg-black/5"
          >
            Go to Home
          </Link>
        </article>
      </section>
    </main>
  );
}
