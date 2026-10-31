"use client";

import { CalendarClock } from "lucide-react";
import { savePlan } from "@/actions/plans";
import { BILLING_PERIODS, BILLING_PERIOD_LABEL } from "@/lib/constants";
import { CreateDialog, FieldGrid } from "@/components/odoo/create-dialog";
import { Field } from "@/components/forms/field";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";

const OPTIONS = [
  { key: "autoClose", label: "Closes automatically", hint: "At the expiration date", on: false },
  { key: "closable", label: "Closable", hint: "Can be closed early", on: true },
  { key: "pausable", label: "Pausable", hint: "Billing can be paused", on: false },
  { key: "renewable", label: "Renewable", hint: "Can be renewed", on: true },
];

export function NewPlanDialog() {
  return (
    <CreateDialog
      action={savePlan.bind(null, null)}
      stay
      size="lg"
      icon={CalendarClock}
      title="New recurring plan"
      description="How often subscriptions on this plan are billed, and what customers may do with them."
      submitLabel="Create plan"
    >
      {(e) => (
        <>
          <FieldGrid>
            <Field label="Plan name" htmlFor="plan-name" error={e.name} required>
              <Input id="plan-name" name="name" placeholder="e.g. Monthly" required autoFocus />
            </Field>
            <Field label="Price" htmlFor="plan-price" error={e.price}>
              <Input id="plan-price" name="price" type="number" step="0.01" min="0" defaultValue={0} />
            </Field>
            <Field label="Billing period" htmlFor="plan-interval" error={e.billingInterval ?? e.billingPeriod} required>
              <div className="flex gap-2">
                <Input id="plan-interval" name="billingInterval" type="number" min="1" max="36" defaultValue={1} className="w-20" aria-label="Interval" />
                <NativeSelect name="billingPeriod" defaultValue="MONTHLY" className="flex-1" aria-label="Period">
                  {BILLING_PERIODS.map((p) => <option key={p} value={p}>{BILLING_PERIOD_LABEL[p]}</option>)}
                </NativeSelect>
              </div>
            </Field>
            <Field label="Minimum quantity" htmlFor="plan-minq" error={e.minQuantity}>
              <Input id="plan-minq" name="minQuantity" type="number" min="1" defaultValue={1} />
            </Field>
            <Field label="Available from" htmlFor="plan-start" error={e.startDate}>
              <Input id="plan-start" name="startDate" type="date" />
            </Field>
            <Field label="Available until" htmlFor="plan-end" error={e.endDate}>
              <Input id="plan-end" name="endDate" type="date" />
            </Field>
          </FieldGrid>
          <fieldset>
            <legend className="mb-2 text-[13px] font-semibold">Options</legend>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {OPTIONS.map((o) => (
                <label key={o.key} className="flex cursor-pointer items-start gap-2.5 rounded-lg border p-3 transition-colors hover:bg-muted/60 has-[:checked]:border-primary/40 has-[:checked]:bg-accent/60">
                  <Checkbox name={o.key} defaultChecked={o.on} className="mt-0.5" />
                  <span>
                    <span className="block text-[13px] font-semibold">{o.label}</span>
                    <span className="block text-xs text-muted-foreground">{o.hint}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        </>
      )}
    </CreateDialog>
  );
}
