"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { stayOnList, type ActionState, zodFieldErrors } from "@/lib/action";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  dueDays: z.coerce.number().int().min(0, "Days cannot be negative").max(365),
  note: z.string().trim().optional().transform((v) => v || null),
});

export async function savePaymentTerm(id: string | null, _: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { fieldErrors: zodFieldErrors(parsed.error.issues) };
  if (id) {
    await prisma.paymentTerm.update({ where: { id }, data: parsed.data });
    revalidatePath("/config/payment-terms");
    return { message: "Payment term saved" };
  }
  const term = await prisma.paymentTerm.create({ data: parsed.data });
  revalidatePath("/config/payment-terms");
  if (stayOnList(fd)) return { message: `Payment term "${term.name}" created` };
  redirect(`/config/payment-terms/${term.id}`);
}

export async function deletePaymentTerm(id: string): Promise<ActionState> {
  await requireAdmin();
  await prisma.paymentTerm.delete({ where: { id } });
  revalidatePath("/config/payment-terms");
  redirect("/config/payment-terms");
}
