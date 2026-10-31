import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { ROLE_LABEL, type Role } from "@/lib/constants";
import { fmtDate } from "@/lib/format";
import { ControlPanel } from "@/components/odoo/control-panel";
import { ClickableRow } from "@/components/odoo/clickable-row";
import { SearchBar } from "@/components/odoo/search-bar";
import { ListView } from "@/components/odoo/list-view";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { NewUserDialog } from "./new-user-dialog";

export const metadata = { title: "Users" };

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ q?: string; filter?: string }> }) {
  const sp = await searchParams;
  await requireAdmin();
  const where: Prisma.UserWhereInput = {
    role: sp.filter === "portal" ? "PORTAL" : sp.filter === "admin" ? "ADMIN" : sp.filter === "internal" ? "INTERNAL" : { in: ["ADMIN", "INTERNAL"] },
    ...(sp.q && { OR: [{ name: { contains: sp.q } }, { email: { contains: sp.q } }] }),
  };
  const users = await prisma.user.findMany({ where, orderBy: [{ role: "asc" }, { name: "asc" }], take: 200, include: { customer: { select: { id: true } } } });
  return (
    <>
      <ControlPanel
        breadcrumbs={[{ label: "Users" }]}
        actions={<NewUserDialog />}
        right={<SearchBar placeholder="Search users..." filters={[{ value: "admin", label: "Administrators" }, { value: "internal", label: "Internal users" }, { value: "portal", label: "Portal users" }]} />}
      />
      <ListView>
        <Table>
          <THead><TR><TH>Name</TH><TH>Login</TH><TH>Access</TH><TH>Created</TH><TH>Status</TH></TR></THead>
          <TBody>
            {users.map((u) => (
              <ClickableRow key={u.id} href={u.role === "PORTAL" && u.customer ? `/customers/${u.customer.id}` : `/users/${u.id}`}>
                <TD><span className="flex items-center gap-2 font-medium"><Avatar name={u.name} className="size-6 text-[10px]" />{u.name}</span></TD>
                <TD className="text-muted-foreground">{u.email}</TD>
                <TD><Badge variant={u.role === "ADMIN" ? "purple" : u.role === "INTERNAL" ? "blue" : "teal"}>{ROLE_LABEL[u.role as Role]}</Badge></TD>
                <TD className="text-muted-foreground">{fmtDate(u.createdAt)}</TD>
                <TD>{u.active ? <Badge variant="green">Active</Badge> : <Badge variant="gray">Inactive</Badge>}</TD>
              </ClickableRow>
            ))}
          </TBody>
        </Table>
      </ListView>
    </>
  );
}
