import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { nextNumber } from "@/lib/sequence";
import { logActivity } from "@/lib/activity";
import { inputDate, startOfDay } from "@/lib/format";
import { round2 } from "@/lib/utils";
import { addDays, addPeriod, computeTotals, type CalcDiscount } from "@/lib/pricing";

type Tx = Prisma.TransactionClient;

export * from "@/lib/pricing";

/** Discounts that are live on a date and still have uses left. */
export async function activeDiscounts(db: Tx | typeof prisma, at: Date): Promise<CalcDiscount[]> {
  const rows = await db.discount.findMany({
    where: {
      active: true,
      AND: [
        { OR: [{ startDate: null }, { startDate: { lte: at } }] },
        { OR: [{ endDate: null }, { endDate: { gte: startOfDay(at) } }] },
      ],
    },
    include: { products: { select: { id: true } } },
    orderBy: { createdAt: "asc" },
  });
  return rows
    .filter((d) => d.usageLimit === null || d.usedCount < d.usageLimit)
    .map((d) => ({
      id: d.id,
      name: d.name,
      type: d.type,
      value: d.value,
      minPurchase: d.minPurchase,
      minQuantity: d.minQuantity,
      appliesTo: d.appliesTo,
      productIds: d.products.map((p) => p.id),
    }));
}

// ─── Invoice generation ───────────────────────────────────────

export class BillingError extends Error {}

const subscriptionForBilling = {
  plan: true,
  paymentTerm: true,
  lines: { include: { taxes: true }, orderBy: { sequence: "asc" } },
} satisfies Prisma.SubscriptionInclude;

/**
 * Creates the invoice for a subscription's next billing period and moves the
 * subscription's next invoice date forward. The (subscription, period) pair is
 * unique in the database, so a period can never be billed twice.
 */
export async function generateInvoice(
  tx: Tx,
  subscriptionId: string,
  opts: { userId?: string | null; invoiceDate?: Date } = {},
) {
  const sub = await tx.subscription.findUnique({ where: { id: subscriptionId }, include: subscriptionForBilling });
  if (!sub) throw new BillingError("Subscription not found");
  if (sub.status !== "ACTIVE") throw new BillingError("Only running subscriptions can be invoiced");
  if (!sub.lines.length) throw new BillingError("Add at least one order line before invoicing");

  const periodStart = startOfDay(sub.nextInvoiceDate ?? sub.startDate);
  if (sub.expirationDate && periodStart >= startOfDay(sub.expirationDate)) {
    throw new BillingError("The subscription has reached its expiration date");
  }
  let periodEnd = addPeriod(periodStart, sub.plan.billingPeriod, sub.plan.billingInterval);
  if (sub.expirationDate && periodEnd > sub.expirationDate) periodEnd = startOfDay(sub.expirationDate);

  const periodKey = inputDate(periodStart);
  const dup = await tx.invoice.findFirst({ where: { subscriptionId: sub.id, periodKey }, select: { number: true } });
  if (dup) throw new BillingError(`This period is already billed on ${dup.number}`);

  const invoiceDate = startOfDay(opts.invoiceDate ?? new Date());
  const discounts = await activeDiscounts(tx, invoiceDate);
  const totals = computeTotals(
    sub.lines.map((l) => ({
      productId: l.productId,
      description: l.description,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      taxes: l.taxes,
    })),
    discounts,
  );

  const number = await nextNumber(tx, "INV", invoiceDate);
  const invoice = await tx.invoice.create({
    data: {
      number,
      customerId: sub.customerId,
      subscriptionId: sub.id,
      paymentTermId: sub.paymentTermId,
      status: "DRAFT",
      invoiceDate,
      dueDate: addDays(invoiceDate, sub.paymentTerm?.dueDays ?? 0),
      periodStart,
      periodEnd,
      periodKey,
      untaxedAmount: totals.untaxed,
      discountAmount: totals.discount,
      taxAmount: totals.tax,
      total: totals.total,
      lines: {
        create: totals.lines.map((l, i) => ({
          productId: l.productId,
          description: l.description,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          subtotal: l.subtotal,
          discountAmount: l.discountAmount,
          taxAmount: l.taxAmount,
          total: l.total,
          taxLabel: l.taxLabel,
          sequence: i,
        })),
      },
      discounts: { create: totals.applied.map((a) => ({ discountId: a.id, amount: a.amount })) },
    },
  });

  for (const a of totals.applied) {
    await tx.discount.update({ where: { id: a.id }, data: { usedCount: { increment: 1 } } });
  }
  await tx.subscription.update({ where: { id: sub.id }, data: { nextInvoiceDate: periodEnd } });
  await logActivity("subscription", sub.id, `Invoice ${number} created for ${periodKey} → ${inputDate(periodEnd)}`, opts.userId, tx);
  await logActivity("invoice", invoice.id, `Invoice created from subscription ${sub.number}`, opts.userId, tx);
  return invoice;
}

