"use client";

import { useEffect, useState, useCallback } from "react";
import SafeImage from "@/components/SafeImage";
import { resolveImageUrl } from "@/lib/imageUrl";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

/**
 * Shadcn-powered Embla carousel wrapper
 * - Keeps your existing API: images, options(opts), className, slideClass
 * - Uses shadcn/ui Carousel (Embla under the hood)
 * - Custom white round prev/next + dots retained
 */
export default function EmblaCarousel({
  images = [],
  options = { loop: true, align: "start" },
  className = "",
  slideClass = "h-[60vh] min-h-[380px]",
}) {
  const [api, setApi] = useState(null); // Embla API from shadcn Carousel
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState([]);

  // Keep selected index and snaps in sync
  useEffect(() => {
    if (!api) return;

    const onSelect = () => setSelectedIndex(api.selectedScrollSnap());
    const onReInit = () => {
      setScrollSnaps(api.scrollSnapList());
      onSelect();
    };

    setScrollSnaps(api.scrollSnapList());
    onSelect();

    api.on("select", onSelect);
    api.on("reInit", onReInit);

    return () => {
      api.off("select", onSelect);
      api.off("reInit", onReInit);
    };
  }, [api]);

  const scrollTo = useCallback((i) => api && api.scrollTo(i), [api]);

  return (
    <div className={`relative ${className}`}>
      <Carousel opts={options} setApi={setApi} className="w-full">
        <CarouselContent>
          {images.map((src, i) => (
            <CarouselItem key={i} className="p-0">
              <div className={`relative flex-[0_0_100%] ${slideClass}`}>
                <div className="absolute inset-0">
                  <SafeImage
                    src={resolveImageUrl(src)}
                    alt={`Slide ${i + 1}`}
                    fill
                    sizes="100vw"
                    className="object-cover"
                    priority={i === 0}
                  />
                </div>
                {/* optional dark overlay for hero text readability */}
                {/* <div className='absolute inset-0 bg-black/20' /> */}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* Prev/Next with your preferred look (override shadcn defaults) */}
        <CarouselPrevious
          className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 backdrop-blur px-3 py-2 ring-1 ring-black/10 hover:bg-white"
          aria-label="Previous slide"
        >
          ‹
        </CarouselPrevious>
        <CarouselNext
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 backdrop-blur px-3 py-2 ring-1 ring-black/10 hover:bg-white"
          aria-label="Next slide"
        >
          ›
        </CarouselNext>
      </Carousel>

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
