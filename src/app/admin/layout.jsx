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
    .single();

  if (!profile || !["admin", "editor"].includes(profile.role)) {
    return redirect("/login?unauthorized=1");
  }

  return <div className="min-h-screen">{children}</div>;
}
