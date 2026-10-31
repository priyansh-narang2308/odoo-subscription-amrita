"use client";

import { useState } from "react";
import { recordPayment } from "@/actions/payments";
import { inputDate } from "@/lib/format";
import { PAYMENT_METHODS, PAYMENT_METHOD_LABEL } from "@/lib/constants";
import { RecordForm } from "@/components/odoo/record-form";
import { FormRow } from "@/components/forms/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";

export function NewPaymentForm({ invoices, defaultInvoice }: { invoices: { id: string; due: number; label: string }[]; defaultInvoice?: string }) {
  const [invoiceId, setInvoiceId] = useState(defaultInvoice ?? "");
  const [amount, setAmount] = useState(invoices.find((i) => i.id === defaultInvoice)?.due ?? 0);
  return (
    <RecordForm action={recordPayment} backHref="/payments" breadcrumbs={[{ label: "Payments", href: "/payments" }, { label: "New" }]}>
      {(e) => (
        <div className="max-w-2xl">
          <h1 className="mb-4 text-2xl font-semibold">Register Payment</h1>
          <FormRow label="Invoice" htmlFor="invoiceId" error={e.invoiceId} required>
            <NativeSelect
              id="invoiceId"
              name="invoiceId"
              value={invoiceId}
              onChange={(ev) => {
                setInvoiceId(ev.target.value);
                setAmount(invoices.find((i) => i.id === ev.target.value)?.due ?? 0);
              }}
            >
              <option value="">Select an outstanding invoice…</option>
              {invoices.map((i) => <option key={i.id} value={i.id}>{i.label}</option>)}
            </NativeSelect>
          </FormRow>
          <FormRow label="Payment Method" htmlFor="method" error={e.method}>
            <NativeSelect id="method" name="method" defaultValue="BANK_TRANSFER">
              {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{PAYMENT_METHOD_LABEL[m]}</option>)}
            </NativeSelect>
          </FormRow>
          <FormRow label="Amount" htmlFor="amount" error={e.amount} required>
            <Input id="amount" name="amount" type="number" step="0.01" min="0.01" value={amount} onChange={(ev) => setAmount(Number(ev.target.value))} />
          </FormRow>
          <FormRow label="Payment Date" htmlFor="date" error={e.date} required>
            <Input id="date" name="date" type="date" defaultValue={inputDate(new Date())} />
          </FormRow>
          <FormRow label="Note" htmlFor="note">
            <Textarea id="note" name="note" placeholder="Bank reference, cheque number…" />
          </FormRow>
        </div>
      )}
    </RecordForm>
  );
}
