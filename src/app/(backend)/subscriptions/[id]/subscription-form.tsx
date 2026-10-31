"use client";

import Link from "next/link";
import { useState } from "react";
import {
  CheckCircle2,
  FileText,
  Pause,
  Play,
  RefreshCw,
  Send,
  Trash2,
  Undo2,
  XCircle,
} from "lucide-react";
import type { ActionState } from "@/lib/action";
import type { CatalogProduct, CatalogTax } from "@/lib/catalog";
import { SUBSCRIPTION_PIPELINE, SUBSCRIPTION_STATUS_LABEL, billingLabel } from "@/lib/constants";
import { fmtDate, money, relativeDays } from "@/lib/format";
import { RecordForm, type FormAction } from "@/components/odoo/record-form";
import { ActionButton } from "@/components/odoo/action-button";
import { StatusBar } from "@/components/odoo/status-bar";
import { InvoiceStatusBadge } from "@/components/odoo/status-badge";
import { OrderLines, type LineDraft } from "@/components/odoo/order-lines";
import { FormRow } from "@/components/forms/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { ClickableRow } from "@/components/odoo/clickable-row";
import { cn } from "@/lib/utils";

type Act = () => Promise<ActionState>;
export type SubscriptionActions = Partial<Record<"send" | "confirm" | "start" | "invoice" | "pause" | "resume" | "close" | "renew" | "reset" | "remove", Act>>;

type Plan = { id: string; name: string; price: number; billingPeriod: string; billingInterval: number; minQuantity: number; pausable: boolean; closable: boolean; renewable: boolean };
type Template = { id: string; name: string; planId: string | null; validityDays: number; note: string | null; lines: { productId: string; variantId: string | null; quantity: number; description: string | null; taxIds: string[] }[] };
type Sub = {
  id: string;
  number: string;
  status: string;
  customerId: string;
  customerName: string;
  planId: string;
  templateId: string | null;
  paymentTermId: string | null;
  salespersonId: string | null;
  startDate: string;
  expirationDate: string;
  nextInvoiceDate: string | null;
  quotationExpiresAt: string | null;
  closedAt: string | null;
  closeReason: string | null;
  notes: string | null;
  renewedFrom: { id: string; number: string } | null;
  renewal: { id: string; number: string } | null;
  lines: LineDraft[];
  invoices: { id: string; number: string; invoiceDate: string; dueDate: string; total: number; amountPaid: number; status: string; periodStart: string | null; periodEnd: string | null }[];
};
type Preview = { applied: { id: string; name: string; amount: number }[]; untaxed: number; discount: number; tax: number; total: number } | null;

const today = () => new Date().toISOString().slice(0, 10);

