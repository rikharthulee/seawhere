import { getServiceSupabase } from "@/lib/supabase";

export default async function Page() {
  const supa = getServiceSupabase();

  const { data, error } = await supa
    .from("excursions")
    .select("*") // grab everything
    .limit(5);

  if (error) {
    return <pre>Query error: {error.message}</pre>;
  }

  if (!data || !data.length) {
    return <p>No rows at all in excursions table.</p>;
  }

  return <pre>{JSON.stringify(data, null, 2)}</pre>;
}
