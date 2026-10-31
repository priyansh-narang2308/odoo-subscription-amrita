"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePortal } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { nextNumber } from "@/lib/sequence";
import { addDays, BillingError, registerPayment } from "@/lib/billing";
import { startOfDay } from "@/lib/format";
import { type ActionState } from "@/lib/action";

/** Loads a subscription only if it belongs to the signed-in customer. */
async function ownSubscription(id: string) {
  const user = await requirePortal();
  const sub = await prisma.subscription.findFirst({
    where: { id, customerId: user.customerId },
    include: { plan: true, renewal: true, lines: { include: { taxes: { select: { id: true } } } } },
  });
  if (!sub) throw new Error("Subscription not found");
  return { user, sub };
}

function refresh(id: string) {
  revalidatePath("/my");
  revalidatePath(`/my/subscriptions/${id}`);
  revalidatePath(`/subscriptions/${id}`);
}

export async function acceptQuotation(id: string): Promise<ActionState> {
  const { user, sub } = await ownSubscription(id);
  if (sub.status !== "QUOTATION") return { error: "This quotation can no longer be accepted" };
  if (sub.quotationExpiresAt && sub.quotationExpiresAt < startOfDay(new Date())) return { error: "This quotation has expired. Please contact us for a new one." };
  await prisma.subscription.update({ where: { id }, data: { status: "CONFIRMED", confirmedAt: new Date() } });
  await logActivity("subscription", id, "Quotation accepted by the customer in the portal", user.id);
  refresh(id);
  return { message: "Thank you! Your subscription is confirmed." };
}

export async function portalClose(id: string): Promise<ActionState> {
  const { user, sub } = await ownSubscription(id);
  if (!["ACTIVE", "PAUSED"].includes(sub.status)) return { error: "Only running subscriptions can be closed" };
  if (!sub.plan.closable) return { error: "Your plan cannot be closed before its end date. Please contact us." };
  await prisma.subscription.update({ where: { id }, data: { status: "CLOSED", closedAt: new Date(), closeReason: "Closed by the customer" } });
  await logActivity("subscription", id, "Closed by the customer in the portal", user.id);
  refresh(id);
  return { message: "Your subscription has been closed" };
}

export async function portalPause(id: string): Promise<ActionState> {
  const { user, sub } = await ownSubscription(id);
  if (!sub.plan.pausable) return { error: "Your plan does not allow pausing" };
  if (sub.status === "ACTIVE") {
    await prisma.subscription.update({ where: { id }, data: { status: "PAUSED" } });
    await logActivity("subscription", id, "Paused by the customer in the portal", user.id);
    refresh(id);
    return { message: "Subscription paused" };
  }
  if (sub.status === "PAUSED") {
    const today = startOfDay(new Date());
    const next = sub.nextInvoiceDate && sub.nextInvoiceDate > today ? sub.nextInvoiceDate : today;
    await prisma.subscription.update({ where: { id }, data: { status: "ACTIVE", nextInvoiceDate: next } });
    await logActivity("subscription", id, "Resumed by the customer in the portal", user.id);
    refresh(id);
    return { message: "Subscription resumed" };
  }
  return { error: "This subscription is not running" };
}

/** Customers can ask for a renewal: it creates a quotation the team can review. */
export async function portalRenew(id: string): Promise<ActionState> {
  const { user, sub } = await ownSubscription(id);
  if (!sub.plan.renewable) return { error: "Your plan is not renewable" };
  if (sub.renewal) return { error: "A renewal has already been requested" };
  if (!["ACTIVE", "PAUSED", "CLOSED"].includes(sub.status)) return { error: "This subscription cannot be renewed yet" };
  const start = startOfDay(sub.expirationDate ?? sub.nextInvoiceDate ?? new Date());
  const duration = sub.expirationDate ? sub.expirationDate.getTime() - sub.startDate.getTime() : null;
  const renewal = await prisma.$transaction(async (tx) => {
    const number = await nextNumber(tx, "SUB");
    return tx.subscription.create({
      data: {
        number,
        customerId: sub.customerId,
        planId: sub.planId,
        paymentTermId: sub.paymentTermId,
        salespersonId: sub.salespersonId,
        status: "QUOTATION",
        startDate: start,
        expirationDate: duration ? new Date(start.getTime() + duration) : null,
        nextInvoiceDate: start,
        quotationExpiresAt: addDays(startOfDay(new Date()), 30),
        renewedFromId: sub.id,
        lines: {
          create: sub.lines.map((l) => ({
            productId: l.productId,
            variantId: l.variantId,
            description: l.description,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            sequence: l.sequence,
            taxes: { connect: l.taxes },
          })),
        },
      },
    });
  });
  await logActivity("subscription", sub.id, `Customer requested a renewal (${renewal.number})`, user.id);
  await logActivity("subscription", renewal.id, `Renewal of ${sub.number} requested in the portal`, user.id);
  refresh(id);
  redirect(`/my/subscriptions/${renewal.id}`);
}

/** Simulated online payment of the full amount due. */
export async function payInvoiceOnline(id: string): Promise<ActionState> {
  const user = await requirePortal();
  const inv = await prisma.invoice.findFirst({ where: { id, customerId: user.customerId } });
  if (!inv) return { error: "Invoice not found" };
  if (inv.status !== "CONFIRMED") return { error: "This invoice is not awaiting payment" };
  try {
    await prisma.$transaction((tx) =>
      registerPayment(tx, {
        invoiceId: inv.id,
        method: "ONLINE",
        amount: inv.total - inv.amountPaid,
        date: new Date(),
        note: "Paid online through the customer portal",
        userId: null,
      }),
    );
  } catch (e) {
    if (e instanceof BillingError) return { error: e.message };
    throw e;
  }
  revalidatePath("/my");
  revalidatePath(`/my/invoices/${id}`);
  revalidatePath(`/invoices/${id}`);
  return { message: "Payment received — thank you!" };
}