export function SubscriptionForm({
  subscription: sub,
  defaults,
  customers,
  plans,
  terms,
  staff,
  templates,
  catalog,
  preview,
  isAdmin,
  save,
  actions: a,
  aside,
}: {
  subscription: Sub | null;
  defaults: { customerId: string | null; salespersonId: string; paymentTermId: string | null };
  customers: { id: string; name: string }[];
  plans: Plan[];
  terms: { id: string; name: string }[];
  staff: { id: string; name: string }[];
  templates: Template[];
  catalog: { products: CatalogProduct[]; taxes: CatalogTax[] };
  preview: Preview;
  isAdmin: boolean;
  save: FormAction;
  actions: SubscriptionActions;
  aside?: React.ReactNode;
}) {
  const status = sub?.status ?? "DRAFT";
  const closed = status === "CLOSED";
  const headerEditable = status === "DRAFT" || status === "QUOTATION";
  const [planId, setPlanId] = useState(sub?.planId ?? plans[0]?.id ?? "");
  const [templateId, setTemplateId] = useState(sub?.templateId ?? "");
  const [lines, setLines] = useState<LineDraft[]>(sub?.lines ?? []);
  const [linesKey, setLinesKey] = useState(0);
  const [notes, setNotes] = useState(sub?.notes ?? "");
  const plan = plans.find((p) => p.id === planId);
  const byId = new Map(catalog.products.map((p) => [p.id, p]));

  const applyTemplate = (id: string) => {
    setTemplateId(id);
    const t = templates.find((x) => x.id === id);
    if (!t) return;
    if (t.planId) setPlanId(t.planId);
    if (t.note && !notes) setNotes(t.note);
    setLines(
      t.lines.map((l) => {
        const p = byId.get(l.productId);
        const v = p?.variants.find((x) => x.id === l.variantId);
        return {
          key: crypto.randomUUID(),
          productId: l.productId,
          variantId: l.variantId,
          description: l.description || (p ? (v ? `${p.name} (${v.label.split(": ")[1]})` : p.name) : "Product"),
          quantity: l.quantity,
          unitPrice: (p?.salesPrice ?? 0) + (v?.extraPrice ?? 0),
          taxIds: l.taxIds,
        };
      }),
    );
    setLinesKey((k) => k + 1);
  };

  const changePlan = (id: string) => {
    setPlanId(id);
    const p = plans.find((x) => x.id === id);
    // Plans with their own price are billed as a "plan fee" line
    if (p && p.price > 0 && !lines.some((l) => l.description.endsWith("plan fee"))) {
      setLines((ls) => [...ls, { key: crypto.randomUUID(), productId: null, variantId: null, description: `${p.name} plan fee`, quantity: 1, unitPrice: p.price, taxIds: [] }]);
      setLinesKey((k) => k + 1);
    }
  };

  const quoteExpired = sub?.status === "QUOTATION" && sub.quotationExpiresAt && sub.quotationExpiresAt.slice(0, 10) < today();

  const header = sub && (
    <>
      <div className="flex flex-wrap gap-1.5">
        {status === "DRAFT" && a.send && <ActionButton action={a.send}><Send /> Send Quotation</ActionButton>}
        {status === "QUOTATION" && a.confirm && <ActionButton action={a.confirm}><CheckCircle2 /> Confirm</ActionButton>}
        {status === "DRAFT" && a.confirm && <ActionButton variant="secondary" action={a.confirm}><CheckCircle2 /> Confirm</ActionButton>}
        {status === "QUOTATION" && a.send && <ActionButton variant="secondary" action={a.send}><Send /> Resend</ActionButton>}
        {status === "CONFIRMED" && a.start && <ActionButton action={a.start}><Play /> Start Subscription</ActionButton>}
        {status === "ACTIVE" && a.invoice && <ActionButton action={a.invoice}><FileText /> Create Invoice</ActionButton>}
        {status === "ACTIVE" && plan?.pausable && a.pause && <ActionButton variant="secondary" action={a.pause}><Pause /> Pause</ActionButton>}
        {status === "PAUSED" && a.resume && <ActionButton action={a.resume}><Play /> Resume</ActionButton>}
        {["ACTIVE", "PAUSED", "CLOSED"].includes(status) && plan?.renewable && !sub.renewal && a.renew && (
          <ActionButton variant="secondary" action={a.renew}><RefreshCw /> Renew</ActionButton>
        )}
        {(status === "QUOTATION" || status === "CONFIRMED") && a.reset && <ActionButton variant="secondary" action={a.reset}><Undo2 /> Reset to Draft</ActionButton>}
        {["DRAFT", "QUOTATION", "CONFIRMED"].includes(status) && a.close && (
          <ActionButton variant="secondary" action={a.close} confirm="Cancel this quotation? It will be moved to Closed."><XCircle /> Cancel</ActionButton>
        )}
        {["ACTIVE", "PAUSED"].includes(status) && (plan?.closable || isAdmin) && a.close && (
          <ActionButton variant="secondary" action={a.close} confirm="Close this subscription? No further invoices will be created."><XCircle /> Close</ActionButton>
        )}
        {status === "DRAFT" && sub.invoices.length === 0 && a.remove && (
          <ActionButton variant="ghost" action={a.remove} confirm="Delete this draft permanently?"><Trash2 /> Delete</ActionButton>
        )}
      </div>
      <StatusBar
        steps={SUBSCRIPTION_PIPELINE}
        current={status}
        labels={{ ...SUBSCRIPTION_STATUS_LABEL, ACTIVE: "In Progress" }}
      />
    </>
  );

  return (
    <RecordForm
      action={save}
      readOnly={closed}
      backHref="/subscriptions"
      breadcrumbs={[{ label: "Subscriptions", href: "/subscriptions" }, { label: sub?.number ?? "New" }]}
      header={header}
      aside={aside}
    >
      {(e) => (
        <>
          {sub && (
            <div className="-mt-2 mb-3 flex flex-wrap items-start justify-between gap-2">
              <div className="space-y-1">
                {quoteExpired && <Banner tone="red">This quotation expired on {fmtDate(sub.quotationExpiresAt)}. Resend it to extend its validity.</Banner>}
                {sub.status === "PAUSED" && <Banner tone="amber">Billing is paused. Resume the subscription to continue invoicing.</Banner>}
                {closed && <Banner tone="gray">Closed on {fmtDate(sub.closedAt)}{sub.closeReason && ` — ${sub.closeReason}`}.</Banner>}
                {sub.renewedFrom && <Banner tone="blue">Renewal of <Link className="underline" href={`/subscriptions/${sub.renewedFrom.id}`}>{sub.renewedFrom.number}</Link></Banner>}
                {sub.renewal && <Banner tone="blue">Renewed by <Link className="underline" href={`/subscriptions/${sub.renewal.id}`}>{sub.renewal.number}</Link></Banner>}
              </div>
              <Link href={`/invoices?subscription=${sub.id}`} className="flex items-center gap-2 rounded-sm border px-3 py-1.5 text-[13px] hover:bg-muted">
                <FileText className="size-5 text-primary" />
                <span className="leading-tight"><b className="block tabular-nums">{sub.invoices.length}</b><span className="text-xs text-muted-foreground">Invoices</span></span>
              </Link>
            </div>
          )}
          <h1 className="mb-4 text-2xl font-semibold">{sub?.number ?? <span className="text-muted-foreground">New</span>}</h1>

          <input type="hidden" name="planId" value={planId} />
          <input type="hidden" name="templateId" value={templateId} />
          <div className="grid gap-x-10 lg:grid-cols-2">
            <div>
              <FormRow label="Customer" htmlFor="customerId" error={e.customerId} required>
                {headerEditable ? (
                  <NativeSelect id="customerId" name="customerId" defaultValue={sub?.customerId ?? defaults.customerId ?? ""} required>
                    <option value="">Select a customer…</option>
                    {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </NativeSelect>
                ) : (
                  <>
                    <input type="hidden" name="customerId" value={sub!.customerId} />
                    <Link href={`/customers/${sub!.customerId}`} className="text-primary hover:underline">{sub!.customerName}</Link>
                  </>
                )}
              </FormRow>
              <FormRow label="Quotation Template" htmlFor="template">
                <NativeSelect id="template" value={templateId} onChange={(ev) => applyTemplate(ev.target.value)} disabled={!headerEditable}>
                  <option value="">—</option>
                  {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </NativeSelect>
              </FormRow>
              <FormRow label="Recurring Plan" htmlFor="plan" error={e.planId} required>
                <NativeSelect id="plan" value={planId} onChange={(ev) => changePlan(ev.target.value)} disabled={!headerEditable}>
                  {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </NativeSelect>
                {plan && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {billingLabel(plan.billingPeriod, plan.billingInterval)} · min. qty {plan.minQuantity}
                    {plan.price > 0 && ` · plan fee ${money(plan.price)}`}
                  </p>
                )}
              </FormRow>
              <FormRow label="Payment Terms" htmlFor="paymentTermId">
                <NativeSelect id="paymentTermId" name="paymentTermId" defaultValue={sub?.paymentTermId ?? defaults.paymentTermId ?? ""}>
                  <option value="">Immediate</option>
                  {terms.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </NativeSelect>
              </FormRow>
            </div>
            <div>
              <FormRow label="Start Date" htmlFor="startDate" error={e.startDate} required>
                <Input id="startDate" name="startDate" type="date" defaultValue={sub?.startDate ?? today()} readOnly={!headerEditable} className={cn(!headerEditable && "border-transparent bg-transparent")} />
              </FormRow>
              <FormRow label="Expiration Date" htmlFor="expirationDate" error={e.expirationDate}>
                <Input id="expirationDate" name="expirationDate" type="date" defaultValue={sub?.expirationDate ?? ""} />
              </FormRow>
              {sub && ["CONFIRMED", "ACTIVE", "PAUSED"].includes(status) && (
                <FormRow label="Next Invoice">
                  <span className="text-[13px]">
                    {fmtDate(sub.nextInvoiceDate)}{" "}
                    {sub.nextInvoiceDate && <span className="text-muted-foreground">({relativeDays(new Date(sub.nextInvoiceDate))})</span>}
                  </span>
                </FormRow>
              )}
              {sub?.quotationExpiresAt && headerEditable && (
                <FormRow label="Quotation Valid Until"><span className="text-[13px]">{fmtDate(sub.quotationExpiresAt)}</span></FormRow>
              )}
              <FormRow label="Salesperson" htmlFor="salespersonId">
                <NativeSelect id="salespersonId" name="salespersonId" defaultValue={sub?.salespersonId ?? defaults.salespersonId}>
                  <option value="">—</option>
                  {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </NativeSelect>
              </FormRow>
            </div>
          </div>

          <Tabs defaultValue="lines" className="mt-6">
            <TabsList>
              <TabsTrigger value="lines">Order Lines</TabsTrigger>
              {sub && <TabsTrigger value="invoices">Invoices ({sub.invoices.length})</TabsTrigger>}
              <TabsTrigger value="other">Other Info</TabsTrigger>
            </TabsList>
            <TabsContent value="lines" forceMount className="data-[state=inactive]:hidden">
              <OrderLines
                key={linesKey}
                initial={lines}
                onChange={setLines}
                products={catalog.products}
                taxes={catalog.taxes}
                readOnly={closed}
                minQuantity={plan?.minQuantity ?? 1}
              />
              {preview && preview.applied.length > 0 && (
                <div className="mt-4 rounded-sm border border-emerald-200 bg-emerald-50 px-3 py-2 text-[13px] text-emerald-900">
                  <p className="font-semibold">Discounts applied automatically on the next invoice</p>
                  <ul className="mt-1 space-y-0.5">
                    {preview.applied.map((d) => <li key={d.id} className="flex justify-between"><span>{d.name}</span><span className="tabular-nums">− {money(d.amount)}</span></li>)}
                  </ul>
                  <p className="mt-1.5 flex justify-between border-t border-emerald-200 pt-1.5 font-semibold"><span>Estimated next invoice</span><span className="tabular-nums">{money(preview.total)}</span></p>
                </div>
              )}
            </TabsContent>
            {sub && (
              <TabsContent value="invoices" forceMount className="data-[state=inactive]:hidden">
                {sub.invoices.length === 0 ? (
                  <p className="py-6 text-center text-[13px] text-muted-foreground">No invoices yet.</p>
                ) : (
                  <Table>
                    <THead><TR><TH>Number</TH><TH>Date</TH><TH>Period</TH><TH>Due</TH><TH className="text-right">Total</TH><TH className="text-right">Paid</TH><TH>Status</TH></TR></THead>
                    <TBody>
                      {sub.invoices.map((i) => (
                        <ClickableRow key={i.id} href={`/invoices/${i.id}`}>
                          <TD className="font-medium">{i.number}</TD>
                          <TD>{fmtDate(i.invoiceDate)}</TD>
                          <TD className="whitespace-nowrap text-muted-foreground">{fmtDate(i.periodStart)} → {fmtDate(i.periodEnd)}</TD>
                          <TD>{fmtDate(i.dueDate)}</TD>
                          <TD className="text-right tabular-nums">{money(i.total)}</TD>
                          <TD className="text-right tabular-nums">{money(i.amountPaid)}</TD>
                          <TD><InvoiceStatusBadge status={i.status} overdue={i.dueDate.slice(0, 10) < today()} /></TD>
                        </ClickableRow>
                      ))}
                    </TBody>
                  </Table>
                )}
              </TabsContent>
            )}
            <TabsContent value="other" forceMount className="data-[state=inactive]:hidden">
              <FormRow label="Terms & Notes" htmlFor="notes">
                <Textarea id="notes" name="notes" value={notes} onChange={(ev) => setNotes(ev.target.value)} placeholder="Terms and conditions, internal notes…" />
              </FormRow>
            </TabsContent>
          </Tabs>
        </>
      )}
    </RecordForm>
  );
}

function Banner({ tone, children }: { tone: "red" | "amber" | "gray" | "blue"; children: React.ReactNode }) {
  const cls = {
    red: "border-red-200 bg-red-50 text-red-800",
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    gray: "border-gray-200 bg-gray-50 text-gray-700",
    blue: "border-sky-200 bg-sky-50 text-sky-800",
  }[tone];
  return <div className={cn("rounded-sm border px-3 py-1.5 text-[13px]", cls)}>{children}</div>;
}
