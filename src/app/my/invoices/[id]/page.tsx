import Link from "next/link";
import { notFound } from "next/navigation";
import { CreditCard, Printer } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePortal } from "@/lib/auth";
import { money } from "@/lib/format";
import { payInvoiceOnline } from "@/actions/portal";
import { ActionButton } from "@/components/odoo/action-button";
import { InvoiceDocument, invoiceDocInclude } from "@/components/odoo/invoice-document";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default async function MyInvoice({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requirePortal();
  const inv = await prisma.invoice.findFirst({
    where: { id, customerId: user.customerId, status: { in: ["CONFIRMED", "PAID"] } },
    include: invoiceDocInclude,
  });
  if (!inv) notFound();
  const due = inv.total - inv.amountPaid;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link href="/my/invoices" className="text-[13px] text-primary hover:underline">← All invoices</Link>
        <div className="flex gap-2">
          {inv.status === "CONFIRMED" && (
            <ActionButton size="default" action={payInvoiceOnline.bind(null, inv.id)} confirm={`Pay ${money(due)} now with your saved online payment method? (demo — no real charge)`}>
              <CreditCard /> Pay Now {money(due)}
            </ActionButton>
          )}
          <Button variant="secondary" asChild>
            <Link href={`/my/invoices/${inv.id}/print`} target="_blank"><Printer /> Download / Print</Link>
          </Button>
        </div>
      </div>
      <Card className="p-6 md:p-10"><InvoiceDocument invoice={inv} showLogo /></Card>
    </div>
  );
}
