"use client";

import type { PaymentTerm } from "@prisma/client";
import { Trash2 } from "lucide-react";
import type { ActionState } from "@/lib/action";
import { RecordForm, type FormAction } from "@/components/odoo/record-form";
import { ActionButton } from "@/components/odoo/action-button";
import { FormRow } from "@/components/forms/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function PaymentTermForm({
  term,
  readOnly,
  save,
  remove,
}: {
  term: PaymentTerm | null;
  readOnly: boolean;
  save: FormAction;
  remove?: () => Promise<ActionState>;
}) {
  return (
    <RecordForm
      action={save}
      readOnly={readOnly}
      backHref="/config/payment-terms"
      breadcrumbs={[{ label: "Payment Terms", href: "/config/payment-terms" }, { label: term?.name ?? "New" }]}
      header={remove && !readOnly && (
        <ActionButton variant="secondary" action={remove} confirm="Delete this payment term?">
          <Trash2 /> Delete
        </ActionButton>
      )}
    >
      {(e) => (
        <div className="max-w-xl">
          <FormRow label="Payment Term" htmlFor="name" error={e.name} required>
            <Input id="name" name="name" defaultValue={term?.name} placeholder="e.g. 30 Days" required />
          </FormRow>
          <FormRow label="Due After (days)" htmlFor="dueDays" error={e.dueDays}>
            <Input id="dueDays" name="dueDays" type="number" min="0" max="365" defaultValue={term?.dueDays ?? 0} />
          </FormRow>
          <FormRow label="Description on Invoice" htmlFor="note" error={e.note}>
            <Textarea id="note" name="note" defaultValue={term?.note ?? ""} />
          </FormRow>
        </div>
      )}
    </RecordForm>
  );
}
