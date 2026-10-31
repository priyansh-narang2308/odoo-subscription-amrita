"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { sendMail } from "@/lib/mailer";
import { BillingError, cancelInvoice, runBilling } from "@/lib/billing";
import { fmtDate, money } from "@/lib/format";
import { type ActionState } from "@/lib/action";
import { date, str } from "@/lib/utils";

function refresh(id?: string) {
  revalidatePath("/invoices");
  revalidatePath("/dashboard");
  if (id) revalidatePath(`/invoices/${id}`);
}

export async function saveInvoice(id: string, _: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireStaff();
  const inv = await prisma.invoice.findUniqueOrThrow({ where: { id } });
  if (inv.status !== "DRAFT") return { error: "Only draft invoices can be edited" };
  const invoiceDate = date(fd, "invoiceDate");
  const dueDate = date(fd, "dueDate");
  if (!invoiceDate) return { fieldErrors: { invoiceDate: "Invoice date is required" } };
  if (!dueDate) return { fieldErrors: { dueDate: "Due date is required" } };
  if (dueDate < invoiceDate) return { fieldErrors: { dueDate: "Due date cannot be before the invoice date" } };
  await prisma.invoice.update({ where: { id }, data: { invoiceDate, dueDate, notes: str(fd, "notes") } });
  await logActivity("invoice", id, "Invoice updated", user.id);
  refresh(id);
  return { message: "Invoice saved" };
}

export async function confirmInvoice(id: string): Promise<ActionState> {
  const user = await requireStaff();
  const inv = await prisma.invoice.findUniqueOrThrow({ where: { id } });
  if (inv.status !== "DRAFT") return { error: "Only draft invoices can be confirmed" };
  const paid = inv.total <= 0;
  await prisma.invoice.update({
    where: { id },
    data: { status: paid ? "PAID" : "CONFIRMED", confirmedAt: new Date(), ...(paid && { paidAt: new Date() }) },
  });
  await logActivity("invoice", id, "Invoice confirmed", user.id);
  refresh(id);
  return { message: "Invoice confirmed" };
}

export async function sendInvoice(id: string): Promise<ActionState> {
  const user = await requireStaff();
  const inv = await prisma.invoice.findUniqueOrThrow({ where: { id }, include: { customer: true } });
  if (inv.status === "DRAFT") return { error: "Confirm the invoice before sending it" };
  if (inv.status === "CANCELLED") return { error: "Cancelled invoices cannot be sent" };
  await sendMail({
    to: inv.customer.email,
    subject: `Invoice ${inv.number} from Brightloop`,
    text: `Hello ${inv.customer.name},\n\nPlease find invoice ${inv.number} for ${money(inv.total)}, due on ${fmtDate(inv.dueDate)}.\nAmount due: ${money(inv.total - inv.amountPaid)}\n\nYou can view and pay it from your customer portal.\n`,
  });
  await prisma.invoice.update({ where: { id }, data: { sentAt: new Date() } });
  await logActivity("invoice", id, `Invoice sent to ${inv.customer.email}`, user.id);
  refresh(id);
  return { message: `Invoice sent to ${inv.customer.email}` };
}

export async function cancelInvoiceAction(id: string): Promise<ActionState> {
  const user = await requireStaff();
  try {
    await prisma.$transaction((tx) => cancelInvoice(tx, id, user.id));
  } catch (e) {
    if (e instanceof BillingError) return { error: e.message };
    throw e;
  }
  refresh(id);
  revalidatePath("/subscriptions");
  return { message: "Invoice cancelled; its billing period can be invoiced again" };
}

export async function resetInvoiceToDraft(id: string): Promise<ActionState> {
  const user = await requireStaff();
  const inv = await prisma.invoice.findUniqueOrThrow({ where: { id }, include: { _count: { select: { payments: true } } } });
  if (inv.status !== "CONFIRMED" || inv._count.payments) return { error: "Only posted invoices without payments can be reset" };
  await prisma.invoice.update({ where: { id }, data: { status: "DRAFT", confirmedAt: null } });
  await logActivity("invoice", id, "Invoice reset to draft", user.id);
  refresh(id);
  return { message: "Invoice reset to draft" };
}

/** Billing day: invoice every due subscription in one click. */
export async function runBillingAction(): Promise<ActionState> {
  const user = await requireStaff();
  const r = await runBilling(user.id);
  refresh();
  revalidatePath("/subscriptions");
  const parts = [`${r.invoiced} invoice${r.invoiced === 1 ? "" : "s"} created`];
  if (r.activated) parts.push(`${r.activated} subscription${r.activated === 1 ? "" : "s"} started`);
  if (r.closed) parts.push(`${r.closed} closed at expiry`);
  if (r.errors.length) return { error: `${parts.join(", ")}. ${r.errors.length} skipped: ${r.errors.slice(0, 3).join("; ")}` };
  return { message: r.invoiced || r.activated || r.closed ? parts.join(", ") : "Nothing is due today — every subscription is up to date" };
}

/** Confirm all draft invoices at once (after a billing run). */
export async function confirmAllDrafts(): Promise<ActionState> {
  const user = await requireStaff();
  const drafts = await prisma.invoice.findMany({ where: { status: "DRAFT" }, select: { id: true } });
  if (!drafts.length) return { message: "No draft invoices to confirm" };
  await prisma.invoice.updateMany({ where: { id: { in: drafts.map((d) => d.id) } }, data: { status: "CONFIRMED", confirmedAt: new Date() } });
  await prisma.activity.createMany({ data: drafts.map((d) => ({ model: "invoice", recordId: d.id, message: "Invoice confirmed (bulk)", userId: user.id })) });
  refresh();
  return { message: `${drafts.length} invoices confirmed` };
}
