import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { listCountriesPublic } from "@/lib/data/public/geo";

export const revalidate = 300;
export const runtime = "nodejs";

export default async function CountriesPage() {
  const countries = await listCountriesPublic();

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="border-t-2 border-border pt-2">
        <h1 className="text-3xl md:text-4xl font-medium">Countries</h1>
        <div className="border-b-2 border-border mt-3" />
      </div>

      <section className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {countries.map((country) => (
          <Card key={country.id} className="overflow-hidden">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold">{country.name}</div>
                {country.iso_code ? (
                  <div className="text-sm text-muted-foreground">{country.iso_code}</div>
                ) : null}
              </div>
              <Link href={`/country/${country.slug}`} className="underline text-sm">
                Explore
              </Link>
            </CardContent>
          </Card>
        ))}
      </section>
    </main>
  );
}
