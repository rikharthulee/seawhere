"use client";

import { useState } from "react";
import { Accordion } from "@/components/ui/accordion";
import TripDayAccordionItem from "@/components/trips/TripDayAccordionItem";

export default function TripDaysAccordion({ days = [] }) {
  const [openDayId, setOpenDayId] = useState("");

  return (
    <Accordion
      type="single"
      collapsible
      value={openDayId}
      onValueChange={(value) => setOpenDayId(value || "")}
      className="space-y-3"
    >
      {days.map((day) => (
        <TripDayAccordionItem
          key={day.id}
          day={day}
          destinationLabel={day.destinationLabel}
          itineraryLabel={day.itineraryLabel}
          itineraryCount={day.itineraryCount}
          isOpen={openDayId === day.id}
        />
      ))}
    </Accordion>
  );
}
