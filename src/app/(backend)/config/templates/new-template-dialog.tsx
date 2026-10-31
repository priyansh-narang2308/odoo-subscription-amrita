"use client";

import { LayoutTemplate } from "lucide-react";
import { saveTemplate } from "@/actions/templates";
import { CreateDialog, FieldGrid } from "@/components/odoo/create-dialog";
import { Field } from "@/components/forms/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";

export function NewTemplateDialog({ plans }: { plans: { id: string; name: string }[] }) {
  return (
    <CreateDialog
      action={saveTemplate.bind(null, null)}
      icon={LayoutTemplate}
      title="New quotation template"
      description="Add the product lines on the next screen."
      submitLabel="Create & open"
    >
      {(e) => (
        <>
          <Field label="Template name" htmlFor="t-name" error={e.name} required>
            <Input id="t-name" name="name" placeholder="e.g. Startup bundle" required autoFocus />
          </Field>
          <FieldGrid>
            <Field label="Recurring plan" htmlFor="t-plan" error={e.planId}>
              <NativeSelect id="t-plan" name="planId" defaultValue="">
                <option value="">Any plan</option>
                {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </NativeSelect>
            </Field>
            <Field label="Quotation valid for (days)" htmlFor="t-valid" error={e.validityDays}>
              <Input id="t-valid" name="validityDays" type="number" min="1" defaultValue={30} />
            </Field>
          </FieldGrid>
          <Field label="Note" htmlFor="t-note">
            <Textarea id="t-note" name="note" placeholder="Shown on quotations created from this template" className="min-h-16" />
          </Field>
        </>
      )}
    </CreateDialog>
  );
}
