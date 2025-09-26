import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { createClient } from "@supabase/supabase-js";
import env from "@/lib/env";
import {
  normalizePrefectureShape,
  normalizeDivisionShape,
  shouldUseGeoViews,
  sortGeoRows,
} from "@/lib/geo-normalize";

const useGeoViews = env.USE_GEO_VIEWS() || shouldUseGeoViews();

const mapPrefecture = normalizePrefectureShape;
const mapDivision = normalizeDivisionShape;

function prefectureQuery(client) {
  if (useGeoViews) {
    return client.from("geo_prefectures_v").select("*");
  }
  return client
    .from("prefectures")
    .select("id,name,slug,region_id,order_index")
    .order("order_index", { ascending: true });
}

function divisionQuery(client) {
  if (useGeoViews) {
    return client.from("geo_divisions_v").select("*");
  }
  return client
    .from("divisions")
    .select("id,name,slug,prefecture_id,order_index")
    .order("order_index", { ascending: true });
}

export async function GET() {
  try {
    // Prefer service role for reliable admin reads (bypass RLS)
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE;
    if (url && serviceKey) {
      const svc = createClient(url, serviceKey);
      const [r, p, d] = await Promise.all([
        svc.from("regions").select("id,name,slug,order_index").order("order_index", { ascending: true }),
        prefectureQuery(svc),
        divisionQuery(svc),
      ]);
      const err = r.error || p.error || d.error;
      if (err) return NextResponse.json({ error: err.message }, { status: 400 });
      const prefectures = Array.isArray(p.data)
        ? sortGeoRows(p.data.map(mapPrefecture).filter(Boolean))
        : [];
      const divisions = Array.isArray(d.data)
        ? sortGeoRows(d.data.map(mapDivision).filter(Boolean))
        : [];
      return NextResponse.json({ regions: r.data || [], prefectures, divisions });
    }

    // Fallback: use user session (requires RLS allowing reads for admin/editor)
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const [regionsRes, prefsRes, divsRes] = await Promise.all([
      supabase.from("regions").select("id,name,slug,order_index").order("order_index", { ascending: true }),
      prefectureQuery(supabase),
      divisionQuery(supabase),
    ]);
    const err = regionsRes.error || prefsRes.error || divsRes.error;
    if (err) return NextResponse.json({ error: err.message }, { status: 400 });
    const prefectures = Array.isArray(prefsRes.data)
      ? sortGeoRows(prefsRes.data.map(mapPrefecture).filter(Boolean))
      : [];
    const divisions = Array.isArray(divsRes.data)
      ? sortGeoRows(divsRes.data.map(mapDivision).filter(Boolean))
      : [];
    return NextResponse.json({ regions: regionsRes.data || [], prefectures, divisions });
  } catch (e) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
