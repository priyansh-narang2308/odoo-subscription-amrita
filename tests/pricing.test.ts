// Pure rules from the brief: password policy, billing periods, taxes and discounts.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { passwordSchema } from "@/lib/auth/password";
import { addPeriod, computeTotals, type CalcDiscount, type CalcLine } from "@/lib/pricing";

const gst = { id: "t1", name: "GST 18%", type: "PERCENT", amount: 18 };
const line = (productId: string, quantity: number, unitPrice: number, taxes = [gst]): CalcLine => ({
  productId, description: productId, quantity, unitPrice, taxes,
});
const discount = (over: Partial<CalcDiscount>): CalcDiscount => ({
  id: "d1", name: "Promo", type: "PERCENT", value: 10, minPurchase: 0, minQuantity: 0, appliesTo: "SUBSCRIPTION", productIds: [], ...over,
});

describe("password policy", () => {
  it("accepts more than eight characters with upper, lower and special", () => {
    assert.ok(passwordSchema.safeParse("Brightl00p!").success);
  });
  it("rejects exactly eight characters", () => {
    assert.ok(!passwordSchema.safeParse("Bright!a").success);
  });
  for (const [why, pw] of [["no uppercase", "brightloop!"], ["no lowercase", "BRIGHTLOOP!"], ["no special", "Brightloop1"]]) {
    it(`rejects a password with ${why}`, () => assert.ok(!passwordSchema.safeParse(pw).success));
  }
});

describe("billing periods", () => {
  it("adds daily, weekly and yearly periods", () => {
    const d = new Date(2026, 0, 10);
    assert.equal(addPeriod(d, "DAILY").getDate(), 11);
    assert.equal(addPeriod(d, "WEEKLY").getDate(), 17);
    assert.equal(addPeriod(d, "YEARLY").getFullYear(), 2027);
  });
  it("clamps monthly billing to the end of a shorter month", () => {
    const next = addPeriod(new Date(2026, 0, 31), "MONTHLY");
    assert.deepEqual([next.getMonth(), next.getDate()], [1, 28]);
  });
});

describe("taxes", () => {
  it("applies percentage and fixed taxes per line", () => {
    const fixed = { id: "t2", name: "Cess", type: "FIXED", amount: 5 };
    const t = computeTotals([line("a", 2, 1000, [gst, fixed])]);
    assert.equal(t.untaxed, 2000);
    assert.equal(t.tax, 360 + 10);
    assert.equal(t.total, 2370);
  });
});

describe("discounts", () => {
  it("takes a percentage off the whole subscription before tax", () => {
    const t = computeTotals([line("a", 1, 1000), line("b", 1, 1000)], [discount({ value: 10 })]);
    assert.equal(t.discount, 200);
    assert.equal(t.tax, 324); // 18% of 1800
    assert.equal(t.total, 2124);
    assert.deepEqual(t.applied.map((a) => a.amount), [200]);
  });
  it("limits a product discount to that product's lines", () => {
    const t = computeTotals([line("a", 1, 1000), line("b", 1, 1000)], [discount({ appliesTo: "PRODUCTS", productIds: ["b"] })]);
    assert.deepEqual(t.lines.map((l) => l.discountAmount), [0, 100]);
  });
  it("needs the minimum quantity and minimum purchase", () => {
    assert.equal(computeTotals([line("a", 2, 1000)], [discount({ minQuantity: 5 })]).discount, 0);
    assert.equal(computeTotals([line("a", 2, 1000)], [discount({ minPurchase: 5000 })]).discount, 0);
    assert.equal(computeTotals([line("a", 5, 1000)], [discount({ minQuantity: 5 })]).discount, 500);
  });
  it("never lets a fixed discount exceed the amount", () => {
    const t = computeTotals([line("a", 1, 300)], [discount({ type: "FIXED", value: 1000 })]);
    assert.equal(t.discount, 300);
    assert.equal(t.total, 0);
  });
});
