export default function QuickFacts({ facts = [] }) {
  if (!Array.isArray(facts) || facts.length === 0) return null;

  return (
    <div className="rounded-xl border bg-background p-4">
      <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
        Quick facts
      </div>
      <div className="mt-3 space-y-1">
        {facts.map((fact, index) => (
          <div key={`${fact.key}-${index}`} className="flex gap-3 py-1 text-sm">
            <div className="text-muted-foreground">{fact.key}</div>
            <div className="ml-auto text-right font-medium text-foreground line-clamp-2">
              {fact.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
