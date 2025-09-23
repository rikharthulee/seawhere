import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function Hero() {
  return (
    <>
      {/* HERO */}
      <section className="relative h-[65vh] min-h-[420px]">
        <Image
          src="/hero.webp"
          alt="Japan landscape"
          fill
          sizes="100vw"
          className="object-cover"
          priority
          quality={70}
        />

        {/* Stronger gradient scrim for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/70 to-black/90" />

        <div className="relative z-10 mx-auto max-w-4xl px-4 h-full flex flex-col items-center justify-center text-center">
          <h1 className="text-white drop-shadow-lg text-4xl md:text-6xl font-semibold leading-tight">
            Tailor-made journeys, crafted by experts
          </h1>
          <p className="mt-4 text-white/90 drop-shadow text-lg max-w-2xl font-medium">
            Bespoke itineraries to Japan&apos;s most extraordinary places.
          </p>
        </div>
      </section>

      {/* PITCH SECTION BELOW HERO */}
      <section className="bg-white py-12 px-4">
        <div className="max-w-4xl mx-auto text-left">
          <p className="text-lg leading-relaxed text-gray-800">
            After fifteen years designing Japan holidays for some of the UK’s
            leading travel agencies — and three years living in Tokyo — our
            expert, David, has created JapanMan. It&apos;s not your average
            travel site. Interactive, customisable and drawn mostly from
            on-the-ground personal experience, this is the place to build your
            dream Japan holiday.
          </p>

          <p className="mt-6 text-lg leading-relaxed text-gray-800 font-semibold">
            JapanMan members receive:
          </p>

          <ul className="mt-3 list-disc pl-6 space-y-2 text-lg leading-relaxed text-gray-800">
            <li>
              Dozens of sample itineraries covering every corner of the country,
              all fully customisable using JapanMan&apos;s exclusive itinerary
              builder. Like, add, swap out and browse until you&apos;ve made the
              perfect holiday.
            </li>
            <li>
              Hundreds of curated excursions combining sights, transport info
              and maps to minimise hassle and maximise your time in Japan.
            </li>
            <li>
              Hundreds of hand-picked accommodation, restaurants, experiences,
              tours and guides with direct booking links.
            </li>
            <li>
              All the little details like opening times, closing days, entry
              fees and advance ticket info — covered for you.
            </li>
            <li>
              A comprehensive toolkit of everything you need to know before you
              go: Japan Rail Pass, luggage, driving in Japan, family options,
              food allergies, and more.
            </li>
            <li>
              Helpdesk email support including itinerary reviews to ensure it
              all runs smoothly.
            </li>
          </ul>

          <p className="mt-6 text-lg leading-relaxed text-gray-800">
            What you choose to book is ultimately up to you, but with JapanMan
            you&apos;re bound to enjoy a richer and more cost-effective Japan
            experience. Become a member for the one-off cost of just £50 and
            gain unlimited access to our service.
          </p>

          <Button asChild className="mt-8 rounded-full">
            <Link href="/contact">Contact Us</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
