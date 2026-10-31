import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth";
import { PAGE_SIZE } from "@/lib/constants";
import { addDays } from "@/lib/pricing";
import { fmtDate, money, startOfDay } from "@/lib/format";
import { ControlPanel } from "@/components/odoo/control-panel";
import { ClickableRow } from "@/components/odoo/clickable-row";
import { SearchBar } from "@/components/odoo/search-bar";
import { Pager, parsePage } from "@/components/odoo/pager";
import { ListView } from "@/components/odoo/list-view";
import { EmptyState } from "@/components/odoo/empty-state";
import { SubscriptionStatusBadge } from "@/components/odoo/status-badge";
import { Avatar } from "@/components/ui/avatar";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { subscriptionOptions } from "@/lib/create-options";
import { NewSubscriptionDialog } from "./new-subscription-dialog";

export const metadata = { title: "Subscriptions" };

type SP = { q?: string; filter?: string; page?: string; customer?: string; plan?: string };

const FILTERS = [
  { value: "quotations", label: "Quotations" },
  { value: "running", label: "In Progress" },
  { value: "paused", label: "Paused" },
  { value: "closed", label: "Closed" },
  { value: "to-invoice", label: "Due for invoicing" },
  { value: "to-renew", label: "Expiring in 30 days" },
];

function whereFor(sp: SP): Prisma.SubscriptionWhereInput {
  const today = startOfDay(new Date());
  const filter: Record<string, Prisma.SubscriptionWhereInput> = {
    quotations: { status: { in: ["DRAFT", "QUOTATION"] } },
    running: { status: "ACTIVE" },
    paused: { status: "PAUSED" },
    closed: { status: "CLOSED" },
    "to-invoice": { status: "ACTIVE", nextInvoiceDate: { lte: today } },
    "to-renew": { status: { in: ["ACTIVE", "PAUSED"] }, expirationDate: { gte: today, lte: addDays(today, 30) } },
  };
  return {
    ...(sp.filter && filter[sp.filter]),
    ...(sp.customer && { customerId: sp.customer }),
    ...(sp.plan && { planId: sp.plan }),
    ...(sp.q && {
      OR: [
        { number: { contains: sp.q } },
        { customer: { name: { contains: sp.q } } },
        { plan: { name: { contains: sp.q } } },
        { lines: { some: { description: { contains: sp.q } } } },
      ],
    }),
  };
}

export default async function SubscriptionsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  await requireStaff();
  const page = parsePage(sp.page);
  const where = whereFor(sp);
  const [rows, total, sum, options] = await Promise.all([
    prisma.subscription.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true, number: true, status: true, startDate: true, nextInvoiceDate: true, expirationDate: true, quotationExpiresAt: true,
        customer: { select: { name: true } },
        plan: { select: { name: true } },
        salesperson: { select: { name: true } },
        lines: { select: { quantity: true, unitPrice: true } },
      },
    }),
    prisma.subscription.count({ where }),
    sp.customer ? prisma.customer.findUnique({ where: { id: sp.customer }, select: { name: true } }) : null,
    subscriptionOptions(),
  ]);
  const today = startOfDay(new Date());
  const title = sp.filter === "quotations" ? "Quotations" : "Subscriptions";

  return (
    <>
      <ControlPanel
        breadcrumbs={sum ? [{ label: sum.name, href: `/customers/${sp.customer}` }, { label: title }] : [{ label: title }]}
        actions={<NewSubscriptionDialog options={options} />}
        right={
          <>
            <SearchBar placeholder="Search number, customer, product..." filters={FILTERS} />
            <Pager page={page} pageSize={PAGE_SIZE} total={total} basePath="/subscriptions" params={sp} />
          </>
        }
      />
      <ListView>
        {rows.length === 0 ? (
          <EmptyState title="No subscriptions found" hint="Create a quotation, confirm it, and it becomes a running subscription billed automatically.">
            <div className="mt-2"><NewSubscriptionDialog options={options} triggerLabel="New Subscription" /></div>
          </EmptyState>
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Number</TH><TH>Customer</TH><TH>Plan</TH><TH>Start Date</TH><TH>Next Invoice</TH>
                <TH>Expiration</TH><TH>Salesperson</TH><TH className="text-right">Recurring (untaxed)</TH><TH>Status</TH>
              </TR>
            </THead>
            <TBody>
              {rows.map((s) => {
                const recurring = s.lines.reduce((t, l) => t + l.quantity * l.unitPrice, 0);
                const due = s.status === "ACTIVE" && s.nextInvoiceDate && s.nextInvoiceDate <= today;
                return (
                  <ClickableRow key={s.id} href={`/subscriptions/${s.id}`}>
                    <TD className="font-medium">{s.number}</TD>
                    <TD>{s.customer.name}</TD>
                    <TD>{s.plan.name}</TD>
                    <TD className="whitespace-nowrap">{fmtDate(s.startDate)}</TD>
                    <TD className={cn("whitespace-nowrap", due && "font-semibold text-destructive")}>
                      {["ACTIVE", "PAUSED", "CONFIRMED"].includes(s.status) ? fmtDate(s.nextInvoiceDate) : "—"}
                    </TD>
                    <TD className="whitespace-nowrap text-muted-foreground">{fmtDate(s.expirationDate)}</TD>
                    <TD>{s.salesperson && <span className="flex items-center gap-1.5"><Avatar name={s.salesperson.name} className="size-5 text-[9px]" />{s.salesperson.name}</span>}</TD>
                    <TD className="text-right tabular-nums">{money(recurring)}</TD>
                    <TD><SubscriptionStatusBadge status={s.status} /></TD>
                  </ClickableRow>
                );
              })}
            </TBody>
          </Table>
        )}
      </ListView>
    </>
  );
}
