export function shouldUseGeoViews() {
  const raw =
    (typeof process !== "undefined" &&
      (process.env.NEXT_PUBLIC_USE_GEO_VIEWS ?? process.env.USE_GEO_VIEWS)) ||
    "";
  const normalized = String(raw).trim().toLowerCase();
  if (!normalized) return false;
  return ["1", "true", "yes", "on"].includes(normalized);
}

export function normalizePrefectureShape(row) {
  if (!row) return null;
  return {
    id: row.prefecture_id ?? row.id ?? null,
    name: row.prefecture_name ?? row.name ?? null,
    slug: row.prefecture_slug ?? row.slug ?? null,
    region_id:
      row.region_id ??
      row.prefecture_region_id ??
      row.region?.id ??
      null,
    region_slug: row.region_slug ?? row.region?.slug ?? null,
    region_name: row.region_name ?? row.region?.name ?? null,
    order_index:
      row.prefecture_order_index ??
      row.order_index ??
      row.order ??
      null,
  };
}

export function normalizeDivisionShape(row) {
  if (!row) return null;
  return {
    id: row.division_id ?? row.id ?? null,
    name: row.division_name ?? row.name ?? null,
    slug: row.division_slug ?? row.slug ?? null,
    prefecture_id:
      row.prefecture_id ??
      row.division_prefecture_id ??
      row.prefecture?.id ??
      null,
    prefecture_slug: row.prefecture_slug ?? row.prefecture?.slug ?? null,
    prefecture_name: row.prefecture_name ?? row.prefecture?.name ?? null,
    region_slug: row.region_slug ?? null,
    order_index:
      row.division_order_index ??
      row.order_index ??
      row.order ??
      null,
  };
}

export function sortGeoRows(rows) {
  return [...rows].sort((a, b) => {
    const ai = a?.order_index ?? Number.MAX_SAFE_INTEGER;
    const bi = b?.order_index ?? Number.MAX_SAFE_INTEGER;
    if (ai !== bi) return ai - bi;
    return String(a?.name || "").localeCompare(String(b?.name || ""));
  });
}
