import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth";
import { getActivities } from "@/lib/activity";
import { deleteCustomer, grantPortalAccess, revokePortalAccess, saveCustomer } from "@/actions/customers";
import { Chatter } from "@/components/odoo/chatter";
import { CustomerForm } from "./customer-form";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (id === "new") return { title: "New Customer" };
  const rec = await prisma.customer.findUnique({ where: { id }, select: { name: true } });
  return { title: rec?.name ?? "Not found" };
}

export default async function CustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireStaff();
  const customer = id === "new" ? null : await prisma.customer.findUnique({
    where: { id },
    include: { user: { select: { active: true, email: true } } },
  });
  if (id !== "new" && !customer) notFound();

  let stats = { subscriptions: 0, invoices: 0, due: 0 };
  if (customer) {
    const [subscriptions, invoices, due] = await Promise.all([
      prisma.subscription.count({ where: { customerId: id } }),
      prisma.invoice.count({ where: { customerId: id, status: { not: "CANCELLED" } } }),
      prisma.invoice.aggregate({ where: { customerId: id, status: "CONFIRMED" }, _sum: { total: true, amountPaid: true } }),
    ]);
    stats = { subscriptions, invoices, due: (due._sum.total ?? 0) - (due._sum.amountPaid ?? 0) };
  }
  const activities = customer ? await getActivities("customer", customer.id) : [];

  return (
    <CustomerForm
      customer={customer}
      stats={stats}
      save={saveCustomer.bind(null, customer?.id ?? null)}
      grant={customer ? grantPortalAccess.bind(null, customer.id) : undefined}
      revoke={customer ? revokePortalAccess.bind(null, customer.id) : undefined}
      remove={customer ? deleteCustomer.bind(null, customer.id) : undefined}
      aside={customer && <Chatter entries={activities} />}
    />
  );
}
