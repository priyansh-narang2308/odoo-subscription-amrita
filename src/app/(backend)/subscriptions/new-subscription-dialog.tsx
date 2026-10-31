"use client";

import { useState } from "react";
import { RefreshCcw } from "lucide-react";
import { saveSubscription } from "@/actions/subscriptions";
import { inputDate } from "@/lib/format";
import { CreateDialog, FieldGrid } from "@/components/odoo/create-dialog";
import { Field } from "@/components/forms/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";

type Option = { id: string; name: string };
export type NewSubscriptionOptions = {
  customers: Option[];
  plans: (Option & { label: string })[];
  templates: (Option & { planId: string | null })[];
  terms: Option[];
};

export function NewSubscriptionDialog({ options, triggerLabel }: { options: NewSubscriptionOptions; triggerLabel?: string }) {
  return (
    <CreateDialog
      action={saveSubscription.bind(null, null)}
      size="lg"
      icon={RefreshCcw}
      title="New subscription"
      description="Creates a draft. Pick a quotation template to fill in the product lines for you."
      submitLabel="Create & open"
      triggerLabel={triggerLabel}
    >
      {(e) => <SubscriptionFields e={e} options={options} />}
    </CreateDialog>
  );
}

function SubscriptionFields({ e, options }: { e: Record<string, string>; options: NewSubscriptionOptions }) {
  const [templateId, setTemplateId] = useState("");
  const [planId, setPlanId] = useState(options.plans[0]?.id ?? "");

  return (
    <FieldGrid>
      <Field label="Customer" htmlFor="s-customer" error={e.customerId} required className="sm:col-span-2">
        <NativeSelect id="s-customer" name="customerId" defaultValue="" required autoFocus>
          <option value="" disabled>
            Select a customer…
          </option>
          {options.customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </NativeSelect>
      </Field>
      <Field label="Quotation template" htmlFor="s-template" error={e.templateId} hint="Optional — adds its products and plan">
        <NativeSelect
          id="s-template"
          name="templateId"
          value={templateId}
          onChange={(ev) => {
            setTemplateId(ev.target.value);
            const t = options.templates.find((x) => x.id === ev.target.value);
            if (t?.planId && options.plans.some((p) => p.id === t.planId)) setPlanId(t.planId);
          }}
        >
          <option value="">No template</option>
          {options.templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </NativeSelect>
      </Field>
      <Field label="Recurring plan" htmlFor="s-plan" error={e.planId} required>
        <NativeSelect id="s-plan" name="planId" value={planId} onChange={(ev) => setPlanId(ev.target.value)} required>
          {options.plans.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.label}</option>)}
        </NativeSelect>
      </Field>
      <Field label="Start date" htmlFor="s-start" error={e.startDate} required>
        <Input id="s-start" name="startDate" type="date" defaultValue={inputDate(new Date())} required />
      </Field>
      <Field label="Expiration date" htmlFor="s-end" error={e.expirationDate} hint="Leave empty for no end date">
        <Input id="s-end" name="expirationDate" type="date" />
      </Field>
      <Field label="Payment terms" htmlFor="s-terms" error={e.paymentTermId} className="sm:col-span-2">
        <NativeSelect id="s-terms" name="paymentTermId" defaultValue={options.terms[0]?.id ?? ""}>
          <option value="">No payment terms</option>
          {options.terms.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </NativeSelect>
      </Field>
    </FieldGrid>
  );
}
