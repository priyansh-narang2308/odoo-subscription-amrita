import { prisma } from "@/lib/prisma";
import { requirePortal } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { PortalInvoiceTable, portalInvSelect } from "../portal-lists";

export const metadata = { title: "My Invoices" };

export default async function MyInvoices() {
  const user = await requirePortal();
  const invoices = await prisma.invoice.findMany({
    where: { customerId: user.customerId, status: { in: ["CONFIRMED", "PAID"] } },
    orderBy: { invoiceDate: "desc" },
    take: 200,
    select: portalInvSelect,
  });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Invoices</h1>
      <Card><PortalInvoiceTable rows={invoices} /></Card>
    </div>
  );
}
