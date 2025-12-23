import Timeline from "@/components/Timeline";

export default function TimelineSandboxPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10 space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">Timeline sandbox</h1>
        <p className="text-sm text-muted-foreground">
          Visual test page for the Timeline component.
        </p>
      </header>

      <section className="rounded-xl border bg-card p-6 md:p-10">
        <Timeline showSample />
      </section>
    </main>
  );
}
