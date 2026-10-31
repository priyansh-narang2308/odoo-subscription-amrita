import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type Db = PrismaClient | Prisma.TransactionClient;

export type ActivityModel = "subscription" | "invoice" | "customer" | "product" | "payment";

export function logActivity(
  model: ActivityModel,
  recordId: string,
  message: string,
  userId?: string | null,
  db: Db = prisma,
) {
  return db.activity.create({ data: { model, recordId, message, userId: userId ?? null } });
}

export function getActivities(model: ActivityModel, recordId: string) {
  return prisma.activity.findMany({
    where: { model, recordId },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { user: { select: { name: true } } },
  });
}
