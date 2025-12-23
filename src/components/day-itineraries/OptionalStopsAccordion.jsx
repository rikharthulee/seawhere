import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import ItineraryRow from "./ItineraryRow";

export default function OptionalStopsAccordion({
  items = [],
  activeKey,
  onSelect,
}) {
  if (!Array.isArray(items) || items.length === 0) return null;

  return (
    <Accordion type="single" collapsible>
      <AccordionItem value="optional-stops" className="border-b-0">
        <AccordionTrigger className="text-left">
          Optional stops nearby ({items.length})
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-4 pt-4">
            <ul className="space-y-4">
              {items.map((entry, idx) => (
                <ItineraryRow
                  key={`optional-${entry?.it?.id || idx}`}
                  entry={entry}
                  isActive={activeKey === (entry?.it?.id || `optional-${idx}`)}
                  onSelect={onSelect}
                  compact
                />
              ))}
            </ul>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
