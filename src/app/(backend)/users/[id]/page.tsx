import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { saveStaff, sendPasswordReset, toggleUser } from "@/actions/users";
import { UserForm } from "./user-form";

export default async function UserPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ invited?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const admin = await requireAdmin();
  const user = id === "new" ? null : await prisma.user.findUnique({ where: { id }, select: { id: true, name: true, email: true, role: true, active: true, createdAt: true } });
  if (id !== "new" && (!user || user.role === "PORTAL")) notFound();
  return (
    <UserForm
      user={user}
      isSelf={user?.id === admin.id}
      invited={sp.invited === "1"}
      save={saveStaff.bind(null, user?.id ?? null)}
      toggle={user ? toggleUser.bind(null, user.id) : undefined}
      reset={user ? sendPasswordReset.bind(null, user.id) : undefined}
    />
  );
}
