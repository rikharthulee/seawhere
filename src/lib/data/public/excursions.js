import { getPublicDB } from '@/lib/supabase/public';
import { EXCURSION_PUBLIC_COLUMNS, EXCURSION_LINK_COLUMNS, NOTE_PUBLIC_COLUMNS } from '@/lib/data/public/selects';

function isUUID(v){ return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(v||'').trim()); }
const TABLE_INFO = {
  sight: {
    table: 'sights',
    columns: 'id,slug,name,summary,images,opening_times_url,destination_id,lat,lng',
  },
  experience: {
    table: 'experiences',
    columns: 'id,slug,name,summary,images,destination_id,status,provider,price_amount,price_currency,duration_minutes',
  },
  tour: {
    table: 'tours',
    columns: 'id,slug,name,summary,images,destination_id,status,provider,price_amount,price_currency,duration_minutes',
  },
  accommodation: {
    table: 'accommodation',
    columns: 'id,slug,name,summary,images,destination_id,price_band,rating',
  },
  food_drink: {
    table: 'food_drink',
    columns: 'id,slug,name,description,images,destination_id,type,price_band,rating',
  },
  note: {
    table: 'excursion_notes',
    columns: NOTE_PUBLIC_COLUMNS,
  },
};

function tableInfoForType(type) {
  const key = typeof type === 'string' ? type.toLowerCase().trim() : '';
  return TABLE_INFO[key] || null;
}

function normalizeTransportSteps(rawSteps = null){
  if(!rawSteps) return { steps: [], maps_url: null, details: null };
  if(Array.isArray(rawSteps)) return { steps: rawSteps, maps_url: null, details: null };
  if(typeof rawSteps === 'object'){
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
    const steps = Array.isArray(rawSteps.steps) ? rawSteps.steps : [];
    return { steps, maps_url: mapsUrl, details };
  }
  return { steps: [], maps_url: null, details: null };
}

function mapTransportLeg(row){
  if(!row || typeof row !== 'object') return null;
  const { steps: parsedSteps, maps_url, details } = normalizeTransportSteps(row.steps);
  return {
    id: row.id,
    excursion_id: row.excursion_id,
    from_item_id: row.from_item_id,
    to_item_id: row.to_item_id,
    template_id: row.template_id,
    primary_mode: typeof row.primary_mode === 'string' ? row.primary_mode.toLowerCase() : null,
    title: row.title || null,
    summary: row.summary || details || null,
    steps: parsedSteps,
    est_duration_min: typeof row.est_duration_min === 'number' ? row.est_duration_min : null,
    est_distance_m: typeof row.est_distance_m === 'number' ? row.est_distance_m : null,
    est_cost_min: row.est_cost_min ?? null,
    est_cost_max: row.est_cost_max ?? null,
    currency: row.currency || null,
    notes: row.notes || null,
    maps_url,
    sort_order: typeof row.sort_order === 'number' ? row.sort_order : null,
  };
}

async function fetchTransportLegs(supabase, excursionId){
  const { data, error } = await supabase
    .from('excursion_transport_legs')
    .select('id,excursion_id,from_item_id,to_item_id,template_id,primary_mode,title,summary,steps,est_duration_min,est_distance_m,est_cost_min,est_cost_max,currency,notes,sort_order')
    .eq('excursion_id', excursionId)
    .order('sort_order', { ascending: true });
  if(error){
    console.error('[public:excursions] transport select failed', { table: 'excursion_transport_legs', msg: error.message, excursionId });
    return [];
  }
  return (data || []).map(mapTransportLeg).filter(Boolean);
}

