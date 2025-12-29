function normalizeModeForDb(mode) {
  const map = {
    walk: 'WALK',
    walking: 'WALK',
    bus: 'BUS',
    coach: 'BUS',
    train: 'TRAIN',
    subway: 'SUBWAY',
    metro: 'SUBWAY',
    tram: 'TRAM',
    taxi: 'TAXI',
    cab: 'TAXI',
    car: 'DRIVE',
    drive: 'DRIVE',
    rideshare: 'DRIVE',
    ferry: 'FERRY',
    boat: 'FERRY',
    ship: 'FERRY',
    plane: 'FLY',
    flight: 'FLY',
    motorbike: 'MOTORBIKE',
    motorcycle: 'MOTORBIKE',
    scooter: 'MOTORBIKE',
  };
  const normalized = String(mode || '').trim().toLowerCase();
  if (!normalized) return 'OTHER';
  return map[normalized] || normalized.toUpperCase();
}

function toNullableInt(value) {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? Math.round(num) : null;
}

function toNullableNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function buildStepsPayload(leg = {}) {
  const steps = Array.isArray(leg.steps) ? leg.steps : [];
  const mapsUrl =
    typeof leg.maps_url === 'string' && leg.maps_url.trim()
      ? leg.maps_url.trim()
      : null;
  const details =
    typeof leg.details === 'string' && leg.details.trim()
      ? leg.details.trim()
      : null;
  const meta = {};
  if (mapsUrl) meta.maps_url = mapsUrl;
  if (details && !leg.summary) meta.details = details;
  if (typeof leg.mode === 'string' && leg.mode.trim()) {
    meta.mode = leg.mode.trim();
  }
  if (steps.length === 0 && Object.keys(meta).length === 0) {
    return { steps: [] };
  }
  return { steps, ...meta };
}

function extractStepsMeta(rawSteps) {
  if (!rawSteps) return { steps: [], maps_url: null, details: null, mode: null };
  if (Array.isArray(rawSteps)) {
    return { steps: rawSteps, maps_url: null, details: null, mode: null };
  }
  if (typeof rawSteps === 'object') {
    const steps = Array.isArray(rawSteps.steps) ? rawSteps.steps : [];
    const mapsUrl =
      typeof rawSteps.maps_url === 'string' && rawSteps.maps_url.trim()
        ? rawSteps.maps_url.trim()
        : typeof rawSteps?.meta?.maps_url === 'string'
          ? rawSteps.meta.maps_url.trim()
          : null;
    const details =
      typeof rawSteps.details === 'string' && rawSteps.details.trim()
        ? rawSteps.details.trim()
        : typeof rawSteps?.meta?.details === 'string'
          ? rawSteps.meta.details.trim()
          : null;
    const mode =
      typeof rawSteps.mode === 'string' && rawSteps.mode.trim()
        ? rawSteps.mode.trim()
        : typeof rawSteps?.meta?.mode === 'string'
          ? rawSteps.meta.mode.trim()
          : null;
    return { steps, maps_url: mapsUrl, details, mode };
  }
  return { steps: [], maps_url: null, details: null, mode: null };
}

function findNeighborItems(sortedItems, sortOrder) {
  if (!sortedItems.length) return { from: null, to: null };
  const order = Number(sortOrder) || 0;
  let from = sortedItems[0];
  let to = sortedItems[sortedItems.length - 1];
  for (const item of sortedItems) {
    if (item.sort_order < order) {
      from = item;
      continue;
    }
    if (item.sort_order === order && !from) {
      from = item;
    }
    if (item.sort_order >= order) {
      to = item;
      break;
    }
  }
  return { from, to };
}

export function buildTransportInsertRows({
  dayItineraryId,
  legs = [],
  items = [],
}) {
  if (!dayItineraryId || !Array.isArray(legs) || legs.length === 0) return [];
  const curatedItems = (items || [])
    .filter(
      (it) =>
        it &&
        it.id &&
        String(it.item_type || '').toLowerCase() !== 'note'
    )
    .map((it) => ({
      id: it.id,
      sort_order: Number(it.sort_order) || 0,
    }))
    .sort((a, b) => a.sort_order - b.sort_order);
  if (curatedItems.length === 0) return [];

  return legs
    .map((leg) => {
      if (!leg || typeof leg !== 'object') return null;
      const sortOrder = Number(leg.sort_order) || 0;
      const { from, to } = findNeighborItems(curatedItems, sortOrder);
      if (!from || !to) return null;

      const stepsPayload = buildStepsPayload(leg);
      const durationMin =
        toNullableInt(
          leg.est_duration_min !== undefined
            ? leg.est_duration_min
            : leg.duration_minutes
        );
      const distanceMeters =
        toNullableInt(
          leg.est_distance_m !== undefined
            ? leg.est_distance_m
            : leg.distance_km
              ? Number(leg.distance_km) * 1000
              : undefined
        );

      return {
        day_itinerary_id: dayItineraryId,
        from_item_id: from.id,
        to_item_id: to.id,
        template_id: leg.template_id || null,
        primary_mode: normalizeModeForDb(leg.mode || leg.primary_mode),
        title: leg.title || null,
        summary:
          leg.summary ||
          (typeof leg.details === "string" ? leg.details : null),
        steps: stepsPayload,
        est_duration_min: durationMin,
        est_distance_m: distanceMeters,
        est_cost_min: toNullableNumber(leg.est_cost_min),
        est_cost_max: toNullableNumber(leg.est_cost_max),
        currency: leg.currency || null,
        notes: leg.notes || null,
        sort_order: sortOrder || null,
      };
    })
    .filter(Boolean);
}

export function deserializeTransportLeg(row) {
  if (!row || typeof row !== 'object') return null;
  const { steps, maps_url, details, mode } = extractStepsMeta(row.steps);
  const durationMinutes =
    typeof row.est_duration_min === 'number' ? row.est_duration_min : null;
  const distanceMeters =
    typeof row.est_distance_m === 'number' ? row.est_distance_m : null;

  const normalizedMode =
    typeof mode === 'string' && mode.trim()
      ? mode.trim().toLowerCase()
      : typeof row.primary_mode === 'string'
        ? row.primary_mode.toLowerCase()
        : 'other';

  return {
    id: row.id,
    item_type: 'transport',
    sort_order: typeof row.sort_order === 'number' ? row.sort_order : null,
    primary_mode: row.primary_mode || null,
    mode: normalizedMode,
    title: row.title || '',
    summary: row.summary || null,
    details: details || row.summary || null,
    maps_url: maps_url || null,
    steps,
    est_duration_min: durationMinutes,
    duration_minutes: durationMinutes,
    est_distance_m: distanceMeters,
    distance_km: distanceMeters ? distanceMeters / 1000 : null,
    est_cost_min: row.est_cost_min ?? null,
    est_cost_max: row.est_cost_max ?? null,
    currency: row.currency || null,
    notes: row.notes || null,
    template_id: row.template_id || null,
    from_item_id: row.from_item_id || null,
    to_item_id: row.to_item_id || null,
  };
}

export function extractTransportLegs(rows = []) {
  return (rows || []).map(deserializeTransportLeg).filter(Boolean);
}
