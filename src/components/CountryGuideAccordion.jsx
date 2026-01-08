import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import CountryGuideBlockRenderer from "@/components/CountryGuideBlockRenderer";
import QuickFacts from "@/components/QuickFacts";

export default function CountryGuideAccordion({ sections = [], facts = [] }) {
  const hasSections = Array.isArray(sections) && sections.length > 0;
  const hasFacts = Array.isArray(facts) && facts.length > 0;
  if (!hasSections && !hasFacts) return null;

  return (
    <Accordion type="multiple" className="rounded-2xl border bg-card">
      {hasFacts ? (
        <AccordionItem value="quick-facts">
          <AccordionTrigger className="px-4 text-base">
            <div>
              <div className="font-semibold text-foreground">Quick facts</div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4">
            <div className="pb-4">
              <QuickFacts facts={facts} />
            </div>
          </AccordionContent>
        </AccordionItem>
      ) : null}
      {sections.map((section) => (
        <AccordionItem key={section.id || section.slug} value={section.slug}>
          <AccordionTrigger className="px-4 text-base">
            <div>
              <div className="font-semibold text-foreground">{section.title}</div>
              {section.summary ? (
                <div className="mt-1 text-sm text-muted-foreground">
                  {section.summary}
                </div>
              ) : null}
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4">
            <div className="space-y-4 pb-4">
              {(section.blocks || []).map((block) => (
                <CountryGuideBlockRenderer key={block.id} block={block} />
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
