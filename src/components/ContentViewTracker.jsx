"use client";

import { useEffect } from "react";
import { incrementView } from "@/app/content-views/actions";
import { buildViewSessionKey } from "@/lib/contentViews/shared";

export default function ContentViewTracker({ type, id }) {
  useEffect(() => {
    if (!type || !id) return;
    if (typeof window === "undefined") return;
    try {
      const key = buildViewSessionKey(type, id);
      if (!key) return;
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
      incrementView(type, id).catch(() => {});
    } catch {
      // Ignore session storage errors.
    }
  }, [type, id]);

  return null;
}
