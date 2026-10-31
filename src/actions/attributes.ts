"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { type ActionState } from "@/lib/action";

const valuesSchema = z.array(
  z.object({
    id: z.string().optional(),
    name: z.string().trim().min(1, "Every value needs a name"),
    defaultExtra: z.coerce.number().min(0),
  }),
);

export async function saveAttribute(id: string | null, _: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const name = String(fd.get("name") ?? "").trim();
  if (!name) return { fieldErrors: { name: "Name is required" } };
  const values = valuesSchema.safeParse(JSON.parse(String(fd.get("values") ?? "[]")));
  if (!values.success) return { error: values.error.issues[0]!.message };
  const names = values.data.map((v) => v.name.toLowerCase());
  if (new Set(names).size !== names.length) return { error: "Value names must be unique" };

  const clash = await prisma.productAttribute.findFirst({ where: { name, NOT: id ? { id } : undefined } });
  if (clash) return { fieldErrors: { name: "An attribute with this name already exists" } };

  if (!id) {
    const attr = await prisma.productAttribute.create({
      data: { name, values: { create: values.data.map(({ name, defaultExtra }) => ({ name, defaultExtra })) } },
    });
    revalidatePath("/config/attributes");
    redirect(`/config/attributes/${attr.id}`);
  }

  const keep = values.data.filter((v) => v.id).map((v) => v.id!);
  await prisma.$transaction([
    prisma.productAttribute.update({ where: { id }, data: { name } }),
    prisma.attributeValue.deleteMany({ where: { attributeId: id, id: { notIn: keep } } }),
    ...values.data.map((v) =>
      v.id
        ? prisma.attributeValue.update({ where: { id: v.id }, data: { name: v.name, defaultExtra: v.defaultExtra } })
        : prisma.attributeValue.create({ data: { attributeId: id, name: v.name, defaultExtra: v.defaultExtra } }),
    ),
  ]);
  revalidatePath("/config/attributes");
  revalidatePath(`/config/attributes/${id}`);
  return { message: "Attribute saved" };
}

export async function deleteAttribute(id: string): Promise<ActionState> {
  await requireAdmin();
  await prisma.productAttribute.delete({ where: { id } });
  revalidatePath("/config/attributes");
  redirect("/config/attributes");
}
