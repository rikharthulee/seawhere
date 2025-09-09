"use client";

import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Image from "next/image";
import { resolveImageUrl } from "@/lib/imageUrl";

export default function EmblaCarousel({
  images = [],
  options = { loop: true, align: "start" },
  className = "",
  slideClass = "h-[60vh] min-h-[380px]",
}) {
  const [viewportRef, embla] = useEmblaCarousel(options);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState([]);

  const onSelect = useCallback(() => {
    if (!embla) return;
    setSelectedIndex(embla.selectedScrollSnap());
  }, [embla]);

  const scrollTo = useCallback(
    (index) => {
      if (!embla) return;
      embla.scrollTo(index);
    },
    [embla]
  );

  const scrollPrev = useCallback(() => embla && embla.scrollPrev(), [embla]);
  const scrollNext = useCallback(() => embla && embla.scrollNext(), [embla]);

  useEffect(() => {
    if (!embla) return;
    setScrollSnaps(embla.scrollSnapList());
    embla.on("select", onSelect);
    embla.on("reInit", () => {
      setScrollSnaps(embla.scrollSnapList());
      onSelect();
    });
    onSelect();
  }, [embla, onSelect]);

  return (
    <div className={`relative ${className}`}>
      {/* viewport */}
      <div className="overflow-hidden" ref={viewportRef}>
        <div className="flex">
          {images.map((src, i) => (
            <div key={i} className={`flex-[0_0_100%] relative ${slideClass}`}>
              <div className="absolute inset-0">
                <Image
                  src={resolveImageUrl(src)}
                  alt={`Slide ${i + 1}`}
                  fill
                  sizes="100vw"
                  className="object-cover"
                  draggable={false}
                  priority={i === 0}
                />
              </div>
              {/* optional dark overlay for hero text readability */}
              {/* <div className='absolute inset-0 bg-black/20' /> */}
            </div>
          ))}
        </div>
      </div>

      {/* prev/next buttons */}
      <button
        type="button"
        aria-label="Previous slide"
        onClick={scrollPrev}
        className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 backdrop-blur px-3 py-2 ring-1 ring-black/10 hover:bg-white"
      >
        ‹
      </button>
      <button
        type="button"
        aria-label="Next slide"
        onClick={scrollNext}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 backdrop-blur px-3 py-2 ring-1 ring-black/10 hover:bg-white"
      >
        ›
      </button>

      {/* dots */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2">
        {scrollSnaps.map((_, i) => (
          <button
            key={i}
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => scrollTo(i)}
            className={`h-2.5 w-2.5 rounded-full ring-1 ring-white/60 transition ${
              i === selectedIndex ? "bg-white" : "bg-white/40 hover:bg-white/70"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
