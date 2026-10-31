"use client";

import type { QuotationTemplate, QuotationTemplateLine } from "@prisma/client";
import { Trash2 } from "lucide-react";
import type { ActionState } from "@/lib/action";
import type { CatalogProduct, CatalogTax } from "@/lib/catalog";
import { RecordForm, type FormAction } from "@/components/odoo/record-form";
import { ActionButton } from "@/components/odoo/action-button";
import { OrderLines } from "@/components/odoo/order-lines";
import { FormRow } from "@/components/forms/field";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";

type Template = QuotationTemplate & { lines: (QuotationTemplateLine & { taxes: { id: string }[] })[] };

export function TemplateForm({
  template,
  plans,
  catalog,
  readOnly,
  save,
  remove,
}: {
  template: Template | null;
  plans: { id: string; name: string }[];
  catalog: { products: CatalogProduct[]; taxes: CatalogTax[] };
  readOnly: boolean;
  save: FormAction;
  remove?: () => Promise<ActionState>;
}) {
  return (
    <RecordForm
      action={save}
      readOnly={readOnly}
      backHref="/config/templates"
      breadcrumbs={[{ label: "Quotation Templates", href: "/config/templates" }, { label: template?.name ?? "New" }]}
      header={remove && !readOnly && (
        <ActionButton variant="secondary" action={remove} confirm="Delete this quotation template?">
          <Trash2 /> Delete
        </ActionButton>
      )}
    >
      {(e) => (
        <>
          <Input
            name="name"
            defaultValue={template?.name}
            placeholder="e.g. Enterprise Yearly Bundle"
            required
            aria-label="Template name"
            className="mb-1 h-11 border-0 border-b px-0 text-2xl font-semibold shadow-none focus-visible:ring-0"
          />
          {e.name && <p className="text-xs text-destructive">{e.name}</p>}
          <div className="mt-4 grid gap-x-10 md:grid-cols-2">
            <FormRow label="Quotation Validity" htmlFor="validityDays">
              <div className="flex items-center gap-2">
                <Input id="validityDays" name="validityDays" type="number" min="1" className="w-24" defaultValue={template?.validityDays ?? 30} />
                <span className="text-[13px] text-muted-foreground">days</span>
              </div>
            </FormRow>
            <FormRow label="Recurring Plan" htmlFor="planId">
              <NativeSelect id="planId" name="planId" defaultValue={template?.planId ?? ""}>
                <option value="">—</option>
                {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </NativeSelect>
            </FormRow>
          </div>
          <Separator label="Lines" />
          <OrderLines
            mode="template"
            readOnly={readOnly}
            products={catalog.products}
            taxes={catalog.taxes}
            initial={
              template?.lines.map((l) => ({
                key: l.id,
                productId: l.productId,
                variantId: l.variantId,
                description: l.description ?? "",
                quantity: l.quantity,
                unitPrice: 0,
                taxIds: l.taxes.map((t) => t.id),
              })) ?? []
            }
          />
          <Separator label="Terms & Conditions" />
          <Textarea name="note" defaultValue={template?.note ?? ""} placeholder="Shown on quotations created from this template" />
        </>
      )}
    </RecordForm>
  );
}
