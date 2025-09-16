export default function FaqPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="border-t-2 border-border pt-2">
        <h1 className="text-3xl md:text-4xl font-medium">FAQ</h1>
        <div className="border-b-2 border-border mt-3" />
      </div>

      <section className="mt-8 divide-y divide-black/10">
        <div className="py-5">
          <h2 className="text-lg font-semibold">How does planning work?</h2>
          <p className="mt-2 text-gray-700">
            We’ll discuss your dates, interests, and pace. I’ll propose a draft
            itinerary, iterate with your feedback, and provide maps, routing,
            and booking suggestions.
          </p>
        </div>
        <div className="py-5">
          <h2 className="text-lg font-semibold">
            Can you book hotels and trains?
          </h2>
          <p className="mt-2 text-gray-700">
            I provide curated recommendations and booking guidance. You make the
            payments directly with providers so you keep full control.
          </p>
        </div>
        <div className="py-5">
          <h2 className="text-lg font-semibold">
            Do you offer on-the-ground support?
          </h2>
          <p className="mt-2 text-gray-700">
            Yes—optional WhatsApp support for quick help, rerouting, and fresh
            suggestions as your trip unfolds.
          </p>
        </div>
        <div className="py-5">
          <h2 className="text-lg font-semibold">
            Is this suitable for families?
          </h2>
          <p className="mt-2 text-gray-700">
            Absolutely. I’ll balance travel times, rest, and activities to keep
            things smooth for all ages.
          </p>
        </div>
      </section>
    </main>
  );
}
