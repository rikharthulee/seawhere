// app/destinations/[slug]/page.js  (temporary minimal version)
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

export const revalidate = 0;

export default async function DestinationPage({ params }) {
  const { slug } = params; // no await here
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  // Minimal, no joins, only what's needed to render
  const { data: dst, error } = await db
    .from("destinations")
    .select(
      "id, name, slug, status, prefecture_id, division_id, hero_image, thumbnail_image, summary, body_richtext, credit"
    )
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (error || !dst) notFound();

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl md:text-4xl font-medium">{dst.name}</h1>
      <p className="mt-4 text-black/70">{dst.summary}</p>
    </main>
  );
}
