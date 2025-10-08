import { getDB } from '@/lib/supabase/server';

const PUBLIC_ENTITY_COLUMNS = 'id,slug,name,summary,images,opening_times_url,lat,lng';

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
    if(!table){ console.warn('[public] unknown item_type', {idx, item_type: it?.item_type}); return {...it, entity:null, table:null}; }
    if(!isUUID(id)){ console.warn('[public] invalid UUID', {idx, item_type: it?.item_type, ref_id: it?.ref_id}); return {...it, entity:null, table}; }
    const { data, error, status } = await supabase.from(table).select(PUBLIC_ENTITY_COLUMNS).eq('id', id).maybeSingle();
    if(error){ console.error('[public] entity select failed', {table, status, msg:error.message, ref_id:id}); return {...it, entity:null, table}; }
    if(!data){ console.warn('[public] entity not visible', {table, ref_id:id}); return {...it, entity:null, table}; }
    return {...it, entity:data, table};
  }));
}

export async function getCuratedExcursionPublicByIdentifier(identifier){
  const supabase = await getDB();
  const ident = String(identifier||'').trim();
  const byId = isUUID(ident);

  let q = supabase.from('excursions')
    .select('id, slug, name, summary, description, cover_image, maps_url, destination_id, status, tags, updated_at, transport')
    .eq('status','published').limit(1);
  q = byId ? q.eq('id', ident) : q.eq('slug', ident);

  const { data: rows, error: exErr } = await q;
  if(exErr){ console.error('getCuratedExcursionPublicByIdentifier: excursion lookup error:', exErr.message); return {excursion:null, items:[], transport:[]}; }
  const ex = rows?.[0] || null;
  if(!ex) return {excursion:null, items:[], transport:[]};

  const { data: rawItems, error: itemsErr } = await supabase
    .from('excursion_items')
    .select('item_type, ref_id, sort_order')   // minimal keys only
    .eq('excursion_id', ex.id)
    .order('sort_order', { ascending: true });

  if(itemsErr){
    console.error('getCuratedExcursionPublicByIdentifier: items lookup error:', itemsErr.message);
    return { excursion: ex, items: [], transport: normalizeTransport(ex.transport) };
  }

  const items = await hydrateExcursionItems(supabase, rawItems || []);
  const transport = normalizeTransport(ex.transport);
  return { excursion: ex, items, transport };
}

// Simple public listing for the index page
export async function listPublishedExcursions({ limit = 200 } = {}) {
  const supabase = await getDB();
  const { data, error } = await supabase
    .from('excursions')
    .select('id, slug, name, summary, cover_image, tags, destination_id, status, updated_at, maps_url')
    .eq('status', 'published')
    .order('updated_at', { ascending: false })
    .limit(Math.min(Math.max(Number(limit) || 0, 1), 500));
  if (error) throw error;
  return data || [];
}
