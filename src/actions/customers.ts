"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth";
import { hashPassword } from "@/lib/auth/password";
import { issuePasswordLink } from "@/lib/invite";
import { logActivity } from "@/lib/activity";
import { type ActionState, zodFieldErrors } from "@/lib/action";

const opt = z.string().trim().optional().transform((v) => v || null);
const schema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  phone: opt,
  company: opt,
  street: opt,
  city: opt,
  country: opt,
  taxId: opt,
  notes: opt,
});

export async function saveCustomer(id: string | null, _: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireStaff();
  const parsed = schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { fieldErrors: zodFieldErrors(parsed.error.issues) };

  if (!id) {
    const c = await prisma.customer.create({ data: parsed.data });
    await logActivity("customer", c.id, "Customer created", user.id);
    revalidatePath("/customers");
    redirect(`/customers/${c.id}`);
  }
  const existing = await prisma.customer.findUniqueOrThrow({ where: { id }, include: { user: true } });
  if (existing.user && existing.user.email !== parsed.data.email) {
    const taken = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (taken) return { fieldErrors: { email: "Another account already uses this email" } };
    await prisma.user.update({ where: { id: existing.user.id }, data: { email: parsed.data.email } });
  }
  await prisma.customer.update({ where: { id }, data: parsed.data });
  await logActivity("customer", id, "Customer details updated", user.id);
  revalidatePath("/customers");
  revalidatePath(`/customers/${id}`);
  return { message: "Customer saved" };
}

/** Creates a portal login for the customer and emails them a link to set their password. */
export async function grantPortalAccess(id: string): Promise<ActionState> {
  const staff = await requireStaff();
  const c = await prisma.customer.findUniqueOrThrow({ where: { id } });
  if (c.userId) return { error: "This customer already has portal access" };
  if (await prisma.user.findUnique({ where: { email: c.email } })) {
    return { error: "An account with this email already exists" };
  }
  const user = await prisma.user.create({
    data: {
      name: c.name,
      email: c.email,
      role: "PORTAL",
      passwordHash: await hashPassword(randomBytes(24).toString("hex")),
      customer: { connect: { id: c.id } },
    },
  });
  const { link, delivered } = await issuePasswordLink(user, "invite");
  await logActivity("customer", c.id, `Portal access granted — invitation sent to ${c.email}`, staff.id);
  revalidatePath(`/customers/${id}`);
  return {
    message: delivered || process.env.NODE_ENV === "production"
      ? `Invitation sent to ${c.email}`
      : `Invitation created (dev, no SMTP): ${link.replace(/^https?:\/\/[^/]+/, "")}`,
  };
}

export async function revokePortalAccess(id: string): Promise<ActionState> {
  const staff = await requireStaff();
  const c = await prisma.customer.findUniqueOrThrow({ where: { id }, include: { user: true } });
  if (!c.user) return { error: "This customer has no portal access" };
  await prisma.user.update({ where: { id: c.user.id }, data: { active: !c.user.active } });
  await logActivity("customer", c.id, c.user.active ? "Portal access revoked" : "Portal access restored", staff.id);
  revalidatePath(`/customers/${id}`);
  return { message: c.user.active ? "Portal access revoked" : "Portal access restored" };
}

export async function deleteCustomer(id: string): Promise<ActionState> {
  await requireStaff();
  const c = await prisma.customer.findUniqueOrThrow({
    where: { id },
    include: { _count: { select: { subscriptions: true, invoices: true } } },
  });
  if (c._count.subscriptions || c._count.invoices) {
    return { error: "Customers with subscriptions or invoices cannot be deleted" };
  }
  await prisma.customer.delete({ where: { id } });
  if (c.userId) await prisma.user.delete({ where: { id: c.userId } });
  revalidatePath("/customers");
  redirect("/customers");
}
