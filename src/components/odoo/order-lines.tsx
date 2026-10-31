"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { computeTotals } from "@/lib/pricing";
import { money } from "@/lib/format";
import type { CatalogProduct, CatalogTax } from "@/lib/catalog";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export type LineDraft = {
  key: string;
  productId: string | null;
  variantId: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  taxIds: string[];
};

function variantName(p: CatalogProduct, variantId: string | null) {
  const v = p.variants.find((x) => x.id === variantId);
  return v ? `${p.name} (${v.label.split(": ")[1]})` : p.name;
}

/**
 * Editable product lines. Serialises itself into a hidden `lines` input.
 * `mode="template"` hides prices and taxes (quotation templates).
 */
export function OrderLines({
  name = "lines",
  initial,
  products,
  taxes,
  mode = "order",
  readOnly,
  minQuantity = 1,
  onChange,
}: {
  name?: string;
  initial: LineDraft[];
  products: CatalogProduct[];
  taxes: CatalogTax[];
  mode?: "order" | "template";
  readOnly?: boolean;
  minQuantity?: number;
  onChange?: (lines: LineDraft[]) => void;
}) {
  const [lines, setLinesState] = useState<LineDraft[]>(initial);
  const setLines = (fn: (l: LineDraft[]) => LineDraft[]) =>
    setLinesState((prev) => {
      const next = fn(prev);
      onChange?.(next);
      return next;
    });
  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const taxById = useMemo(() => new Map(taxes.map((t) => [t.id, t])), [taxes]);
  const order = mode === "order";

  const patch = (key: string, p: Partial<LineDraft>) => setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...p } : l)));

  const pickProduct = (key: string, productId: string) => {
    const p = byId.get(productId);
    if (!p) return patch(key, { productId: null, variantId: null });
    const v = p.variants[0];
    patch(key, {
      productId,
      variantId: v?.id ?? null,
      description: variantName(p, v?.id ?? null),
      unitPrice: p.salesPrice + (v?.extraPrice ?? 0),
      taxIds: p.taxIds,
    });
  };
  const pickVariant = (key: string, line: LineDraft, variantId: string) => {
    const p = byId.get(line.productId ?? "");
    if (!p) return;
    const v = p.variants.find((x) => x.id === variantId);
    patch(key, { variantId: variantId || null, description: variantName(p, variantId || null), unitPrice: p.salesPrice + (v?.extraPrice ?? 0) });
  };

  const totals = computeTotals(
    lines.map((l) => ({
      productId: l.productId,
      description: l.description,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      taxes: l.taxIds.map((t) => taxById.get(t)).filter((t): t is CatalogTax => !!t),
    })),
  );

  const serialised = JSON.stringify(
    lines
      .filter((l) => l.productId || l.description.trim())
      .map(({ productId, variantId, description, quantity, unitPrice, taxIds }) => ({ productId, variantId, description, quantity, unitPrice, taxIds })),
  );

  return (
    <div>
      <input type="hidden" name={name} value={serialised} />
      <Table>
        <THead>
          <TR>
            <TH className="min-w-56">Product</TH>
            <TH className="min-w-44">Variant</TH>
            {order && <TH className="min-w-48">Description</TH>}
            <TH className="w-24 text-right">Quantity</TH>
            {order && <TH className="w-32 text-right">Unit Price</TH>}
            {order && <TH className="w-44">Taxes</TH>}
            {order && <TH className="w-32 text-right">Amount</TH>}
            {!readOnly && <TH className="w-8" />}
          </TR>
        </THead>
        <TBody>
          {lines.map((l, i) => {
            const p = l.productId ? byId.get(l.productId) : undefined;
            const computed = totals.lines[i]!;
            const belowMin = order && l.productId && l.quantity < minQuantity;
            return (
              <TR key={l.key} className="align-top">
                <TD>
                  {readOnly ? (
                    <span className="font-medium">{p?.name ?? l.description}</span>
                  ) : l.productId === null && l.description && order ? (
                    <span className="text-[13px] italic text-muted-foreground">Custom line</span>
                  ) : (
                    <NativeSelect value={l.productId ?? ""} onChange={(e) => pickProduct(l.key, e.target.value)} aria-label="Product">
                      <option value="">Select a product…</option>
                      {products.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                    </NativeSelect>
                  )}
                </TD>
                <TD>
                  {p && p.variants.length > 0 ? (
                    readOnly ? (
                      <span>{p.variants.find((v) => v.id === l.variantId)?.label ?? "—"}</span>
                    ) : (
                      <NativeSelect value={l.variantId ?? ""} onChange={(e) => pickVariant(l.key, l, e.target.value)} aria-label="Variant">
                        <option value="">No variant</option>
                        {p.variants.map((v) => (
                          <option key={v.id} value={v.id}>{v.label}{v.extraPrice ? ` (+${v.extraPrice})` : ""}</option>
                        ))}
                      </NativeSelect>
                    )
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TD>
                {order && (
                  <TD>
                    {readOnly ? l.description : (
                      <Input value={l.description} onChange={(e) => patch(l.key, { description: e.target.value })} aria-label="Description" />
                    )}
                  </TD>
                )}
                <TD className="text-right">
                  {readOnly ? <span className="tabular-nums">{l.quantity}</span> : (
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      value={l.quantity}
                      onChange={(e) => patch(l.key, { quantity: Number(e.target.value) })}
                      className={cn("text-right", belowMin && "border-amber-400")}
                      aria-label="Quantity"
                    />
                  )}
                  {belowMin && <p className="mt-0.5 text-[11px] text-amber-700">Plan minimum is {minQuantity}</p>}
                </TD>
                {order && (
                  <TD className="text-right">
                    {readOnly ? <span className="tabular-nums">{money(l.unitPrice)}</span> : (
                      <Input type="number" min="0" step="0.01" value={l.unitPrice} onChange={(e) => patch(l.key, { unitPrice: Number(e.target.value) })} className="text-right" aria-label="Unit price" />
                    )}
                  </TD>
                )}
                {order && (
                  <TD>
                    <TaxPicker
                      taxes={taxes}
                      value={l.taxIds}
                      readOnly={readOnly}
                      onChange={(taxIds) => patch(l.key, { taxIds })}
                    />
                  </TD>
                )}
                {order && <TD className="pt-3.5 text-right font-medium tabular-nums">{money(computed.subtotal)}</TD>}
                {!readOnly && (
                  <TD className="pt-3.5">
                    <button type="button" onClick={() => setLines((ls) => ls.filter((x) => x.key !== l.key))} className="text-muted-foreground hover:text-destructive" aria-label="Remove line">
                      <Trash2 className="size-4" />
                    </button>
                  </TD>
                )}
              </TR>
            );
          })}
        </TBody>
      </Table>
      {!readOnly && (
        <div className="mt-2 flex gap-4 px-3">
          <button type="button" onClick={() => setLines((ls) => [...ls, newLine(minQuantity)])} className="flex items-center gap-1 text-[13px] text-primary hover:underline">
            <Plus className="size-4" /> Add a product
          </button>
          {order && (
            <button
              type="button"
              onClick={() => setLines((ls) => [...ls, { ...newLine(1), description: "Custom charge", unitPrice: 0 }])}
              className="flex items-center gap-1 text-[13px] text-primary hover:underline"
            >
              <Plus className="size-4" /> Add a custom line
            </button>
          )}
        </div>
      )}
      {lines.length === 0 && <p className="px-3 py-4 text-center text-[13px] text-muted-foreground">No lines yet.</p>}
      {order && (
        <div className="mt-4 flex justify-end">
          <dl className="w-72 space-y-1 text-[13px]">
            <div className="flex justify-between"><dt className="text-muted-foreground">Untaxed Amount</dt><dd className="tabular-nums">{money(totals.untaxed)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Taxes</dt><dd className="tabular-nums">{money(totals.tax)}</dd></div>
            <div className="flex justify-between border-t pt-1.5 text-[15px] font-bold"><dt>Total</dt><dd className="tabular-nums">{money(totals.total)}</dd></div>
          </dl>
        </div>
      )}
    </div>
  );
}

export function newLine(qty = 1): LineDraft {
  return { key: crypto.randomUUID(), productId: null, variantId: null, description: "", quantity: qty, unitPrice: 0, taxIds: [] };
}

function TaxPicker({
  taxes,
  value,
  onChange,
  readOnly,
}: {
  taxes: CatalogTax[];
  value: string[];
  onChange: (v: string[]) => void;
  readOnly?: boolean;
}) {
  const names = taxes.filter((t) => value.includes(t.id)).map((t) => t.name);
  const chips = names.length ? (
    <div className="flex flex-wrap gap-1">
      {names.map((n) => <span key={n} className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-700">{n}</span>)}
    </div>
  ) : (
    <span className="text-muted-foreground">No tax</span>
  );
  if (readOnly) return <div className="pt-1.5">{chips}</div>;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex min-h-8 w-full items-center rounded-sm border border-input bg-card px-2 py-1 text-left text-[13px] hover:bg-muted">
        {chips}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {taxes.map((t) => (
          <label key={t.id} className="flex cursor-pointer items-center gap-2 rounded-sm px-2.5 py-1.5 text-[13px] hover:bg-muted">
            <input
              type="checkbox"
              className="accent-primary"
              checked={value.includes(t.id)}
              onChange={(e) => onChange(e.target.checked ? [...value, t.id] : value.filter((x) => x !== t.id))}
            />
            {t.name}
          </label>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
