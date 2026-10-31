import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth";
import { PAGE_SIZE, PRODUCT_TYPE_LABEL } from "@/lib/constants";
import { money } from "@/lib/format";
import { ControlPanel } from "@/components/odoo/control-panel";
import { ClickableRow } from "@/components/odoo/clickable-row";
import { SearchBar } from "@/components/odoo/search-bar";
import { Pager, parsePage } from "@/components/odoo/pager";
import { ListView } from "@/components/odoo/list-view";
import { EmptyState } from "@/components/odoo/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";

export const metadata = { title: "Products" };

type SP = { q?: string; filter?: string; page?: string };

export default async function ProductsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const user = await requireStaff();
  const page = parsePage(sp.page);
  const where: Prisma.ProductWhereInput = {
    active: sp.filter === "archived" ? false : true,
    ...(sp.filter === "services" && { type: "SERVICE" }),
    ...(sp.filter === "goods" && { type: "GOODS" }),
    ...(sp.q && { name: { contains: sp.q } }),
  };
  const [rows, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { taxes: { select: { name: true } }, _count: { select: { variants: true } } },
    }),
    prisma.product.count({ where }),
  ]);

  return (
    <>
      <ControlPanel
        breadcrumbs={[{ label: "Products" }]}
        actions={user.role === "ADMIN" && (
          <Button size="sm" asChild><Link href="/products/new"><Plus /> New</Link></Button>
        )}
        right={
          <>
            <SearchBar
              placeholder="Search products..."
              filters={[
                { value: "services", label: "Services" },
                { value: "goods", label: "Goods" },
                { value: "archived", label: "Archived" },
              ]}
            />
            <Pager page={page} pageSize={PAGE_SIZE} total={total} basePath="/products" params={sp} />
          </>
        }
      />
      <ListView>
        {rows.length === 0 ? (
          <EmptyState title="No products found" hint="Create products to sell them on subscriptions." />
        ) : (
          <Table>
            <THead>
              <TR><TH>Product Name</TH><TH>Type</TH><TH className="text-right">Sales Price</TH><TH className="text-right">Cost</TH><TH>Taxes</TH><TH className="text-right">Variants</TH></TR>
            </THead>
            <TBody>
              {rows.map((p) => (
                <ClickableRow key={p.id} href={`/products/${p.id}`}>
                  <TD className="font-medium">{p.name}</TD>
                  <TD>{PRODUCT_TYPE_LABEL[p.type]}</TD>
                  <TD className="text-right tabular-nums">{money(p.salesPrice)}</TD>
                  <TD className="text-right tabular-nums text-muted-foreground">{money(p.costPrice)}</TD>
                  <TD><div className="flex gap-1">{p.taxes.map((t) => <Badge key={t.name} variant="gray">{t.name}</Badge>)}</div></TD>
                  <TD className="text-right tabular-nums">{p._count.variants || "—"}</TD>
                </ClickableRow>
              ))}
            </TBody>
          </Table>
        )}
      </ListView>
    </>
  );
}
