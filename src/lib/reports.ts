import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { monthlyFactor } from "@/lib/pricing";
import { startOfDay } from "@/lib/format";
import { round2 } from "@/lib/utils";

export type RangeKey = "month" | "quarter" | "year" | "all";
export const RANGES: { key: RangeKey; label: string }[] = [
  { key: "month", label: "This Month" },
  { key: "quarter", label: "Last 3 Months" },
  { key: "year", label: "Last 12 Months" },
  { key: "all", label: "All Time" },
];

export function rangeStart(key: RangeKey): Date | null {
  const now = new Date();
  if (key === "month") return new Date(now.getFullYear(), now.getMonth(), 1);
  if (key === "quarter") return new Date(now.getFullYear(), now.getMonth() - 2, 1);
  if (key === "year") return new Date(now.getFullYear(), now.getMonth() - 11, 1);
  return null;
}

/** Everything the finance dashboard shows, computed with a handful of aggregate queries. */
export async function dashboardData(range: RangeKey, planId?: string) {
  const from = rangeStart(range);
  const today = startOfDay(new Date());
  const subWhere: Prisma.SubscriptionWhereInput = planId ? { planId } : {};
  const invWhere: Prisma.InvoiceWhereInput = planId ? { subscription: { planId } } : {};
  const inRange = from ? { gte: from } : undefined;

  const twelve = new Date(today.getFullYear(), today.getMonth() - 11, 1);

  const [
    byStatus,
    running,
    paymentsSum,
    invoicedSum,
    outstanding,
    overdueAgg,
    overdueList,
    newSubs,
    churned,
    paymentsSeries,
    invoicesSeries,
    recentPayments,
    topCustomers,
  ] = await Promise.all([
    prisma.subscription.groupBy({ by: ["status"], where: subWhere, _count: true }),
    prisma.subscription.findMany({
      where: { ...subWhere, status: "ACTIVE" },
      select: { plan: { select: { id: true, name: true, billingPeriod: true, billingInterval: true } }, lines: { select: { quantity: true, unitPrice: true } } },
    }),
    prisma.payment.aggregate({ where: { date: inRange, invoice: invWhere }, _sum: { amount: true }, _count: true }),
    prisma.invoice.aggregate({ where: { ...invWhere, status: { in: ["CONFIRMED", "PAID"] }, invoiceDate: inRange }, _sum: { total: true }, _count: true }),
    prisma.invoice.aggregate({ where: { ...invWhere, status: "CONFIRMED" }, _sum: { total: true, amountPaid: true }, _count: true }),
    prisma.invoice.aggregate({ where: { ...invWhere, status: "CONFIRMED", dueDate: { lt: today } }, _sum: { total: true, amountPaid: true }, _count: true }),
    prisma.invoice.findMany({
      where: { ...invWhere, status: "CONFIRMED", dueDate: { lt: today } },
      orderBy: { dueDate: "asc" },
      take: 8,
      select: { id: true, number: true, dueDate: true, total: true, amountPaid: true, customer: { select: { name: true } } },
    }),
    prisma.subscription.count({ where: { ...subWhere, confirmedAt: inRange ?? { not: null } } }),
    prisma.subscription.count({ where: { ...subWhere, status: "CLOSED", closedAt: inRange ?? { not: null } } }),
    prisma.payment.findMany({ where: { date: { gte: twelve }, invoice: invWhere }, select: { date: true, amount: true } }),
    prisma.invoice.findMany({ where: { ...invWhere, status: { in: ["CONFIRMED", "PAID"] }, invoiceDate: { gte: twelve } }, select: { invoiceDate: true, total: true } }),
    prisma.payment.findMany({
      where: { invoice: invWhere },
      orderBy: { date: "desc" },
      take: 6,
      select: { id: true, number: true, date: true, amount: true, method: true, invoice: { select: { id: true, customer: { select: { name: true } } } } },
    }),
    prisma.invoice.groupBy({
      by: ["customerId"],
      where: { ...invWhere, status: { in: ["CONFIRMED", "PAID"] }, invoiceDate: inRange },
      _sum: { total: true },
      orderBy: { _sum: { total: "desc" } },
      take: 5,
    }),
  ]);

  // MRR: normalise each running subscription's recurring amount to one month
  const mrrByPlan = new Map<string, { name: string; mrr: number; count: number }>();
  let mrr = 0;
  for (const s of running) {
    const amount = s.lines.reduce((t, l) => t + l.quantity * l.unitPrice, 0) * monthlyFactor(s.plan.billingPeriod, s.plan.billingInterval);
    mrr += amount;
    const row = mrrByPlan.get(s.plan.id) ?? { name: s.plan.name, mrr: 0, count: 0 };
    row.mrr += amount;
    row.count++;
    mrrByPlan.set(s.plan.id, row);
  }

  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(twelve.getFullYear(), twelve.getMonth() + i, 1);
    return { key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleDateString("en-GB", { month: "short" }), year: d.getFullYear(), collected: 0, invoiced: 0 };
  });
  const idx = new Map(months.map((m, i) => [m.key, i]));
  for (const p of paymentsSeries) {
    const i = idx.get(`${p.date.getFullYear()}-${p.date.getMonth()}`);
    if (i !== undefined) months[i]!.collected += p.amount;
  }
  for (const inv of invoicesSeries) {
    const i = idx.get(`${inv.invoiceDate.getFullYear()}-${inv.invoiceDate.getMonth()}`);
    if (i !== undefined) months[i]!.invoiced += inv.total;
  }

  const customerNames = await prisma.customer.findMany({
    where: { id: { in: topCustomers.map((c) => c.customerId) } },
    select: { id: true, name: true },
  });
  const nameOf = new Map(customerNames.map((c) => [c.id, c.name]));

  const count = (s: string) => byStatus.find((b) => b.status === s)?._count ?? 0;
  return {
    counts: {
      active: count("ACTIVE"),
      paused: count("PAUSED"),
      quotations: count("DRAFT") + count("QUOTATION"),
      confirmed: count("CONFIRMED"),
      closed: count("CLOSED"),
    },
    statusBreakdown: byStatus.map((b) => ({ status: b.status, count: b._count })),
    mrr: round2(mrr),
    arr: round2(mrr * 12),
    collected: round2(paymentsSum._sum.amount ?? 0),
    paymentsCount: paymentsSum._count,
    invoiced: round2(invoicedSum._sum.total ?? 0),
    invoicesCount: invoicedSum._count,
    outstanding: round2((outstanding._sum.total ?? 0) - (outstanding._sum.amountPaid ?? 0)),
    outstandingCount: outstanding._count,
    overdue: round2((overdueAgg._sum.total ?? 0) - (overdueAgg._sum.amountPaid ?? 0)),
    overdueCount: overdueAgg._count,
    overdueList,
    newSubs,
    churned,
    months: months.map((m) => ({ ...m, collected: round2(m.collected), invoiced: round2(m.invoiced) })),
    mrrByPlan: [...mrrByPlan.values()].sort((a, b) => b.mrr - a.mrr).map((p) => ({ ...p, mrr: round2(p.mrr) })),
    recentPayments,
    topCustomers: topCustomers.map((c) => ({ id: c.customerId, name: nameOf.get(c.customerId) ?? "—", total: round2(c._sum.total ?? 0) })),
  };
}
