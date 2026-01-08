export default function CountryFactsBar({ facts = [] }) {
  if (!Array.isArray(facts) || facts.length === 0) return null;

  return (
    <div className="mt-6 rounded-2xl border bg-white/80 p-4 shadow-sm backdrop-blur">
      <div className="flex gap-3 overflow-x-auto pb-2 md:grid md:grid-cols-3 md:gap-4 md:overflow-visible md:pb-0 lg:grid-cols-6">
        {facts.map((fact, index) => (
          <div
            key={`${fact.key}-${index}`}
            className="min-w-[180px] rounded-xl border bg-muted/30 px-4 py-3"
          >
            <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              {fact.key}
            </div>
            <div className="mt-1 text-sm font-semibold text-foreground">
              {fact.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
