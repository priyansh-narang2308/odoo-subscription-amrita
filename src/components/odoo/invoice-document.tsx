import type { Customer, Invoice, InvoiceLine, Payment, PaymentTerm } from "@prisma/client";
import { BrandLogo } from "@/components/brand";
import { PAYMENT_METHOD_LABEL } from "@/lib/constants";
import { fmtDate, money, startOfDay } from "@/lib/format";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { InvoiceStatusBadge } from "./status-badge";

export type InvoiceDoc = Invoice & {
  customer: Customer;
  lines: InvoiceLine[];
  payments: Payment[];
  paymentTerm: PaymentTerm | null;
  subscription: { number: string } | null;
  discounts: { amount: number; discount: { name: string } }[];
};

/** The printable invoice body — same layout on screen, in print and in the portal. */
export function InvoiceDocument({ invoice: inv, showLogo }: { invoice: InvoiceDoc; showLogo?: boolean }) {
  const due = inv.total - inv.amountPaid;
  const overdue = inv.status === "CONFIRMED" && inv.dueDate < startOfDay(new Date());
  return (
    <div className="text-[13px]">
      {showLogo && (
        <div className="mb-8 flex items-start justify-between border-b pb-4">
          <BrandLogo />
          <div className="text-right text-xs text-muted-foreground">
            <p className="font-semibold text-foreground">Brightloop Software Pvt. Ltd.</p>
            <p>4th Floor, Koregaon Park, Pune 411001</p>
            <p>billing@brightloop.test · GSTIN 27ABCDE1234F1Z5</p>
          </div>
        </div>
      )}
      <div className="flex flex-col justify-between gap-6 sm:flex-row">
        <div>
          <h1 className="text-2xl font-semibold">
            {inv.status === "DRAFT" ? "Draft Invoice" : "Invoice"} <span className="tabular-nums">{inv.number}</span>
          </h1>
          <div className="mt-1"><InvoiceStatusBadge status={inv.status} overdue={overdue} /></div>
        </div>
        <address className="not-italic sm:text-right">
          <p className="font-semibold">{inv.customer.name}</p>
          {inv.customer.street && <p>{inv.customer.street}</p>}
          {(inv.customer.city || inv.customer.country) && <p>{[inv.customer.city, inv.customer.country].filter(Boolean).join(", ")}</p>}
          <p className="text-muted-foreground">{inv.customer.email}</p>
          {inv.customer.taxId && <p className="text-muted-foreground">GSTIN {inv.customer.taxId}</p>}
        </address>
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-4 rounded-sm bg-muted/50 p-3 sm:grid-cols-4">
        <Meta label="Invoice Date" value={fmtDate(inv.invoiceDate)} />
        <Meta label="Due Date" value={fmtDate(inv.dueDate)} />
        <Meta label="Billing Period" value={inv.periodStart ? `${fmtDate(inv.periodStart)} – ${fmtDate(inv.periodEnd)}` : "—"} />
        <Meta label="Source" value={inv.subscription?.number ?? "—"} />
      </dl>

      <div className="mt-6">
        <Table>
          <THead>
            <TR>
              <TH>Description</TH><TH className="text-right">Quantity</TH><TH className="text-right">Unit Price</TH>
              <TH className="text-right">Discount</TH><TH>Taxes</TH><TH className="text-right">Amount</TH>
            </TR>
          </THead>
          <TBody>
            {inv.lines.map((l) => (
              <TR key={l.id}>
                <TD>{l.description}</TD>
                <TD className="text-right tabular-nums">{l.quantity}</TD>
                <TD className="text-right tabular-nums">{money(l.unitPrice)}</TD>
                <TD className="text-right tabular-nums">{l.discountAmount ? `− ${money(l.discountAmount)}` : ""}</TD>
                <TD className="text-muted-foreground">{l.taxLabel}</TD>
                <TD className="text-right tabular-nums">{money(l.subtotal - l.discountAmount)}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </div>

      <div className="mt-4 flex flex-col-reverse justify-between gap-6 sm:flex-row">
        <div className="max-w-sm space-y-1 text-xs text-muted-foreground">
          {inv.paymentTerm && <p>Payment terms: {inv.paymentTerm.name}{inv.paymentTerm.note && ` — ${inv.paymentTerm.note}`}</p>}
          {inv.notes && <p className="whitespace-pre-line">{inv.notes}</p>}
          {inv.status !== "DRAFT" && inv.status !== "CANCELLED" && <p>Please use <b className="text-foreground">{inv.number}</b> as the payment reference.</p>}
        </div>
        <dl className="w-full space-y-1 sm:w-80">
          <Row label="Untaxed Amount" value={money(inv.untaxedAmount)} />
          {inv.discounts.map((d) => <Row key={d.discount.name} label={d.discount.name} value={`− ${money(d.amount)}`} className="text-emerald-700" />)}
          <Row label="Taxes" value={money(inv.taxAmount)} />
          <Row label="Total" value={money(inv.total)} className="border-t pt-1.5 text-[15px] font-bold" />
          {inv.payments.map((p) => (
            <Row key={p.id} label={`Paid on ${fmtDate(p.date)} (${PAYMENT_METHOD_LABEL[p.method] ?? p.method})`} value={`− ${money(p.amount)}`} className="text-xs italic text-muted-foreground" />
          ))}
          {inv.status !== "CANCELLED" && inv.status !== "DRAFT" && (
            <Row label="Amount Due" value={money(due)} className="border-t pt-1.5 font-bold" />
          )}
        </dl>
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium">{value}</dd>
    </div>
  );
}

function Row({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={`flex justify-between gap-4 ${className ?? ""}`}>
      <dt>{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}

export const invoiceDocInclude = {
  customer: true,
  lines: { orderBy: { sequence: "asc" as const } },
  payments: { orderBy: { date: "asc" as const } },
  paymentTerm: true,
  subscription: { select: { number: true, id: true } },
  discounts: { include: { discount: { select: { name: true } } } },
};
