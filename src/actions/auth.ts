"use server";

import { createHash } from "node:crypto";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession, destroySession, homeFor } from "@/lib/auth";
import { hashPassword, passwordSchema, verifyPassword } from "@/lib/auth/password";
import { issuePasswordLink } from "@/lib/invite";
import { type ActionState, zodFieldErrors } from "@/lib/action";
import type { Role } from "@/lib/constants";

const emailSchema = z.string().trim().toLowerCase().email("Enter a valid email address");

function safeNext(v: FormDataEntryValue | null) {
  return typeof v === "string" && v.startsWith("/") && !v.startsWith("//") ? v : null;
}

export async function loginAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const email = emailSchema.safeParse(fd.get("email"));
  const password = String(fd.get("password") ?? "");
  if (!email.success || !password) return { error: "Enter your email and password" };

  const user = await prisma.user.findUnique({ where: { email: email.data } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    if (process.env.VERCEL) console.warn(`[auth] failed login for ${email.data}: user ${user ? "found" : "missing"}, ${await prisma.user.count()} users in db`);
    return { error: "Wrong login/password" };
  }
  if (!user.active) return { error: "This account has been deactivated. Contact your administrator." };

  await createSession(user);
  const home = homeFor(user.role as Role);
  const next = safeNext(fd.get("next"));
  const allowed = next && (user.role === "PORTAL" ? next.startsWith("/my") : !next.startsWith("/my"));
  redirect(allowed ? next : home);
}

const signupSchema = z
  .object({
    name: z.string().trim().min(2, "Enter your name"),
    company: z.string().trim().optional(),
    email: emailSchema,
    password: passwordSchema,
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { path: ["confirm"], message: "Passwords do not match" });

/** Public sign-up creates a portal (customer) account linked to a new customer record. */
export async function signupAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = signupSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { fieldErrors: zodFieldErrors(parsed.error.issues) };
  const { name, company, email, password } = parsed.data;

  if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) {
    return { fieldErrors: { email: "An account with this email already exists" } };
  }

  const user = await prisma.user.create({
    data: {
      name,
      email,
      role: "PORTAL",
      passwordHash: await hashPassword(password),
      customer: { create: { name: company || name, company: company || null, email } },
    },
  });
  await createSession(user);
  redirect("/my");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

export async function forgotPasswordAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const email = emailSchema.safeParse(fd.get("email"));
  if (!email.success) return { fieldErrors: { email: email.error.issues[0]!.message } };

  const generic = { message: "If an account exists for this email, a reset link has been sent to it." };
  const user = await prisma.user.findUnique({ where: { email: email.data } });
  if (!user || !user.active) return generic;

  const { link, delivered } = await issuePasswordLink(user, "reset");
  // Without SMTP in development, surface the link so the flow can be tested end to end
  if (!delivered && process.env.NODE_ENV !== "production") return { ...generic, devLink: link };
  return generic;
}

export async function resetPasswordAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const token = String(fd.get("token") ?? "");
  const password = passwordSchema.safeParse(fd.get("password"));
  if (!password.success) return { fieldErrors: { password: password.error.issues[0]!.message } };
  if (password.data !== fd.get("confirm")) return { fieldErrors: { confirm: "Passwords do not match" } };

  const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash: sha256(token) } });
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return { error: "This reset link is invalid or has expired. Request a new one." };
  }
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash: await hashPassword(password.data) } }),
    prisma.passwordResetToken.updateMany({ where: { userId: record.userId, usedAt: null }, data: { usedAt: new Date() } }),
  ]);
  redirect("/login?reset=1");
}
