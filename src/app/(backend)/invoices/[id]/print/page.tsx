import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth";
import { InvoiceDocument, invoiceDocInclude } from "@/components/odoo/invoice-document";
import { PrintButton } from "@/components/odoo/print-button";

export default async function PrintInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireStaff();
  const inv = await prisma.invoice.findUnique({ where: { id }, include: invoiceDocInclude });
  if (!inv) notFound();
  return (
    <div className="min-h-screen bg-muted/60 py-8 print:bg-white print:py-0">
      <PrintButton />
      <div className="mx-auto max-w-[850px] bg-white p-10 shadow print:max-w-none print:p-0 print:shadow-none">
        <InvoiceDocument invoice={inv} showLogo />
      </div>
    </div>
  );
}
