"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { stayOnList, type ActionState, zodFieldErrors } from "@/lib/action";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  type: z.enum(["PERCENT", "FIXED"]),
  amount: z.coerce.number().min(0, "Amount cannot be negative"),
});

export async function saveTax(id: string | null, _: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { fieldErrors: zodFieldErrors(parsed.error.issues) };
  if (parsed.data.type === "PERCENT" && parsed.data.amount > 100) return { fieldErrors: { amount: "A percentage cannot exceed 100" } };

  if (id) {
    await prisma.tax.update({ where: { id }, data: parsed.data });
    revalidatePath("/config/taxes");
    return { message: "Tax saved" };
  }
  const tax = await prisma.tax.create({ data: parsed.data });
  revalidatePath("/config/taxes");
  if (stayOnList(fd)) return { message: `Tax "${tax.name}" created` };
  redirect(`/config/taxes/${tax.id}`);
}

export async function toggleTax(id: string): Promise<ActionState> {
  await requireAdmin();
  const tax = await prisma.tax.findUniqueOrThrow({ where: { id } });
  await prisma.tax.update({ where: { id }, data: { active: !tax.active } });
  revalidatePath("/config/taxes");
  revalidatePath(`/config/taxes/${id}`);
  return { message: tax.active ? "Tax archived" : "Tax restored" };
}
