import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Vercel's filesystem is read-only apart from /tmp. The build seeds prisma/demo.db and
// bundles it; each server instance copies it to /tmp once and works on that copy.
function datasourceUrl(): string | undefined {
  if (!process.env.VERCEL) return undefined;
  const target = "/tmp/brightloop.db";
  if (!fs.existsSync(target)) {
    fs.copyFileSync(path.join(process.cwd(), "prisma", "demo.db"), target);
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
