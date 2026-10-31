import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth";
import { deletePaymentTerm, savePaymentTerm } from "@/actions/payment-terms";
import { PaymentTermForm } from "./payment-term-form";

export default async function PaymentTermPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireStaff();
  const term = id === "new" ? null : await prisma.paymentTerm.findUnique({
    where: { id },
    include: { _count: { select: { subscriptions: true, invoices: true } } },
  });
  if (id !== "new" && !term) notFound();
  const inUse = !!term && term._count.subscriptions + term._count.invoices > 0;
  return (
    <PaymentTermForm
      term={term}
      readOnly={user.role !== "ADMIN"}
      save={savePaymentTerm.bind(null, term?.id ?? null)}
      remove={term && !inUse ? deletePaymentTerm.bind(null, term.id) : undefined}
    />
  );
}
