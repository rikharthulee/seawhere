import { NextResponse } from "next/server";
import { getDB } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const revalidate = 0;

function normalizeFacts(facts) {
  if (!Array.isArray(facts)) return [];
  return facts
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const key = typeof item.key === "string" ? item.key.trim() : "";
      const value = typeof item.value === "string" ? item.value.trim() : "";
      if (!key || !value) return null;
      return { key, value };
    })
    .filter(Boolean);
}

function normalizeBlocks(blocks) {
  if (!Array.isArray(blocks)) return [];
  return blocks
    .map((block, index) => {
      if (!block || typeof block !== "object") return null;
      const type = typeof block.type === "string" ? block.type : "";
      const position = Number.isFinite(block.position) ? block.position : index + 1;
      const content = block.content && typeof block.content === "object" ? block.content : {};
      if (!type) return null;
      return { type, position, content };
    })
    .filter(Boolean);
}

function normalizeSections(sections) {
  if (!Array.isArray(sections)) return [];
  return sections
    .map((section, index) => {
      if (!section || typeof section !== "object") return null;
      const title = typeof section.title === "string" ? section.title.trim() : "";
      const slug = typeof section.slug === "string" ? section.slug.trim() : "";
      const summary =
        typeof section.summary === "string" ? section.summary.trim() : "";
      const position = Number.isFinite(section.position) ? section.position : index + 1;
      if (!title || !slug) return null;
      return {
        title,
        slug,
        summary: summary || null,
        position,
        blocks: normalizeBlocks(section.blocks),
      };
    })
    .filter(Boolean);
}

export async function GET(request) {
  try {
    const db = await getDB();
    const { searchParams } = new URL(request.url);
    const countrySlug = searchParams.get("country");

    const { data: countries, error: countriesError } = await db
      .from("countries")
      .select("id, name, slug")
      .order("name", { ascending: true });

    if (countriesError) {
      return NextResponse.json({ error: countriesError.message }, { status: 400 });
    }

    if (!countrySlug) {
      return NextResponse.json({ countries: countries || [], guide: null }, { status: 200 });
    }

    const { data: guide, error: guideError } = await db
      .from("country_guides")
      .select("country_slug, intro, facts, status")
      .eq("country_slug", countrySlug)
      .maybeSingle();

    if (guideError) {
      return NextResponse.json({ error: guideError.message }, { status: 400 });
    }

    if (!guide) {
      return NextResponse.json({ countries: countries || [], guide: null }, { status: 200 });
    }

    const { data: sections, error: sectionsError } = await db
      .from("country_guide_sections")
      .select("id, title, slug, summary, position, status")
      .eq("country_slug", countrySlug)
      .order("position", { ascending: true });

    if (sectionsError) {
      return NextResponse.json({ error: sectionsError.message }, { status: 400 });
    }

    const sectionIds = (sections || []).map((section) => section.id).filter(Boolean);
    let blocks = [];
    if (sectionIds.length) {
      const { data: blocksData, error: blocksError } = await db
        .from("country_guide_blocks")
        .select("id, section_id, type, position, content, status")
        .in("section_id", sectionIds)
        .order("position", { ascending: true });

      if (blocksError) {
        return NextResponse.json({ error: blocksError.message }, { status: 400 });
      }
      blocks = blocksData || [];
    }

    const blocksBySection = blocks.reduce((acc, block) => {
      if (!block?.section_id) return acc;
      acc[block.section_id] = acc[block.section_id] || [];
      acc[block.section_id].push(block);
      return acc;
    }, {});

    const shapedSections = (sections || []).map((section) => ({
      ...section,
      blocks: blocksBySection[section.id] || [],
    }));

    return NextResponse.json(
      {
        countries: countries || [],
        guide: {
          ...guide,
          sections: shapedSections,
        },
      },
      { status: 200 }
    );
  } catch (e) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const payload = await request.json();
    const countrySlug =
      typeof payload?.country_slug === "string" ? payload.country_slug.trim() : "";
    if (!countrySlug) {
      return NextResponse.json({ error: "Missing country_slug" }, { status: 400 });
    }

    const intro = typeof payload?.intro === "string" ? payload.intro.trim() : "";
    const facts = normalizeFacts(payload?.facts);
    const sections = normalizeSections(payload?.sections);

    const db = await getDB();

    const { error: guideError } = await db
      .from("country_guides")
      .upsert({
        country_slug: countrySlug,
        intro: intro || null,
        facts,
        status: "published",
      });

    if (guideError) {
      return NextResponse.json({ error: guideError.message }, { status: 400 });
    }

    const { error: deleteError } = await db
      .from("country_guide_sections")
      .delete()
      .eq("country_slug", countrySlug);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 400 });
    }

    if (sections.length === 0) {
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    const { data: insertedSections, error: insertSectionsError } = await db
      .from("country_guide_sections")
      .insert(
        sections.map((section) => ({
          country_slug: countrySlug,
          title: section.title,
          slug: section.slug,
          summary: section.summary,
          position: section.position,
          status: "published",
        }))
      )
      .select("id, slug");

    if (insertSectionsError) {
      return NextResponse.json({ error: insertSectionsError.message }, { status: 400 });
    }

    const sectionIdBySlug = (insertedSections || []).reduce((acc, section) => {
      acc[section.slug] = section.id;
      return acc;
    }, {});

    const blocks = [];
    sections.forEach((section) => {
      const sectionId = sectionIdBySlug[section.slug];
      if (!sectionId) return;
      section.blocks.forEach((block) => {
        blocks.push({
          section_id: sectionId,
          type: block.type,
          position: block.position,
          content: block.content,
          status: "published",
        });
      });
    });

    if (blocks.length) {
      const { error: blocksError } = await db
        .from("country_guide_blocks")
        .insert(blocks);

      if (blocksError) {
        return NextResponse.json({ error: blocksError.message }, { status: 400 });
      }
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
