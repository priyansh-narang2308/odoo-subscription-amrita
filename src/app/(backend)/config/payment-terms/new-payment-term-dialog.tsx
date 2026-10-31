"use client";

import { Receipt } from "lucide-react";
import { savePaymentTerm } from "@/actions/payment-terms";
import { CreateDialog, FieldGrid } from "@/components/odoo/create-dialog";
import { Field } from "@/components/forms/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function NewPaymentTermDialog() {
  return (
    <CreateDialog
      action={savePaymentTerm.bind(null, null)}
      stay
      icon={Receipt}
      title="New payment term"
      description="Sets the due date of invoices that use it."
      submitLabel="Create term"
    >
      {(e) => (
        <>
          <FieldGrid>
            <Field label="Name" htmlFor="pt-name" error={e.name} required>
              <Input id="pt-name" name="name" placeholder="e.g. 15 Days" required autoFocus />
            </Field>
            <Field label="Due after (days)" htmlFor="pt-days" error={e.dueDays} required>
              <Input id="pt-days" name="dueDays" type="number" min="0" max="365" defaultValue={15} required />
            </Field>
          </FieldGrid>
          <Field label="Note on invoices" htmlFor="pt-note" error={e.note}>
            <Textarea id="pt-note" name="note" placeholder="e.g. Payment due within 15 days of the invoice date." className="min-h-16" />
          </Field>
        </>
      )}
    </CreateDialog>
  );
}
