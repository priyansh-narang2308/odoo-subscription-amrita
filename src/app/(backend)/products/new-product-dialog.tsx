"use client";

import { Package } from "lucide-react";
import { saveProduct } from "@/actions/products";
import { PRODUCT_TYPES, PRODUCT_TYPE_LABEL } from "@/lib/constants";
import { CreateDialog, FieldGrid } from "@/components/odoo/create-dialog";
import { Field } from "@/components/forms/field";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";

export function NewProductDialog({ taxes }: { taxes: { id: string; name: string }[] }) {
  return (
    <CreateDialog
      action={saveProduct.bind(null, null)}
      size="lg"
      icon={Package}
      title="New product"
      description="You can add variants with price extras on the product page next."
      submitLabel="Create & open"
    >
      {(e) => (
        <>
          <FieldGrid>
            <Field label="Product name" htmlFor="pr-name" error={e.name} required className="sm:col-span-2">
              <Input id="pr-name" name="name" placeholder="e.g. CRM (per seat)" required autoFocus />
            </Field>
            <Field label="Product type" htmlFor="pr-type" error={e.type}>
              <NativeSelect id="pr-type" name="type" defaultValue="SERVICE">
                {PRODUCT_TYPES.map((t) => <option key={t} value={t}>{PRODUCT_TYPE_LABEL[t]}</option>)}
              </NativeSelect>
            </Field>
            <Field label="Sales price (₹)" htmlFor="pr-sale" error={e.salesPrice} required>
              <Input id="pr-sale" name="salesPrice" type="number" step="0.01" min="0" defaultValue={0} required />
            </Field>
            <Field label="Cost price (₹)" htmlFor="pr-cost" error={e.costPrice}>
              <Input id="pr-cost" name="costPrice" type="number" step="0.01" min="0" defaultValue={0} />
            </Field>
            <Field label="Taxes">
              <div className="flex min-h-8 flex-wrap items-center gap-x-4 gap-y-1.5">
                {taxes.map((t, i) => (
                  <label key={t.id} className="flex cursor-pointer items-center gap-2 text-[13px]">
                    <Checkbox name="taxIds" value={t.id} defaultChecked={i === 0} /> {t.name}
                  </label>
                ))}
              </div>
            </Field>
          </FieldGrid>
          <Field label="Internal notes" htmlFor="pr-notes" error={e.notes}>
            <Textarea id="pr-notes" name="notes" className="min-h-16" />
          </Field>
        </>
      )}
    </CreateDialog>
  );
}
