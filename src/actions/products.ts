"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { type ActionState, zodFieldErrors } from "@/lib/action";
import { PRODUCT_TYPES } from "@/lib/constants";

const schema = z.object({
  name: z.string().trim().min(1, "Product name is required"),
  type: z.enum(PRODUCT_TYPES),
  salesPrice: z.coerce.number().min(0, "Price cannot be negative"),
  costPrice: z.coerce.number().min(0, "Cost cannot be negative"),
  notes: z.string().trim().optional().transform((v) => v || null),
});
const variantsSchema = z.array(z.object({ attributeValueId: z.string().min(1), extraPrice: z.coerce.number().min(0) }));

export async function saveProduct(id: string | null, _: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireAdmin();
  const parsed = schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { fieldErrors: zodFieldErrors(parsed.error.issues) };
  const taxIds = fd.getAll("taxIds").map(String);
  const variants = variantsSchema.safeParse(JSON.parse(String(fd.get("variants") ?? "[]")));
  if (!variants.success) return { error: "Each variant needs an attribute value" };
  const valueIds = variants.data.map((v) => v.attributeValueId);
  if (new Set(valueIds).size !== valueIds.length) return { error: "Each attribute value can only be used once per product" };

  if (!id) {
    const product = await prisma.product.create({
      data: {
        ...parsed.data,
        taxes: { connect: taxIds.map((t) => ({ id: t })) },
        variants: { create: variants.data },
      },
    });
    await logActivity("product", product.id, "Product created", user.id);
    revalidatePath("/products");
    redirect(`/products/${product.id}`);
  }

  await prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: { id },
      data: { ...parsed.data, taxes: { set: taxIds.map((t) => ({ id: t })) } },
    });
    await tx.productVariant.deleteMany({ where: { productId: id, attributeValueId: { notIn: valueIds } } });
    for (const v of variants.data) {
      await tx.productVariant.upsert({
        where: { productId_attributeValueId: { productId: id, attributeValueId: v.attributeValueId } },
        create: { productId: id, ...v },
        update: { extraPrice: v.extraPrice },
      });
    }
  });
  await logActivity("product", id, "Product updated", user.id);
  revalidatePath("/products");
  revalidatePath(`/products/${id}`);
  return { message: "Product saved" };
}

export async function toggleProduct(id: string): Promise<ActionState> {
  const user = await requireAdmin();
  const p = await prisma.product.findUniqueOrThrow({ where: { id } });
  await prisma.product.update({ where: { id }, data: { active: !p.active } });
  await logActivity("product", id, p.active ? "Product archived" : "Product restored", user.id);
  revalidatePath("/products");
  revalidatePath(`/products/${id}`);
  return { message: p.active ? "Product archived" : "Product restored" };
}
