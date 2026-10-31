import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth";
import { PAGE_SIZE } from "@/lib/constants";
import { ControlPanel } from "@/components/odoo/control-panel";
import { ClickableRow } from "@/components/odoo/clickable-row";
import { SearchBar } from "@/components/odoo/search-bar";
import { Pager, parsePage } from "@/components/odoo/pager";
import { ListView } from "@/components/odoo/list-view";
import { EmptyState } from "@/components/odoo/empty-state";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";

export const metadata = { title: "Customers" };

type SP = { q?: string; filter?: string; page?: string };

export default async function CustomersPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  await requireStaff();
  const page = parsePage(sp.page);
  const where: Prisma.CustomerWhereInput = {
    ...(sp.q && { OR: [{ name: { contains: sp.q } }, { email: { contains: sp.q } }, { city: { contains: sp.q } }, { phone: { contains: sp.q } }] }),
    ...(sp.filter === "portal" && { userId: { not: null } }),
    ...(sp.filter === "active" && { subscriptions: { some: { status: "ACTIVE" } } }),
  };
  const [rows, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { _count: { select: { subscriptions: { where: { status: "ACTIVE" } } } }, user: { select: { active: true } } },
    }),
    prisma.customer.count({ where }),
  ]);

  return (
    <>
      <ControlPanel
        breadcrumbs={[{ label: "Customers" }]}
        actions={<Button size="sm" asChild><Link href="/customers/new"><Plus /> New</Link></Button>}
        right={
          <>
            <SearchBar
              placeholder="Search name, email, city..."
              filters={[{ value: "active", label: "With running subscriptions" }, { value: "portal", label: "Portal users" }]}
            />
            <Pager page={page} pageSize={PAGE_SIZE} total={total} basePath="/customers" params={sp} />
          </>
        }
      />
      <ListView>
        {rows.length === 0 ? (
          <EmptyState title="No customers found" />
        ) : (
          <Table>
            <THead><TR><TH>Name</TH><TH>Email</TH><TH>Phone</TH><TH>City</TH><TH className="text-right">Running Subscriptions</TH><TH>Portal</TH></TR></THead>
            <TBody>
              {rows.map((c) => (
                <ClickableRow key={c.id} href={`/customers/${c.id}`}>
                  <TD><span className="flex items-center gap-2 font-medium"><Avatar name={c.name} className="size-6 text-[10px]" />{c.name}</span></TD>
                  <TD className="text-muted-foreground">{c.email}</TD>
                  <TD className="text-muted-foreground">{c.phone}</TD>
                  <TD>{c.city}</TD>
                  <TD className="text-right tabular-nums">{c._count.subscriptions}</TD>
                  <TD>{c.user ? <Badge variant={c.user.active ? "teal" : "gray"}>{c.user.active ? "Enabled" : "Revoked"}</Badge> : null}</TD>
                </ClickableRow>
              ))}
            </TBody>
          </Table>
        )}
      </ListView>
    </>
  );
}
