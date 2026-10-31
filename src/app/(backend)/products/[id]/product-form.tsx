"use client";

import { useState } from "react";
import type { AttributeValue, Product, ProductAttribute, ProductVariant, Tax } from "@prisma/client";
import { Archive, ArchiveRestore, Plus, Trash2 } from "lucide-react";
import type { ActionState } from "@/lib/action";
import { PRODUCT_TYPES, PRODUCT_TYPE_LABEL } from "@/lib/constants";
import { money } from "@/lib/format";
import { RecordForm, type FormAction } from "@/components/odoo/record-form";
import { ActionButton } from "@/components/odoo/action-button";
import { ActiveBadge } from "@/components/odoo/status-badge";
import { FormRow } from "@/components/forms/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";

type FullProduct = Product & {
  taxes: { id: string }[];
  variants: (ProductVariant & { attributeValue: AttributeValue })[];
  _count: { subscriptionLines: number };
};
type Attr = ProductAttribute & { values: AttributeValue[] };
type VariantRow = { key: string; attributeValueId: string; extraPrice: number };

export function ProductForm({
  product,
  taxes,
  attributes,
  readOnly,
  save,
  toggle,
  aside,
}: {
  product: FullProduct | null;
  taxes: Tax[];
  attributes: Attr[];
  readOnly: boolean;
  save: FormAction;
  toggle?: () => Promise<ActionState>;
  aside?: React.ReactNode;
}) {
  const [salesPrice, setSalesPrice] = useState(product?.salesPrice ?? 0);
  const [variants, setVariants] = useState<VariantRow[]>(
    product?.variants.map((v) => ({ key: v.id, attributeValueId: v.attributeValueId, extraPrice: v.extraPrice })) ?? [],
  );
  const allValues = attributes.flatMap((a) => a.values.map((v) => ({ ...v, attribute: a.name })));
  const taxIds = new Set(product?.taxes.map((t) => t.id) ?? (taxes[0] ? [taxes[0].id] : []));

  const setVariant = (key: string, patch: Partial<VariantRow>) =>
    setVariants((rows) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  return (
    <RecordForm
      action={save}
      readOnly={readOnly}
      backHref="/products"
      breadcrumbs={[{ label: "Products", href: "/products" }, { label: product?.name ?? "New" }]}
      aside={aside}
      header={product && (
        <>
          <div>{!readOnly && toggle && (
            <ActionButton variant="secondary" action={toggle}>
              {product.active ? <><Archive /> Archive</> : <><ArchiveRestore /> Unarchive</>}
            </ActionButton>
          )}</div>
          <div className="flex items-center gap-3 text-[13px] text-muted-foreground">
            <span><b className="text-foreground tabular-nums">{product._count.subscriptionLines}</b> running subscription lines</span>
            <ActiveBadge active={product.active} />
          </div>
        </>
      )}
    >
      {(e) => (
        <>
          <input type="hidden" name="variants" value={JSON.stringify(variants.map(({ attributeValueId, extraPrice }) => ({ attributeValueId, extraPrice })))} />
          <label className="text-xs text-muted-foreground" htmlFor="name">Product Name</label>
          <Input
            id="name"
            name="name"
            defaultValue={product?.name}
            placeholder="e.g. Brightloop CRM"
            required
            className="mb-1 h-11 border-0 border-b px-0 text-2xl font-semibold shadow-none focus-visible:ring-0"
          />
          {e.name && <p className="text-xs text-destructive">{e.name}</p>}

          <Tabs defaultValue="general" className="mt-4">
            <TabsList>
              <TabsTrigger value="general">General Information</TabsTrigger>
              <TabsTrigger value="variants">Variants {variants.length > 0 && `(${variants.length})`}</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>
            <TabsContent value="general" forceMount className="data-[state=inactive]:hidden">
              <div className="grid gap-x-10 md:grid-cols-2">
                <div>
                  <FormRow label="Product Type" htmlFor="type" error={e.type}>
                    <NativeSelect id="type" name="type" defaultValue={product?.type ?? "SERVICE"}>
                      {PRODUCT_TYPES.map((t) => <option key={t} value={t}>{PRODUCT_TYPE_LABEL[t]}</option>)}
                    </NativeSelect>
                  </FormRow>
                  <FormRow label="Customer Taxes" error={e.taxIds}>
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 py-1">
                      {taxes.map((t) => (
                        <label key={t.id} className="flex items-center gap-1.5 text-[13px]">
                          <Checkbox name="taxIds" value={t.id} defaultChecked={taxIds.has(t.id)} /> {t.name}
                        </label>
                      ))}
                      {taxes.length === 0 && <span className="text-xs text-muted-foreground">No taxes configured</span>}
                    </div>
                  </FormRow>
                </div>
                <div>
                  <FormRow label="Sales Price" htmlFor="salesPrice" error={e.salesPrice}>
                    <Input id="salesPrice" name="salesPrice" type="number" step="0.01" min="0" value={salesPrice} onChange={(ev) => setSalesPrice(Number(ev.target.value))} />
                  </FormRow>
                  <FormRow label="Cost" htmlFor="costPrice" error={e.costPrice}>
                    <Input id="costPrice" name="costPrice" type="number" step="0.01" min="0" defaultValue={product?.costPrice ?? 0} />
                  </FormRow>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="variants" forceMount className="data-[state=inactive]:hidden">
              <p className="mb-3 text-xs text-muted-foreground">
                Each variant adds its extra price on top of the sales price when it is chosen on a subscription.
              </p>
              <Table>
                <THead><TR><TH>Attribute Value</TH><TH className="w-40 text-right">Extra Price</TH><TH className="w-40 text-right">Final Price</TH><TH className="w-10" /></TR></THead>
                <TBody>
                  {variants.map((v) => (
                    <TR key={v.key}>
                      <TD>
                        <NativeSelect
                          value={v.attributeValueId}
                          onChange={(ev) => {
                            const val = allValues.find((x) => x.id === ev.target.value);
                            setVariant(v.key, { attributeValueId: ev.target.value, extraPrice: val?.defaultExtra ?? v.extraPrice });
                          }}
                          aria-label="Attribute value"
                        >
                          <option value="">Select a value…</option>
                          {attributes.map((a) => (
                            <optgroup key={a.id} label={a.name}>
                              {a.values.map((val) => <option key={val.id} value={val.id}>{a.name}: {val.name}</option>)}
                            </optgroup>
                          ))}
                        </NativeSelect>
                      </TD>
                      <TD><Input type="number" step="0.01" min="0" className="text-right" value={v.extraPrice} onChange={(ev) => setVariant(v.key, { extraPrice: Number(ev.target.value) })} aria-label="Extra price" /></TD>
                      <TD className="text-right tabular-nums">{money(salesPrice + v.extraPrice)}</TD>
                      <TD>{!readOnly && (
                        <button type="button" onClick={() => setVariants((r) => r.filter((x) => x.key !== v.key))} className="text-muted-foreground hover:text-destructive" aria-label="Remove variant">
                          <Trash2 className="size-4" />
                        </button>
                      )}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => setVariants((r) => [...r, { key: crypto.randomUUID(), attributeValueId: "", extraPrice: 0 }])}
                  className="mt-2 flex items-center gap-1 px-3 text-[13px] text-primary hover:underline"
                  disabled={allValues.length === 0}
                >
                  <Plus className="size-4" /> Add a variant
                </button>
              )}
              {allValues.length === 0 && <p className="mt-2 text-xs text-muted-foreground">Create attributes first under Products → Attributes.</p>}
            </TabsContent>
            <TabsContent value="notes" forceMount className="data-[state=inactive]:hidden">
              <Textarea name="notes" defaultValue={product?.notes ?? ""} placeholder="Internal notes about this product…" className="min-h-32" />
            </TabsContent>
          </Tabs>
        </>
      )}
    </RecordForm>
  );
}
