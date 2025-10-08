export default function FlowView({ items = [], legs = [], mapsUrl = "" }) {
  const rows = [];
  for (let i = 0; i < items.length; i++) {
    rows.push({ kind: "item", data: items[i] });
    if (i < legs.length) rows.push({ kind: "leg", data: legs[i] });
  }
  return (
    <section className="mx-auto max-w-3xl px-4 pb-16">
      {rows.map((row, idx) => (
        <div key={idx} className="mb-6">
          {row.kind === "item" ? (
            <ItemCard item={row.data} />
          ) : (
            <LegCard leg={row.data} />
          )}
        </div>
      ))}
      {mapsUrl ? (
        <div className="mt-8">
          <a className="underline" href={mapsUrl} target="_blank" rel="noreferrer">
            Open route map
          </a>
        </div>
      ) : null}
    </section>
  );
}

function ItemCard({ item }) {
  const e = item?.entity || {};
  return (
    <article className="rounded border p-4">
      <h3 className="text-lg font-semibold">{e.name || "Untitled"}</h3>
      {e.summary ? <p className="text-sm mt-1">{e.summary}</p> : null}
      {e.opening_times_url ? (
        <a className="text-sm underline" href={e.opening_times_url} target="_blank" rel="noreferrer">
          Opening times
        </a>
      ) : null}
    </article>
  );
}

function LegCard({ leg }) {
  const dur = Number(leg?.est_duration_min) || null;
  const costMin = Number(leg?.est_cost_min) || null;
  const costMax = Number(leg?.est_cost_max) || null;
  const currency = leg?.currency || "JPY";
  return (
    <div className="rounded bg-muted p-4">
      <div className="text-sm font-medium">{leg?.title || leg?.primary_mode || "Transport"}</div>
      {leg?.summary ? <p className="text-sm mt-1">{leg.summary}</p> : null}
      {dur || costMin ? (
        <div className="text-xs mt-2">
          {dur ? `~${dur} min` : null}
          {costMin ? ` · ${currency} ${costMin}${costMax ? `–${costMax}` : ""}` : null}
        </div>
      ) : null}
    </div>
  );
}

