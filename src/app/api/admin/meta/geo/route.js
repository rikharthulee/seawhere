import { NextResponse } from "next/server";
import { getDB } from "@/lib/supabase/server";
import env from "@/lib/env";
import {
  normalizePrefectureShape,
  normalizeDivisionShape,
  shouldUseGeoViews,
  sortGeoRows,
} from "@/lib/geo-normalize";

export const runtime = "nodejs";
export const revalidate = 0;

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
    const db = await getDB();

    const [regionsRes, prefsRes, divsRes] = await Promise.all([
      db
        .from("regions")
        .select("id,name,slug,order_index")
        .order("order_index", { ascending: true }),
      prefectureQuery(db),
      divisionQuery(db),
    ]);

    const err = regionsRes.error || prefsRes.error || divsRes.error;
    if (err) return NextResponse.json({ error: err.message }, { status: 400 });

    const prefectures = Array.isArray(prefsRes.data)
      ? sortGeoRows(prefsRes.data.map(mapPrefecture).filter(Boolean))
      : [];
    const divisions = Array.isArray(divsRes.data)
      ? sortGeoRows(divsRes.data.map(mapDivision).filter(Boolean))
      : [];

    return NextResponse.json(
      {
        regions: regionsRes.data || [],
        prefectures,
        divisions,
      },
      { status: 200 }
    );
  } catch (e) {
    return NextResponse.json(
      { error: String(e?.message || e) },
      { status: 500 }
    );
  }
}
