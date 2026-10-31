import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Pause, Play, RefreshCw, XCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePortal } from "@/lib/auth";
import { computeTotals } from "@/lib/pricing";
import {
  billingLabel,
  SUBSCRIPTION_PIPELINE,
  SUBSCRIPTION_STATUS_LABEL,
} from "@/lib/constants";
import { fmtDate, money } from "@/lib/format";
import {
  acceptQuotation,
  portalClose,
  portalPause,
  portalRenew,
} from "@/actions/portal";
import { ActionButton } from "@/components/odoo/action-button";
import { StatusBar } from "@/components/odoo/status-bar";
import { Card } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { PortalInvoiceTable, portalInvSelect } from "../../portal-lists";

export default async function MySubscription({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requirePortal();
  const sub = await prisma.subscription.findFirst({
    where: { id, customerId: user.customerId, status: { not: "DRAFT" } },
    include: {
      plan: true,
      paymentTerm: true,
      renewal: { select: { id: true, number: true } },
      renewedFrom: { select: { id: true, number: true } },
      lines: { orderBy: { sequence: "asc" }, include: { taxes: true } },
      invoices: {
        where: { status: { in: ["CONFIRMED", "PAID"] } },
        orderBy: { invoiceDate: "desc" },
        select: portalInvSelect,
      },
    },
  });
  if (!sub) notFound();
  const totals = computeTotals(
    sub.lines.map((l) => ({ ...l, taxes: l.taxes })),
  );
  const running = sub.status === "ACTIVE" || sub.status === "PAUSED";

  return (
    <div className="space-y-4">
      <Link
        href="/my/subscriptions"
        className="text-[13px] text-primary hover:underline"
      >
        ← All subscriptions
      </Link>
      <Card className="p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {sub.status === "QUOTATION" ? "Quotation" : "Subscription"}
            </p>
            <h1 className="text-2xl font-semibold">{sub.number}</h1>
            <p className="text-[13px] text-muted-foreground">
              {sub.plan.name} ·{" "}
              {billingLabel(sub.plan.billingPeriod, sub.plan.billingInterval)}
            </p>
          </div>
          <StatusBar
            steps={SUBSCRIPTION_PIPELINE}
            current={sub.status}
            labels={SUBSCRIPTION_STATUS_LABEL}
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {sub.status === "QUOTATION" && (
            <ActionButton
              size="default"
              action={acceptQuotation.bind(null, sub.id)}
            >
              <CheckCircle2 /> Accept Quotation
            </ActionButton>
          )}
          {running && sub.plan.pausable && (
            <ActionButton
              variant="secondary"
              action={portalPause.bind(null, sub.id)}
            >
              {sub.status === "ACTIVE" ? (
                <>
                  <Pause /> Pause
                </>
              ) : (
                <>
                  <Play /> Resume
                </>
              )}
            </ActionButton>
          )}
          {(running || sub.status === "CLOSED") &&
            sub.plan.renewable &&
            !sub.renewal && (
              <ActionButton
                variant="secondary"
                action={portalRenew.bind(null, sub.id)}
                confirm="Request a renewal? We'll prepare a renewal quotation for you to accept."
              >
                <RefreshCw /> Renew
              </ActionButton>
            )}
          {running && sub.plan.closable && (
            <ActionButton
              variant="secondary"
              action={portalClose.bind(null, sub.id)}
              confirm="Close this subscription? You won't be billed for further periods."
            >
              <XCircle /> Close Subscription
            </ActionButton>
          )}
        </div>
        {sub.renewal && (
          <p className="mt-3 text-[13px]">
            Renewal requested:{" "}
            <Link
              className="text-primary underline"
              href={`/my/subscriptions/${sub.renewal.id}`}
            >
              {sub.renewal.number}
            </Link>
          </p>
        )}
        {sub.renewedFrom && (
          <p className="mt-3 text-[13px]">
            Renews{" "}
            <Link
              className="text-primary underline"
              href={`/my/subscriptions/${sub.renewedFrom.id}`}
            >
              {sub.renewedFrom.number}
            </Link>
          </p>
        )}

        <dl className="mt-5 grid grid-cols-2 gap-4 rounded-sm bg-muted/50 p-3 text-[13px] sm:grid-cols-4">
          <div>
            <dt className="text-xs text-muted-foreground">Start date</dt>
            <dd className="font-medium">{fmtDate(sub.startDate)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">
              {sub.status === "QUOTATION" ? "Valid until" : "Next invoice"}
            </dt>
            <dd className="font-medium">
              {fmtDate(
                sub.status === "QUOTATION"
                  ? sub.quotationExpiresAt
                  : running
                    ? sub.nextInvoiceDate
                    : null,
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Expiration</dt>
            <dd className="font-medium">{fmtDate(sub.expirationDate)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Payment terms</dt>
            <dd className="font-medium">
              {sub.paymentTerm?.name ?? "Immediate"}
            </dd>
          </div>
        </dl>

        <div className="mt-5">
          <Table>
            <THead>
              <TR>
                <TH>Product</TH>
                <TH className="text-right">Quantity</TH>
                <TH className="text-right">Unit Price</TH>
                <TH>Taxes</TH>
                <TH className="text-right">Amount</TH>
              </TR>
            </THead>
            <TBody>
              {totals.lines.map((l, i) => (
                <TR key={i}>
                  <TD>{l.description}</TD>
                  <TD className="text-right tabular-nums">{l.quantity}</TD>
                  <TD className="text-right tabular-nums">
                    {money(l.unitPrice)}
                  </TD>
                  <TD className="text-muted-foreground">{l.taxLabel}</TD>
                  <TD className="text-right tabular-nums">
                    {money(l.subtotal)}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
          <dl className="ml-auto mt-3 w-72 space-y-1 text-[13px]">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Untaxed</dt>
              <dd className="tabular-nums">{money(totals.untaxed)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Taxes</dt>
              <dd className="tabular-nums">{money(totals.tax)}</dd>
            </div>
            <div className="flex justify-between border-t pt-1.5 font-bold">
              <dt>Total per period</dt>
              <dd className="tabular-nums">{money(totals.total)}</dd>
            </div>
          </dl>
          {sub.notes && (
            <p className="mt-4 whitespace-pre-line text-xs text-muted-foreground">
              {sub.notes}
            </p>
          )}
        </div>
      </Card>
      {sub.invoices.length > 0 && (
        <Card>
          <div className="border-b px-4 py-3 text-sm font-semibold">
            Invoices
          </div>
          <PortalInvoiceTable rows={sub.invoices} />
        </Card>
      )}
    </div>
  );
}
