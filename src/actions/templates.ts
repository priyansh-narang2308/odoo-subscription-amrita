"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { type ActionState } from "@/lib/action";
import { parseLines } from "@/lib/lines";
import { str } from "@/lib/utils";

export async function saveTemplate(id: string | null, _: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const name = str(fd, "name");
  if (!name) return { fieldErrors: { name: "Name is required" } };
  const validityDays = Math.max(1, Math.floor(Number(fd.get("validityDays") ?? 30)) || 30);
  const planId = str(fd, "planId");
  const note = str(fd, "note");
  const parsed = parseLines(fd);
  if ("error" in parsed) return { error: parsed.error };
  if (parsed.lines.some((l) => !l.productId)) return { error: "Every template line needs a product" };

  const lines = parsed.lines.map((l, i) => ({
    productId: l.productId!,
    variantId: l.variantId,
    quantity: l.quantity,
    description: l.description || null,
    sequence: i,
    taxes: { connect: l.taxIds.map((t) => ({ id: t })) },
  }));

  if (!id) {
    const t = await prisma.quotationTemplate.create({ data: { name, validityDays, planId, note, lines: { create: lines } } });
    revalidatePath("/config/templates");
    redirect(`/config/templates/${t.id}`);
  }
  await prisma.$transaction([
    prisma.quotationTemplateLine.deleteMany({ where: { templateId: id } }),
    prisma.quotationTemplate.update({ where: { id }, data: { name, validityDays, planId, note, lines: { create: lines } } }),
  ]);
  revalidatePath("/config/templates");
  revalidatePath(`/config/templates/${id}`);
  return { message: "Template saved" };
}

export async function deleteTemplate(id: string): Promise<ActionState> {
  await requireAdmin();
  await prisma.quotationTemplate.delete({ where: { id } });
  revalidatePath("/config/templates");
  redirect("/config/templates");
}
