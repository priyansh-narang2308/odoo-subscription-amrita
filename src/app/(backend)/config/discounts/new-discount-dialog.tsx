"use client";

import { useState } from "react";
import { BadgePercent } from "lucide-react";
import { saveDiscount } from "@/actions/discounts";
import { DISCOUNT_SCOPES, DISCOUNT_SCOPE_LABEL } from "@/lib/constants";
import { CreateDialog, FieldGrid } from "@/components/odoo/create-dialog";
import { Field } from "@/components/forms/field";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";

export function NewDiscountDialog({ products }: { products: { id: string; name: string }[] }) {
  return (
    <CreateDialog
      action={saveDiscount.bind(null, null)}
      stay
      size="lg"
      icon={BadgePercent}
      title="New discount"
      description="Applied automatically to the next invoice of every subscription that qualifies."
      submitLabel="Create discount"
    >
      {(e) => <DiscountFields e={e} products={products} />}
    </CreateDialog>
  );
}

function DiscountFields({ e, products }: { e: Record<string, string>; products: { id: string; name: string }[] }) {
  const [type, setType] = useState("PERCENT");
  const [scope, setScope] = useState("SUBSCRIPTION");
  return (
    <>
      <FieldGrid>
        <Field label="Name" htmlFor="d-name" error={e.name} required className="sm:col-span-2">
          <Input id="d-name" name="name" placeholder="e.g. Loyal customer 10%" required autoFocus />
        </Field>
        <Field label="Discount type" htmlFor="d-type" error={e.type}>
          <NativeSelect id="d-type" name="type" value={type} onChange={(ev) => setType(ev.target.value)}>
            <option value="PERCENT">Percentage</option>
            <option value="FIXED">Fixed amount</option>
          </NativeSelect>
        </Field>
        <Field label={type === "PERCENT" ? "Value (%)" : "Value (₹)"} htmlFor="d-value" error={e.value} required>
          <Input id="d-value" name="value" type="number" step="0.01" min="0.01" max={type === "PERCENT" ? 100 : undefined} defaultValue={10} required />
        </Field>
        <Field label="Minimum purchase (₹)" htmlFor="d-minp" error={e.minPurchase}>
          <Input id="d-minp" name="minPurchase" type="number" step="0.01" min="0" defaultValue={0} />
        </Field>
        <Field label="Minimum quantity" htmlFor="d-minq" error={e.minQuantity}>
          <Input id="d-minq" name="minQuantity" type="number" min="0" defaultValue={0} />
        </Field>
        <Field label="Start date" htmlFor="d-start" error={e.startDate}>
          <Input id="d-start" name="startDate" type="date" />
        </Field>
        <Field label="End date" htmlFor="d-end" error={e.endDate}>
          <Input id="d-end" name="endDate" type="date" />
        </Field>
        <Field label="Usage limit" htmlFor="d-limit" error={e.usageLimit} hint="Leave empty for unlimited">
          <Input id="d-limit" name="usageLimit" type="number" min="1" placeholder="Unlimited" />
        </Field>
        <Field label="Applies to" htmlFor="d-scope" error={e.appliesTo}>
          <NativeSelect id="d-scope" name="appliesTo" value={scope} onChange={(ev) => setScope(ev.target.value)}>
            {DISCOUNT_SCOPES.map((s) => <option key={s} value={s}>{DISCOUNT_SCOPE_LABEL[s]}</option>)}
          </NativeSelect>
        </Field>
      </FieldGrid>
      {scope === "PRODUCTS" && (
        <Field label="Products" error={e.productIds} required>
          <div className="grid max-h-40 grid-cols-1 gap-1 overflow-y-auto rounded-lg border p-2 sm:grid-cols-2">
            {products.map((p) => (
              <label key={p.id} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-[13px] hover:bg-muted">
                <Checkbox name="productIds" value={p.id} /> {p.name}
              </label>
            ))}
          </div>
        </Field>
      )}
    </>
  );
}
