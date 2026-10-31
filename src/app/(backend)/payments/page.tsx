import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth";
import { PAGE_SIZE, PAYMENT_METHODS, PAYMENT_METHOD_LABEL } from "@/lib/constants";
import { fmtDate, money } from "@/lib/format";
import { ControlPanel } from "@/components/odoo/control-panel";
import { ClickableRow } from "@/components/odoo/clickable-row";
import { SearchBar } from "@/components/odoo/search-bar";
import { Pager, parsePage } from "@/components/odoo/pager";
import { ListView } from "@/components/odoo/list-view";
import { EmptyState } from "@/components/odoo/empty-state";
import { Badge } from "@/components/ui/badge";
import { Table, TBody, TD, TFoot, TH, THead, TR } from "@/components/ui/table";
import { openInvoiceOptions } from "@/lib/create-options";
import { NewPaymentDialog } from "./new-payment-dialog";

export const metadata = { title: "Payments" };

type SP = { q?: string; filter?: string; page?: string };

export default async function PaymentsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  await requireStaff();
  const page = parsePage(sp.page);
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const where: Prisma.PaymentWhereInput = {
    ...(sp.filter === "this-month" ? { date: { gte: monthStart } } : sp.filter && { method: sp.filter }),
    ...(sp.q && { OR: [{ number: { contains: sp.q } }, { note: { contains: sp.q } }, { invoice: { number: { contains: sp.q } } }, { invoice: { customer: { name: { contains: sp.q } } } }] }),
  };
  const [rows, total, sum, openInvoices] = await Promise.all([
    prisma.payment.findMany({
      where,
      orderBy: [{ date: "desc" }, { number: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { invoice: { select: { id: true, number: true, customer: { select: { name: true } } } }, createdBy: { select: { name: true } } },
    }),
    prisma.payment.count({ where }),
    prisma.payment.aggregate({ where, _sum: { amount: true } }),
    openInvoiceOptions(),
  ]);

  return (
    <>
      <ControlPanel
        breadcrumbs={[{ label: "Payments" }]}
        actions={<NewPaymentDialog invoices={openInvoices} />}
        right={
          <>
            <SearchBar
              placeholder="Search payment, invoice, customer..."
              filters={[{ value: "this-month", label: "This month" }, ...PAYMENT_METHODS.map((m) => ({ value: m, label: PAYMENT_METHOD_LABEL[m]! }))]}
            />
            <Pager page={page} pageSize={PAGE_SIZE} total={total} basePath="/payments" params={sp} />
          </>
        }
      />
      <ListView>
        {rows.length === 0 ? (
          <EmptyState title="No payments found" hint="Payments are registered against posted invoices." />
        ) : (
          <Table>
            <THead><TR><TH>Number</TH><TH>Date</TH><TH>Customer</TH><TH>Invoice</TH><TH>Method</TH><TH>Note</TH><TH>Recorded By</TH><TH className="text-right">Amount</TH></TR></THead>
            <TBody>
              {rows.map((p) => (
                <ClickableRow key={p.id} href={`/invoices/${p.invoice.id}`}>
                  <TD className="font-medium">{p.number}</TD>
                  <TD className="whitespace-nowrap">{fmtDate(p.date)}</TD>
                  <TD>{p.invoice.customer.name}</TD>
                  <TD className="text-primary">{p.invoice.number}</TD>
                  <TD><Badge variant={p.method === "ONLINE" ? "teal" : "gray"}>{PAYMENT_METHOD_LABEL[p.method] ?? p.method}</Badge></TD>
                  <TD className="max-w-56 truncate text-muted-foreground">{p.note}</TD>
                  <TD className="text-muted-foreground">{p.createdBy?.name ?? "Customer"}</TD>
                  <TD className="text-right tabular-nums">{money(p.amount)}</TD>
                </ClickableRow>
              ))}
            </TBody>
            <TFoot><TR><TD colSpan={7} className="text-muted-foreground">{total} payments</TD><TD className="text-right tabular-nums">{money(sum._sum.amount)}</TD></TR></TFoot>
          </Table>
        )}
      </ListView>
    </>
  );
}
