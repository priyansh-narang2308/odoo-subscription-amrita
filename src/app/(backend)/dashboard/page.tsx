import Link from "next/link";
import { AlertTriangle, ArrowRight, Banknote, CircleDollarSign, FileClock, RefreshCcw, TrendingUp } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth";
import { dashboardData, RANGES, type RangeKey } from "@/lib/reports";
import { PAYMENT_METHOD_LABEL, SUBSCRIPTION_STATUS_LABEL } from "@/lib/constants";
import { fmtDate, money, relativeDays } from "@/lib/format";
import { ControlPanel } from "@/components/odoo/control-panel";
import { ParamSelect } from "@/components/odoo/param-select";
import { RevenueChart } from "@/components/charts/revenue-chart";
import { BarList } from "@/components/charts/bar-list";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export const metadata = { title: "Reporting" };

const STATUS_BAR: Record<string, string> = {
  ACTIVE: "bg-emerald-600",
  PAUSED: "bg-amber-500",
  CONFIRMED: "bg-violet-500",
  QUOTATION: "bg-sky-500",
  DRAFT: "bg-gray-400",
  CLOSED: "bg-red-400",
};

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ range?: string; plan?: string }> }) {
  const sp = await searchParams;
  await requireStaff();
  const range = (RANGES.find((r) => r.key === sp.range)?.key ?? "year") as RangeKey;
  const [data, plans] = await Promise.all([
    dashboardData(range, sp.plan),
    prisma.recurringPlan.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  const rangeLabel = RANGES.find((r) => r.key === range)!.label.toLowerCase();
  const href = (r: string) => `/dashboard?range=${r}${sp.plan ? `&plan=${sp.plan}` : ""}`;

  return (
    <>
      <ControlPanel
        breadcrumbs={[{ label: "Subscription Analysis" }]}
        right={
          <>
            <div className="flex overflow-hidden rounded-sm border bg-card">
              {RANGES.map((r) => (
                <Link key={r.key} href={href(r.key)} className={cn("px-3 py-1.5 text-[13px] hover:bg-muted", r.key === range && "bg-accent font-semibold text-accent-foreground")}>
                  {r.label}
                </Link>
              ))}
            </div>
            <ParamSelect param="plan" placeholder="All plans" options={plans.map((p) => ({ value: p.id, label: p.name }))} />
          </>
        }
      />
      <div className="space-y-4 p-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Kpi icon={RefreshCcw} label="Active Subscriptions" value={String(data.counts.active)} sub={`${data.counts.paused} paused · ${data.counts.quotations} open quotations`} href="/subscriptions?filter=running" />
          <Kpi icon={TrendingUp} label="Monthly Recurring Revenue" value={money(data.mrr)} sub={`ARR ${money(data.arr)}`} />
          <Kpi icon={Banknote} label="Revenue Collected" value={money(data.collected)} sub={`${data.paymentsCount} payments · ${rangeLabel}`} href="/payments" />
          <Kpi icon={CircleDollarSign} label="Outstanding" value={money(data.outstanding)} sub={`${data.outstandingCount} posted invoices unpaid`} href="/invoices?filter=unpaid" />
          <Kpi icon={AlertTriangle} label="Overdue" value={money(data.overdue)} sub={`${data.overdueCount} invoices past due`} href="/invoices?filter=overdue" tone={data.overdueCount ? "danger" : undefined} />
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle>Revenue — last 12 months</CardTitle>
              <CardDescription>Invoiced (posted & paid invoices) versus cash collected from payments</CardDescription>
            </CardHeader>
            <CardContent><RevenueChart data={data.months} /></CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Subscriptions by status</CardTitle>
              <CardDescription>{data.newSubs} confirmed and {data.churned} closed · {rangeLabel}</CardDescription>
            </CardHeader>
            <CardContent>
              <BarList
                items={["ACTIVE", "PAUSED", "CONFIRMED", "QUOTATION", "DRAFT", "CLOSED"].map((s) => ({
                  label: SUBSCRIPTION_STATUS_LABEL[s]!,
                  value: data.statusBreakdown.find((b) => b.status === s)?.count ?? 0,
                  color: STATUS_BAR[s],
                }))}
              />
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-1.5"><FileClock className="size-4 text-destructive" /> Overdue invoices</CardTitle>
                <CardDescription>Oldest first — chase these before they become lost revenue</CardDescription>
              </div>
              <Link href="/invoices?filter=overdue" className="flex items-center gap-1 text-[13px] text-primary hover:underline">View all <ArrowRight className="size-3.5" /></Link>
            </CardHeader>
            <CardContent className="px-0 pb-1">
              {data.overdueList.length === 0 ? (
                <p className="py-8 text-center text-[13px] text-muted-foreground">No overdue invoices. 🎉</p>
              ) : (
                <Table>
                  <THead><TR><TH className="pl-4">Invoice</TH><TH>Customer</TH><TH>Due</TH><TH className="pr-4 text-right">Amount Due</TH></TR></THead>
                  <TBody>
                    {data.overdueList.map((i) => (
                      <TR key={i.id} className="hover:bg-muted/50">
                        <TD className="pl-4"><Link href={`/invoices/${i.id}`} className="font-medium text-primary hover:underline">{i.number}</Link></TD>
                        <TD>{i.customer.name}</TD>
                        <TD className="whitespace-nowrap text-destructive">{fmtDate(i.dueDate)} <span className="text-xs">({relativeDays(i.dueDate)})</span></TD>
                        <TD className="pr-4 text-right font-medium tabular-nums">{money(i.total - i.amountPaid)}</TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>MRR by plan</CardTitle>
              <CardDescription>Running subscriptions, normalised to one month</CardDescription>
            </CardHeader>
            <CardContent>
              <BarList items={data.mrrByPlan.map((p) => ({ label: p.name, value: p.mrr, hint: `${p.count} subs` }))} format={money} />
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Top customers</CardTitle>
              <CardDescription>By invoiced amount · {rangeLabel}</CardDescription>
            </CardHeader>
            <CardContent>
              <BarList items={data.topCustomers.map((c) => ({ label: c.name, value: c.total }))} format={money} color="bg-[#017e84]" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>Recent payments</CardTitle>
                <CardDescription>{money(data.invoiced)} invoiced across {data.invoicesCount} invoices · {rangeLabel}</CardDescription>
              </div>
              <Link href="/payments" className="flex items-center gap-1 text-[13px] text-primary hover:underline">View all <ArrowRight className="size-3.5" /></Link>
            </CardHeader>
            <CardContent className="px-0 pb-1">
              <Table>
                <TBody>
                  {data.recentPayments.map((p) => (
                    <TR key={p.id} className="hover:bg-muted/50">
                      <TD className="pl-4"><Link href={`/invoices/${p.invoice.id}`} className="font-medium hover:underline">{p.invoice.customer.name}</Link><p className="text-xs text-muted-foreground">{p.number} · {PAYMENT_METHOD_LABEL[p.method]}</p></TD>
                      <TD className="text-muted-foreground">{fmtDate(p.date)}</TD>
                      <TD className="pr-4 text-right font-medium tabular-nums text-emerald-700">+ {money(p.amount)}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  sub,
  href,
  tone,
}: {
  icon: typeof RefreshCcw;
  label: string;
  value: string;
  sub: string;
  href?: string;
  tone?: "danger";
}) {
  const body = (
    <Card className={cn("h-full p-4 transition-colors", href && "hover:border-primary/40", tone === "danger" && "border-red-200")}>
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <Icon className={cn("size-4", tone === "danger" ? "text-destructive" : "text-primary")} />
      </div>
      <p className={cn("mt-1.5 text-2xl font-semibold tabular-nums tracking-tight", tone === "danger" && "text-destructive")}>{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>
    </Card>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}
