import type { Prisma } from "@prisma/client";
import { CalendarClock, CheckCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth";
import { PAGE_SIZE } from "@/lib/constants";
import { fmtDate, money, startOfDay } from "@/lib/format";
import { confirmAllDrafts, runBillingAction } from "@/actions/invoices";
import { ControlPanel } from "@/components/odoo/control-panel";
import { ClickableRow } from "@/components/odoo/clickable-row";
import { SearchBar } from "@/components/odoo/search-bar";
import { Pager, parsePage } from "@/components/odoo/pager";
import { ListView } from "@/components/odoo/list-view";
import { EmptyState } from "@/components/odoo/empty-state";
import { ActionButton } from "@/components/odoo/action-button";
import { InvoiceStatusBadge } from "@/components/odoo/status-badge";
import { Table, TBody, TD, TFoot, TH, THead, TR } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export const metadata = { title: "Invoices" };

type SP = { q?: string; filter?: string; page?: string; customer?: string; subscription?: string };

const FILTERS = [
  { value: "draft", label: "Draft" },
  { value: "unpaid", label: "Posted, not paid" },
  { value: "overdue", label: "Overdue" },
  { value: "paid", label: "Paid" },
  { value: "cancelled", label: "Cancelled" },
];

export default async function InvoicesPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  await requireStaff();
  const page = parsePage(sp.page);
  const today = startOfDay(new Date());
  const filter: Record<string, Prisma.InvoiceWhereInput> = {
    draft: { status: "DRAFT" },
    unpaid: { status: "CONFIRMED" },
    overdue: { status: "CONFIRMED", dueDate: { lt: today } },
    paid: { status: "PAID" },
    cancelled: { status: "CANCELLED" },
  };
  const where: Prisma.InvoiceWhereInput = {
    ...(sp.filter && filter[sp.filter]),
    ...(sp.customer && { customerId: sp.customer }),
    ...(sp.subscription && { subscriptionId: sp.subscription }),
    ...(sp.q && { OR: [{ number: { contains: sp.q } }, { customer: { name: { contains: sp.q } } }, { subscription: { number: { contains: sp.q } } }] }),
  };
  const [rows, total, sums, drafts] = await Promise.all([
    prisma.invoice.findMany({
      where,
      orderBy: [{ invoiceDate: "desc" }, { number: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true, number: true, status: true, invoiceDate: true, dueDate: true, total: true, amountPaid: true,
        customer: { select: { name: true } },
        subscription: { select: { number: true } },
      },
    }),
    prisma.invoice.count({ where }),
    prisma.invoice.aggregate({ where: { ...where, status: where.status ?? { not: "CANCELLED" } }, _sum: { total: true, amountPaid: true } }),
    prisma.invoice.count({ where: { status: "DRAFT" } }),
  ]);
  const sumTotal = sums._sum.total ?? 0;
  const sumDue = sumTotal - (sums._sum.amountPaid ?? 0);

  return (
    <>
      <ControlPanel
        breadcrumbs={[{ label: sp.filter === "overdue" ? "Overdue Invoices" : "Invoices" }]}
        actions={
          <>
            <ActionButton action={runBillingAction}><CalendarClock /> Run Billing</ActionButton>
            {drafts > 0 && (
              <ActionButton variant="secondary" action={confirmAllDrafts} confirm={`Confirm all ${drafts} draft invoices?`}>
                <CheckCheck /> Confirm Drafts ({drafts})
              </ActionButton>
            )}
          </>
        }
        right={
          <>
            <SearchBar placeholder="Search number, customer, subscription..." filters={FILTERS} />
            <Pager page={page} pageSize={PAGE_SIZE} total={total} basePath="/invoices" params={sp} />
          </>
        }
      />
      <ListView>
        {rows.length === 0 ? (
          <EmptyState title="No invoices found" hint="Invoices are created from running subscriptions. Use Run Billing on billing day to invoice everything that is due." />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Number</TH><TH>Customer</TH><TH>Invoice Date</TH><TH>Due Date</TH><TH>Subscription</TH>
                <TH className="text-right">Total</TH><TH className="text-right">Amount Due</TH><TH>Status</TH>
              </TR>
            </THead>
            <TBody>
              {rows.map((i) => {
                const overdue = i.status === "CONFIRMED" && i.dueDate < today;
                return (
                  <ClickableRow key={i.id} href={`/invoices/${i.id}`}>
                    <TD className="font-medium">{i.number}</TD>
                    <TD>{i.customer.name}</TD>
                    <TD className="whitespace-nowrap">{fmtDate(i.invoiceDate)}</TD>
                    <TD className={cn("whitespace-nowrap", overdue && "font-semibold text-destructive")}>{fmtDate(i.dueDate)}</TD>
                    <TD className="text-muted-foreground">{i.subscription?.number}</TD>
                    <TD className="text-right tabular-nums">{money(i.total)}</TD>
                    <TD className="text-right tabular-nums">{i.status === "CANCELLED" ? "—" : money(i.total - i.amountPaid)}</TD>
                    <TD><InvoiceStatusBadge status={i.status} overdue={overdue} /></TD>
                  </ClickableRow>
                );
              })}
            </TBody>
            <TFoot>
              <TR>
                <TD colSpan={5} className="text-muted-foreground">Totals for {total} invoice{total === 1 ? "" : "s"} (excl. cancelled)</TD>
                <TD className="text-right tabular-nums">{money(sumTotal)}</TD>
                <TD className="text-right tabular-nums">{money(sumDue)}</TD>
                <TD />
              </TR>
            </TFoot>
          </Table>
        )}
      </ListView>
    </>
  );
}
