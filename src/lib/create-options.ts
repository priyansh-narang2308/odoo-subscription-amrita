import "server-only";
import { prisma } from "@/lib/prisma";
import { billingLabel } from "@/lib/constants";
import { fmtDate, money } from "@/lib/format";

/** Choices for the "New subscription" dialog. */
export async function subscriptionOptions() {
  const [customers, plans, templates, terms] = await Promise.all([
    prisma.customer.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true }, take: 2000 }),
    prisma.recurringPlan.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.quotationTemplate.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, planId: true } }),
    prisma.paymentTerm.findMany({ orderBy: { dueDays: "asc" }, select: { id: true, name: true } }),
  ]);
  return {
    customers,
    plans: plans.map((p) => ({ id: p.id, name: p.name, label: billingLabel(p.billingPeriod, p.billingInterval) })),
    templates,
    terms,
  };
}

/** Posted invoices with money still due, for the "Register a payment" dialog. */
export async function openInvoiceOptions() {
  const invoices = await prisma.invoice.findMany({
    where: { status: "CONFIRMED" },
    orderBy: { dueDate: "asc" },
    select: { id: true, number: true, total: true, amountPaid: true, dueDate: true, customer: { select: { name: true } } },
    take: 1000,
  });
  return invoices.map((i) => {
    const due = Math.round((i.total - i.amountPaid) * 100) / 100;
    return { id: i.id, due, label: `${i.number} · ${i.customer.name} · ${money(due)} due ${fmtDate(i.dueDate)}` };
  });
}
