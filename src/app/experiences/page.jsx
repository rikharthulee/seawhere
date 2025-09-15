import Experiences from "@/components/Experiences";
import { getPublishedExperiences } from "@/lib/data/experiences";

export default async function ExperiencesPage() {
  let items = [];
  try {
    items = await getPublishedExperiences();
  } catch {}
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <Experiences items={items} />
    </main>
  );
}
export const revalidate = 300;
export const runtime = 'nodejs';
