"use client";

import SafeImage from "@/components/SafeImage";

/**
 * Large skyline banner used above the desktop nav.
 * Non-sticky: scrolls out of view while the nav remains sticky.
 */
export default function DesktopSkylineBanner({ bannerH = 120, scale = 1.8 }) {
  const heightPx = bannerH * scale;

  return (
    <div className="hidden lg:block relative" style={{ height: `${heightPx}px` }}>
      <div className="pointer-events-none select-none absolute inset-0 flex justify-center z-10">
        <div className="relative h-full w-full max-w-[1400px]">
          <SafeImage
            src="/banner.svg"
            alt="Tokyo skyline banner"
            fill
            sizes="100vw"
            className="object-contain object-bottom"
            priority
          />
        </div>
      </div>
    </div>
  );
}
