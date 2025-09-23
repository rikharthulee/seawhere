import { redirect } from "next/navigation";

export default function LegacyAdminAccommodationsRedirect() {
  redirect("/admin/accommodation");
}
