// Billing-day guarantees from the brief, run against a throwaway seeded database (test.db).
import { before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "@/lib/prisma";
import { activeDiscounts, registerPayment, runBilling } from "@/lib/billing";
import { addPeriod } from "@/lib/pricing";
import { startOfDay } from "@/lib/format";

const today = startOfDay(new Date());

/** A running monthly subscription whose last three periods have not been billed yet. */
async function overdueSubscription(tag: string, plan: { autoClose?: boolean } = {}, expirationDate?: Date) {
  const customer = await prisma.customer.create({ data: { name: `Test ${tag}`, email: `${tag}@example.com` } });
  const p = await prisma.recurringPlan.create({ data: { name: `Plan ${tag}`, billingPeriod: "MONTHLY", ...plan } });
  const product = await prisma.product.create({ data: { name: `Seat ${tag}`, salesPrice: 1000 } });
  const start = addPeriod(today, "MONTHLY", -3);
  return prisma.subscription.create({
    data: {
      number: `TEST/${tag}`, customerId: customer.id, planId: p.id, status: "ACTIVE",
      startDate: start, nextInvoiceDate: start, expirationDate,
      lines: { create: [{ productId: product.id, description: "Seat", quantity: 2, unitPrice: 1000 }] },
    },
  });
}

describe("billing day", () => {
  let subId: string;
  before(async () => {
    subId = (await overdueSubscription("catchup")).id;
  });

  it("creates an invoice for every missed period", async () => {
    await runBilling(null, today);
    const invoices = await prisma.invoice.findMany({ where: { subscriptionId: subId } });
    assert.ok(invoices.length >= 3, `expected 3+ invoices, got ${invoices.length}`);
    assert.ok(invoices.every((i) => i.untaxedAmount === 2000), "lines copied from the subscription");
  });

  it("never bills the same period twice", async () => {
    const before = await prisma.invoice.count({ where: { subscriptionId: subId } });
    const second = await runBilling(null, today);
    assert.equal(await prisma.invoice.count({ where: { subscriptionId: subId } }), before);
    assert.equal(second.errors.length, 0);
    const keys = (await prisma.invoice.findMany({ where: { subscriptionId: subId }, select: { periodKey: true } })).map((i) => i.periodKey);
    assert.equal(new Set(keys).size, keys.length);
  });

  it("closes subscriptions on plans that end on their own", async () => {
    const sub = await overdueSubscription("autoclose", { autoClose: true }, addPeriod(today, "DAILY", -1));
    await runBilling(null, today);
    const after = await prisma.subscription.findUniqueOrThrow({ where: { id: sub.id } });
    assert.equal(after.status, "CLOSED");
  });
});

describe("payments", () => {
  it("rejects overpayment and marks the invoice paid once settled", async () => {
    const sub = await overdueSubscription("pay");
    await runBilling(null, today);
    const inv = await prisma.invoice.findFirstOrThrow({ where: { subscriptionId: sub.id } });
    await prisma.invoice.update({ where: { id: inv.id }, data: { status: "CONFIRMED" } });
    const pay = (amount: number) =>
      prisma.$transaction((tx) => registerPayment(tx, { invoiceId: inv.id, method: "CARD", amount, date: today }));

    await assert.rejects(pay(inv.total + 1), /exceeds/);
    await pay(inv.total / 2);
    assert.equal((await prisma.invoice.findUniqueOrThrow({ where: { id: inv.id } })).status, "CONFIRMED");
    await pay(inv.total / 2);
    assert.equal((await prisma.invoice.findUniqueOrThrow({ where: { id: inv.id } })).status, "PAID");
    await assert.rejects(pay(1), /unpaid/);
  });
});

describe("discount limits", () => {
  it("stops applying a discount once its usage limit is reached", async () => {
    const d = await prisma.discount.create({ data: { name: "One-off", type: "FIXED", value: 50, usageLimit: 1 } });
    await overdueSubscription("limit");
    await runBilling(null, today);
    assert.equal(await prisma.discountUsage.count({ where: { discountId: d.id } }), 1);
    assert.ok(!(await activeDiscounts(prisma, today)).some((x) => x.id === d.id));
  });

  it("ignores discounts outside their dates", async () => {
    const d = await prisma.discount.create({ data: { name: "Expired", type: "PERCENT", value: 10, endDate: addPeriod(today, "DAILY", -2) } });
    assert.ok(!(await activeDiscounts(prisma, today)).some((x) => x.id === d.id));
  });
});
