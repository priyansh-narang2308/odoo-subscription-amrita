import Link from "next/link";
import { fmtDate, money, startOfDay } from "@/lib/format";
import { InvoiceStatusBadge, SubscriptionStatusBadge } from "@/components/odoo/status-badge";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";

type SubRow = { id: string; number: string; status: string; startDate: Date; nextInvoiceDate: Date | null; plan: { name: string }; lines: { quantity: number; unitPrice: number }[] };
type InvRow = { id: string; number: string; status: string; invoiceDate: Date; dueDate: Date; total: number; amountPaid: number };

export function PortalSubscriptionTable({ rows }: { rows: SubRow[] }) {
  if (!rows.length) return <p className="px-4 py-8 text-center text-[13px] text-muted-foreground">You have no subscriptions yet.</p>;
  return (
    <Table>
      <THead><TR><TH className="pl-4">Subscription</TH><TH>Plan</TH><TH>Start</TH><TH>Next Invoice</TH><TH className="text-right">Recurring</TH><TH className="pr-4">Status</TH></TR></THead>
      <TBody>
        {rows.map((s) => (
          <TR key={s.id} className="hover:bg-muted/50">
            <TD className="pl-4"><Link href={`/my/subscriptions/${s.id}`} className="font-medium text-primary hover:underline">{s.number}</Link></TD>
            <TD>{s.plan.name}</TD>
            <TD>{fmtDate(s.startDate)}</TD>
            <TD>{s.status === "ACTIVE" ? fmtDate(s.nextInvoiceDate) : "—"}</TD>
            <TD className="text-right tabular-nums">{money(s.lines.reduce((t, l) => t + l.quantity * l.unitPrice, 0))}</TD>
            <TD className="pr-4"><SubscriptionStatusBadge status={s.status} /></TD>
          </TR>
        ))}
      </TBody>
    </Table>
  );
}

export function PortalInvoiceTable({ rows }: { rows: InvRow[] }) {
  const today = startOfDay(new Date());
  if (!rows.length) return <p className="px-4 py-8 text-center text-[13px] text-muted-foreground">No invoices yet.</p>;
  return (
    <Table>
      <THead><TR><TH className="pl-4">Invoice</TH><TH>Date</TH><TH>Due</TH><TH className="text-right">Total</TH><TH className="text-right">Amount Due</TH><TH className="pr-4">Status</TH></TR></THead>
      <TBody>
        {rows.map((i) => (
          <TR key={i.id} className="hover:bg-muted/50">
            <TD className="pl-4"><Link href={`/my/invoices/${i.id}`} className="font-medium text-primary hover:underline">{i.number}</Link></TD>
            <TD>{fmtDate(i.invoiceDate)}</TD>
            <TD>{fmtDate(i.dueDate)}</TD>
            <TD className="text-right tabular-nums">{money(i.total)}</TD>
            <TD className="text-right tabular-nums">{money(i.total - i.amountPaid)}</TD>
            <TD className="pr-4"><InvoiceStatusBadge status={i.status} overdue={i.status === "CONFIRMED" && i.dueDate < today} /></TD>
          </TR>
        ))}
      </TBody>
    </Table>
  );
}

export const portalSubSelect = {
  id: true, number: true, status: true, startDate: true, nextInvoiceDate: true,
  plan: { select: { name: true } },
  lines: { select: { quantity: true, unitPrice: true } },
} as const;

export const portalInvSelect = { id: true, number: true, status: true, invoiceDate: true, dueDate: true, total: true, amountPaid: true } as const;
