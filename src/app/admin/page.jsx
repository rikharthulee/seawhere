// app/admin/page.js
import Link from "next/link";

export default function AdminHome() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl md:text-4xl font-medium">Admin Dashboard</h1>

      {/* Action cards */}
      <section className="mt-8 grid gap-6 sm:grid-cols-2">
        {/* Destinations */}
        <article className="p-5 rounded-xl ring-1 ring-black/10">
          <h2 className="text-xl font-semibold">📍 Destinations</h2>
          <p className="mt-2 text-gray-700">
            Cities, towns, or areas that group sights, experiences, tours, and
            accommodation.
          </p>
          <Link
            href="/admin/destinations"
            className="inline-block mt-4 rounded bg-black text-white px-4 py-2 hover:opacity-90"
          >
            Go to Destinations
          </Link>
        </article>

        {/* Accommodation */}
        <article className="p-5 rounded-xl ring-1 ring-black/10">
          <h2 className="text-xl font-semibold">🏨 Accommodation</h2>
          <p className="mt-2 text-gray-700">
            Places to stay overnight, such as hotels, ryokan and boutiques.
          </p>
          <Link
            href="/admin/accommodation"
            className="inline-block mt-4 rounded bg-black text-white px-4 py-2 hover:opacity-90"
          >
            Go to Accommodation
          </Link>
        </article>

        {/* Sights */}
        <article className="p-5 rounded-xl ring-1 ring-black/10">
          <h2 className="text-xl font-semibold">🏯 Sights</h2>
          <p className="mt-2 text-gray-700">
            Static places like temples, gardens, or landmarks that visitors can
            go and see.
          </p>
          <Link
            href="/admin/sights"
            className="inline-block mt-4 rounded bg-black text-white px-4 py-2 hover:opacity-90"
          >
            Go to Sights
          </Link>
        </article>

        {/* Experiences */}
        <article className="p-5 rounded-xl ring-1 ring-black/10">
          <h2 className="text-xl font-semibold">🎎 Experiences</h2>
          <p className="mt-2 text-gray-700">
            Hands-on or cultural activities, like a tea ceremony, sumo try-on,
            or cooking class.
          </p>
          <Link
            href="/admin/experiences"
            className="inline-block mt-4 rounded bg-black text-white px-4 py-2 hover:opacity-90"
          >
            Go to Experiences
          </Link>
        </article>

        {/* Tours */}
        <article className="p-5 rounded-xl ring-1 ring-black/10">
          <h2 className="text-xl font-semibold">🚌 Tours</h2>
          <p className="mt-2 text-gray-700">
            Guided outings from A→A or A→B, such as walking tours or day trips.
          </p>
          <Link
            href="/admin/tours"
            className="inline-block mt-4 rounded bg-black text-white px-4 py-2 hover:opacity-90"
          >
            Go to Tours
          </Link>
        </article>

        {/* Food & Drink */}
        <article className="p-5 rounded-xl ring-1 ring-black/10">
          <h2 className="text-xl font-semibold">🍣 Food &amp; Drink</h2>
          <p className="mt-2 text-gray-700">
            Manage restaurants, bars, and cafés featured in trips.
          </p>
          <Link
            href="/admin/food-drink"
            className="inline-block mt-4 rounded bg-black text-white px-4 py-2 hover:opacity-90"
          >
            Go to Food &amp; Drink
          </Link>
        </article>

        {/* Transportation */}
        <article className="p-5 rounded-xl ring-1 ring-black/10">
          <h2 className="text-xl font-semibold">🚉 Transportation</h2>
          <p className="mt-2 text-gray-700">
            Manage stations, terminals, and other transit points for trips.
          </p>
          <Link
            href="/admin/transportation"
            className="inline-block mt-4 rounded bg-black text-white px-4 py-2 hover:opacity-90"
          >
            Go to Transportation
          </Link>
        </article>

        {/* Day Itineraries */}
        <article className="p-5 rounded-xl ring-1 ring-black/10">
          <h2 className="text-xl font-semibold">🗺️ Day Itineraries</h2>
          <p className="mt-2 text-gray-700">
            Curate day plans by combining sights, experiences, tours, transport,
            and notes.
          </p>
          <Link
            href="/admin/itineraries"
            className="inline-block mt-4 rounded bg-black text-white px-4 py-2 hover:opacity-90"
          >
            Open Day Itinerary Builder
          </Link>
        </article>

        {/* View Website */}
        <article className="p-5 rounded-xl ring-1 ring-black/10">
          <h2 className="text-xl font-semibold">🌐 View Website</h2>
          <p className="mt-2 text-gray-700">
            Open the public homepage in a new tab.
          </p>
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-4 rounded border border-border px-4 py-2 hover:bg-accent"
          >
            Go to Home
          </Link>
        </article>
      </section>
    </main>
  );
}
