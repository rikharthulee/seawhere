"use client";
import DayItineraryBuilder from "@/components/admin/DayItineraryBuilder";

export const runtime = "nodejs";

export default function Page() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <DayItineraryBuilder />
    </main>
  );
}
