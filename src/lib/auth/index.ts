import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import type { Role } from "@/lib/constants";
import { SESSION_COOKIE, sessionCookieOptions, signSession, verifySession } from "./session";

export async function createSession(user: { id: string; role: string; name: string }) {
  const token = await signSession({ uid: user.id, role: user.role as Role, name: user.name });
  (await cookies()).set(SESSION_COOKIE, token, sessionCookieOptions);
}

export async function destroySession() {
  (await cookies()).delete(SESSION_COOKIE);
}

/** Current user (fresh from DB, cached per request). Inactive users count as signed out. */
export const getCurrentUser = cache(async () => {
  const session = await verifySession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.uid },
    select: { id: true, name: true, email: true, role: true, active: true, customer: { select: { id: true } } },
  });
  if (!user || !user.active) return null;
  return { ...user, role: user.role as Role, customerId: user.customer?.id ?? null };
});

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

export function homeFor(role: Role) {
  return role === "PORTAL" ? "/my" : "/home";
}

/** Require a signed-in user, optionally with one of the given roles. */
export async function requireUser(roles?: Role[]) {
  const user = await getCurrentUser();
  // A valid token for a user who no longer exists: clear the cookie rather than loop through middleware
  if (!user) redirect("/logout");
  if (roles && !roles.includes(user.role)) redirect(homeFor(user.role));
  return user;
}

export const requireStaff = () => requireUser(["ADMIN", "INTERNAL"]);
export const requireAdmin = () => requireUser(["ADMIN"]);

export async function requirePortal() {
  const user = await requireUser(["PORTAL"]);
  if (!user.customerId) redirect("/logout");
  return user as CurrentUser & { customerId: string };
}
