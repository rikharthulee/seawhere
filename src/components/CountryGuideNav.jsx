import QuickFacts from "@/components/QuickFacts";

export default function CountryGuideNav({ sections = [], facts = [] }) {
  const hasSections = Array.isArray(sections) && sections.length > 0;
  const hasFacts = Array.isArray(facts) && facts.length > 0;
  if (!hasSections && !hasFacts) return null;

  return (
    <aside className="hidden md:block">
      <div className="sticky top-24 space-y-4">
        {hasSections ? (
          <div className="rounded-2xl border bg-muted/30 p-4">
            <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
              On this page
            </div>
            <nav className="mt-4 space-y-2 text-sm">
              {sections.map((section) => (
                <a
                  key={section.id || section.slug}
                  href={`#${section.slug}`}
                  className="block text-muted-foreground transition hover:text-foreground"
                >
                  {section.title}
                </a>
              ))}
            </nav>
          </div>
        ) : null}
        <QuickFacts facts={facts} />
      </div>
    </aside>
  );
}
