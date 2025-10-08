import { getPublicDB } from '@/lib/supabase/public';
import { ENTITY_PUBLIC_COLUMNS, EXCURSION_PUBLIC_COLUMNS, EXCURSION_LINK_COLUMNS } from '@/lib/data/public/selects';

function isUUID(v){ return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(v||'').trim()); }
function tableForType(t){
  switch((t||'').toLowerCase().trim()){
    case 'sight': return 'sights';
    case 'experience': return 'experiences';
    case 'tour': return 'tours';
    default: return null;
  }
}
function normalizeTransport(value){
  if(!value) return [];
  if(Array.isArray(value)) return value;
  if(typeof value === 'string'){ try{
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : Array.isArray(parsed?.items) ? parsed.items : (parsed && typeof parsed==='object') ? [parsed] : [];
  } catch { return []; } }
  if(typeof value === 'object'){ return Array.isArray(value.items) ? value.items : [value]; }
  return [];
}

// Strict per-item hydrator. No batching, no normalization, no fallback requests.
export async function hydrateExcursionItems(supabase, items=[]){
  return Promise.all((items||[]).map(async (it, idx)=>{
    const table = tableForType(it?.item_type);
    const id = typeof it?.ref_id==='string' ? it.ref_id.trim() : it?.ref_id;
    if(!table){ console.warn('[public:excursions] unknown item_type', {idx, item_type: it?.item_type}); return {...it, entity:null, table:null}; }
    if(!isUUID(id)){ console.warn('[public:excursions] invalid id', { idx, id: it?.ref_id }); return {...it, entity:null, table}; }
    const { data, error, status } = await supabase.from(table).select(ENTITY_PUBLIC_COLUMNS).eq('id', id).maybeSingle();
    if(error){ console.error('[public:excursions] select failed', {table, status, msg:error.message}); return {...it, entity:null, table}; }
    if(!data){ console.warn('[public:excursions] entity not visible', { table, id }); return {...it, entity:null, table}; }
    return {...it, entity:data, table};
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
    return { excursion: ex, items: [], transport: normalizeTransport(ex.transport) };
  }

  const items = await hydrateExcursionItems(supabase, rawItems || []);
  const transport = normalizeTransport(ex.transport);
  return { excursion: ex, items, transport };
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
    return { excursion: ex, items: [], transport: normalizeTransport(ex.transport) };
  }

  const items = await hydrateExcursionItems(supabase, rawItems || []);
  const transport = normalizeTransport(ex.transport);
  return { excursion: ex, items, transport };
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
