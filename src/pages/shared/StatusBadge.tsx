import type { ShortUrlStatus } from "@/domain/short-url";
import { Badge } from "@/ui/Badge";

const LABELS: Record<ShortUrlStatus, string> = { active: "Active", deactivated: "Deactivated" };

export function StatusBadge({ status }: { status: ShortUrlStatus }) {
  return <Badge tone={status === "active" ? "positive" : "neutral"}>{LABELS[status]}</Badge>;
}
