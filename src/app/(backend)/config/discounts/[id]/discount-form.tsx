"use client";

import { useState } from "react";
import type { Discount } from "@prisma/client";
import { Archive, ArchiveRestore } from "lucide-react";
import type { ActionState } from "@/lib/action";
import { DISCOUNT_SCOPES, DISCOUNT_SCOPE_LABEL } from "@/lib/constants";
import { inputDate } from "@/lib/format";
import { RecordForm, type FormAction } from "@/components/odoo/record-form";
import { ActionButton } from "@/components/odoo/action-button";
import { ActiveBadge } from "@/components/odoo/status-badge";
import { FormRow } from "@/components/forms/field";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Checkbox } from "@/components/ui/checkbox";

export function DiscountForm({
  discount,
  products,
  readOnly,
  save,
  toggle,
}: {
  discount: (Discount & { products: { id: string }[] }) | null;
  products: { id: string; name: string }[];
  readOnly: boolean;
  save: FormAction;
  toggle?: () => Promise<ActionState>;
}) {
  const [scope, setScope] = useState(discount?.appliesTo ?? "SUBSCRIPTION");
  const selected = new Set(discount?.products.map((p) => p.id));

  return (
    <RecordForm
      action={save}
      readOnly={readOnly}
      backHref="/config/discounts"
      breadcrumbs={[
        { label: "Discounts", href: "/config/discounts" },
        { label: discount?.name ?? "New" },
      ]}
      header={
        discount && (
          <>
            <div>
              {!readOnly && toggle && (
                <ActionButton variant="secondary" action={toggle}>
                  {discount.active ? (
                    <>
                      <Archive /> Archive
                    </>
                  ) : (
                    <>
                      <ArchiveRestore /> Unarchive
                    </>
                  )}
                </ActionButton>
              )}
            </div>
            <div className="flex items-center gap-3 text-[13px] text-muted-foreground">
              <span>
                Used{" "}
                <b className="text-foreground tabular-nums">
                  {discount.usedCount}
                </b>
                {discount.usageLimit !== null && ` of ${discount.usageLimit}`}{" "}
                times
              </span>
              <ActiveBadge active={discount.active} />
            </div>
          </>
        )
      }
    >
      {(e) => (
        <>
          {readOnly && (
            <div className="mb-4 rounded-sm border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Only administrators can create or change discount rules.
            </div>
          )}
          <Input
            name="name"
            defaultValue={discount?.name}
            placeholder="e.g. Bulk seats 10%"
            required
            aria-label="Discount name"
            className="mb-1 h-11 border-0 border-b px-0 text-2xl font-semibold shadow-none focus-visible:ring-0"
          />
          {e.name && <p className="text-xs text-destructive">{e.name}</p>}
          <div className="mt-4 grid gap-x-10 md:grid-cols-2">
            <div>
              <FormRow
                label="Discount"
                htmlFor="value"
                error={e.value ?? e.type}
              >
                <div className="flex gap-2">
                  <Input
                    id="value"
                    name="value"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={discount?.value ?? 10}
                    className="w-28"
                  />
                  <NativeSelect
                    name="type"
                    defaultValue={discount?.type ?? "PERCENT"}
                    aria-label="Discount type"
                  >
                    <option value="PERCENT">Percentage (%)</option>
                    <option value="FIXED">Fixed amount (₹)</option>
                  </NativeSelect>
                </div>
              </FormRow>
              <FormRow
                label="Applies To"
                htmlFor="appliesTo"
                error={e.appliesTo}
              >
                <NativeSelect
                  id="appliesTo"
                  name="appliesTo"
                  value={scope}
                  onChange={(ev) => setScope(ev.target.value)}
                >
                  {DISCOUNT_SCOPES.map((s) => (
                    <option key={s} value={s}>
                      {DISCOUNT_SCOPE_LABEL[s]}
                    </option>
                  ))}
                </NativeSelect>
              </FormRow>
              <FormRow
                label="Usage Limit"
                htmlFor="usageLimit"
                error={e.usageLimit}
              >
                <Input
                  id="usageLimit"
                  name="usageLimit"
                  type="number"
                  min="1"
                  placeholder="Unlimited"
                  defaultValue={discount?.usageLimit ?? ""}
                />
              </FormRow>
            </div>
            <div>
              <FormRow
                label="Minimum Purchase"
                htmlFor="minPurchase"
                error={e.minPurchase}
              >
                <Input
                  id="minPurchase"
                  name="minPurchase"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={discount?.minPurchase ?? 0}
                />
              </FormRow>
              <FormRow
                label="Minimum Quantity"
                htmlFor="minQuantity"
                error={e.minQuantity}
              >
                <Input
                  id="minQuantity"
                  name="minQuantity"
                  type="number"
                  min="0"
                  defaultValue={discount?.minQuantity ?? 0}
                />
              </FormRow>
              <FormRow
                label="Start Date"
                htmlFor="startDate"
                error={e.startDate}
              >
                <Input
                  id="startDate"
                  name="startDate"
                  type="date"
                  defaultValue={inputDate(discount?.startDate)}
                />
              </FormRow>
              <FormRow label="End Date" htmlFor="endDate" error={e.endDate}>
                <Input
                  id="endDate"
                  name="endDate"
                  type="date"
                  defaultValue={inputDate(discount?.endDate)}
                />
              </FormRow>
            </div>
          </div>
          {scope === "PRODUCTS" && (
            <>
              <Separator label="Products" />
              {e.productIds && (
                <p className="mb-2 text-xs text-destructive">{e.productIds}</p>
              )}
              <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
                {products.map((p) => (
                  <label
                    key={p.id}
                    className="flex items-center gap-2 text-[13px]"
                  >
                    <Checkbox
                      name="productIds"
                      value={p.id}
                      defaultChecked={selected.has(p.id)}
                    />{" "}
                    {p.name}
                  </label>
                ))}
              </div>
            </>
          )}
          <p className="mt-6 text-xs text-muted-foreground">
            Running discounts are applied automatically to the next invoices
            whose lines meet the conditions, and stop once they expire or reach
            their usage limit.
          </p>
        </>
      )}
    </RecordForm>
  );
}
