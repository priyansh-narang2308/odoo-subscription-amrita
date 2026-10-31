// Pure pricing & period helpers — safe to import from client components.
import { round2 } from "@/lib/utils";

// ─── Periods ───────────────────────────────────────────────────

export function addPeriod(from: Date, period: string, interval = 1) {
  const d = new Date(from);
  switch (period) {
    case "DAILY":
      d.setDate(d.getDate() + interval);
      break;
    case "WEEKLY":
      d.setDate(d.getDate() + 7 * interval);
      break;
    case "YEARLY":
      d.setFullYear(d.getFullYear() + interval);
      break;
    default: {
      // Monthly: clamp to month end (31 Jan + 1 month => 28/29 Feb)
      const day = d.getDate();
      d.setDate(1);
      d.setMonth(d.getMonth() + interval);
      const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      d.setDate(Math.min(day, last));
    }
  }
  return d;
}

export function addDays(from: Date, days: number) {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d;
}

/** Factor that converts one billing period's amount into a monthly amount (for MRR). */
export function monthlyFactor(period: string, interval = 1) {
  const i = Math.max(1, interval);
  switch (period) {
    case "DAILY":
      return 30 / i;
    case "WEEKLY":
      return 52 / 12 / i;
    case "YEARLY":
      return 1 / (12 * i);
    default:
      return 1 / i;
  }
}

// ─── Line, tax & discount computation ─────────────────────────

export type CalcTax = { id: string; name: string; type: string; amount: number };
export type CalcLine = {
  productId: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  taxes: CalcTax[];
};
export type CalcDiscount = {
  id: string;
  name: string;
  type: string;
  value: number;
  minPurchase: number;
  minQuantity: number;
  appliesTo: string;
  productIds: string[];
};

export type ComputedLine = CalcLine & {
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  taxLabel: string | null;
};

export type Totals = {
  lines: ComputedLine[];
  untaxed: number;
  discount: number;
  tax: number;
  total: number;
  applied: { id: string; name: string; amount: number }[];
};

export function taxFor(base: number, quantity: number, tax: CalcTax) {
  return tax.type === "FIXED" ? tax.amount * quantity : (base * tax.amount) / 100;
}

/**
 * Computes line amounts. Discounts are evaluated in order against the lines
 * they cover (whole document or specific products), checked against their
 * minimum purchase / quantity and spread proportionally across those lines.
 * Taxes are applied after discounts.
 */
export function computeTotals(input: CalcLine[], discounts: CalcDiscount[] = []): Totals {
  const lines: ComputedLine[] = input.map((l) => ({
    ...l,
    subtotal: round2(l.quantity * l.unitPrice),
    discountAmount: 0,
    taxAmount: 0,
    total: 0,
    taxLabel: l.taxes.length ? l.taxes.map((t) => t.name).join(", ") : null,
  }));
  const applied: Totals["applied"] = [];

  for (const d of discounts) {
    const eligible =
      d.appliesTo === "PRODUCTS"
        ? lines.filter((l) => l.productId && d.productIds.includes(l.productId))
        : lines;
    if (!eligible.length) continue;
    const base = eligible.reduce((s, l) => s + (l.subtotal - l.discountAmount), 0);
    const qty = eligible.reduce((s, l) => s + l.quantity, 0);
    if (base <= 0 || base < d.minPurchase || qty < d.minQuantity) continue;

    const amount = round2(d.type === "PERCENT" ? (base * Math.min(d.value, 100)) / 100 : Math.min(d.value, base));
    if (amount <= 0) continue;

    let remaining = amount;
    eligible.forEach((l, i) => {
      const room = l.subtotal - l.discountAmount;
      const share = i === eligible.length - 1 ? remaining : round2((amount * room) / base);
      const take = Math.min(share, room);
      l.discountAmount = round2(l.discountAmount + take);
      remaining = round2(remaining - take);
    });
    applied.push({ id: d.id, name: d.name, amount });
  }

  for (const l of lines) {
    const base = l.subtotal - l.discountAmount;
    l.taxAmount = round2(l.taxes.reduce((s, t) => s + taxFor(base, l.quantity, t), 0));
    l.total = round2(base + l.taxAmount);
  }

  const untaxed = round2(lines.reduce((s, l) => s + l.subtotal, 0));
  const discount = round2(lines.reduce((s, l) => s + l.discountAmount, 0));
  const tax = round2(lines.reduce((s, l) => s + l.taxAmount, 0));
  return { lines, untaxed, discount, tax, total: round2(untaxed - discount + tax), applied };
}
