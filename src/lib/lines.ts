import { z } from "zod";

export const lineInputSchema = z.object({
  productId: z.string().nullable(),
  variantId: z.string().nullable(),
  description: z.string().trim(),
  quantity: z.coerce.number().positive("Quantities must be greater than zero"),
  unitPrice: z.coerce.number().min(0, "Prices cannot be negative"),
  taxIds: z.array(z.string()).default([]),
});
export type LineInput = z.infer<typeof lineInputSchema>;

/** Parses the editor's hidden `lines` JSON field. */
export function parseLines(fd: FormData, key = "lines"): { lines: LineInput[] } | { error: string } {
  let raw: unknown;
  try {
    raw = JSON.parse(String(fd.get(key) ?? "[]"));
  } catch {
    return { error: "Order lines could not be read" };
  }
  const parsed = z.array(lineInputSchema).safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]!.message };
  for (const l of parsed.data) {
    if (!l.productId && !l.description) return { error: "Each line needs a product or a description" };
  }
  return { lines: parsed.data };
}
