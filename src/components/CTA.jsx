import Link from "next/link";

export default function CTA() {
  return (
    <section id="plan" className="py-16">
      <div className="mx-auto max-w-6xl rounded-2xl bg-neutral-900 px-6 py-12 text-white">
        <div className="grid gap-6 md:grid-cols-2 items-center">
          <div>
            <h3 className="text-2xl md:text-3xl font-medium">
              Plan your tailor-made journey
            </h3>
            <p className="mt-2 text-white/80">
              Speak to a specialist to craft an itinerary around you.
            </p>
          </div>
          <div className="md:text-right">
            <Link
              href="/contact"
              className="inline-block rounded-full bg-card text-card-foreground px-6 py-3"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
