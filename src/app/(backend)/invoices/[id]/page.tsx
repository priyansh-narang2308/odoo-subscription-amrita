import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Mail, Printer, Undo2, XCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth";
import { getActivities } from "@/lib/activity";
import { INVOICE_PIPELINE, INVOICE_STATUS_LABEL } from "@/lib/constants";
import { inputDate } from "@/lib/format";
import { cancelInvoiceAction, confirmInvoice, resetInvoiceToDraft, saveInvoice, sendInvoice } from "@/actions/invoices";
import { registerPaymentAction } from "@/actions/payments";
import { ControlPanel } from "@/components/odoo/control-panel";
import { ActionButton } from "@/components/odoo/action-button";
import { StatusBar } from "@/components/odoo/status-bar";
import { Chatter } from "@/components/odoo/chatter";
import { InvoiceDocument, invoiceDocInclude } from "@/components/odoo/invoice-document";
import { Button } from "@/components/ui/button";
import { RegisterPayment } from "./register-payment";
import { DraftFields } from "./draft-fields";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (id === "new") return { title: "Invoice" };
  const rec = await prisma.invoice.findUnique({ where: { id }, select: { number: true } });
  return { title: rec?.number ?? "Not found" };
}

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireStaff();
  const inv = await prisma.invoice.findUnique({ where: { id }, include: invoiceDocInclude });
  if (!inv) notFound();
  const activities = await getActivities("invoice", inv.id);
  const due = inv.total - inv.amountPaid;

  return (
    <>
      <ControlPanel
        breadcrumbs={[
          ...(inv.subscription ? [{ label: inv.subscription.number, href: `/subscriptions/${inv.subscription.id}` }] : [{ label: "Invoices", href: "/invoices" }]),
          { label: inv.number },
        ]}
        actions={
          <Button variant="secondary" size="sm" asChild>
            <Link href={`/invoices/${inv.id}/print`} target="_blank"><Printer /> Print</Link>
          </Button>
        }
      />
      <div className="no-print flex flex-col gap-2 border-b bg-card px-4 py-2 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {inv.status === "DRAFT" && <ActionButton action={confirmInvoice.bind(null, inv.id)}><CheckCircle2 /> Confirm</ActionButton>}
          {inv.status === "CONFIRMED" && <RegisterPayment action={registerPaymentAction.bind(null, inv.id)} amountDue={due} number={inv.number} />}
          {(inv.status === "CONFIRMED" || inv.status === "PAID") && (
            <ActionButton variant={inv.sentAt ? "secondary" : "default"} action={sendInvoice.bind(null, inv.id)}><Mail /> {inv.sentAt ? "Resend" : "Send"}</ActionButton>
          )}
          {inv.status === "CONFIRMED" && inv.payments.length === 0 && (
            <ActionButton variant="secondary" action={resetInvoiceToDraft.bind(null, inv.id)}><Undo2 /> Reset to Draft</ActionButton>
          )}
          {(inv.status === "DRAFT" || inv.status === "CONFIRMED") && inv.payments.length === 0 && (
            <ActionButton variant="secondary" action={cancelInvoiceAction.bind(null, inv.id)} confirm="Cancel this invoice? Its billing period will be released so it can be invoiced again.">
              <XCircle /> Cancel
            </ActionButton>
          )}
        </div>
        <StatusBar steps={INVOICE_PIPELINE} current={inv.status} labels={INVOICE_STATUS_LABEL} />
      </div>
      <div className="flex flex-col gap-4 px-4 py-4 2xl:flex-row">
        <div className="min-w-0 flex-1">
          <div className="o-sheet">
            {inv.status === "DRAFT" && (
              <DraftFields action={saveInvoice.bind(null, inv.id)} invoiceDate={inputDate(inv.invoiceDate)} dueDate={inputDate(inv.dueDate)} notes={inv.notes ?? ""} />
            )}
            <InvoiceDocument invoice={inv} />
          </div>
        </div>
        <aside className="mx-auto w-full max-w-[1140px] shrink-0 2xl:mx-0 2xl:w-[360px]"><Chatter entries={activities} /></aside>
      </div>
    </>
  );
}
