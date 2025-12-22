"use server";

import { getPublicDB } from "@/lib/supabase/public";
import { resolveImageUrl } from "@/lib/imageUrl";
import { getCuratedDayItineraryByIdPublic } from "@/lib/data/public/itineraries";

export async function getDayItineraryItems(dayItineraryId) {
  if (!dayItineraryId) return { items: [] };
  const { items, transport } = await getCuratedDayItineraryByIdPublic(
    dayItineraryId
  );
  const normalized = (items || []).map((it) => normalizeItem(it));
  const flow = [
    ...(transport || []).map((leg) => ({
      kind: "leg",
      sort_order: Number.isFinite(leg?.sort_order) ? leg.sort_order : Infinity,
      leg,
    })),
    ...normalized.map((it) => ({
      kind: "item",
      sort_order: Number.isFinite(it?.sort_order) ? it.sort_order : Infinity,
      isNote: it.isNote,
      it,
    })),
  ].sort((a, b) => {
    const orderA = Number.isFinite(a.sort_order) ? a.sort_order : Infinity;
    const orderB = Number.isFinite(b.sort_order) ? b.sort_order : Infinity;
    if (orderA !== orderB) return orderA - orderB;
    const priority = (entry) => {
      if (entry.kind === "leg") return 0;
      if (entry.kind === "item" && !entry.isNote) return 1;
      return 2;
    };
    return priority(a) - priority(b);
  });
  return { items: normalized, flow };
}

function firstParagraph(value) {
  try {
    if (!value) return "";
    if (typeof value === "string") return value.trim();
    if (Array.isArray(value)) {
      for (const entry of value) {
        if (typeof entry === "string" && entry.trim()) return entry.trim();
        if (
          entry &&
          typeof entry === "object" &&
          typeof entry.text === "string" &&
          entry.text.trim()
        ) {
          return entry.text.trim();
        }
      }
      return "";
    }
    if (typeof value === "object") {
      if (value.type === "paragraph") {
        const nodes = Array.isArray(value.content) ? value.content : [];
        const text = nodes.map((n) => n?.text || "").join("").trim();
        if (text) return text;
      }
      if (value.type === "doc" && Array.isArray(value.content)) {
        for (const node of value.content) {
          if (node?.type === "paragraph") {
            const nodes = Array.isArray(node.content) ? node.content : [];
            const text = nodes.map((n) => n?.text || "").join("").trim();
            if (text) return text;
          }
        }
      }
      if (typeof value.summary === "string" && value.summary.trim()) {
        return value.summary.trim();
      }
      if (typeof value.text === "string" && value.text.trim()) {
        return value.text.trim();
      }
    }
  } catch {}
  return "";
}

function firstImage(srcLike) {
  if (!srcLike) return null;
  if (typeof srcLike === "string") return srcLike;
  if (Array.isArray(srcLike) && srcLike.length) {
    const f = srcLike[0];
    if (typeof f === "string") return f;
    if (f?.src) return f.src;
  }
  if (srcLike?.src) return srcLike.src;
  return null;
}

function normalizeItem(it) {
  const e = it?.entity || null;
  const isNote = (it?.item_type || "").toLowerCase() === "note";
  const noteTitle = isNote ? e?.title || it?.title || "Note" : null;
  const noteDetails = isNote ? e?.details ?? it?.details ?? "" : null;
  const displayImage = isNote
    ? null
    : resolveImageUrl(firstImage(e?.images) || firstImage(it?.images));
  const entitySummary =
    e?.summary || (e?.description ? firstParagraph(e.description) : "");

  return {
    ...it,
    isNote,
    displayName: isNote ? noteTitle : e?.name || it?.name || "(untitled)",
    displaySummary: isNote ? noteDetails || "" : entitySummary || it?.summary || "",
    opening_times_url: isNote
      ? null
      : e?.opening_times_url || it?.opening_times_url || null,
    displayImage,
    details: isNote
      ? noteDetails
      : typeof it?.details === "string" && it.details.trim().length > 0
        ? it.details
        : null,
  };
}
