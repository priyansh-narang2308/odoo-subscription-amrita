import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePortal } from "@/lib/auth";
import { InvoiceDocument, invoiceDocInclude } from "@/components/odoo/invoice-document";
import { PrintButton } from "@/components/odoo/print-button";

export default async function MyInvoicePrint({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requirePortal();
  const inv = await prisma.invoice.findFirst({ where: { id, customerId: user.customerId, status: { in: ["CONFIRMED", "PAID"] } }, include: invoiceDocInclude });
  if (!inv) notFound();
  return (
    <div className="print:py-0">
      <PrintButton />
      <div className="mx-auto max-w-[850px] bg-white p-10 shadow print:max-w-none print:p-0 print:shadow-none">
        <InvoiceDocument invoice={inv} showLogo />
      </div>
    </div>
  );
}
