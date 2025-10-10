import Experiences from "@/components/Experiences";
// Fetch via API (ISR)
import { listPublishedExperiences } from "@/lib/data/public/experiences";

export default async function ExperiencesPage() {
  const items = await listPublishedExperiences();
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <Experiences items={items} />
    </main>
  );
}
export const revalidate = 300;
export const runtime = "nodejs";
