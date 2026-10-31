"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { initialState } from "@/lib/action";
import type { FormAction } from "@/components/odoo/record-form";
import { Field } from "@/components/forms/field";
import { SubmitButton } from "@/components/forms/submit-button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

/** Editable header fields while an invoice is still a draft. */
export function DraftFields({ action, invoiceDate, dueDate, notes }: { action: FormAction; invoiceDate: string; dueDate: string; notes: string }) {
  const [state, formAction] = useActionState(action, initialState);
  useEffect(() => {
    if (state.message) toast.success(state.message);
    if (state.error) toast.error(state.error);
  }, [state]);
  const fe = state.fieldErrors ?? {};
  return (
    <form action={formAction} className="no-print mb-4 grid gap-3 rounded-sm border border-dashed bg-muted/40 p-3 sm:grid-cols-[1fr_1fr_2fr_auto] sm:items-end">
      <Field label="Invoice Date" htmlFor="invoiceDate" error={fe.invoiceDate}>
        <Input id="invoiceDate" name="invoiceDate" type="date" defaultValue={invoiceDate} />
      </Field>
      <Field label="Due Date" htmlFor="dueDate" error={fe.dueDate}>
        <Input id="dueDate" name="dueDate" type="date" defaultValue={dueDate} />
      </Field>
      <Field label="Notes" htmlFor="notes">
        <Textarea id="notes" name="notes" defaultValue={notes} className="min-h-8" rows={1} />
      </Field>
      <SubmitButton size="sm" variant="secondary" pendingText="Saving…">Save</SubmitButton>
    </form>
  );
}
