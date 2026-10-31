import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth";
import { loadCatalog } from "@/lib/catalog";
import { getActivities } from "@/lib/activity";
import { activeDiscounts, computeTotals } from "@/lib/billing";
import { inputDate } from "@/lib/format";
import * as A from "@/actions/subscriptions";
import { Chatter } from "@/components/odoo/chatter";
import { SubscriptionForm, type SubscriptionActions } from "./subscription-form";

export default async function SubscriptionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ customer?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const user = await requireStaff();

  const [sub, customers, plans, terms, staff, templates, catalog] = await Promise.all([
    id === "new" ? null : prisma.subscription.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        plan: true,
        renewedFrom: { select: { id: true, number: true } },
        renewal: { select: { id: true, number: true } },
        lines: { orderBy: { sequence: "asc" }, include: { taxes: true } },
        invoices: { orderBy: { invoiceDate: "desc" }, select: { id: true, number: true, invoiceDate: true, dueDate: true, total: true, amountPaid: true, status: true, periodStart: true, periodEnd: true } },
      },
    }),
    prisma.customer.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true }, take: 2000 }),
    prisma.recurringPlan.findMany({ where: id === "new" ? { active: true } : undefined, orderBy: { name: "asc" } }),
    prisma.paymentTerm.findMany({ orderBy: { dueDays: "asc" }, select: { id: true, name: true } }),
    prisma.user.findMany({ where: { role: { in: ["ADMIN", "INTERNAL"] }, active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.quotationTemplate.findMany({
      orderBy: { name: "asc" },
      include: { lines: { orderBy: { sequence: "asc" }, include: { taxes: { select: { id: true } } } } },
    }),
    loadCatalog(),
  ]);
  if (id !== "new" && !sub) notFound();

  // Preview of what the next invoice will look like, including automatic discounts
  let preview = null;
  if (sub && sub.lines.length && !["CLOSED"].includes(sub.status)) {
    const t = computeTotals(
      sub.lines.map((l) => ({ productId: l.productId, description: l.description, quantity: l.quantity, unitPrice: l.unitPrice, taxes: l.taxes })),
      await activeDiscounts(prisma, sub.nextInvoiceDate && sub.nextInvoiceDate > new Date() ? sub.nextInvoiceDate : new Date()),
    );
    preview = { applied: t.applied, untaxed: t.untaxed, discount: t.discount, tax: t.tax, total: t.total };
  }

  const actions: SubscriptionActions = sub
    ? {
        send: A.sendQuotation.bind(null, sub.id),
        confirm: A.confirmSubscription.bind(null, sub.id),
        start: A.startSubscription.bind(null, sub.id),
        invoice: A.createSubscriptionInvoice.bind(null, sub.id),
        pause: A.pauseSubscription.bind(null, sub.id),
        resume: A.resumeSubscription.bind(null, sub.id),
        close: A.closeSubscription.bind(null, sub.id, undefined),
        renew: A.renewSubscription.bind(null, sub.id),
        reset: A.resetToDraft.bind(null, sub.id),
        remove: A.deleteSubscription.bind(null, sub.id),
      }
    : {};

  const activities = sub ? await getActivities("subscription", sub.id) : [];

  return (
    <SubscriptionForm
      key={sub?.updatedAt.toISOString() ?? "new"}
      subscription={
        sub && {
          id: sub.id,
          number: sub.number,
          status: sub.status,
          customerId: sub.customerId,
          customerName: sub.customer.name,
          planId: sub.planId,
          templateId: sub.templateId,
          paymentTermId: sub.paymentTermId,
          salespersonId: sub.salespersonId,
          startDate: inputDate(sub.startDate),
          expirationDate: inputDate(sub.expirationDate),
          nextInvoiceDate: sub.nextInvoiceDate?.toISOString() ?? null,
          quotationExpiresAt: sub.quotationExpiresAt?.toISOString() ?? null,
          closedAt: sub.closedAt?.toISOString() ?? null,
          closeReason: sub.closeReason,
          notes: sub.notes,
          renewedFrom: sub.renewedFrom,
          renewal: sub.renewal,
          lines: sub.lines.map((l) => ({
            key: l.id,
            productId: l.productId,
            variantId: l.variantId,
            description: l.description,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            taxIds: l.taxes.map((t) => t.id),
          })),
          invoices: sub.invoices.map((i) => ({ ...i, invoiceDate: i.invoiceDate.toISOString(), dueDate: i.dueDate.toISOString(), periodStart: i.periodStart?.toISOString() ?? null, periodEnd: i.periodEnd?.toISOString() ?? null })),
        }
      }
      defaults={{ customerId: sp.customer ?? null, salespersonId: user.id, paymentTermId: terms[0]?.id ?? null }}
      customers={customers}
      plans={plans.map((p) => ({ id: p.id, name: p.name, price: p.price, billingPeriod: p.billingPeriod, billingInterval: p.billingInterval, minQuantity: p.minQuantity, pausable: p.pausable, closable: p.closable, renewable: p.renewable }))}
      terms={terms}
      staff={staff}
      templates={templates.map((t) => ({
        id: t.id,
        name: t.name,
        planId: t.planId,
        validityDays: t.validityDays,
        note: t.note,
        lines: t.lines.map((l) => ({ productId: l.productId, variantId: l.variantId, quantity: l.quantity, description: l.description, taxIds: l.taxes.map((x) => x.id) })),
      }))}
      catalog={catalog}
      preview={preview}
      isAdmin={user.role === "ADMIN"}
      save={A.saveSubscription.bind(null, sub?.id ?? null)}
      actions={actions}
      aside={sub && <Chatter entries={activities} />}
    />
  );
}
