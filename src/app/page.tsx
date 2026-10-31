import type { Metadata } from "next";
import Link from "next/link";
import {
  BadgePercent,
  BarChart3,
  CalendarClock,
  Check,
  FileSignature,
  FileText,
  Globe,
  KeyRound,
  Layers,
  Package,
  Receipt,
  RefreshCcw,
  ShieldCheck,
  UserCog,
  Users,
  Wallet,
  WifiOff,
  History,
  type LucideIcon,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, homeFor } from "@/lib/auth";
import { BrandLogo } from "@/components/brand";
import { LandingHeader } from "@/components/landing/landing-header";
import { InvoiceMock, LifecycleMock, PortalMock, ReportMock } from "@/components/landing/mockups";
import { Arrow, Circled, Highlight, Note, Underline } from "@/components/landing/scribbles";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: { absolute: "Brightloop — Subscriptions, billing and payments in one loop" },
  description: "Plans, quotations, recurring invoices, discounts, payments and revenue reports — in one clean platform.",
};

const APPS: { name: string; icon: LucideIcon; tint: string }[] = [
  { name: "Subscriptions", icon: RefreshCcw, tint: "from-[#9b6a90] to-[#714b67]" },
  { name: "Quotations", icon: FileSignature, tint: "from-[#f3a05b] to-[#e0782f]" },
  { name: "Recurring Plans", icon: CalendarClock, tint: "from-[#5bb9be] to-[#017e84]" },
  { name: "Products", icon: Package, tint: "from-[#f2c14e] to-[#dc9a14]" },
  { name: "Variants", icon: Layers, tint: "from-[#8aa4f0] to-[#4f6fd8]" },
  { name: "Invoicing", icon: FileText, tint: "from-[#4fb3a9] to-[#1f8a80]" },
  { name: "Payments", icon: Wallet, tint: "from-[#6fc48a] to-[#2f9a55]" },
  { name: "Discounts", icon: BadgePercent, tint: "from-[#f27d8c] to-[#d64b5d]" },
  { name: "Taxes", icon: Receipt, tint: "from-[#b28be6] to-[#7d55c7]" },
  { name: "Customers", icon: Users, tint: "from-[#5aa9e6] to-[#2a78c2]" },
  { name: "Customer Portal", icon: Globe, tint: "from-[#4cc3d9] to-[#1890a8]" },
  { name: "Reporting", icon: BarChart3, tint: "from-[#e88a6b] to-[#c95b3a]" },
];

const FEATURES = [
  {
    kicker: "Subscriptions",
    title: (
      <>
        From quotation to <Highlight>renewal</Highlight>
      </>
    ),
    body: "Start from a quotation template, send it, and let the customer accept it online. Every subscription follows a clear lifecycle with its own history.",
    points: [
      "Quotation templates with validity and ready-made lines",
      "Pause, resume, close and renew — as each plan allows",
      "Product variants with price extras, applied automatically",
      "A chatter log of every change, by every user",
    ],
    note: "Draft → Quotation → Confirmed → Active → Closed",
    mock: <LifecycleMock />,
  },
  {
    kicker: "Invoicing",
    title: (
      <>
        Invoices that <Highlight>write themselves</Highlight>
      </>
    ),
    body: "Recurring invoices are generated for each billing period, with your taxes and discounts already applied. Confirm, send, print — or let the billing run do it.",
    points: [
      "Exactly one invoice per period — never twice, never skipped",
      "Missed periods are caught up automatically",
      "Fixed or % discounts with limits, dates and scope",
      "Partial payments with paid vs. outstanding always visible",
    ],
    note: "No double billing. Ever.",
    mock: <InvoiceMock />,
  },
  {
    kicker: "Reporting",
    title: (
      <>
        Know your <Highlight>numbers</Highlight>
      </>
    ),
    body: "A live dashboard of recurring revenue, collections and overdue invoices, filterable by period and plan — straight from your data.",
    points: [
      "MRR and ARR, normalised across billing periods",
      "Invoiced vs. collected for the last 12 months",
      "Overdue invoices to chase, oldest first",
      "Top customers and MRR by plan",
    ],
    note: "Fresh numbers on every page load",
    mock: <ReportMock />,
  },
  {
    kicker: "Customer portal",
    title: (
      <>
        A portal your customers <Highlight>enjoy</Highlight>
      </>
    ),
    body: "Customers sign in to see their own subscriptions and invoices — nothing else. They can accept quotations, pay, pause or ask for a renewal themselves.",
    points: [
      "Accept quotations and pay invoices online",
      "Pause, close or renew within the plan rules",
      "Download any invoice as a clean PDF",
      "Strictly their own data, enforced on the server",
    ],
    note: "Less back-and-forth for your team",
    mock: <PortalMock />,
  },
];

