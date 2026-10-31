import Link from "next/link";
import { ArrowRight, FileText, RefreshCcw, Wallet } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePortal } from "@/lib/auth";
import { money } from "@/lib/format";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { PortalInvoiceTable, PortalSubscriptionTable, portalInvSelect, portalSubSelect } from "./portal-lists";

export const metadata = { title: "My Account" };

export default async function PortalHome() {
  const user = await requirePortal();
  const [subs, invoices, due, pendingQuotes] = await Promise.all([
    prisma.subscription.findMany({ where: { customerId: user.customerId, status: { not: "DRAFT" } }, orderBy: { createdAt: "desc" }, take: 5, select: portalSubSelect }),
    prisma.invoice.findMany({ where: { customerId: user.customerId, status: { in: ["CONFIRMED", "PAID"] } }, orderBy: { invoiceDate: "desc" }, take: 5, select: portalInvSelect }),
    prisma.invoice.aggregate({ where: { customerId: user.customerId, status: "CONFIRMED" }, _sum: { total: true, amountPaid: true }, _count: true }),
    prisma.subscription.count({ where: { customerId: user.customerId, status: "QUOTATION" } }),
  ]);
  const running = await prisma.subscription.count({ where: { customerId: user.customerId, status: "ACTIVE" } });
  const amountDue = (due._sum.total ?? 0) - (due._sum.amountPaid ?? 0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Welcome, {user.name}</h1>
        <p className="text-[13px] text-muted-foreground">Manage your subscriptions and invoices without emailing anyone.</p>
      </div>
      {pendingQuotes > 0 && (
        <Link href="/my/subscriptions" className="block rounded-md border border-sky-200 bg-sky-50 px-4 py-3 text-[13px] text-sky-900 hover:bg-sky-100">
          You have <b>{pendingQuotes}</b> quotation{pendingQuotes > 1 ? "s" : ""} waiting for your approval →
        </Link>
      )}
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat icon={RefreshCcw} label="Running subscriptions" value={String(running)} href="/my/subscriptions" />
        <Stat icon={Wallet} label="Amount due" value={money(amountDue)} href="/my/invoices" danger={amountDue > 0} />
        <Stat icon={FileText} label="Unpaid invoices" value={String(due._count)} href="/my/invoices" />
      </div>
      <Card>
        <CardHeader className="flex-row items-center justify-between border-b pb-3">
          <CardTitle>Your subscriptions</CardTitle>
          <Link href="/my/subscriptions" className="flex items-center gap-1 text-[13px] text-primary hover:underline">See all <ArrowRight className="size-3.5" /></Link>
        </CardHeader>
        <PortalSubscriptionTable rows={subs} />
      </Card>
      <Card>
        <CardHeader className="flex-row items-center justify-between border-b pb-3">
          <CardTitle>Recent invoices</CardTitle>
          <Link href="/my/invoices" className="flex items-center gap-1 text-[13px] text-primary hover:underline">See all <ArrowRight className="size-3.5" /></Link>
        </CardHeader>
        <PortalInvoiceTable rows={invoices} />
      </Card>
    </div>
  );
}

function Stat({ icon: Icon, label, value, href, danger }: { icon: typeof FileText; label: string; value: string; href: string; danger?: boolean }) {
  return (
    <Link href={href}>
      <Card className="flex items-center gap-3 p-4 hover:border-primary/40">
        <span className="flex size-10 items-center justify-center rounded-md bg-accent"><Icon className="size-5 text-primary" /></span>
        <span>
          <span className="block text-xs text-muted-foreground">{label}</span>
          <span className={`block text-xl font-semibold tabular-nums ${danger ? "text-destructive" : ""}`}>{value}</span>
        </span>
      </Card>
    </Link>
  );
}
