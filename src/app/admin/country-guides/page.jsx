import CountryGuideManager from "@/components/admin/CountryGuideManager";

export const dynamic = "force-dynamic";

export default function CountryGuidesAdminPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10 space-y-6">
      <div>
        <h1 className="text-3xl md:text-4xl font-semibold">Country guides</h1>
        <p className="mt-2 text-muted-foreground">
          Edit travel basics content that appears on country pages.
        </p>
      </div>
      <CountryGuideManager />
    </main>
  );
}