// Strict per-item hydrator. No batching, no normalization, no fallback requests.
export async function hydrateExcursionItems(supabase, items = []) {
  return Promise.all((items || []).map(async (it, idx) => {
    const info = tableInfoForType(it?.item_type);
    const table = info?.table || null;
    const id = typeof it?.ref_id === 'string' ? it.ref_id.trim() : it?.ref_id;
    if (!table) {
      console.warn('[public:excursions] unknown item_type', { idx, item_type: it?.item_type });
      return { ...it, entity: null, table: null };
    }
    if (!isUUID(id)) {
      console.warn('[public:excursions] invalid id', { idx, id: it?.ref_id });
      return { ...it, entity: null, table };
    }
    const columns = info.columns;
    const { data, error, status } = await supabase
      .from(table)
      .select(columns)
      .eq('id', id)
      .maybeSingle();
    if (error) {
      console.error('[public:excursions] select failed', { table, status, msg: error.message });
      return { ...it, entity: null, table };
    }
    if (!data) {
      console.warn('[public:excursions] entity not visible', { table, id });
      return { ...it, entity: null, table };
    }
    return { ...it, entity: data, table };
  }));
}

export async function getCuratedExcursionBySlugPublic(slug){
  const supabase = getPublicDB();
  const normalized = String(slug||'').trim();
  if(!normalized){
    console.warn('[public:excursions] invalid slug', { slug });
    return { excursion: null, items: [], transport: [] };
  }

  const { data: ex, error: exErr, status } = await supabase
    .from('excursions')
    .select(EXCURSION_PUBLIC_COLUMNS)
    .eq('slug', normalized)
    .eq('status','published')
    .maybeSingle();
  if(exErr){
    console.error('[public:excursions] select failed', { table: 'excursions', status, msg: exErr.message });
    return { excursion: null, items: [], transport: [] };
  }
  if(!ex){
    console.warn('[public:excursions] entity not visible', { table: 'excursions', slug: normalized });
    return { excursion: null, items: [], transport: [] };
  }

  const { data: rawItems, error: itemsErr } = await supabase
    .from('excursion_items')
    .select(EXCURSION_LINK_COLUMNS)
    .eq('excursion_id', ex.id)
    .order('sort_order', { ascending: true });

  if(itemsErr){
    console.error('[public:excursions] select failed', { table: 'excursion_items', msg: itemsErr.message });
    const transportFallback = await fetchTransportLegs(supabase, ex.id);
    return { excursion: ex, items: [], transport: transportFallback };
  }

  const items = await hydrateExcursionItems(supabase, rawItems || []);
  const transportLegs = await fetchTransportLegs(supabase, ex.id);
  return { excursion: ex, items, transport: transportLegs };
}

export async function getCuratedExcursionByIdPublic(id){
  const supabase = getPublicDB();
  const normalized = String(id||'').trim();
  if(!isUUID(normalized)){
    console.warn('[public:excursions] invalid id', { id });
    return { excursion: null, items: [], transport: [] };
  }

  const { data: ex, error: exErr, status } = await supabase
    .from('excursions')
    .select(EXCURSION_PUBLIC_COLUMNS)
    .eq('id', normalized)
    .eq('status','published')
    .maybeSingle();
  if(exErr){
    console.error('[public:excursions] select failed', { table: 'excursions', status, msg: exErr.message });
    return { excursion: null, items: [], transport: [] };
  }
  if(!ex){
    console.warn('[public:excursions] entity not visible', { table: 'excursions', id: normalized });
    return { excursion: null, items: [], transport: [] };
  }

  const { data: rawItems, error: itemsErr } = await supabase
    .from('excursion_items')
    .select(EXCURSION_LINK_COLUMNS)
    .eq('excursion_id', normalized)
    .order('sort_order', { ascending: true });

  if(itemsErr){
    console.error('[public:excursions] select failed', { table: 'excursion_items', msg: itemsErr.message });
    const transportFallback = await fetchTransportLegs(supabase, ex.id);
    return { excursion: ex, items: [], transport: transportFallback };
  }

  const items = await hydrateExcursionItems(supabase, rawItems || []);
  const transportLegs = await fetchTransportLegs(supabase, ex.id);
  return { excursion: ex, items, transport: transportLegs };
}

// Simple public listing for the index page
export async function listPublishedExcursions({ limit = 200 } = {}) {
  const supabase = getPublicDB();
  const { data, error } = await supabase
    .from('excursions')
    .select('id, slug, name, summary, cover_image, tags, destination_id, status, updated_at, maps_url')
    .eq('status', 'published')
    .order('updated_at', { ascending: false })
    .limit(Math.min(Math.max(Number(limit) || 0, 1), 500));
  if (error) throw error;
  return data || [];
}
