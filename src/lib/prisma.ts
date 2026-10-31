import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Vercel's filesystem is read-only apart from /tmp. The build seeds prisma/demo.db and
// bundles it; each server instance copies it to /tmp once and works on that copy.
function datasourceUrl(): string | undefined {
  // The build step seeds prisma/demo.db itself (it imports billing, which loads this file),
  // so the /tmp redirect must only happen in the running server.
  if (!process.env.VERCEL || process.env.BRIGHTLOOP_SEEDING) return undefined;
  // One file per deployment, so a reused instance never picks up another build's data.
  const target = `/tmp/brightloop-${process.env.VERCEL_DEPLOYMENT_ID ?? "local"}.db`;
  if (!fs.existsSync(target)) {
    const source = path.join(process.cwd(), "prisma", "demo.db");
    fs.copyFileSync(source, target);
    console.log(`[db] copied ${source} (${fs.statSync(source).size} bytes) to ${target}`);
  }
  process.env.DATABASE_URL = `file:${target}`;
  return process.env.DATABASE_URL;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: datasourceUrl(),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
