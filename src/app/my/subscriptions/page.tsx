import { prisma } from "@/lib/prisma";
import { requirePortal } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { PortalSubscriptionTable, portalSubSelect } from "../portal-lists";

export const metadata = { title: "My Subscriptions" };

export default async function MySubscriptions() {
  const user = await requirePortal();
  const subs = await prisma.subscription.findMany({
    where: { customerId: user.customerId, status: { not: "DRAFT" } },
    orderBy: { createdAt: "desc" },
    select: portalSubSelect,
  });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Subscriptions</h1>
      <Card><PortalSubscriptionTable rows={subs} /></Card>
    </div>
  );
}
