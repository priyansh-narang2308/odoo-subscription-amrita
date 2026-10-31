"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { stayOnList, type ActionState, zodFieldErrors } from "@/lib/action";
import { BILLING_PERIODS } from "@/lib/constants";
import { bool, date } from "@/lib/utils";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  price: z.coerce.number().min(0, "Price cannot be negative"),
  billingPeriod: z.enum(BILLING_PERIODS),
  billingInterval: z.coerce.number().int().min(1, "Must be at least 1").max(36),
  minQuantity: z.coerce.number().int().min(1, "Must be at least 1"),
});

export async function savePlan(id: string | null, _: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { fieldErrors: zodFieldErrors(parsed.error.issues) };
  const startDate = date(fd, "startDate");
  const endDate = date(fd, "endDate");
  if (startDate && endDate && endDate < startDate) return { fieldErrors: { endDate: "End date must be after the start date" } };

  const data = {
    ...parsed.data,
    startDate,
    endDate,
    autoClose: bool(fd, "autoClose"),
    closable: bool(fd, "closable"),
    pausable: bool(fd, "pausable"),
    renewable: bool(fd, "renewable"),
  };
  if (id) {
    await prisma.recurringPlan.update({ where: { id }, data });
    revalidatePath("/config/plans");
    return { message: "Plan saved" };
  }
  const plan = await prisma.recurringPlan.create({ data });
  revalidatePath("/config/plans");
  if (stayOnList(fd)) return { message: `Plan "${plan.name}" created` };
  redirect(`/config/plans/${plan.id}`);
}

export async function togglePlan(id: string): Promise<ActionState> {
  await requireAdmin();
  const plan = await prisma.recurringPlan.findUniqueOrThrow({ where: { id } });
  await prisma.recurringPlan.update({ where: { id }, data: { active: !plan.active } });
  revalidatePath("/config/plans");
  revalidatePath(`/config/plans/${id}`);
  return { message: plan.active ? "Plan archived" : "Plan restored" };
}
