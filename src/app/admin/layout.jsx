// app/admin/layout.js
import { redirect } from "next/navigation";
import { getDB } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }) {
  const supabase = await getDB();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const fallbackRole =
    user?.app_metadata?.role || user?.role || user?.user_metadata?.role || null;
  const effectiveRole = profile?.role || fallbackRole;

  if (!effectiveRole || !["admin", "editor"].includes(effectiveRole)) {
    return redirect("/login?unauthorized=1");
  }

  return <div className="min-h-screen">{children}</div>;
}
