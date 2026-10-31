import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const started = Date.now();
  await prisma.$queryRaw`SELECT 1`;
  return Response.json({ ok: true, db: "up", ms: Date.now() - started });
}
