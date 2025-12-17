import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function Hero() {
  return (
    <>
      {/* HERO */}
      <section className="relative h-[65vh] min-h-[420px]">
        <Image
          src="/hero.jpg"
          alt="Southeast Asia landscape"
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
            Tailor-made journeys across Southeast Asia
          </h1>
          <p className="mt-4 text-white/90 drop-shadow text-lg max-w-2xl font-medium">
            Bespoke trips to Laos, Thailand, Vietnam, Cambodia and beyond.
          </p>
        </div>
      </section>

      {/* PITCH SECTION BELOW HERO */}
      <section className="bg-white py-12 px-4">
        <div className="max-w-4xl mx-auto text-left">
          <p className="text-lg leading-relaxed text-gray-800">
            After fifteen years designing trips around Asia for leading UK
            travel agencies — and living across the region — our team created
            Seawhere. Interactive, customisable and built from on-the-ground
            research, this is the place to craft your perfect Southeast Asia
            adventure.
          </p>

          <p className="mt-6 text-lg leading-relaxed text-gray-800 font-semibold">
            Seawhere guests get:
          </p>

          <ul className="mt-3 list-disc pl-6 space-y-2 text-lg leading-relaxed text-gray-800">
            <li>
              Dozens of sample trips covering beaches, mountains and cities
              across Southeast Asia, all fully customisable using Seawhere&apos;s
              trip builder.
            </li>
            <li>
              Hundreds of curated day itineraries combining sights, transport info and
              maps to minimise hassle and maximise your time on the ground.
            </li>
            <li>
              Hand-picked accommodation, restaurants, experiences, tours and
              guides with direct booking links.
            </li>
            <li>
              All the little details like opening times, closing days, entry
              fees and advance ticket info — covered for you.
            </li>
            <li>
              A comprehensive toolkit of everything you need to know before you
              go: visas, luggage transfers, overland routes, family options,
              food allergies and more.
            </li>
            <li>
              Helpdesk email support including trip reviews to ensure it
              all runs smoothly.
            </li>
          </ul>

          <p className="mt-6 text-lg leading-relaxed text-gray-800">
            Travel independently with insider intel or lean on us to arrange
            guides and tickets. With Seawhere you&apos;re set up for a richer,
            smoother and more cost-effective experience.
          </p>

          <Button asChild className="mt-8 rounded-full">
            <Link href="/contact">Contact Us</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