const STEPS = [
  { title: "Set up your catalogue", body: "Add products and variants, recurring plans, taxes, payment terms and discounts." },
  { title: "Send a quotation", body: "Pick a template, adjust the lines and send it. The customer confirms in the portal." },
  { title: "Bill on autopilot", body: "Invoices are created every period, payments are matched, and reports update live." },
];

const ROLES = [
  {
    icon: ShieldCheck,
    name: "Admin",
    body: "Full control of the business.",
    points: ["Configure plans, taxes and discounts", "Create internal users", "Everything internal users can do"],
  },
  {
    icon: UserCog,
    name: "Internal user",
    body: "Day-to-day operations.",
    points: ["Customers and subscriptions", "Invoices and payments", "Read-only configuration"],
  },
  {
    icon: Globe,
    name: "Portal customer",
    body: "Self-service for your customers.",
    points: ["Their own subscriptions", "Their own invoices and payments", "Profile and password"],
  },
];

const SAFEGUARDS = [
  { icon: KeyRound, title: "Strong passwords", body: "8+ characters with upper, lower and special characters. Reset links expire and are single-use." },
  { icon: ShieldCheck, title: "Role-based access", body: "Every page and action checks the user's role on the server, not just in the menu." },
  { icon: History, title: "Full audit trail", body: "Status changes, invoices and payments are logged on each record's chatter." },
  { icon: WifiOff, title: "Runs fully local", body: "A local SQLite database and bundled fonts — no cloud service required to run it." },
];

async function liveStats() {
  try {
    const [subscriptions, active, invoices, payments, customers] = await Promise.all([
      prisma.subscription.count(),
      prisma.subscription.count({ where: { status: "ACTIVE" } }),
      prisma.invoice.count({ where: { status: { in: ["CONFIRMED", "PAID"] } } }),
      prisma.payment.count(),
      prisma.customer.count(),
    ]);
    return [
      { value: subscriptions, label: "subscriptions managed" },
      { value: active, label: "active right now" },
      { value: invoices, label: "invoices issued" },
      { value: payments, label: "payments recorded" },
      { value: customers, label: "customers" },
    ];
  } catch {
    return null;
  }
}

const fmt = new Intl.NumberFormat("en-IN");

