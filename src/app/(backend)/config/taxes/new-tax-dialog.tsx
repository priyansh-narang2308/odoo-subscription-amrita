"use client";

import { Landmark } from "lucide-react";
import { saveTax } from "@/actions/taxes";
import { CreateDialog, FieldGrid } from "@/components/odoo/create-dialog";
import { Field } from "@/components/forms/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";

export function NewTaxDialog() {
  return (
    <CreateDialog
      action={saveTax.bind(null, null)}
      stay
      icon={Landmark}
      title="New tax"
      description="Taxes are applied per invoice line using these rules."
      submitLabel="Create tax"
    >
      {(e) => (
        <>
          <Field label="Tax name" htmlFor="tax-name" error={e.name} required>
            <Input id="tax-name" name="name" placeholder="e.g. GST 18%" required autoFocus />
          </Field>
          <FieldGrid>
            <Field label="Computation" htmlFor="tax-type" error={e.type}>
              <NativeSelect id="tax-type" name="type" defaultValue="PERCENT">
                <option value="PERCENT">Percentage of price</option>
                <option value="FIXED">Fixed amount per unit</option>
              </NativeSelect>
            </Field>
            <Field label="Amount" htmlFor="tax-amount" error={e.amount} required>
              <Input id="tax-amount" name="amount" type="number" step="0.01" min="0" defaultValue={18} required />
            </Field>
          </FieldGrid>
        </>
      )}
    </CreateDialog>
  );
}
