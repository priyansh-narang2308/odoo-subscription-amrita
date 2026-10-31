"use client";

import Link from "next/link";
import type { RecurringPlan } from "@prisma/client";
import { Archive, ArchiveRestore, RefreshCcw } from "lucide-react";
import type { ActionState } from "@/lib/action";
import { BILLING_PERIODS, BILLING_PERIOD_LABEL } from "@/lib/constants";
import { inputDate } from "@/lib/format";
import { RecordForm, type FormAction } from "@/components/odoo/record-form";
import { ActionButton } from "@/components/odoo/action-button";
import { ActiveBadge } from "@/components/odoo/status-badge";
import { FormRow } from "@/components/forms/field";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Checkbox } from "@/components/ui/checkbox";

const OPTIONS = [
  { key: "autoClose", label: "Closes automatically", hint: "Subscription closes on its own at the expiration date" },
  { key: "closable", label: "Closable", hint: "Can be closed early by staff or the customer" },
  { key: "pausable", label: "Pausable", hint: "Billing can be paused and resumed" },
  { key: "renewable", label: "Renewable", hint: "Can be renewed into a new subscription" },
] as const;

export function PlanForm({
  plan,
  subscriptionCount,
  readOnly,
  save,
  toggle,
}: {
  plan: RecurringPlan | null;
  subscriptionCount: number;
  readOnly: boolean;
  save: FormAction;
  toggle?: () => Promise<ActionState>;
}) {
  return (
    <RecordForm
      action={save}
      readOnly={readOnly}
      backHref="/config/plans"
      breadcrumbs={[{ label: "Recurring Plans", href: "/config/plans" }, { label: plan?.name ?? "New" }]}
      header={plan && (
        <>
          <div>{!readOnly && toggle && (
            <ActionButton variant="secondary" action={toggle}>
              {plan.active ? <><Archive /> Archive</> : <><ArchiveRestore /> Unarchive</>}
            </ActionButton>
          )}</div>
          <ActiveBadge active={plan.active} />
        </>
      )}
    >
      {(e) => (
        <>
          {plan && (
            <div className="-mt-2 mb-4 flex justify-end">
              <Link href={`/subscriptions?plan=${plan.id}`} className="flex items-center gap-2 rounded-sm border px-3 py-1.5 text-[13px] hover:bg-muted">
                <RefreshCcw className="size-4 text-primary" />
                <span><b className="tabular-nums">{subscriptionCount}</b> Subscriptions</span>
              </Link>
            </div>
          )}
          <Input
            name="name"
            defaultValue={plan?.name}
            placeholder="e.g. Monthly"
            required
            aria-label="Plan name"
            className="mb-1 h-11 border-0 border-b px-0 text-2xl font-semibold shadow-none focus-visible:ring-0"
          />
          {e.name && <p className="text-xs text-destructive">{e.name}</p>}
          <div className="mt-4 grid gap-x-10 md:grid-cols-2">
            <div>
              <FormRow label="Price" htmlFor="price" error={e.price}>
                <Input id="price" name="price" type="number" step="0.01" min="0" defaultValue={plan?.price ?? 0} />
              </FormRow>
              <FormRow label="Billing Period" htmlFor="billingInterval" error={e.billingInterval ?? e.billingPeriod}>
                <div className="flex gap-2">
                  <Input id="billingInterval" name="billingInterval" type="number" min="1" className="w-20" defaultValue={plan?.billingInterval ?? 1} />
                  <NativeSelect name="billingPeriod" defaultValue={plan?.billingPeriod ?? "MONTHLY"} aria-label="Billing period">
                    {BILLING_PERIODS.map((p) => <option key={p} value={p}>{BILLING_PERIOD_LABEL[p]}</option>)}
                  </NativeSelect>
                </div>
              </FormRow>
              <FormRow label="Minimum Quantity" htmlFor="minQuantity" error={e.minQuantity}>
                <Input id="minQuantity" name="minQuantity" type="number" min="1" defaultValue={plan?.minQuantity ?? 1} />
              </FormRow>
            </div>
            <div>
              <FormRow label="Available From" htmlFor="startDate" error={e.startDate}>
                <Input id="startDate" name="startDate" type="date" defaultValue={inputDate(plan?.startDate)} />
              </FormRow>
              <FormRow label="Available Until" htmlFor="endDate" error={e.endDate}>
                <Input id="endDate" name="endDate" type="date" defaultValue={inputDate(plan?.endDate)} />
              </FormRow>
            </div>
          </div>
          <Separator label="Subscription Options" />
          <div className="grid gap-3 md:grid-cols-2">
            {OPTIONS.map((o) => (
              <label key={o.key} className="flex items-start gap-2.5 rounded-sm p-1">
                <Checkbox name={o.key} defaultChecked={plan ? plan[o.key] : o.key === "closable" || o.key === "renewable"} className="mt-0.5" />
                <span>
                  <span className="block text-[13px] font-semibold">{o.label}</span>
                  <span className="block text-xs text-muted-foreground">{o.hint}</span>
                </span>
              </label>
            ))}
          </div>
        </>
      )}
    </RecordForm>
  );
}
