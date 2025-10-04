import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDB } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const revalidate = 0;

export async function GET() {
  try {
    const db = await getDB();
    const { data, error } = await db.auth.getUser();
    if (error) {
      const message = String(error?.message || "").toLowerCase();
      if (
        message.includes("refresh token") ||
        error?.code === "refresh_token_not_found" ||
        error?.code === "refresh_token_expired" ||
        error?.code === "refresh_token_already_used"
      ) {
        try {
          await db.auth.signOut();
        } catch (_) {}
        try {
          const cookieStore = await cookies();
          cookieStore
            .getAll()
            .filter((cookie) =>
              cookie.name.startsWith("sb-") || cookie.name.startsWith("sb:")
            )
            .forEach((cookie) => {
              cookieStore.set(cookie.name, "", {
                path: "/",
                maxAge: 0,
                sameSite: "lax",
                secure: process.env.NODE_ENV === "production",
              });
            });
        } catch (_) {}
      }
    }

    const resp = NextResponse.json(
      { user: error ? null : data?.user || null },
      { status: 200 }
    );
    resp.headers.set('Cache-Control', 'no-store');
    return resp;
  } catch (e) {
    const resp = NextResponse.json({ user: null }, { status: 200 });
    resp.headers.set('Cache-Control', 'no-store');
    return resp;
  }
}
