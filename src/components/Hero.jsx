import Link from "next/link";
import SafeImage from "@/components/SafeImage";

export default function Hero() {
  return (
    <>
      {/* HERO */}
      <section className="relative h-[65vh] min-h-[420px]">
        <SafeImage
          src="https://plus.unsplash.com/premium_photo-1661964177687-57387c2cbd14?q=80&w=2000&auto=format&fit=crop&ixlib=rb-4.1.0"
          alt="Japan landscape"
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />

        {/* Stronger gradient scrim for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/70 to-black/90" />

        <div className="relative z-10 mx-auto max-w-4xl px-4 h-full flex flex-col items-center justify-center text-center">
          <h1 className="text-white drop-shadow-lg text-4xl md:text-6xl font-semibold leading-tight">
            Tailor-made journeys, crafted by experts
          </h1>
          <p className="mt-4 text-white/90 drop-shadow text-lg max-w-2xl font-medium">
            Bespoke itineraries to Japan's most extraordinary places.
          </p>
        </div>
      </section>

      {/* PITCH SECTION BELOW HERO */}
      <section className="bg-white py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-lg leading-relaxed text-gray-800">
            With fifteen years designing Japan holidays for some of the UK’s
            leading travel agencies — and three years living in Japan — our
            expert, David, is the person to speak to about making your trip
            truly special.
          </p>
          <p className="mt-4 text-lg leading-relaxed text-gray-800">
            We offer a <strong>30-minute, no-obligation consultation</strong>,
            then a flat fee of <strong>£125</strong> for a comprehensive
            tailored itinerary and <strong>unlimited email support</strong> on
            the build-up to your holiday. Because we're based in South-East
            Asia, we can provide{" "}
            <strong>real-time, on-the-ground assistance</strong> while you
            travel.
          </p>
          <p className="mt-4 text-lg leading-relaxed text-gray-800">
            What you choose to book is entirely up to you — but with us as your
            trusted advisor, you're bound to enjoy a richer, more cost-effective
            Japan experience.
          </p>
          <Link
            href="/contact"
            className="inline-block mt-8 rounded-full bg-black text-white px-6 py-3 hover:bg-gray-800 transition"
          >
            Contact Us
          </Link>
        </div>
      </section>
    </>
  );
}
