import { CheckCircle2, CreditCard, Download, Pause, RefreshCcw } from "lucide-react";
import { money } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Static illustrations of real screens, drawn with the app's own visual language. */

function Window({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-xl border border-black/10 bg-white shadow-[0_24px_60px_-20px_rgba(60,30,55,0.35)]", className)}>
      <div className="flex h-9 items-center gap-1.5 bg-[#714b67] px-3">
        <span className="size-2.5 rounded-full bg-white/30" />
        <span className="size-2.5 rounded-full bg-white/30" />
        <span className="size-2.5 rounded-full bg-white/30" />
        <span className="ml-3 truncate text-xs font-medium text-white/90">{title}</span>
      </div>
      {children}
    </div>
  );
}

const STEPS = ["Quotation", "Confirmed", "Active", "Closed"];

export function LifecycleMock() {
  return (
    <Window title="Subscriptions / SUB/2026/00042">
      <div className="space-y-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-1.5">
            <span className="rounded bg-[#714b67] px-2.5 py-1 text-[11px] font-medium text-white">Create Invoice</span>
            <span className="rounded bg-[#e7e9ed] px-2.5 py-1 text-[11px] font-medium text-gray-700">Pause</span>
            <span className="hidden rounded bg-[#e7e9ed] px-2.5 py-1 text-[11px] font-medium text-gray-700 sm:inline">Renew</span>
          </div>
          <div className="flex text-[10px] font-medium">
            {STEPS.map((s, i) => (
              <span
                key={s}
                className={cn(
                  "border-y border-r px-2 py-1 first:rounded-l first:border-l last:rounded-r sm:px-2.5",
                  i === 2 ? "border-[#714b67] bg-[#714b67] text-white" : "bg-white text-gray-500",
                )}
              >
                {s}
              </span>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[11px] text-gray-500">Subscription</p>
          <p className="text-lg font-semibold text-gray-900">SUB/2026/00042</p>
        </div>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-[12px]">
          {[
            ["Customer", "Corner Bakery"],
            ["Recurring plan", "Monthly"],
            ["Start date", "01 Oct 2026"],
            ["Next invoice", "01 Nov 2026"],
          ].map(([k, v]) => (
            <div key={k} className="flex flex-col">
              <dt className="text-gray-500">{k}</dt>
              <dd className="font-medium text-gray-800">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="rounded-md border text-[12px]">
          <div className="grid grid-cols-[1fr_auto_auto] gap-4 border-b bg-gray-50 px-3 py-1.5 font-semibold text-gray-600">
            <span>Product</span>
            <span>Qty</span>
            <span className="w-20 text-right">Amount</span>
          </div>
          {[
            ["CRM (per seat)", 3, 5280],
            ["Cloud Storage 100 GB", 1, 499],
          ].map(([p, q, a]) => (
            <div key={p as string} className="grid grid-cols-[1fr_auto_auto] gap-4 border-b px-3 py-1.5 last:border-0">
              <span className="truncate text-gray-800">{p}</span>
              <span className="text-gray-600">{q}</span>
              <span className="w-20 text-right font-medium">{money(a as number)}</span>
            </div>
          ))}
        </div>
        <div className="flex items-start gap-2 border-t pt-3 text-[11px] text-gray-500">
          <span className="mt-0.5 size-5 shrink-0 rounded-full bg-[#017e84] text-center text-[10px] leading-5 text-white">PN</span>
          <p>
            <span className="font-medium text-gray-700">Priyansh</span> · Subscription started · first invoice INV/2026/00118 created
          </p>
        </div>
      </div>
    </Window>
  );
}

export function InvoiceMock() {
  return (
    <Window title="Invoicing / INV/2026/00118">
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-lg font-semibold text-gray-900">INV/2026/00118</p>
            <span className="mt-1 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">Paid</span>
          </div>
          <div className="text-right text-[11px] text-gray-500">
            <p>Billing period</p>
            <p className="font-medium text-gray-800">01 Oct – 31 Oct 2026</p>
          </div>
        </div>
        <div className="mt-4 space-y-1.5 text-[12px]">
          {[
            ["Untaxed amount", money(5779)],
            ["Loyal customer −10%", `− ${money(577.9)}`],
            ["GST 18%", money(936.2)],
          ].map(([k, v], i) => (
            <div key={k} className={cn("flex justify-between", i === 1 && "text-[#017e84]")}>
              <span className={i === 1 ? "" : "text-gray-500"}>{k}</span>
              <span className="font-medium">{v}</span>
            </div>
          ))}
          <div className="flex justify-between border-t pt-2 text-[14px] font-semibold text-gray-900">
            <span>Total</span>
            <span>{money(6137.3)}</span>
          </div>
          <div className="flex justify-between text-[11px] italic text-gray-500">
            <span>Paid on 01 Oct 2026 (UPI)</span>
            <span>− {money(6137.3)}</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>Amount due</span>
            <span>{money(0)}</span>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[10px] font-medium">
          {["Sep", "Oct", "Nov"].map((m, i) => (
            <div key={m} className={cn("rounded-md border px-2 py-2", i === 2 ? "border-dashed text-gray-400" : "border-emerald-200 bg-emerald-50 text-emerald-700")}>
              {i === 2 ? <RefreshCcw className="mx-auto mb-1 size-3.5" /> : <CheckCircle2 className="mx-auto mb-1 size-3.5" />}
              {m} {i === 2 ? "· scheduled" : "· billed once"}
            </div>
          ))}
        </div>
      </div>
    </Window>
  );
}

const BARS = [42, 55, 49, 63, 70, 66, 78, 84, 80, 92, 97, 104];

export function ReportMock() {
  const max = Math.max(...BARS);
  return (
    <Window title="Reporting / Dashboard">
      <div className="p-4 sm:p-5">
        <div className="grid grid-cols-3 gap-2">
          {[
            ["MRR", "₹1.04L", "+8.2%"],
            ["Active", "48", "+5"],
            ["Overdue", "₹6.3K", "3 invoices"],
          ].map(([k, v, d], i) => (
            <div key={k} className="rounded-md border px-2.5 py-2">
              <p className="text-[10px] uppercase tracking-wide text-gray-500">{k}</p>
              <p className="text-base font-semibold text-gray-900">{v}</p>
              <p className={cn("text-[10px]", i === 2 ? "text-[#d23f3a]" : "text-emerald-600")}>{d}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex h-32 items-end gap-1.5 border-b border-gray-200 pb-px" aria-hidden>
          {BARS.map((b, i) => (
            <div key={i} className="flex h-full flex-1 items-end">
              <div
                className={cn("w-full rounded-t-[3px]", i === BARS.length - 1 ? "bg-[#714b67]" : "bg-[#714b67]/35")}
                style={{ height: `${(b / max) * 100}%` }}
              />
            </div>
          ))}
        </div>
        <div className="mt-1.5 flex justify-between text-[10px] text-gray-400">
          <span>Nov</span>
          <span>Collected revenue · last 12 months</span>
          <span>Oct</span>
        </div>
      </div>
    </Window>
  );
}

export function PortalMock() {
  return (
    <div className="overflow-hidden rounded-xl border border-black/10 bg-white shadow-[0_24px_60px_-20px_rgba(60,30,55,0.35)]">
      <div className="flex h-11 items-center gap-4 border-b px-4 text-[12px]">
        <span className="font-bold text-[#714b67]">
          bright<span className="text-[#017e84]">loop</span>
        </span>
        <span className="border-b-2 border-[#714b67] py-3 font-medium text-[#714b67]">Overview</span>
        <span className="text-gray-500">Invoices</span>
      </div>
      <div className="space-y-3 p-4 sm:p-5">
        <p className="text-base font-semibold text-gray-900">Welcome, Corner Bakery</p>
        <div className="flex items-center justify-between rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5 text-[12px]">
          <div>
            <p className="font-semibold text-gray-900">INV/2026/00121</p>
            <p className="text-amber-700">Due today · {money(2124)}</p>
          </div>
          <span className="flex items-center gap-1 rounded bg-[#714b67] px-2.5 py-1.5 text-[11px] font-medium text-white">
            <CreditCard className="size-3.5" /> Pay now
          </span>
        </div>
        {[
          ["SUB/2026/00042", "Monthly · Active", "Active"],
          ["SUB/2026/00017", "Yearly · Paused", "Paused"],
        ].map(([n, d, s]) => (
          <div key={n} className="flex items-center justify-between rounded-md border px-3 py-2.5 text-[12px]">
            <div>
              <p className="font-medium text-gray-900">{n}</p>
              <p className="text-gray-500">{d}</p>
            </div>
            <span
              className={cn(
                "flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                s === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600",
              )}
            >
              {s === "Paused" && <Pause className="size-3" />} {s}
            </span>
          </div>
        ))}
        <p className="flex items-center gap-1.5 text-[11px] text-gray-500">
          <Download className="size-3.5" /> Download any invoice as PDF
        </p>
      </div>
    </div>
  );
}
