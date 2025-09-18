"use client";
import ExcursionsBuilder from "@/components/ExcursionBuilder";

export const runtime = "nodejs";

export default function ExcursionBuilderPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <ExcursionsBuilder />
    </main>
  );
}
