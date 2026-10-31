import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { INVOICE_STATUS_LABEL, SUBSCRIPTION_STATUS_LABEL } from "@/lib/constants";

const SUB: Record<string, BadgeVariant> = {
  DRAFT: "gray",
  QUOTATION: "blue",
  CONFIRMED: "purple",
  ACTIVE: "green",
  PAUSED: "yellow",
  CLOSED: "red",
};
const INV: Record<string, BadgeVariant> = {
  DRAFT: "gray",
  CONFIRMED: "blue",
  PAID: "green",
  CANCELLED: "red",
};

export function SubscriptionStatusBadge({ status }: { status: string }) {
  return <Badge variant={SUB[status] ?? "gray"}>{SUBSCRIPTION_STATUS_LABEL[status] ?? status}</Badge>;
}

export function InvoiceStatusBadge({ status, overdue }: { status: string; overdue?: boolean }) {
  if (overdue && status === "CONFIRMED") return <Badge variant="red">Overdue</Badge>;
  return <Badge variant={INV[status] ?? "gray"}>{INVOICE_STATUS_LABEL[status] ?? status}</Badge>;
}

export function ActiveBadge({ active }: { active: boolean }) {
  return active ? <Badge variant="green">Active</Badge> : <Badge variant="gray">Archived</Badge>;
}
