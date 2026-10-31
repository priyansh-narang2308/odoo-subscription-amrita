/**
 * Load test for the "thousands of subscriptions, every page under two seconds"
 * requirement. Bulk-fills a separate database and times the queries each page runs.
 *
 *   npm run perf            # 5,000 subscriptions into prisma/perf.db
 *   PERF_SUBS=20000 npm run perf
 *
 * Never touches dev.db: package.json points DATABASE_URL at perf.db for this script.
 */
import { prisma } from "@/lib/prisma";
import { dashboardData } from "@/lib/reports";
import { PAGE_SIZE } from "@/lib/constants";
import { startOfDay } from "@/lib/format";

const TARGET = Number(process.env.PERF_SUBS ?? 5000);
const INVOICES_PER_SUB = 6;
const BUDGET_MS = 2000;
const STATUSES = ["ACTIVE", "ACTIVE", "ACTIVE", "ACTIVE", "PAUSED", "CLOSED", "QUOTATION", "DRAFT"];
const METHODS = ["BANK_TRANSFER", "CARD", "CASH", "CHEQUE", "ONLINE"];

async function inChunks<T>(rows: T[], insert: (chunk: T[]) => Promise<unknown>) {
  for (let i = 0; i < rows.length; i += 500) await insert(rows.slice(i, i + 500));
}

async function fill() {
  const have = await prisma.subscription.count();
  if (have >= TARGET) return console.log(`perf.db already holds ${have} subscriptions`);

  const [customers, plans, products] = await Promise.all([
    prisma.customer.findMany({ select: { id: true } }),
    prisma.recurringPlan.findMany({ select: { id: true } }),
    prisma.product.findMany({ select: { id: true, name: true, salesPrice: true } }),
  ]);
  if (!customers.length || !plans.length || !products.length) throw new Error("Seed perf.db first (npm run perf seeds it)");

  const today = startOfDay(new Date());
  const day = 86_400_000;
  const subs = [], lines = [], invoices = [], payments = [];

  for (let i = have; i < TARGET; i++) {
    const id = `perf-sub-${i}`;
    const status = STATUSES[i % STATUSES.length]!;
    const start = new Date(today.getTime() - (i % 720) * day);
    const customerId = customers[i % customers.length]!.id;
    subs.push({
      id, number: `PERF/${String(i).padStart(6, "0")}`, customerId, planId: plans[i % plans.length]!.id,
      status, startDate: start, nextInvoiceDate: status === "ACTIVE" ? new Date(today.getTime() + (i % 30) * day) : null,
      createdAt: start,
    });
    let untaxed = 0;
    for (let l = 0; l < 2; l++) {
      const p = products[(i + l) % products.length]!;
      const quantity = 1 + (i % 5);
      untaxed += quantity * p.salesPrice;
      lines.push({ subscriptionId: id, productId: p.id, description: p.name, quantity, unitPrice: p.salesPrice, sequence: l });
    }
    if (status === "DRAFT" || status === "QUOTATION") continue;
    for (let k = 0; k < INVOICES_PER_SUB; k++) {
      const invoiceDate = new Date(start.getTime() + k * 30 * day);
      if (invoiceDate > today) break;
      const invId = `perf-inv-${i}-${k}`;
      const total = Math.round(untaxed * 1.18 * 100) / 100;
      // Most invoices are paid; the newest are still open and some of those are overdue
      const paid = k < INVOICES_PER_SUB - 2 || i % 3 === 0;
      invoices.push({
        id: invId, number: `PINV/${i}/${k}`, customerId, subscriptionId: id,
        status: paid ? "PAID" : "CONFIRMED", invoiceDate, dueDate: new Date(invoiceDate.getTime() + 15 * day),
        periodKey: `${k}`, untaxedAmount: untaxed, taxAmount: total - untaxed, total, amountPaid: paid ? total : 0,
      });
      if (paid) {
        payments.push({
          number: `PPAY/${i}/${k}`, invoiceId: invId, method: METHODS[(i + k) % METHODS.length]!,
          amount: total, date: new Date(invoiceDate.getTime() + 5 * day),
        });
      }
    }
  }

  console.log(`Inserting ${subs.length} subscriptions, ${invoices.length} invoices, ${payments.length} payments…`);
  await inChunks(subs, (c) => prisma.subscription.createMany({ data: c }));
  await inChunks(lines, (c) => prisma.subscriptionLine.createMany({ data: c }));
  await inChunks(invoices, (c) => prisma.invoice.createMany({ data: c }));
  await inChunks(payments, (c) => prisma.payment.createMany({ data: c }));
}

async function time(label: string, run: () => Promise<unknown>) {
  await run(); // warm-up, like a second visit to the page
  const started = performance.now();
  await run();
  const ms = performance.now() - started;
  return { page: label, ms: Math.round(ms), ok: ms < BUDGET_MS };
}

async function main() {
  await fill();
  const today = startOfDay(new Date());
  const listSelect = {
    id: true, number: true, status: true, startDate: true, nextInvoiceDate: true,
    customer: { select: { name: true } }, plan: { select: { name: true } }, lines: { select: { quantity: true, unitPrice: true } },
  } as const;
  const page = (where: object, orderBy: object, select: object, model: "subscription" | "invoice" | "payment") => {
    const delegate = prisma[model] as unknown as { findMany: (a: object) => Promise<unknown>; count: (a: object) => Promise<number> };
    return Promise.all([delegate.findMany({ where, orderBy, skip: 0, take: PAGE_SIZE, select }), delegate.count({ where })]);
  };

  const results = [
    await time("Dashboard · last 12 months", () => dashboardData("year")),
    await time("Dashboard · all time", () => dashboardData("all")),
    await time("Subscriptions list", () => page({}, { createdAt: "desc" }, listSelect, "subscription")),
    await time("Subscriptions · search", () =>
      page({ OR: [{ number: { contains: "0042" } }, { customer: { name: { contains: "Bakery" } } }] }, { createdAt: "desc" }, listSelect, "subscription")),
    await time("Subscriptions · last page", () =>
      prisma.subscription.findMany({ orderBy: { createdAt: "desc" }, skip: Math.max(0, TARGET - PAGE_SIZE), take: PAGE_SIZE, select: listSelect })),
    await time("Invoices list", () => page({}, { invoiceDate: "desc" }, { id: true, number: true, total: true, customer: { select: { name: true } } }, "invoice")),
    await time("Invoices · overdue filter", () =>
      page({ status: "CONFIRMED", dueDate: { lt: today } }, { dueDate: "asc" }, { id: true, number: true, total: true }, "invoice")),
    await time("Payments list", () => page({}, { date: "desc" }, { id: true, number: true, amount: true, invoice: { select: { number: true } } }, "payment")),
    await time("Sidebar badge counts", () =>
      Promise.all([
        prisma.subscription.count({ where: { status: { in: ["DRAFT", "QUOTATION"] } } }),
        prisma.invoice.count({ where: { status: "CONFIRMED", dueDate: { lt: today } } }),
        prisma.invoice.count({ where: { status: "DRAFT" } }),
      ])),
  ];

  const counts = { subscriptions: await prisma.subscription.count(), invoices: await prisma.invoice.count(), payments: await prisma.payment.count() };
  console.log(`\nData: ${counts.subscriptions} subscriptions · ${counts.invoices} invoices · ${counts.payments} payments\n`);
  console.table(results.map((r) => ({ page: r.page, "query time": `${r.ms} ms`, "under 2 s": r.ok ? "yes" : "NO" })));
  if (results.some((r) => !r.ok)) process.exitCode = 1;
}

main().finally(() => prisma.$disconnect());
