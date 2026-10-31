"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireStaff, type CurrentUser } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { nextNumber } from "@/lib/sequence";
import { sendMail } from "@/lib/mailer";
import { addDays, BillingError, generateInvoice } from "@/lib/billing";
import { startOfDay, fmtDate, money } from "@/lib/format";
import { parseLines } from "@/lib/lines";
import { type ActionState } from "@/lib/action";
import { SUBSCRIPTION_STATUS_LABEL } from "@/lib/constants";
import { date, str } from "@/lib/utils";

const EDITABLE_HEADER = ["DRAFT", "QUOTATION"];

function refresh(id?: string) {
  revalidatePath("/subscriptions");
  if (id) revalidatePath(`/subscriptions/${id}`);
}

function fail(e: unknown): ActionState {
  if (e instanceof BillingError) return { error: e.message };
  throw e;
}

export async function saveSubscription(id: string | null, _: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireStaff();
  const customerId = str(fd, "customerId");
  const planId = str(fd, "planId");
  const startDate = date(fd, "startDate");
  const expirationDate = date(fd, "expirationDate");
  const fieldErrors: Record<string, string> = {};
  if (!customerId) fieldErrors.customerId = "Choose a customer";
  if (!planId) fieldErrors.planId = "Choose a recurring plan";
  if (!startDate) fieldErrors.startDate = "Start date is required";
  if (startDate && expirationDate && expirationDate <= startDate) fieldErrors.expirationDate = "Expiration must be after the start date";
  if (Object.keys(fieldErrors).length) return { fieldErrors };

  const parsed = parseLines(fd);
  if ("error" in parsed) return { error: parsed.error };
  const plan = await prisma.recurringPlan.findUnique({ where: { id: planId! } });
  if (!plan) return { fieldErrors: { planId: "Plan not found" } };
  const short = parsed.lines.find((l) => l.productId && l.quantity < plan.minQuantity);
  if (short) return { error: `"${short.description}" is below the plan's minimum quantity of ${plan.minQuantity}` };

  const lines = parsed.lines.map((l, i) => ({
    productId: l.productId,
    variantId: l.variantId,
    description: l.description || "Product",
    quantity: l.quantity,
    unitPrice: l.unitPrice,
    sequence: i,
    taxes: { connect: l.taxIds.map((t) => ({ id: t })) },
  }));
  const header = {
    customerId: customerId!,
    planId: planId!,
    templateId: str(fd, "templateId"),
    startDate: startDate!,
    expirationDate,
  };
  const common = {
    paymentTermId: str(fd, "paymentTermId"),
    salespersonId: str(fd, "salespersonId"),
    notes: str(fd, "notes"),
  };

  if (!id) {
    if (!plan.active) return { fieldErrors: { planId: "This plan is archived" } };
    if (plan.startDate && startDate! < startOfDay(plan.startDate)) return { fieldErrors: { startDate: `This plan is available from ${fmtDate(plan.startDate)}` } };
    if (plan.endDate && startDate! > plan.endDate) return { fieldErrors: { startDate: `This plan ended on ${fmtDate(plan.endDate)}` } };
    const sub = await prisma.$transaction(async (tx) => {
      const number = await nextNumber(tx, "SUB");
      return tx.subscription.create({
        data: { number, ...header, ...common, status: "DRAFT", nextInvoiceDate: startDate, lines: { create: lines } },
      });
    });
    await logActivity("subscription", sub.id, "Subscription created", user.id);
    refresh();
    redirect(`/subscriptions/${sub.id}`);
  }

  const current = await prisma.subscription.findUniqueOrThrow({ where: { id } });
  if (current.status === "CLOSED") return { error: "Closed subscriptions cannot be modified" };
  const headerEditable = EDITABLE_HEADER.includes(current.status);

  await prisma.$transaction([
    prisma.subscriptionLine.deleteMany({ where: { subscriptionId: id } }),
    prisma.subscription.update({
      where: { id },
      data: {
        ...common,
        ...(headerEditable ? { ...header, nextInvoiceDate: startDate } : { expirationDate }),
        lines: { create: lines },
      },
    }),
  ]);
  await logActivity("subscription", id, "Subscription updated", user.id);
  refresh(id);
  return { message: "Subscription saved" };
}

