import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth";
import { fmtDate, money } from "@/lib/format";
import { NewPaymentForm } from "./new-payment-form";

export const metadata = { title: "New Payment" };

export default async function NewPaymentPage({ searchParams }: { searchParams: Promise<{ invoice?: string }> }) {
  const sp = await searchParams;
  await requireStaff();
  const invoices = await prisma.invoice.findMany({
    where: { status: "CONFIRMED" },
    orderBy: { dueDate: "asc" },
    select: { id: true, number: true, total: true, amountPaid: true, dueDate: true, customer: { select: { name: true } } },
    take: 1000,
  });
  return (
    <NewPaymentForm
      defaultInvoice={sp.invoice}
      invoices={invoices.map((i) => ({
        id: i.id,
        due: Math.round((i.total - i.amountPaid) * 100) / 100,
        label: `${i.number} · ${i.customer.name} · ${money(i.total - i.amountPaid)} due ${fmtDate(i.dueDate)}`,
      }))}
    />
  );
}
