import { getPublicDB } from "@/lib/supabase/public";

function normalizeFacts(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const key = typeof item.key === "string" ? item.key : "";
      const valueText = typeof item.value === "string" ? item.value : "";
      if (!key || !valueText) return null;
      return { key, value: valueText };
    })
    .filter(Boolean);
}

function normalizeBlocks(blocks = []) {
  if (!Array.isArray(blocks)) return [];
  return blocks
    .map((block) => {
      if (!block || typeof block !== "object") return null;
      return {
        id: block.id,
        type: typeof block.type === "string" ? block.type : "",
        position: Number.isFinite(block.position) ? block.position : 0,
        content: block.content && typeof block.content === "object" ? block.content : {},
      };
    })
    .filter((block) => block && block.type);
}

function normalizeSections(sections = [], blocksBySection = {}) {
  if (!Array.isArray(sections)) return [];
  return sections.map((section) => {
    const slug = typeof section.slug === "string" ? section.slug : "";
    return {
      id: section.id,
      title: typeof section.title === "string" ? section.title : "",
      slug,
      summary: typeof section.summary === "string" ? section.summary : null,
      position: Number.isFinite(section.position) ? section.position : 0,
      blocks: normalizeBlocks(blocksBySection[section.id] || []),
    };
  });
}

export async function getCountryGuide(countrySlug) {
  if (!countrySlug) return null;
  const db = getPublicDB();

  const { data: guide, error: guideError } = await db
    .from("country_guides")
    .select("country_slug, intro, status, facts")
    .eq("country_slug", countrySlug)
    .eq("status", "published")
    .maybeSingle();

  if (guideError || !guide) return null;

  const { data: sections, error: sectionsError } = await db
    .from("country_guide_sections")
    .select("id, title, slug, summary, position, status")
    .eq("country_slug", countrySlug)
    .eq("status", "published")
    .order("position", { ascending: true });

  if (sectionsError || !Array.isArray(sections) || sections.length === 0) {
    return {
      ...guide,
      facts: normalizeFacts(guide.facts),
      sections: [],
    };
  }

  const sectionIds = sections.map((section) => section.id).filter(Boolean);
  const { data: blocks, error: blocksError } = await db
    .from("country_guide_blocks")
    .select("id, section_id, type, position, content")
    .in("section_id", sectionIds)
    .order("position", { ascending: true });

  const blocksBySection = (blocksError ? [] : blocks || []).reduce(
    (acc, block) => {
      if (!block?.section_id) return acc;
      acc[block.section_id] = acc[block.section_id] || [];
      acc[block.section_id].push(block);
      return acc;
    },
    {}
  );

  return {
    ...guide,
    facts: normalizeFacts(guide.facts),
    sections: normalizeSections(sections, blocksBySection),
  };
}