async function load(id: string) {
  return prisma.subscription.findUniqueOrThrow({
    where: { id },
    include: { plan: true, customer: true, lines: true, template: true },
  });
}

async function transition(user: CurrentUser, id: string, from: string[], to: string, extra: Record<string, unknown> = {}, note?: string) {
  const sub = await load(id);
  if (!from.includes(sub.status)) {
    return { error: `Not allowed while the subscription is ${SUBSCRIPTION_STATUS_LABEL[sub.status]}` };
  }
  await prisma.subscription.update({ where: { id }, data: { status: to, ...extra } });
  await logActivity("subscription", id, note ?? `Status changed to ${SUBSCRIPTION_STATUS_LABEL[to]}`, user.id);
  refresh(id);
  return null;
}

export async function sendQuotation(id: string): Promise<ActionState> {
  const user = await requireStaff();
  const sub = await load(id);
  if (!sub.lines.length) return { error: "Add at least one product line before sending" };
  const validity = sub.template?.validityDays ?? 30;
  const expires = addDays(startOfDay(new Date()), validity);
  const err = await transition(user, id, ["DRAFT", "QUOTATION"], "QUOTATION", { quotationExpiresAt: expires }, `Quotation sent to ${sub.customer.email}`);
  if (err) return err;
  const total = sub.lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
  await sendMail({
    to: sub.customer.email,
    subject: `Quotation ${sub.number} from Brightloop`,
    text: `Hello ${sub.customer.name},\n\nPlease find your quotation ${sub.number} for the ${sub.plan.name} plan.\nRecurring amount (untaxed): ${money(total)}\nValid until: ${fmtDate(expires)}\n\nYou can review it in your customer portal.\n`,
  });
  return { message: "Quotation sent" };
}

export async function confirmSubscription(id: string): Promise<ActionState> {
  const user = await requireStaff();
  const sub = await load(id);
  if (!sub.lines.length) return { error: "Add at least one product line before confirming" };
  if (sub.status === "QUOTATION" && sub.quotationExpiresAt && sub.quotationExpiresAt < startOfDay(new Date())) {
    return { error: "This quotation has expired. Send it again to renew its validity." };
  }
  return (await transition(user, id, ["DRAFT", "QUOTATION"], "CONFIRMED", { confirmedAt: new Date() }, "Subscription confirmed")) ?? { message: "Subscription confirmed" };
}

export async function startSubscription(id: string): Promise<ActionState> {
  const user = await requireStaff();
  const sub = await load(id);
  if (sub.startDate > new Date()) return { error: `This subscription starts on ${fmtDate(sub.startDate)}; the billing run will start it then` };
  const err = await transition(user, id, ["CONFIRMED"], "ACTIVE", { nextInvoiceDate: sub.nextInvoiceDate ?? sub.startDate }, "Subscription started");
  if (err) return err;
  // A renewal taking over closes the subscription it renews
  if (sub.renewedFromId) {
    await prisma.subscription.updateMany({
      where: { id: sub.renewedFromId, status: { not: "CLOSED" } },
      data: { status: "CLOSED", closedAt: new Date(), closeReason: `Renewed by ${sub.number}` },
    });
    await logActivity("subscription", sub.renewedFromId, `Closed — renewed by ${sub.number}`, user.id);
    refresh(sub.renewedFromId);
  }
  return { message: "Subscription is now in progress" };
}

export async function createSubscriptionInvoice(id: string): Promise<ActionState> {
  const user = await requireStaff();
  let invoiceId: string;
  try {
    const inv = await prisma.$transaction((tx) => generateInvoice(tx, id, { userId: user.id }));
    invoiceId = inv.id;
  } catch (e) {
    return fail(e);
  }
  refresh(id);
  revalidatePath("/invoices");
  redirect(`/invoices/${invoiceId}`);
}

