import CountryGuideBlockRenderer from "@/components/CountryGuideBlockRenderer";

export default function CountryGuideSections({ sections = [] }) {
  if (!Array.isArray(sections) || sections.length === 0) return null;

  return (
    <div className="space-y-10">
      {sections.map((section) => (
        <section
          key={section.id || section.slug}
          id={section.slug}
          className="scroll-mt-24 space-y-3"
        >
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-foreground">
              {section.title}
            </h3>
            {section.summary ? (
              <p className="text-sm text-muted-foreground">{section.summary}</p>
            ) : null}
          </div>
          <div className="space-y-4">
            {(section.blocks || []).map((block) => (
              <CountryGuideBlockRenderer key={block.id} block={block} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
