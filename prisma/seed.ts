/* Demo data for Brightloop Software.
 * Run: npm run db:seed        (SEED_LARGE=1 adds ~3000 extra subscriptions for load testing)
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { addDays, addPeriod, registerPayment, runBilling } from "../src/lib/billing";
import { nextNumber } from "../src/lib/sequence";
import { startOfDay } from "../src/lib/format";

const prisma = new PrismaClient();

function rand<T>(arr: T[], i: number) {
  return arr[i % arr.length]!;
}
function monthsAgo(n: number, day = 1) {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - n);
  d.setDate(day);
  return startOfDay(d);
}

async function wipe() {
  await prisma.$transaction([
    prisma.activity.deleteMany(),
    prisma.payment.deleteMany(),
    prisma.discountUsage.deleteMany(),
    prisma.invoiceLine.deleteMany(),
    prisma.invoice.deleteMany(),
    prisma.subscriptionLine.deleteMany(),
    prisma.subscription.deleteMany(),
    prisma.quotationTemplateLine.deleteMany(),
    prisma.quotationTemplate.deleteMany(),
    prisma.discount.deleteMany(),
    prisma.productVariant.deleteMany(),
    prisma.attributeValue.deleteMany(),
    prisma.productAttribute.deleteMany(),
    prisma.product.deleteMany(),
    prisma.recurringPlan.deleteMany(),
    prisma.tax.deleteMany(),
    prisma.paymentTerm.deleteMany(),
    prisma.customer.deleteMany(),
    prisma.passwordResetToken.deleteMany(),
    prisma.user.deleteMany(),
    prisma.sequence.deleteMany(),
  ]);
}

async function main() {
  console.log("Seeding Brightloop demo data…");
  await wipe();

  // ── Users ──
  const hash = (p: string) => bcrypt.hash(p, 10);
  const admin = await prisma.user.create({
    data: { email: "admin@brightloop.test", name: "Aditi Sharma", role: "ADMIN", passwordHash: await hash("Admin@1234") },
  });
  const staff = await prisma.user.create({
    data: { email: "staff@brightloop.test", name: "Rahul Mehta", role: "INTERNAL", passwordHash: await hash("Staff@1234") },
  });
  await prisma.user.create({
    data: { email: "sales@brightloop.test", name: "Neha Iyer", role: "INTERNAL", passwordHash: await hash("Sales@1234") },
  });

  // ── Customers ──
  const companies = [
    ["Corner Bakery", "Pune"], ["Northwind Traders", "Mumbai"], ["Acme Logistics", "Delhi"], ["Blue Lotus Spa", "Goa"],
    ["Green Leaf Organics", "Bengaluru"], ["Pixel Forge Studio", "Hyderabad"], ["Sunrise Clinics", "Chennai"],
    ["Metro Hardware", "Ahmedabad"], ["Urban Threads", "Jaipur"], ["Quantum Analytics", "Bengaluru"],
    ["Riverside Cafe", "Kochi"], ["Atlas Engineering", "Nagpur"], ["Bright Minds Academy", "Indore"],
    ["Cobalt Fintech", "Gurugram"], ["Harbor Freight Co", "Visakhapatnam"], ["Lumen Lighting", "Surat"],
    ["Peak Fitness", "Chandigarh"], ["Saffron Kitchens", "Lucknow"], ["Vertex Robotics", "Pune"],
    ["Zenith Hotels", "Udaipur"], ["Orbit Media", "Mumbai"], ["Evergreen Realty", "Noida"],
  ] as const;
  const customers: { id: string }[] = [];
  for (const [i, [name, city]] of companies.entries()) {
    const slug = name.toLowerCase().replace(/[^a-z]+/g, "");
    customers.push(
      await prisma.customer.create({
        data: {
          name,
          company: name,
          email: `billing@${slug}.example`,
          phone: `+91 98${String(10000000 + i * 7919).slice(0, 8)}`,
          street: `${12 + i} MG Road`,
          city,
          country: "India",
        },
      }),
    );
  }
  // Portal login for the first customer
  const portalUser = await prisma.user.create({
    data: { email: "customer@brightloop.test", name: "Corner Bakery", role: "PORTAL", passwordHash: await hash("Customer@123") },
  });
  await prisma.customer.update({ where: { id: customers[0]!.id }, data: { userId: portalUser.id, email: portalUser.email } });

  // ── Taxes & terms ──
  const gst18 = await prisma.tax.create({ data: { name: "GST 18%", type: "PERCENT", amount: 18 } });
  const gst5 = await prisma.tax.create({ data: { name: "GST 5%", type: "PERCENT", amount: 5 } });
  await prisma.tax.create({ data: { name: "Platform Fee (₹25/unit)", type: "FIXED", amount: 25 } });

  const immediate = await prisma.paymentTerm.create({ data: { name: "Immediate Payment", dueDays: 0 } });
  const net15 = await prisma.paymentTerm.create({ data: { name: "15 Days", dueDays: 15 } });
  const net30 = await prisma.paymentTerm.create({ data: { name: "30 Days", dueDays: 30, note: "Payment due within 30 days of invoice date." } });

  // ── Plans ──
  const monthly = await prisma.recurringPlan.create({
    data: { name: "Monthly", price: 0, billingPeriod: "MONTHLY", minQuantity: 1, closable: true, pausable: true, renewable: true },
  });
  const yearly = await prisma.recurringPlan.create({
    data: { name: "Yearly Contract", price: 0, billingPeriod: "YEARLY", minQuantity: 5, closable: false, pausable: false, renewable: true, autoClose: true },
  });
  const quarterly = await prisma.recurringPlan.create({
    data: { name: "Quarterly", price: 0, billingPeriod: "MONTHLY", billingInterval: 3, minQuantity: 1, closable: true, renewable: true },
  });
  await prisma.recurringPlan.create({
    data: { name: "Weekly Pilot", price: 499, billingPeriod: "WEEKLY", minQuantity: 1, autoClose: true, closable: true, renewable: false, startDate: monthsAgo(1), endDate: monthsAgo(-6) },
  });

  // ── Attributes & products ──
  const brand = await prisma.productAttribute.create({
    data: { name: "Brand", values: { create: [{ name: "Odoo", defaultExtra: 560 }, { name: "Brightloop", defaultExtra: 0 }] } },
    include: { values: true },
  });
  const edition = await prisma.productAttribute.create({
    data: { name: "Edition", values: { create: [{ name: "Standard", defaultExtra: 0 }, { name: "Professional", defaultExtra: 900 }] } },
    include: { values: true },
  });
  const odoo = brand.values.find((v) => v.name === "Odoo")!;
  const bl = brand.values.find((v) => v.name === "Brightloop")!;
  const std = edition.values.find((v) => v.name === "Standard")!;
  const pro = edition.values.find((v) => v.name === "Professional")!;

  const crm = await prisma.product.create({
    data: {
      name: "Brightloop CRM (per seat)", type: "SERVICE", salesPrice: 1200, costPrice: 300,
      notes: "Pipeline, leads and contact management.", taxes: { connect: [{ id: gst18.id }] },
      variants: { create: [{ attributeValueId: odoo.id, extraPrice: 560 }, { attributeValueId: bl.id, extraPrice: 0 }] },
    },
    include: { variants: true },
  });
  const accounting = await prisma.product.create({
    data: {
      name: "Accounting Suite", type: "SERVICE", salesPrice: 2500, costPrice: 700, taxes: { connect: [{ id: gst18.id }] },
      variants: { create: [{ attributeValueId: std.id, extraPrice: 0 }, { attributeValueId: pro.id, extraPrice: 900 }] },
    },
    include: { variants: true },
  });
  const helpdesk = await prisma.product.create({
    data: { name: "Helpdesk Add-on", type: "SERVICE", salesPrice: 650, costPrice: 120, notes: "Ticketing and SLA tracking.", taxes: { connect: [{ id: gst18.id }] } },
  });
  const storage = await prisma.product.create({
    data: { name: "Extra Storage 100 GB", type: "SERVICE", salesPrice: 300, costPrice: 60, taxes: { connect: [{ id: gst18.id }] } },
  });
  const pos = await prisma.product.create({
    data: { name: "Point of Sale Terminal Licence", type: "SERVICE", salesPrice: 900, costPrice: 250, taxes: { connect: [{ id: gst18.id }] } },
  });
  const scanner = await prisma.product.create({
    data: { name: "Barcode Scanner Rental", type: "GOODS", salesPrice: 400, costPrice: 150, taxes: { connect: [{ id: gst5.id }] } },
  });

  // ── Discounts ──
  await prisma.discount.create({
    data: { name: "Bulk seats 10%", type: "PERCENT", value: 10, minQuantity: 10, appliesTo: "PRODUCTS", products: { connect: [{ id: crm.id }] } },
  });
  await prisma.discount.create({
    data: { name: "Festive ₹500 off", type: "FIXED", value: 500, minPurchase: 5000, usageLimit: 40, startDate: monthsAgo(2), endDate: monthsAgo(-1, 28) },
  });

  // ── Quotation templates ──
  await prisma.quotationTemplate.create({
    data: {
      name: "Small Shop Starter", validityDays: 15, planId: monthly.id, note: "Everything a small shop needs to get going.",
      lines: { create: [
        { productId: pos.id, quantity: 1, sequence: 0, taxes: { connect: [{ id: gst18.id }] } },
        { productId: accounting.id, variantId: accounting.variants[0]!.id, quantity: 1, sequence: 1, taxes: { connect: [{ id: gst18.id }] } },
      ] },
    },
  });
  await prisma.quotationTemplate.create({
    data: {
      name: "Enterprise Yearly Bundle", validityDays: 30, planId: yearly.id,
      lines: { create: [
        { productId: crm.id, variantId: crm.variants[0]!.id, quantity: 25, sequence: 0, taxes: { connect: [{ id: gst18.id }] } },
        { productId: helpdesk.id, quantity: 10, sequence: 1, taxes: { connect: [{ id: gst18.id }] } },
        { productId: storage.id, quantity: 5, sequence: 2, taxes: { connect: [{ id: gst18.id }] } },
      ] },
    },
  });

  // ── Subscriptions ──
  type LineSpec = { product: { id: string; name: string; salesPrice: number }; variant?: { id: string; extraPrice: number; label: string }; qty: number; tax: string };
  const bundles: LineSpec[][] = [
    [{ product: crm, variant: { id: crm.variants[1]!.id, extraPrice: 0, label: "Brightloop" }, qty: 3, tax: gst18.id }],
    [{ product: crm, variant: { id: crm.variants[0]!.id, extraPrice: 560, label: "Odoo" }, qty: 12, tax: gst18.id }, { product: helpdesk, qty: 4, tax: gst18.id }],
    [{ product: accounting, variant: { id: accounting.variants[1]!.id, extraPrice: 900, label: "Professional" }, qty: 1, tax: gst18.id }, { product: storage, qty: 2, tax: gst18.id }],
    [{ product: pos, qty: 2, tax: gst18.id }, { product: scanner, qty: 2, tax: gst5.id }],
    [{ product: accounting, variant: { id: accounting.variants[0]!.id, extraPrice: 0, label: "Standard" }, qty: 1, tax: gst18.id }],
  ];

  async function createSub(i: number, opts: { status: string; startMonthsAgo: number; plan: typeof monthly; customerIdx: number; term?: string }) {
    const start = monthsAgo(opts.startMonthsAgo, 1 + (i % 27));
    const bundle = rand(bundles, i);
    const number = await nextNumber(prisma, "SUB", start);
    const expiration = opts.plan.billingPeriod === "YEARLY" ? addPeriod(start, "YEARLY", 2) : null;
    return prisma.subscription.create({
      data: {
        number,
        customerId: customers[opts.customerIdx % customers.length]!.id,
        planId: opts.plan.id,
        paymentTermId: opts.term ?? rand([immediate.id, net15.id, net30.id], i),
        salespersonId: i % 2 ? staff.id : admin.id,
        status: opts.status,
        startDate: start,
        expirationDate: expiration,
        nextInvoiceDate: start,
        confirmedAt: ["DRAFT", "QUOTATION"].includes(opts.status) ? null : start,
        quotationExpiresAt: opts.status === "QUOTATION" ? addDays(new Date(), 10 - (i % 15)) : null,
        createdAt: addDays(start, -5),
        lines: {
          create: bundle.map((l, s) => ({
            productId: l.product.id,
            variantId: l.variant?.id,
            description: l.variant ? `${l.product.name} (${l.variant.label})` : l.product.name,
            quantity: Math.max(l.qty, opts.plan.minQuantity),
            unitPrice: l.product.salesPrice + (l.variant?.extraPrice ?? 0),
            sequence: s,
            taxes: { connect: [{ id: l.tax }] },
          })),
        },
      },
    });
  }

  let i = 0;
  for (; i < 34; i++) await createSub(i, { status: "ACTIVE", startMonthsAgo: 1 + (i % 10), plan: i % 5 === 1 ? quarterly : monthly, customerIdx: i });
  for (; i < 42; i++) await createSub(i, { status: "ACTIVE", startMonthsAgo: 2 + (i % 8), plan: yearly, customerIdx: i, term: net30.id });
  for (; i < 46; i++) await createSub(i, { status: "QUOTATION", startMonthsAgo: -1, plan: monthly, customerIdx: i });
  for (; i < 49; i++) await createSub(i, { status: "DRAFT", startMonthsAgo: 0, plan: monthly, customerIdx: i });
  for (; i < 51; i++) await createSub(i, { status: "CONFIRMED", startMonthsAgo: -1, plan: monthly, customerIdx: i });
  for (; i < 53; i++) await createSub(i, { status: "PAUSED", startMonthsAgo: 4, plan: monthly, customerIdx: i });

  if (process.env.SEED_LARGE) {
    console.log("  adding 3000 extra subscriptions for load testing…");
    for (let k = 0; k < 3000; k++) await createSub(1000 + k, { status: k % 4 ? "ACTIVE" : "CLOSED", startMonthsAgo: 0, plan: monthly, customerIdx: k });
  }

  // ── Billing history: bill every due period, then post & collect most invoices ──
  const run = await runBilling(admin.id);
  console.log(`  billing run: ${run.invoiced} invoices, ${run.activated} started, ${run.closed} closed`);

  // Close a couple of older subscriptions
  const toClose = await prisma.subscription.findMany({ where: { status: "ACTIVE", plan: { name: "Monthly" } }, take: 3, orderBy: { startDate: "asc" } });
  for (const s of toClose) {
    await prisma.subscription.update({ where: { id: s.id }, data: { status: "CLOSED", closedAt: new Date(), closeReason: "Customer moved to another provider" } });
  }

  const invoices = await prisma.invoice.findMany({ orderBy: { invoiceDate: "asc" } });
  const today = startOfDay(new Date());
  const methods = ["BANK_TRANSFER", "CARD", "CASH", "CHEQUE", "BANK_TRANSFER"];
  let paid = 0;
  for (const [k, inv] of invoices.entries()) {
    const ageDays = (today.getTime() - inv.invoiceDate.getTime()) / 86_400_000;
    if (ageDays < 3 && k % 2 === 0) continue; // a few fresh drafts stay draft
    await prisma.invoice.update({ where: { id: inv.id }, data: { status: "CONFIRMED", confirmedAt: inv.invoiceDate, sentAt: inv.invoiceDate } });
    // ~1 in 7 older invoices are left unpaid (overdue), recent ones partly unpaid
    const leaveUnpaid = k % 7 === 3 || (ageDays < 25 && k % 3 === 0);
    if (leaveUnpaid) continue;
    const payDate = addDays(inv.invoiceDate, Math.min(ageDays, 2 + (k % 12)));
    await prisma.$transaction(async (tx) => {
      if (k % 11 === 5) {
        // partial payment
        await registerPayment(tx, { invoiceId: inv.id, method: rand(methods, k), amount: Math.round(inv.total * 0.5), date: payDate, note: "Partial payment", userId: staff.id });
      } else {
        await registerPayment(tx, { invoiceId: inv.id, method: rand(methods, k), amount: inv.total, date: payDate, note: k % 4 === 0 ? `UTR ${100000 + k}` : null, userId: staff.id });
        paid++;
      }
    });
  }
  console.log(`  ${invoices.length} invoices, ${paid} fully paid`);

  console.log("\nDone. Sign in with:");
  console.log("  Admin     admin@brightloop.test    / Admin@1234");
  console.log("  Internal  staff@brightloop.test    / Staff@1234");
  console.log("  Portal    customer@brightloop.test / Customer@123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
