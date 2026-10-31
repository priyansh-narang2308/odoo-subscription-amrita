import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth";
import { savePlan, togglePlan } from "@/actions/plans";
import { PlanForm } from "./plan-form";

export default async function PlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireStaff();
  const plan = id === "new" ? null : await prisma.recurringPlan.findUnique({
    where: { id },
    include: { _count: { select: { subscriptions: true } } },
  });
  if (id !== "new" && !plan) notFound();
  return (
    <PlanForm
      plan={plan}
      subscriptionCount={plan?._count.subscriptions ?? 0}
      readOnly={user.role !== "ADMIN"}
      save={savePlan.bind(null, plan?.id ?? null)}
      toggle={plan ? togglePlan.bind(null, plan.id) : undefined}
    />
  );
}
