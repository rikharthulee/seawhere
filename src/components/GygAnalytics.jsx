"use client";
import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function GygAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
    const fire = () => {
      try {
        if (typeof window === "undefined") return;
        // Try common analytics entry points used by GYG libraries.
        if (typeof window.gyg === "function") {
          window.gyg("pageview", { url });
          return;
        }
        if (typeof window.GetYourGuideAnalytics === "function") {
          window.GetYourGuideAnalytics("pageview", { url });
          return;
        }
        if (typeof window.gygPartnerAnalytics === "function") {
          window.gygPartnerAnalytics("pageview", { url });
          return;
        }
        // Fallback: emit a custom event some SDKs listen for in SPA contexts
        window.dispatchEvent(new CustomEvent("gyg:pageview", { detail: { url } }));
      } catch {}
    };

    // Fire after route change and also once after hydration.
    fire();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  return null;
}