export async function pauseSubscription(id: string): Promise<ActionState> {
  const user = await requireStaff();
  const sub = await load(id);
  if (!sub.plan.pausable) return { error: `The ${sub.plan.name} plan does not allow pausing` };
  return (await transition(user, id, ["ACTIVE"], "PAUSED", {}, "Subscription paused")) ?? { message: "Subscription paused" };
}

export async function resumeSubscription(id: string): Promise<ActionState> {
  const user = await requireStaff();
  const sub = await load(id);
  const today = startOfDay(new Date());
  // Skip the paused time: billing resumes from today at the earliest
  const next = sub.nextInvoiceDate && sub.nextInvoiceDate > today ? sub.nextInvoiceDate : today;
  return (await transition(user, id, ["PAUSED"], "ACTIVE", { nextInvoiceDate: next }, "Subscription resumed")) ?? { message: "Subscription resumed" };
}

export async function closeSubscription(id: string, reason?: string): Promise<ActionState> {
  const user = await requireStaff();
  const sub = await load(id);
  const quote = ["DRAFT", "QUOTATION", "CONFIRMED"].includes(sub.status);
  const expired = sub.expirationDate && sub.expirationDate <= new Date();
  if (!quote && !sub.plan.closable && !expired && user.role !== "ADMIN") {
    return { error: `The ${sub.plan.name} plan cannot be closed before its expiration date` };
  }
  const why = reason?.trim() || (quote ? "Quotation cancelled" : "Closed by staff");
  return (
    (await transition(user, id, ["DRAFT", "QUOTATION", "CONFIRMED", "ACTIVE", "PAUSED"], "CLOSED", { closedAt: new Date(), closeReason: why }, `Subscription closed: ${why}`)) ??
    { message: "Subscription closed" }
  );
}

export async function renewSubscription(id: string): Promise<ActionState> {
  const user = await requireStaff();
  const sub = await prisma.subscription.findUniqueOrThrow({
    where: { id },
    include: { plan: true, renewal: true, lines: { include: { taxes: { select: { id: true } } }, orderBy: { sequence: "asc" } } },
  });
  if (!sub.plan.renewable) return { error: `The ${sub.plan.name} plan is not renewable` };
  if (!["ACTIVE", "PAUSED", "CLOSED"].includes(sub.status)) return { error: "Only running or closed subscriptions can be renewed" };
  if (sub.renewal) return { error: `Already renewed by ${sub.renewal.number}` };

  const start = startOfDay(sub.expirationDate ?? sub.nextInvoiceDate ?? new Date());
  const duration = sub.expirationDate ? sub.expirationDate.getTime() - sub.startDate.getTime() : null;
  const renewal = await prisma.$transaction(async (tx) => {
    const number = await nextNumber(tx, "SUB");
    return tx.subscription.create({
      data: {
        number,
        customerId: sub.customerId,
        planId: sub.planId,
        templateId: sub.templateId,
        paymentTermId: sub.paymentTermId,
        salespersonId: user.id,
        status: "QUOTATION",
        startDate: start,
        expirationDate: duration ? new Date(start.getTime() + duration) : null,
        nextInvoiceDate: start,
        quotationExpiresAt: addDays(startOfDay(new Date()), 30),
        renewedFromId: sub.id,
        notes: sub.notes,
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
  await logActivity("subscription", sub.id, `Renewal quotation ${renewal.number} created`, user.id);
  await logActivity("subscription", renewal.id, `Renewal of ${sub.number}`, user.id);
  refresh(id);
  redirect(`/subscriptions/${renewal.id}`);
}

export async function resetToDraft(id: string): Promise<ActionState> {
  const user = await requireStaff();
  return (await transition(user, id, ["QUOTATION", "CONFIRMED"], "DRAFT", { confirmedAt: null }, "Reset to draft")) ?? { message: "Back to draft" };
}

export async function deleteSubscription(id: string): Promise<ActionState> {
  await requireStaff();
  const sub = await prisma.subscription.findUniqueOrThrow({ where: { id }, include: { _count: { select: { invoices: true } } } });
  if (sub.status !== "DRAFT" || sub._count.invoices) return { error: "Only draft subscriptions without invoices can be deleted" };
  await prisma.subscription.delete({ where: { id } });
  refresh();
  redirect("/subscriptions");
}

