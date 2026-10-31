"use client";

import { useState } from "react";
import { Banknote } from "lucide-react";
import { recordPayment } from "@/actions/payments";
import { inputDate, money } from "@/lib/format";
import { PAYMENT_METHODS, PAYMENT_METHOD_LABEL } from "@/lib/constants";
import { CreateDialog, FieldGrid } from "@/components/odoo/create-dialog";
import { Field } from "@/components/forms/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";

export type OpenInvoice = { id: string; due: number; label: string };

export function NewPaymentDialog({ invoices }: { invoices: OpenInvoice[] }) {
  return (
    <CreateDialog
      action={recordPayment}
      stay
      icon={Banknote}
      title="Register a payment"
      description="Record money received against a posted invoice."
      submitLabel="Register payment"
    >
      {(e) => <PaymentFields e={e} invoices={invoices} />}
    </CreateDialog>
  );
}

function PaymentFields({ e, invoices }: { e: Record<string, string>; invoices: OpenInvoice[] }) {
  const [invoiceId, setInvoiceId] = useState("");
  const [amount, setAmount] = useState("");
  const due = invoices.find((i) => i.id === invoiceId)?.due;

  return (
    <>
      <Field label="Invoice" htmlFor="p-invoice" error={e.invoiceId} required>
        <NativeSelect
          id="p-invoice"
          name="invoiceId"
          value={invoiceId}
          onChange={(ev) => {
            setInvoiceId(ev.target.value);
            const d = invoices.find((i) => i.id === ev.target.value)?.due;
            setAmount(d === undefined ? "" : d.toFixed(2));
          }}
          required
        >
          <option value="">{invoices.length ? "Select an outstanding invoice…" : "No invoices awaiting payment"}</option>
          {invoices.map((i) => <option key={i.id} value={i.id}>{i.label}</option>)}
        </NativeSelect>
      </Field>
      <FieldGrid>
        <Field label="Amount" htmlFor="p-amount" error={e.amount} hint={due !== undefined ? `${money(due)} outstanding` : undefined} required>
          <Input id="p-amount" name="amount" type="number" step="0.01" min="0.01" max={due} value={amount} onChange={(ev) => setAmount(ev.target.value)} required />
        </Field>
        <Field label="Method" htmlFor="p-method" error={e.method}>
          <NativeSelect id="p-method" name="method" defaultValue="BANK_TRANSFER">
            {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{PAYMENT_METHOD_LABEL[m]}</option>)}
          </NativeSelect>
        </Field>
        <Field label="Payment date" htmlFor="p-date" error={e.date} required>
          <Input id="p-date" name="date" type="date" defaultValue={inputDate(new Date())} required />
        </Field>
      </FieldGrid>
      <Field label="Note" htmlFor="p-note">
        <Textarea id="p-note" name="note" placeholder="Bank reference, cheque number…" className="min-h-16" />
      </Field>
    </>
  );
}
