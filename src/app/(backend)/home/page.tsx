import Link from "next/link";
import type { Metadata } from "next";
import { ArrowUpRight, CircleAlert, FileSignature, RefreshCcw, Wallet } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth";
import { appsFor } from "@/lib/apps";
import { money, startOfDay } from "@/lib/format";
import { ROLE_LABEL } from "@/lib/constants";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Home" };

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export default async function HomePage() {
  const user = await requireStaff();
  const apps = appsFor(user.role);
  const today = startOfDay(new Date());
  const [active, quotations, overdue, outstanding] = await Promise.all([
    prisma.subscription.count({ where: { status: "ACTIVE" } }),
    prisma.subscription.count({ where: { status: { in: ["DRAFT", "QUOTATION"] } } }),
    prisma.invoice.count({ where: { status: "CONFIRMED", dueDate: { lt: today } } }),
    prisma.invoice.aggregate({ where: { status: "CONFIRMED" }, _sum: { total: true, amountPaid: true } }),
  ]);
  const due = (outstanding._sum.total ?? 0) - (outstanding._sum.amountPaid ?? 0);

  const stats = [
    { label: "Active subscriptions", value: String(active), icon: RefreshCcw, href: "/subscriptions?filter=running", tone: "text-[#714b67] bg-[#f1eaf0]" },
    { label: "Quotations to follow up", value: String(quotations), icon: FileSignature, href: "/subscriptions?filter=quotations", tone: "text-[#b8730a] bg-amber-50" },
    { label: "Outstanding", value: money(due), icon: Wallet, href: "/invoices?filter=unpaid", tone: "text-[#017e84] bg-teal-50" },
    { label: "Overdue invoices", value: String(overdue), icon: CircleAlert, href: "/invoices?filter=overdue", tone: "text-red-600 bg-red-50" },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
      <div>
        <p className="text-[13px] text-muted-foreground">
          {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })} · {ROLE_LABEL[user.role]}
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
          {greeting()}, {user.name.split(" ")[0]}
        </h1>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="group rounded-lg border bg-card p-4 transition-shadow hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className={cn("flex size-9 items-center justify-center rounded-md", s.tone)}>
                <s.icon className="size-[18px]" />
              </span>
              <ArrowUpRight className="size-4 text-gray-300 transition-colors group-hover:text-gray-500" />
            </div>
            <p className="mt-3 text-2xl font-semibold tabular-nums tracking-tight">{s.value}</p>
            <p className="text-[13px] text-muted-foreground">{s.label}</p>
          </Link>
        ))}
      </div>

      <h2 className="mt-10 text-[13px] font-semibold uppercase tracking-wider text-gray-400">Apps</h2>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {apps.map((app) => (
          <Link key={app.id} href={app.href} className="group flex items-center gap-4 rounded-lg border bg-card p-4 transition-shadow hover:shadow-md">
            <span className={cn("flex size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br shadow-sm", app.color)}>
              <app.icon className="size-6 text-white" strokeWidth={1.75} />
            </span>
            <span className="min-w-0">
              <span className="block font-semibold text-foreground">{app.name}</span>
              <span className="block truncate text-[13px] text-muted-foreground">{app.description}</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