/** Cancels an invoice and releases its billing period so it can be billed again. */
export async function cancelInvoice(tx: Tx, invoiceId: string, userId?: string | null) {
  const inv = await tx.invoice.findUnique({
    where: { id: invoiceId },
    include: { payments: { select: { id: true } }, discounts: true, subscription: true },
  });
  if (!inv) throw new BillingError("Invoice not found");
  if (inv.status === "CANCELLED") return inv;
  if (inv.payments.length) throw new BillingError("Invoices with registered payments cannot be cancelled");

  for (const d of inv.discounts) {
    await tx.discount.update({ where: { id: d.discountId }, data: { usedCount: { decrement: 1 } } });
  }
  // If this was the latest billed period, rewind the subscription so the period is not skipped
  if (inv.subscription && inv.periodStart && inv.periodEnd &&
      inv.subscription.nextInvoiceDate?.getTime() === inv.periodEnd.getTime()) {
    await tx.subscription.update({ where: { id: inv.subscription.id }, data: { nextInvoiceDate: inv.periodStart } });
  }
  const updated = await tx.invoice.update({ where: { id: inv.id }, data: { status: "CANCELLED", periodKey: null } });
  await logActivity("invoice", inv.id, "Invoice cancelled", userId, tx);
  return updated;
}

export type BillingRunResult = { activated: number; invoiced: number; closed: number; errors: string[] };

/**
 * Billing day: starts confirmed subscriptions whose start date has arrived,
 * invoices every period that is due (catching up missed ones) and closes
 * plans set to end on their own.
 */
export async function runBilling(userId?: string | null, today = new Date()): Promise<BillingRunResult> {
  const now = startOfDay(today);
  const result: BillingRunResult = { activated: 0, invoiced: 0, closed: 0, errors: [] };

  const toStart = await prisma.subscription.findMany({
    where: { status: "CONFIRMED", startDate: { lte: now } },
    select: { id: true },
  });
  for (const s of toStart) {
    await prisma.subscription.update({ where: { id: s.id }, data: { status: "ACTIVE" } });
    await logActivity("subscription", s.id, "Subscription started by billing run", userId);
    result.activated++;
  }

  const due = await prisma.subscription.findMany({
    where: { status: "ACTIVE", nextInvoiceDate: { lte: now } },
    select: { id: true, number: true },
  });
  for (const s of due) {
    // Catch up every due period, one transaction per invoice
    for (let guard = 0; guard < 60; guard++) {
      const current = await prisma.subscription.findUnique({
        where: { id: s.id },
        select: { nextInvoiceDate: true, expirationDate: true },
      });
      if (!current?.nextInvoiceDate || current.nextInvoiceDate > now) break;
      if (current.expirationDate && current.nextInvoiceDate >= current.expirationDate) break;
      try {
        await prisma.$transaction((tx) =>
          generateInvoice(tx, s.id, { userId, invoiceDate: current.nextInvoiceDate! }),
        );
        result.invoiced++;
      } catch (e) {
        result.errors.push(`${s.number}: ${e instanceof Error ? e.message : "failed"}`);
        break;
      }
    }
  }

  const toClose = await prisma.subscription.findMany({
    where: { status: { in: ["ACTIVE", "PAUSED"] }, expirationDate: { lte: now }, plan: { autoClose: true } },
    select: { id: true },
  });
  for (const s of toClose) {
    await prisma.subscription.update({
      where: { id: s.id },
      data: { status: "CLOSED", closedAt: new Date(), closeReason: "Expired (plan closes automatically)" },
    });
    await logActivity("subscription", s.id, "Subscription closed automatically at expiration", userId);
    result.closed++;
  }

  return result;
}

// ─── Payments ─────────────────────────────────────────────────

export async function registerPayment(
  tx: Tx,
  input: { invoiceId: string; method: string; amount: number; date: Date; note?: string | null; userId?: string | null },
) {
  const inv = await tx.invoice.findUnique({ where: { id: input.invoiceId } });
  if (!inv) throw new BillingError("Invoice not found");
  if (inv.status !== "CONFIRMED") throw new BillingError("Only posted, unpaid invoices can receive payments");
  const due = round2(inv.total - inv.amountPaid);
  const amount = round2(input.amount);
  if (amount <= 0) throw new BillingError("Amount must be greater than zero");
  if (amount > due + 0.001) throw new BillingError(`Amount exceeds the amount due (${due.toFixed(2)})`);

  const number = await nextNumber(tx, "PAY", input.date);
  const payment = await tx.payment.create({
    data: {
      number,
      invoiceId: inv.id,
      method: input.method,
      amount,
      date: input.date,
      note: input.note ?? null,
      createdById: input.userId ?? null,
    },
  });
  const paid = round2(inv.amountPaid + amount);
  const fullyPaid = paid >= inv.total - 0.001;
  await tx.invoice.update({
    where: { id: inv.id },
    data: { amountPaid: paid, ...(fullyPaid ? { status: "PAID", paidAt: input.date } : {}) },
  });
  await logActivity("invoice", inv.id, `Payment ${number} of ${amount.toFixed(2)} registered${fullyPaid ? " — invoice paid" : ""}`, input.userId, tx);
  return payment;
}
