import type { Prisma, PrismaClient } from "@prisma/client";

type Db = PrismaClient | Prisma.TransactionClient;

/** Next number for a document series, e.g. SUB/2026/00001. Must run inside a transaction for safety. */
export async function nextNumber(db: Db, prefix: "SUB" | "INV" | "PAY", at = new Date()) {
  const year = at.getFullYear();
  const key = `${prefix}/${year}`;
  const seq = await db.sequence.upsert({
    where: { key },
    create: { key, next: 2 },
    update: { next: { increment: 1 } },
  });
  const n = seq.next - 1;
  return `${key}/${String(n).padStart(5, "0")}`;
}
