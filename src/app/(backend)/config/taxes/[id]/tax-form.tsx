"use client";

import type { Tax } from "@prisma/client";
import { Archive, ArchiveRestore } from "lucide-react";
import type { ActionState } from "@/lib/action";
import { RecordForm, type FormAction } from "@/components/odoo/record-form";
import { ActionButton } from "@/components/odoo/action-button";
import { ActiveBadge } from "@/components/odoo/status-badge";
import { FormRow } from "@/components/forms/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";

export function TaxForm({
  tax,
  readOnly,
  save,
  toggle,
}: {
  tax: Tax | null;
  readOnly: boolean;
  save: FormAction;
  toggle?: () => Promise<ActionState>;
}) {
  return (
    <RecordForm
      action={save}
      readOnly={readOnly}
      backHref="/config/taxes"
      breadcrumbs={[{ label: "Taxes", href: "/config/taxes" }, { label: tax?.name ?? "New" }]}
      header={
        tax && (
          <>
            <div>{!readOnly && toggle && (
              <ActionButton variant="secondary" action={toggle}>
                {tax.active ? <><Archive /> Archive</> : <><ArchiveRestore /> Unarchive</>}
              </ActionButton>
            )}</div>
            <ActiveBadge active={tax.active} />
          </>
        )
      }
    >
      {(e) => (
        <div className="max-w-xl">
          <FormRow label="Tax Name" htmlFor="name" error={e.name} required>
            <Input id="name" name="name" defaultValue={tax?.name} placeholder="e.g. GST 18%" required />
          </FormRow>
          <FormRow label="Tax Computation" htmlFor="type" error={e.type}>
            <NativeSelect id="type" name="type" defaultValue={tax?.type ?? "PERCENT"}>
              <option value="PERCENT">Percentage of price</option>
              <option value="FIXED">Fixed amount per unit</option>
            </NativeSelect>
          </FormRow>
          <FormRow label="Amount" htmlFor="amount" error={e.amount} required>
            <Input id="amount" name="amount" type="number" step="0.01" min="0" defaultValue={tax?.amount ?? 0} required />
          </FormRow>
        </div>
      )}
    </RecordForm>
  );
}
