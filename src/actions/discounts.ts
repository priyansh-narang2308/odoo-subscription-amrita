"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { type ActionState, zodFieldErrors } from "@/lib/action";
import { AMOUNT_TYPES, DISCOUNT_SCOPES } from "@/lib/constants";
import { date, str } from "@/lib/utils";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  type: z.enum(AMOUNT_TYPES),
  value: z.coerce.number().positive("Value must be greater than zero"),
  minPurchase: z.coerce.number().min(0),
  minQuantity: z.coerce.number().int().min(0),
  appliesTo: z.enum(DISCOUNT_SCOPES),
});

export async function saveDiscount(id: string | null, _: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { fieldErrors: zodFieldErrors(parsed.error.issues) };
  if (parsed.data.type === "PERCENT" && parsed.data.value > 100) return { fieldErrors: { value: "A percentage cannot exceed 100" } };

  const startDate = date(fd, "startDate");
  const endDate = date(fd, "endDate");
  if (startDate && endDate && endDate < startDate) return { fieldErrors: { endDate: "End date must be after the start date" } };
  const limitRaw = str(fd, "usageLimit");
  const usageLimit = limitRaw === null ? null : Math.max(1, Math.floor(Number(limitRaw)));
  const productIds = fd.getAll("productIds").map(String);
  if (parsed.data.appliesTo === "PRODUCTS" && productIds.length === 0) {
    return { fieldErrors: { productIds: "Pick at least one product" } };
  }

  const data = { ...parsed.data, startDate, endDate, usageLimit };
  const products = parsed.data.appliesTo === "PRODUCTS" ? productIds.map((p) => ({ id: p })) : [];
  if (id) {
    await prisma.discount.update({ where: { id }, data: { ...data, products: { set: products } } });
    revalidatePath("/config/discounts");
    return { message: "Discount saved" };
  }
  const d = await prisma.discount.create({ data: { ...data, products: { connect: products } } });
  revalidatePath("/config/discounts");
  redirect(`/config/discounts/${d.id}`);
}

export async function toggleDiscount(id: string): Promise<ActionState> {
  await requireAdmin();
  const d = await prisma.discount.findUniqueOrThrow({ where: { id } });
  await prisma.discount.update({ where: { id }, data: { active: !d.active } });
  revalidatePath("/config/discounts");
  revalidatePath(`/config/discounts/${id}`);
  return { message: d.active ? "Discount archived" : "Discount restored" };
}
