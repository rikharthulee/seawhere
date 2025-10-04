import { Label } from "@/components/ui/label";

function formatAdmissionAmount(row) {
  if (row?.is_free) return "Free";
  const raw = row?.amount;
  if (raw === null || raw === undefined || raw === "") return null;
  const currency = (row?.currency || "JPY").toUpperCase();
  const amount = Number(raw);
  if (Number.isNaN(amount)) return null;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch (_) {
    return `${currency} ${amount.toLocaleString()}`;
  }
}

function formatAgeRange(row) {
  const toNumber = (value) => {
    if (value === null || value === undefined || value === "") return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  };
  const min = toNumber(row?.min_age);
  const max = toNumber(row?.max_age);
  if (min === null && max === null) return null;
  if (min !== null && max !== null) return `${min}–${max}`;
  if (min !== null) return `${min}+`;
  return `Up to ${max}`;
}

function formatDateLabel(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function groupBySubsection(rows = []) {
  const map = new Map();
  rows.forEach((row) => {
    if (!row) return;
    const key = row.subsection ? String(row.subsection).trim() : "";
    const normalizedKey = key.length > 0 ? key : null;
    if (!map.has(normalizedKey)) map.set(normalizedKey, []);
    map.get(normalizedKey).push(row);
  });
  return map;
}

export default function AdmissionPricesPublic({ admissions }) {
  const safeAdmissions = Array.isArray(admissions) ? admissions : [];
  const groups = Array.from(groupBySubsection(safeAdmissions).entries());

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold text-foreground">
        Admission prices
      </h2>
      {groups.length > 0 ? (
        groups.map(([subsection, items]) => (
          <div key={subsection || "__DEFAULT__"} className="space-y-3">
            {subsection ? (
              <h3 className="text-lg font-semibold text-foreground">
                {subsection}
              </h3>
            ) : null}
            <ul className="space-y-3 text-sm">
              {items.map((row) => {
                const amountLabel = formatAdmissionAmount(row);
                const ages = formatAgeRange(row);
                const validFrom = formatDateLabel(row.valid_from);
                const validTo = formatDateLabel(row.valid_to);
                const validity =
                  validFrom || validTo ? (
                    <span className="text-xs text-muted-foreground">
                      {validFrom && validTo
                        ? `Valid ${validFrom} – ${validTo}`
                        : validFrom
                        ? `Valid from ${validFrom}`
                        : `Valid until ${validTo}`}
                    </span>
                  ) : null;

                return (
                  <li
                    key={`${row.id || row.label}-${row.idx}`}
                    className="rounded border bg-card px-3 py-2 text-card-foreground"
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className="font-medium">{row.label}</span>
                        <span className="text-sm text-muted-foreground">
                          {amountLabel || "See details"}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        {ages ? <span>Age {ages}</span> : null}
                        {row.requires_id ? (
                          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wide">
                            ID required
                          </span>
                        ) : null}
                      </div>
                      {validity}
                      {row.note ? (
                        <span className="text-xs text-muted-foreground">
                          {row.note}
                        </span>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ))
      ) : (
        <p className="text-sm text-muted-foreground">
          Admission pricing not available.
        </p>
      )}
    </div>
  );
}
