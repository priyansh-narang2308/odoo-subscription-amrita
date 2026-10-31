"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireUser } from "@/lib/auth";
import { hashPassword, passwordSchema, verifyPassword } from "@/lib/auth/password";
import { issuePasswordLink } from "@/lib/invite";
import { type ActionState, zodFieldErrors } from "@/lib/action";

const staffSchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  role: z.enum(["ADMIN", "INTERNAL"]),
});

/** Only administrators can add staff. New staff receive an email to set their password. */
export async function saveStaff(id: string | null, _: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const parsed = staffSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { fieldErrors: zodFieldErrors(parsed.error.issues) };
  const clash = await prisma.user.findFirst({ where: { email: parsed.data.email, NOT: id ? { id } : undefined } });
  if (clash) return { fieldErrors: { email: "An account with this email already exists" } };

  if (!id) {
    const user = await prisma.user.create({
      data: { ...parsed.data, passwordHash: await hashPassword(randomBytes(24).toString("hex")) },
    });
    const { link, delivered } = await issuePasswordLink(user, "invite");
    revalidatePath("/users");
    if (!delivered && process.env.NODE_ENV !== "production") {
      console.info(`Invitation link for ${user.email}: ${link}`);
    }
    redirect(`/users/${user.id}?invited=1`);
  }

  const target = await prisma.user.findUniqueOrThrow({ where: { id } });
  if (target.role === "PORTAL") return { error: "Portal users are managed from their customer record" };
  if (id === admin.id && parsed.data.role !== "ADMIN") return { error: "You cannot remove your own administrator rights" };
  await prisma.user.update({ where: { id }, data: parsed.data });
  revalidatePath("/users");
  revalidatePath(`/users/${id}`);
  return { message: "User saved" };
}

export async function toggleUser(id: string): Promise<ActionState> {
  const admin = await requireAdmin();
  if (id === admin.id) return { error: "You cannot deactivate your own account" };
  const u = await prisma.user.findUniqueOrThrow({ where: { id } });
  await prisma.user.update({ where: { id }, data: { active: !u.active } });
  revalidatePath("/users");
  revalidatePath(`/users/${id}`);
  return { message: u.active ? "User deactivated" : "User reactivated" };
}

export async function sendPasswordReset(id: string): Promise<ActionState> {
  await requireAdmin();
  const u = await prisma.user.findUniqueOrThrow({ where: { id } });
  const { link, delivered } = await issuePasswordLink(u, "reset");
  return {
    message: delivered || process.env.NODE_ENV === "production"
      ? `Password reset link sent to ${u.email}`
      : `Reset link (dev, no SMTP): ${link.replace(/^https?:\/\/[^/]+/, "")}`,
  };
}

/** Any signed-in user: update own name and, optionally, password. */
export async function updateProfile(_: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const name = String(fd.get("name") ?? "").trim();
  if (name.length < 2) return { fieldErrors: { name: "Name is required" } };
  const current = String(fd.get("current") ?? "");
  const next = String(fd.get("password") ?? "");
  const data: { name: string; passwordHash?: string } = { name };

  if (next) {
    const record = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    if (!(await verifyPassword(current, record.passwordHash))) return { fieldErrors: { current: "Current password is incorrect" } };
    const ok = passwordSchema.safeParse(next);
    if (!ok.success) return { fieldErrors: { password: ok.error.issues[0]!.message } };
    if (next !== fd.get("confirm")) return { fieldErrors: { confirm: "Passwords do not match" } };
    data.passwordHash = await hashPassword(next);
  }
  await prisma.user.update({ where: { id: user.id }, data });
  revalidatePath("/", "layout");
  return { message: next ? "Profile and password updated" : "Profile updated" };
}
