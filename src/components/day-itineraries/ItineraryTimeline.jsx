"use client";

import { useEffect, useMemo, useState } from "react";
import ItineraryRow from "./ItineraryRow";
import TransportLegRow from "./TransportLegRow";
import OptionalStopsAccordion from "./OptionalStopsAccordion";
import ItineraryDetailsPanel from "./ItineraryDetailsPanel";
import { Sheet, SheetContent } from "@/components/ui/sheet";

function entryKey(entry, idx) {
  if (!entry) return `entry-${idx}`;
  if (entry.kind === "leg") return entry.leg?.id || `leg-${idx}`;
  return entry.it?.id || `item-${idx}`;
}

export default function ItineraryTimeline({ flow = [], optionalItems = [] }) {
  const [activeEntry, setActiveEntry] = useState(null);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const activeKey = useMemo(() => {
    if (!activeEntry) return null;
    return entryKey(activeEntry, 0);
  }, [activeEntry]);

  const mainFlow = Array.isArray(flow) ? flow : [];
  const optionalFlow = Array.isArray(optionalItems) ? optionalItems : [];

  return (
    <>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <div className="relative pl-2">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
            <ul className="space-y-6">
              {mainFlow.map((entry, idx) =>
                entry.kind === "leg" ? (
                  <TransportLegRow
                    key={entryKey(entry, idx)}
                    entry={entry}
                    isActive={activeKey === entryKey(entry, idx)}
                    onSelect={setActiveEntry}
                  />
                ) : (
                  <ItineraryRow
                    key={entryKey(entry, idx)}
                    entry={entry}
                    isActive={activeKey === entryKey(entry, idx)}
                    onSelect={setActiveEntry}
                  />
                )
              )}
            </ul>
          </div>

          <OptionalStopsAccordion
            items={optionalFlow}
            activeKey={activeKey}
            onSelect={setActiveEntry}
          />
        </div>

        <div className="hidden lg:block">
          <div className="sticky top-24">
            <ItineraryDetailsPanel entry={activeEntry} />
          </div>
        </div>
      </div>

      <Sheet
        open={!isDesktop && !!activeEntry}
        onOpenChange={(open) => {
          if (!open) setActiveEntry(null);
        }}
      >
        <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto">
          <ItineraryDetailsPanel entry={activeEntry} />
        </SheetContent>
      </Sheet>
    </>
  );
}