export default async function Landing() {
  const [user, stats] = await Promise.all([getCurrentUser(), liveStats()]);
  const appHref = user ? homeFor(user.role) : null;

  return (
    <div className="min-h-screen bg-white text-gray-900 [font-size:16px]">
      <LandingHeader appHref={appHref} />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="mx-auto max-w-6xl px-4 pb-10 pt-14 text-center sm:px-6 sm:pt-20 lg:pt-24">
            <h1 className="rise isolate mx-auto max-w-4xl text-[2.6rem] font-bold leading-[1.08] tracking-tight text-gray-900 sm:text-6xl lg:text-7xl">
              All your subscriptions <br className="hidden sm:block" />
              in <Highlight>one loop.</Highlight>
            </h1>
            <p className="rise mx-auto mt-6 max-w-2xl text-lg text-gray-600 [animation-delay:80ms] sm:text-xl">
              Plans, quotations, recurring invoices, discounts and payments.
              <br className="hidden sm:block" /> Simple, accurate, and built for growing teams.
            </p>
            <div className="rise mt-9 flex flex-col items-center justify-center gap-3 [animation-delay:160ms] sm:flex-row">
              <Link
                href={appHref ?? "/signup"}
                className="w-full rounded-md bg-[#714b67] px-7 py-3.5 text-[17px] font-medium text-white shadow-sm transition-colors hover:bg-[#5f3d56] sm:w-auto"
              >
                {appHref ? "Open the app" : "Start now — it's free"}
              </Link>
              <Link
                href={appHref ? "#features" : "/login"}
                className="w-full rounded-md bg-[#e7e9ed] px-7 py-3.5 text-[17px] font-medium text-gray-800 transition-colors hover:bg-[#d8dbe0] sm:w-auto"
              >
                {appHref ? "See what's inside" : "Try the live demo"}
              </Link>
            </div>
            <div className="rise mt-6 flex items-start justify-center gap-1 [animation-delay:240ms]">
              <Arrow className="mt-1 hidden -rotate-12 sm:block" />
              <Note className="max-w-xs text-left">
                Demo accounts are ready — sign in and explore in seconds!
              </Note>
            </div>
          </div>
        </section>

        {/* App grid */}
        <section id="apps" className="scroll-mt-20 px-4 pb-16 sm:px-6">
          <div className="mx-auto max-w-5xl rounded-2xl border border-gray-100 bg-white px-4 py-8 shadow-[0_10px_50px_-12px_rgba(0,0,0,0.12)] sm:px-10 sm:py-12">
            <ul className="grid grid-cols-3 gap-x-3 gap-y-8 sm:grid-cols-4 lg:grid-cols-6">
              {APPS.map(({ name, icon: Icon, tint }) => (
                <li key={name} className="group flex flex-col items-center text-center">
                  <span
                    className={cn(
                      "flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-[0_6px_14px_-6px_rgba(0,0,0,0.35)] transition-transform duration-200 group-hover:-translate-y-1 sm:size-16",
                      tint,
                    )}
                  >
                    <Icon className="size-7 sm:size-8" strokeWidth={1.8} />
                  </span>
                  <span className="mt-2.5 text-[13px] font-medium text-gray-700 sm:text-sm">{name}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="mx-auto mt-6 flex max-w-5xl items-center justify-center gap-2">
            <Note className="text-center">One platform. Every step of the subscription.</Note>
          </div>
        </section>

        {/* Live numbers */}
        {stats && (
          <section className="bg-[#f6f2f5] px-4 py-14 sm:px-6">
            <div className="mx-auto max-w-6xl">
              <div className="flex flex-col items-center text-center">
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Real data, <Underline>not slides</Underline>
                </h2>
                <Note className="mt-3 text-xl">straight from the demo workspace's database ↓</Note>
              </div>
              <dl className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                {stats.map((s, i) => (
                  <div key={s.label} className={cn("rounded-xl bg-white px-4 py-5 text-center shadow-sm", i === 4 && "col-span-2 sm:col-span-1")}>
                    <dt className="sr-only">{s.label}</dt>
                    <dd className="text-3xl font-bold tabular-nums text-[#714b67] sm:text-4xl">{fmt.format(s.value)}</dd>
                    <dd className="mt-1 text-sm text-gray-600">{s.label}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </section>
        )}

        {/* Features */}
        <section id="features" className="scroll-mt-16">
          {FEATURES.map((f, i) => (
            <div key={f.kicker} className={cn("px-4 py-16 sm:px-6 lg:py-24", i % 2 === 1 && "bg-gray-50")}>
              <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2 lg:gap-16">
                <div className={cn(i % 2 === 1 && "lg:order-2")}>
                  <p className="text-sm font-semibold uppercase tracking-wider text-[#017e84]">{f.kicker}</p>
                  <h2 className="isolate mt-3 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">{f.title}</h2>
                  <p className="mt-4 text-lg text-gray-600">{f.body}</p>
                  <ul className="mt-6 space-y-3">
                    {f.points.map((p) => (
                      <li key={p} className="flex gap-3 text-gray-700">
                        <Check className="mt-0.5 size-5 shrink-0 text-[#017e84]" strokeWidth={2.5} />
                        {p}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 flex items-center gap-2">
                    <Note>{f.note}</Note>
                  </div>
                </div>
                <div className={cn("mx-auto w-full max-w-xl", i % 2 === 1 && "lg:order-1")}>{f.mock}</div>
              </div>
            </div>
          ))}
        </section>

        {/* How it works */}
        <section id="how" className="scroll-mt-16 px-4 py-16 sm:px-6 lg:py-24">
          <div className="mx-auto max-w-6xl">
            <div className="text-center">
              <h2 className="isolate text-3xl font-bold tracking-tight sm:text-4xl">
                Up and running in <Highlight>three steps</Highlight>
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-gray-600">No spreadsheets, no reminders, no month-end panic.</p>
            </div>
            <ol className="mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
              {STEPS.map((s, i) => (
                <li key={s.title} className="relative text-center md:text-left">
                  <span className="font-hand text-6xl font-bold leading-none text-[#714b67]">{i + 1}.</span>
                  {i < STEPS.length - 1 && (
                    <Arrow className="absolute -right-6 top-2 hidden h-10 w-20 rotate-[-8deg] md:block" />
                  )}
                  <h3 className="mt-3 text-xl font-semibold">{s.title}</h3>
                  <p className="mt-2 text-gray-600">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Roles */}
        <section id="roles" className="scroll-mt-16 bg-gray-50 px-4 py-16 sm:px-6 lg:py-24">
          <div className="mx-auto max-w-6xl">
            <div className="text-center">
              <h2 className="isolate text-3xl font-bold tracking-tight sm:text-4xl">
                The right access for <Highlight>everyone</Highlight>
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-gray-600">Three roles, enforced on every page and every action.</p>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {ROLES.map(({ icon: Icon, name, body, points }) => (
                <div key={name} className="rounded-xl border border-gray-200 bg-white p-6 transition-shadow hover:shadow-md">
                  <span className="flex size-11 items-center justify-center rounded-lg bg-[#f1eaf0] text-[#714b67]">
                    <Icon className="size-6" />
                  </span>
                  <h3 className="mt-4 font-hand text-3xl font-bold text-gray-900">{name}</h3>
                  <p className="mt-1 text-gray-600">{body}</p>
                  <ul className="mt-5 space-y-2 border-t pt-5 text-[15px]">
                    {points.map((p) => (
                      <li key={p} className="flex gap-2.5 text-gray-700">
                        <Check className="mt-0.5 size-4 shrink-0 text-[#017e84]" strokeWidth={2.5} />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Safeguards */}
        <section className="px-4 py-16 sm:px-6 lg:py-24">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
              Built <Underline>properly</Underline>
            </h2>
            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {SAFEGUARDS.map(({ icon: Icon, title, body }) => (
                <div key={title}>
                  <Icon className="size-7 text-[#714b67]" strokeWidth={1.8} />
                  <h3 className="mt-3 text-lg font-semibold">{title}</h3>
                  <p className="mt-1.5 text-[15px] text-gray-600">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final call to action */}
        <section className="bg-[#714b67] px-4 py-16 text-center text-white sm:px-6">
          <h2 className="font-hand text-4xl font-bold leading-tight sm:text-5xl">
            Ready to put your billing on <Circled>autopilot</Circled>?
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-lg text-white/80">
            {appHref ? "Your workspace is one click away." : "Create an account in a minute, or explore the demo workspace first."}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href={appHref ?? "/signup"}
              className="w-full rounded-md bg-white px-7 py-3.5 text-[17px] font-medium text-[#714b67] transition-colors hover:bg-gray-100 sm:w-auto"
            >
              {appHref ? "Open the app" : "Start now — it's free"}
            </Link>
            {!appHref && (
              <Link
                href="/login"
                className="w-full rounded-md border border-white/40 px-7 py-3.5 text-[17px] font-medium text-white transition-colors hover:bg-white/10 sm:w-auto"
              >
                Sign in
              </Link>
            )}
          </div>
        </section>
      </main>

      <footer className="border-t bg-white px-4 py-12 sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <BrandLogo />
            <p className="mt-3 max-w-sm text-[15px] text-gray-600">
              Subscription management for teams that bill every month — plans, invoices, payments and reports in one place.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-900">Product</h3>
            <ul className="mt-3 space-y-2 text-[15px] text-gray-600">
              <li><a href="#apps" className="hover:text-[#714b67]">Apps</a></li>
              <li><a href="#features" className="hover:text-[#714b67]">Features</a></li>
              <li><a href="#how" className="hover:text-[#714b67]">How it works</a></li>
              <li><a href="#roles" className="hover:text-[#714b67]">Roles</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-900">Account</h3>
            <ul className="mt-3 space-y-2 text-[15px] text-gray-600">
              <li><Link href="/login" className="hover:text-[#714b67]">Sign in</Link></li>
              <li><Link href="/signup" className="hover:text-[#714b67]">Create an account</Link></li>
              <li><Link href="/forgot-password" className="hover:text-[#714b67]">Reset password</Link></li>
            </ul>
          </div>
        </div>
        <p className="mx-auto mt-10 max-w-6xl border-t pt-6 text-sm text-gray-500">© {new Date().getFullYear()} Brightloop Software</p>
      </footer>
    </div>
  );
}
