import { Badge } from "@/components/ui/badge";

export default function StatusBadge({ status }) {
  const s = String(status || "").toLowerCase();
  const isDraft = s === "draft";
  const label = isDraft ? "Draft" : "Published";
  const variant = isDraft ? "warning" : "success";
  return <Badge variant={variant}>{label}</Badge>;
}
